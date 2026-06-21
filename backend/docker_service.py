import docker, tempfile, shutil, git, os, time
from database import local_session
from models.deployment import Deployment
from models.service import Service
from log_manager import manager
from urllib.parse import urlparse

def get_docker():
    return docker.from_env()

def log(service_name:str, msg:str):
    manager.broadcast_sync(service_name, msg)

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
            volume_name = f'pgdata_{container_name}'
            volume = client.volumes.get(volume_name)
            volume.remove(force=True)
        except docker.errors.NotFound:
            pass

        return {"message": "Container parado e removido com sucesso.", "status": "stopped"}
    except Exception as e:
        raise Exception(f"Erro ao remover o container: {str(e)}")

def clone_repo(repo_url: str, service_name: str) -> str:
    """Valida o host e clona o repositório para um diretório temporário."""
    ALLOWED_HOSTS = ['github.com', 'gitlab.com']
    host = urlparse(repo_url).hostname
    if host not in ALLOWED_HOSTS:
        raise Exception('Host não permitido')
 
    temp_dir = tempfile.mkdtemp()
    log(service_name, '[BUILD] Clonando repositório ...')
    git.Repo.clone_from(repo_url, temp_dir)
    return temp_dir

def remove_old_container(client, container_name: str):
    """Remove um container antigo com o mesmo nome, se existir."""
    try:
        old = client.containers.get(container_name)
        old_image_id = old.image.id
        old.remove(force=True)
        return old_image_id
    except docker.errors.NotFound:
        pass

def remove_dangling_image(client, 
                          image_id:str, 
                          current_image_tag:str, 
                          service_name:str):
    if not image_id:
        return
    try:
        current_image = client.images.get(current_image_tag)
        if current_image.id == image_id:
            return
        client.images.remove(image=image_id, force=True)
        log(service_name, '[CLEANUP] Imagem antiga removida.')
    except docker.errors.ImageNotFound:
        pass
    except docker.errors.APIError as e:
        log(service_name, 
            f'[CLEANUP] Aviso: não foi possível remover a imagem antiga ({e}).'
        )

def build_image(client, service, temp_dir):
    """Builda a imagem a partir do repositório clonado e retorna a tag da imagem."""
    image_tag = f"{service.name.lower().replace(' ', '_')}_img"
    build_path = temp_dir
    if service.root_dir is not None:
        build_path = os.path.join(temp_dir, service.root_dir.lstrip('/'))
 
    log(service.name, '[BUILD] Iniciando build da imagem...')
    build_stream = client.api.build(path=build_path, tag=image_tag, decode=True)
 
    for chunk in build_stream:
        if 'stream' in chunk:
            line = chunk['stream'].strip()
            if line:
                log(service.name, f'[BUILD] {line}')
 
    return image_tag

def get_container_port(client, image_tag: str) -> str:
    """Descobre a porta exposta pela imagem."""
    image = client.images.get(image_tag)
    exposed_ports = image.attrs.get('Config', {}).get('ExposedPorts')
    if not exposed_ports:
        raise Exception('Nenhuma porta exposta encontrada na imagem.')
    return list(exposed_ports.keys())[0]

def get_host_port(container, container_port: str):
    """Lê a porta do host mapeada pelo Docker após o container subir."""
    container.reload()
    ports_ = container.attrs['NetworkSettings']['Ports']
    if ports_ and container_port in ports_ and ports_[container_port]:
        return int(ports_[container_port][0]['HostPort'])
    return None

def wait_until_running(container, service_name: str, retries: int = 30, interval: int = 2) -> bool:
    """Aguarda o container atingir status 'running', com timeout por tentativas."""
    attempt = 0
    while attempt < retries:
        container.reload()
        if container.status == 'running':
            log(service_name, '[START] Container rodando.')
            return True
        time.sleep(interval)
        attempt += 1
    return False

def run_service_container(client, 
                          service, 
                          image_tag: str, 
                          container_port: str,
                          mem_limit: str = "512m",
                          nano_cpus: int = 500_000_000):
    container_port_num = container_port.split('/')[0]
    environment_vars = {'PORT': container_port_num}
    if service.env_vars:
        environment_vars.update(service.env_vars)
 
    log(service.name, f'[Start] Subindo container na porta {container_port_num}')
    try:
        container = client.containers.run(
            image_tag,
            mem_limit=mem_limit,
            nano_cpus=nano_cpus,
            detach=True,
            name=service.name,
            ports={container_port: None},
            environment=environment_vars
        )
    except docker.errors.APIError as e:
        raise Exception(f'Erro ao iniciar container: {e}')
 
    return container

def deploy_container(service_id:int, mem_limit:str = "512m", nano_cpus:int = 500_000_000):
    db = local_session()
    temp_dir = None
    service = None
    deploy = None
 
    try:
        service = db.query(Service).filter(Service.id == service_id).first()
        service.status = 'deploying'
        deploy = Deployment(
            service_id=service.id,
            status='building'
        )
        db.add(deploy)
        db.commit()
 
        client = get_docker()
        temp_dir = clone_repo(service.repo_url, service.name)
 
        old_image_id = remove_old_container(client, service.name)
 
        image_tag = build_image(client, service, temp_dir)
        container_port = get_container_port(client, image_tag)
 
        container = run_service_container(client, service, image_tag, container_port, mem_limit, nano_cpus)
 
        service.port = get_host_port(container, container_port)
 
        if wait_until_running(container, service.name):
            service.status = 'running'
            deploy.status = 'success'
            db.commit()
            remove_dangling_image(client, 
                                  old_image_id, 
                                  image_tag, 
                                  service.name)
 
    except Exception as e:
        msg= f'[ERROR] {str(e)}'
        if service:
            log(service.name,msg)
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
        return {"message": f"Container '{container_name}' parado com sucesso.", "status": "stopped"}
    except docker.errors.NotFound:
        return {"message": f"Container '{container_name}' não encontrado.", "status": "not_found"}

def get_container_logs(container_name:str):
    client = get_docker()
    try:
        container = client.containers.get(container_name)
        logs = container.logs(stream=False, follow=False, tail=100)
        return logs.decode('utf-8')
    except docker.errors.NotFound:
        return {'code':404, 'detail':'Container não encontrado.'}