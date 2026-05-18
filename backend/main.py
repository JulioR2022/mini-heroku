from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from database import engine, Base, get_db
from models.deployment import Deployment
from models.project import Project
from models.user import User
from schemas import schemas_project
from schemas import schemas_user
from auth import get_current_user, get_hash_password, create_access_token, verify_password

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title='mini heroku API')

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
    db_project = db.query(Project).filter(
        Project.name == project.name
    ).first()

    if db_project:
        raise HTTPException(
            status_code= 400,
            detail= 'Nome ja utilizado.'
        )
    new_project = Project(
        name= project.name,
        user_id= user_id,
        repo_url = project.repo_url,
        port= project.port,
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

@app.get('/projects', response_model= list[schemas_project.ProjectResponse])
def get_projects(user_id:int = Depends(get_current_user),db:Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    return projects