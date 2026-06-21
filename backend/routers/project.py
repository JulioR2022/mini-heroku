from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.project import Project
from models.user import User
from models.service import Service
from schemas import schemas_project, schemas_service
from sqlalchemy.exc import IntegrityError
from auth import get_current_user
from plan_limits import get_plan_limits
from docker_service import remove_container

router = APIRouter(
    prefix='/projects',
    tags=["Project"]
)


@router.get('/user/projects', response_model= list[schemas_project.ProjectResponse])
def get_all_user_projects(user_id:int = Depends(get_current_user),db:Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == user_id).all()
    return projects

@router.post('', response_model= schemas_project.ProjectResponse)
def create_projects(project: schemas_project.ProjectRequest, 
                    user_id:int = Depends(get_current_user),
                    db:Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    limits = get_plan_limits(user.account_type)
    project_count = db.query(Project).filter(Project.user_id == user_id).count()

    if project_count >= limits["max_projects"]:
        raise HTTPException(
            status_code=403,
            detail=f'Limite de projetos atingido ({limits["max_projects"]}). '
                   f'Faça upgrade do seu plano para criar mais projetos.'
        )

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

@router.get("/user/{project_id}", response_model=schemas_project.ProjectResponse)
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


@router.get('/{project_id}/services', response_model= list[schemas_service.ServiceResponse])
def get_all_project_services(project_id:int,
                user_id:int = Depends(get_current_user),
                db:Session = Depends(get_db)):
    project = db.query(Project).filter(
        Project.user_id == user_id,
        Project.id == project_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")

    services = db.query(Service).filter(Service.project_id == project_id).all()
    return services

@router.delete('/{project_id}')
def delete_project(project_id:int,
                   user_id:int = Depends(get_current_user),
                   db:Session = Depends(get_db)):
    """
    Deleta um projeto e todos os seus serviços.
    """
    project = db.query(Project).filter(
        Project.user_id == user_id,
        Project.id == project_id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Projeto não encontrado.")
    
    # Remove todos os containers associados a um serviço
    services = db.query(Service).filter(Service.project_id == project_id).all()
    for service in services:
        try:
            remove_container(service.name)
        except Exception:
            pass

    db.delete(project)
    db.commit()
    return {"message": "Projeto excluído com sucesso."}
