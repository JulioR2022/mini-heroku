import docker, tempfile, shutil, git, os
from database import local_session
from models.deployment import Deployment
from models.service import Service

def remove_container(container_name:str):
    try:
        client = docker.from_env()
        try:
            container = client.containers.get(container_name)
            container.stop()
            container.remove(force=True)
        except docker.errors.NotFound:
            pass
    
        return {"message": "Container parado e removido com sucesso.", "status": "stopped"}
    except Exception as e:
        raise Exception(f"Erro ao parar o container: {str(e)}")

def deploy_container(service_id:int):
    db = local_session()
    temp_dir = None
    service = None
    deploy = None
    try:
        service = db.query(Service).filter(Service.id == service_id).first()
        
        if not service:
            return

        service.status = 'deploying'
        deploy = Deployment(
            service_id= service.id,
            status= 'building'
        )
        db.add(deploy)
        db.commit()

        client = docker.from_env()
        temp_dir = tempfile.mkdtemp()
        git.Repo.clone_from(service.repo_url, temp_dir)
        # Garantir que a tag não tenha espaços, o que causaria erro no Docker
        image_tag = f"{service.name.lower().replace(' ', '_')}_img"
        build_path = temp_dir
        if service.root_dir is not None:
            build_path = os.path.join(temp_dir, service.root_dir.lstrip('/'))
        client.images.build(path=build_path, tag=image_tag)
        try:
            old = client.containers.get(service.name)
            old.remove(force= True)
        except docker.errors.NotFound:
            pass
        
        environment_vars = {'PORT': '8000'}
        if service.env_vars:
            environment_vars.update(service.env_vars)

        container = None
        try:
            container = client.containers.run(
                image_tag,
                detach=True,
                name= service.name,
                ports= {'8000/tcp': None},
                environment=environment_vars
            )
        except docker.errors.APIError as e:
            raise Exception(f'Erro ao iniciar container: {e}')

        container.reload()
        ports_ = container.attrs['NetworkSettings']['Ports']
        if ports_ and '8000/tcp' in ports_ and ports_['8000/tcp']:
            service.port = int(ports_['8000/tcp'][0]['HostPort'])

        service.status = 'running'
        deploy.status = 'success'
        db.commit()
    except Exception as e:
        print(f'Erro no deploy do serviço {service_id}: {e}')
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