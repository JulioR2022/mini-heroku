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
from schemas import schemas_project
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
        user_id= user_id,
        repo_url = project.repo_url,
        root_dir= project.root_dir,
        port= None,
        env_vars= project.env_vars,
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

@app.post('/projects/{project_id}/deploy')
def trigger_deploy(project_id:int,
                   background_tasks: BackgroundTasks,
                   user_id:int = Depends(get_current_user),
                   db:Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == user_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    background_tasks.add_task(deploy_container, project.id)
    
    return {"message": "Deploy iniciado em segundo plano.", "status": "deploying"}

@app.post('/projects/{project_id}/stop')
def stop_project(project_id:int,
                 user_id:int = Depends(get_current_user),
                 db:Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.user_id == user_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    try:
        message = remove_container(project.name)
        project.status = 'stopped'
        db.commit()
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get('/projects/{project_id}/deployments', response_model=list[schemas_deployment.DeploymentResponse])
def get_deploy(project_id:int,
               user_id:int = Depends(get_current_user),
               db:Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.user_id == user_id,
        Project.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    return project.deployments

@app.get('/projects', response_model= list[schemas_project.ProjectResponse])
def get_projects(user_id:int = Depends(get_current_user),db:Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    return projects
