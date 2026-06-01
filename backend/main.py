from fastapi import FastAPI, Depends, HTTPException,BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import docker, tempfile, shutil, git, os
from database import engine, Base, get_db, local_session
from models.deployment import Deployment
from models.project import Project
from models.user import User
from models.service import Service
from schemas import schemas_project, schemas_service
from schemas import schemas_user
from schemas import schemas_deployment
from auth import get_current_user, get_hash_password, create_access_token, verify_password
from docker_service import deploy_container, remove_container


# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title='mini heroku API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def read_root():
    return {'message': 'API Mini Heroku Funcionando'}

@app.get('/me', response_model=schemas_user.UserResponse)
def get_user(user_id:int = Depends(get_current_user), db:Session = Depends(get_db)):
    user_ = db.query(User).filter(User.id == user_id).first()
    if not user_:
        raise HTTPException(
            status_code= 404,
            detail= "Usuário não encontrado"
        )
    return user_

@app.post('/register', response_model= schemas_user.UserResponse)
def register_user(user:schemas_user.UserRequest ,db:Session = Depends(get_db)):
    user_ = db.query(User).filter(User.name == user.name).first()
    if user_:
        raise HTTPException(
            status_code= 400,
            detail= 'Usuário já existente'
        )
    hash_pwd = get_hash_password(user.password)
    user_ = User(name=user.name, password= hash_pwd)
    db.add(user_)
    db.commit()
    db.refresh(user_)
    return user_

@app.post('/login')
def login(
    form:OAuth2PasswordRequestForm = Depends(),
    db:Session = Depends(get_db)):
    user_ = db.query(User).filter(User.name == form.username).first()
    if not user_:
        raise HTTPException(
            status_code= 400,
            detail= 'Usuário não cadastrado'
        )
    if not verify_password(form.password, user_.password):
        raise HTTPException(
            status_code= 401,
            detail= "Usuário ou senha incorreto."
        )    
    data = {
        'sub': str(user_.id),
        'name': user_.name    
    }
    token = create_access_token(data=data)
    return {'access_token':token, 'token_type':'bearer'}

@app.get("/project/{project_id}", response_model=schemas_project.ProjectResponse)
def get_project(project_id:int,
                user_id:int = Depends(get_current_user),
                db:Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.user_id == user_id,
        Project.id == project_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=404,
            detail= "Projeto não encontrado."
        )
    
    return project

@app.get('/user/projects', response_model= list[schemas_project.ProjectResponse])
def get_all_user_projects(user_id:int = Depends(get_current_user),db:Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    return projects

@app.post('/projects', response_model= schemas_project.ProjectResponse)
def create_projects(project: schemas_project.ProjectRequest, 
                    user_id:int = Depends(get_current_user),
                    db:Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.name == project.name).first()

    if db_project:
        raise HTTPException(
            status_code= 400,
            detail= 'Nome ja utilizado.'
        )
    new_project = Project(
        name= project.name,
        user_id= user_id
    )
    db.add(new_project)
    try:
        db.commit()
        db.refresh(new_project)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code= 400,
            detail= 'Erro de integridade: Este nome de projeto já está em uso.'
        )
    
    return new_project

@app.get('/project/{project_id}/services', response_model= list[schemas_service.ServiceResponse])
def get_all_project_services(project_id:int,
                user_id:int = Depends(get_current_user),
                db:Session = Depends(get_db)):
    services = db.query(Service).join(Project).filter(
        Service.project_id == project_id,
        Project.user_id == user_id
    ).all()
    return services

@app.get('/service/{service_id}', response_model=schemas_service.ServiceResponse)
def get_service(service_id:int,
                user_id: int = Depends(get_current_user),
                db:Session= Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()
        
    return service

@app.get('/service/{service_id}/env')
def get_service_env(service_id:int,
                user_id: int = Depends(get_current_user),
                db:Session= Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return service.env_vars

@app.post('/service', response_model= schemas_service.ServiceResponse)
def create_service(service: schemas_service.ServiceRequest, 
                    user_id:int = Depends(get_current_user),
                    db:Session = Depends(get_db)):
    
    project = db.query(Project).filter(Project.id == service.project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    db_service = db.query(Service).filter(Service.name == service.name).first()

    if db_service:
        raise HTTPException(
            status_code= 400,
            detail= 'Nome ja utilizado.'
        )
    new_service = Service(
        name= service.name,
        project_id= service.project_id,
        repo_url = service.repo_url,
        root_dir= service.root_dir,
        port= None,
        env_vars= service.env_vars,
    )
    db.add(new_service)
    try:
        db.commit()
        db.refresh(new_service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code= 400,
            detail= 'Erro de integridade: Este nome de serviço já está em uso.'
        )
    
    return new_service

@app.patch('/service/{service_id}', response_model = schemas_service.ServiceResponse)
def update_service(service_id:int,
                   update:schemas_service.ServiceUpdate,
                   user_id:int =Depends(get_current_user),
                   db:Session = Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()
    
    if not service:
        raise HTTPException(
            status_code=404,
            detail='Serviço não encontrado'
        )

    update_ = update.model_dump(exclude_unset=True)
    for key,value in update_.items():
        setattr(service, key, value)

    try:
        db.commit()
        db.refresh(service)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code = 400,
            detail='Erro de integridade ao atualizar serviço'
        )
    
    return service

@app.delete('/service/{service_id}')
def delete_service(service_id:int,
                   user_id:int = Depends(get_current_user),
                   db:Session = Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail='Service Not Found'
        )
    
    db.delete(service)
    db.commit()
    
@app.post('/service/{service_id}/deploy')
def trigger_deploy(service_id:int,
                   background_tasks: BackgroundTasks,
                   user_id:int = Depends(get_current_user),
                   db:Session = Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Service.id == service_id,
        Project.user_id == user_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    background_tasks.add_task(deploy_container, service.id)

@app.post('/service/{service_id}/stop')
def stop_service(service_id:int,
                 user_id:int = Depends(get_current_user),
                 db:Session = Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Service.id == service_id,
        Project.user_id == user_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    try:
        message = remove_container(service.name)
        service.status = 'stopped'
        db.commit()
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/service/deployments', response_model=list[schemas_deployment.DeploymentResponse])
def get_deployments(service_id:int,
               user_id:int = Depends(get_current_user),
               db:Session = Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    
    return service.deployments
