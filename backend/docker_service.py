import docker, tempfile, shutil, git, os
from database import local_session
from models.deployment import Deployment
from models.project import Project

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

def deploy_container(project_id:int):
    db = local_session()
    temp_dir = None
    project = None
    deploy = None
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        
        if not project:
            return

        project.status = 'deploying'
        deploy = Deployment(
            project_id= project.id,
            status= 'building'
        )
        db.add(deploy)
        db.commit()

        client = docker.from_env()
        temp_dir = tempfile.mkdtemp()
        git.Repo.clone_from(project.repo_url, temp_dir)
        image_tag = f'{project.name.lower()}_img'
        build_path = temp_dir
        if project.root_dir is not None:
            build_path = os.path.join(temp_dir, project.root_dir.lstrip('/'))
        client.images.build(path=build_path, tag=image_tag)
        try:
            old = client.containers.get(project.name)
            old.remove(force= True)
        except docker.errors.NotFound:
            pass
        
        environment_vars = {'PORT': '8000'}
        if project.env_vars:
            environment_vars.update(project.env_vars)

        container = None
        try:
            container = client.containers.run(
                image_tag,
                detach=True,
                name= project.name,
                ports= {'8000/tcp': None},
                environment=environment_vars
            )
        except docker.errors.APIError as e:
            raise Exception(f'Erro ao iniciar container: {e}')

        container.reload()
        ports_ = container.attrs['NetworkSettings']['Ports']
        if ports_ and '8000/tcp' in ports_ and ports_['8000/tcp']:
            project.port = int(ports_['8000/tcp'][0]['HostPort'])

        project.status = 'running'
        deploy.status = 'success'
        db.commit()
    except Exception as e:
        print(f'Erro no deploy do projeto {project_id}: {e}')
        db.rollback()
        if project:
            project.status = 'failed'
        if deploy:
            deploy.status = 'failed'
        db.commit()
    finally:
        if temp_dir:
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f'Erro: {e}')
        db.close()