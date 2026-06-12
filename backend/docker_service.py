import docker, tempfile, shutil, git, os, time
from database import local_session
from models.deployment import Deployment
from models.service import Service
from log_manager import manager
from urllib.parse import urlparse

def get_docker():
    return docker.from_env()

def remove_container(container_name:str):
    try:
        client = docker.from_env()
        try:
            container = client.containers.get(container_name)
            img_id = container.image.id
            container.stop()
            container.remove(force=True, v=True)
            try:
                client.images.remove(image=img_id, force=True)
            except docker.errors.ImageNotFound:
                pass
        except docker.errors.NotFound:
            return {'message':'Container não encontrado'}
        except Exception as e:
            raise Exception(f'Erro ao remover container: {str(e)}')
        
        try:
            volume_name = f'pgdta_{container_name}'
            volume = client.volumes.get(volume_name)
            volume.remove(force=True)
        except docker.errors.NotFound:
            pass

        return {"message": "Container parado e removido com sucesso.", "status": "stopped"}
    except Exception as e:
        raise Exception(f"Erro ao remover o container: {str(e)}")

def deploy_container(service_id:int):
    ALLOWED_HOSTS = ['github.com', 'gitlab.com']
    def log(msg:str):
        manager.broadcast_sync(service.name, msg)
    
    db = local_session()
    temp_dir = None
    service = None
    deploy = None


    try:
        service = db.query(Service).filter(Service.id == service_id).first() 
        service.status = 'deploying'
        deploy = Deployment(
            service_id= service.id,
            status= 'building'
        )
        db.add(deploy)
        db.commit()

        client = get_docker()
        temp_dir = tempfile.mkdtemp()

        host = urlparse(service.repo_url).hostname
        if host not in ALLOWED_HOSTS:
            raise Exception('Host não permitido.')
        
        log('[BUILD] Clonando repositório ...')
        git.Repo.clone_from(service.repo_url, temp_dir)

        try:
            old = client.containers.get(service.name)
            old.remove(force= True)
        except docker.errors.NotFound:
            pass
        
        image_tag = f"{service.name.lower().replace(' ', '_')}_img"
        build_path = temp_dir
        if service.root_dir is not None:
            build_path = os.path.join(temp_dir, service.root_dir.lstrip('/'))
        
        log('[BUILD] Iniciando build da imagem...')
        build_stream = client.api.build(path=build_path, tag=image_tag, decode=True)
        
        for chunk in build_stream:
            if 'stream' in chunk:
                line = chunk['stream'].strip()
                if line:
                    log(f'[BUILD] {line}')
        
        image = client.images.get(image_tag)
        
        exposed_ports = image.attrs.get('Config',{}).get('ExposedPorts')
        if exposed_ports:
            container_port = list(exposed_ports.keys())[0]
        container_port_num = container_port.split('/')[0]

        environment_vars = {'PORT':container_port_num}
        if service.env_vars:
            environment_vars.update(service.env_vars)

        log(f'[Start] Subindo container na porta {container_port_num}')
        container = None
        try:
            container = client.containers.run(
                image_tag,
                mem_limit= "512m",
                nano_cpus=500_000_000,
                detach=True,
                name= service.name,
                ports= {container_port: None},
                environment=environment_vars
            )
        except docker.errors.APIError as e:
            raise Exception(f'Erro ao iniciar container: {e}')

        container.reload()
        ports_ = container.attrs['NetworkSettings']['Ports']
        if ports_ and container_port in ports_ and ports_[container_port]:
            service.port = int(ports_[container_port][0]['HostPort'])

        

        retries = 0
        while retries < 30:
            container.reload()
            if container.status == 'running':
                service.status = 'running'
                deploy.status = 'success'
                db.commit()
                log(f'[START] Container rodando.')
                break
            time.sleep(2)
            retries += 1

    except Exception as e:
        msg= f'[ERROR] {str(e)}'
        if service:
            log(msg)
        db.rollback()
        db.query(Service).filter(Service.id == service_id).update({"status": "failed"})
        if deploy and deploy.id:
            db.query(Deployment).filter(Deployment.id == deploy.id).update({"status": "failed"})
        db.commit()
    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f'Erro: {e}')
        db.close()

def deploy_database_container(db_name:str, db_pwd:str):
    client = get_docker()
    container_name = f'db_{db_name}'

    try:
        client.containers.get(container_name)
        raise Exception('Nome ja utilizado.')
    except docker.errors.NotFound:
        pass 

    try:
        container = client.containers.run(
            image='postgres:15-alpine',
            detach=True,
            name=container_name,
            environment={
                'POSTGRES_USER':db_name,
                'POSTGRES_PASSWORD': db_pwd,
                'POSTGRES_DB': db_name
            },
            volumes={
                f'pgdata_{db_name}': {'bind': '/var/lib/postgresql/data', 'mode': 'rw'}
            },
            ports={'5432/tcp':None}
        )
        container.reload()
        ports_ = container.attrs['NetworkSettings']['Ports']
        host_port = ports_['5432/tcp'][0]['HostPort']
        return host_port
    except Exception as e:
        raise Exception(f'Erro ao iniciar base de dados:{e}')

def stop_container(container_name:str):
    client = get_docker()
    try:
        container = client.containers.get(container_name)
        container.stop()
    except docker.errors.NotFound:
        pass

def get_container_logs(container_name):
    client = get_docker()
    try:
        container = client.containers.get(container_name)
        line =container.logs(stream=False, follow=True, tail=100)
    except docker.errors.NotFound:
        return {'code':404, 'detail':'Container não encontrado.'}
    
    