from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models.deployment import Deployment
from models.project import Project
from schemas import schemas

# Cria as tabelas
Base.metadata.create_all(bind=engine)

app = FastAPI(title='mini heroku API')

@app.get('/')
def read_root():
    return {'message': 'API Mini Heroku Funcionando'}

@app.post('/projects', response_model= schemas.ProjectResponse)
def create_projects(project: schemas.ProjectRequest, 
                    db:Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.name == project.name).first()
    if db_project:
        raise HTTPException(
            status_code= 400,
            detail= 'Nome ja utilizado'
        )
    new_project = Project(
        name= project.name,
        repo_url = project.repo_url,
        port= project.port,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project

@app.get('/projects', response_model= list[schemas.ProjectResponse])
def get_projects(db:Session = Depends(get_db)):
    projects = db.query(Project).all()
    return projects