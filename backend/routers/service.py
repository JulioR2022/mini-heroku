from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models.project import Project
from models.service import Service
from schemas import schemas_service, schemas_deployment
from sqlalchemy.exc import IntegrityError
from auth import get_current_user
from docker_service import remove_container, stop_container, deploy_container

router = APIRouter(
    prefix='/service',
    tags=["Service"]
)

@router.get('/{service_id}', response_model=schemas_service.ServiceResponse)
def get_service(service_id:int,
                user_id: int = Depends(get_current_user),
                db:Session= Depends(get_db)):
    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.id == service_id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
        
    return service

@router.get('/{service_id}/env')
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

@router.post('', response_model= schemas_service.ServiceResponse)
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

@router.patch('/{service_id}', response_model = schemas_service.ServiceResponse)
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

@router.post('/{service_id}/stop')
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
        message = stop_container(service.name)
        service.status = 'stopped'
        db.commit()
        return message
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/{service_id}')
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
    
    remove_container(service.name)
    db.delete(service)
    db.commit()
    return {"message": "Serviço excluído com sucesso."}

@router.post('/{service_id}/deploy')
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
    return {"message": "Deploy iniciado em background."}

@router.get('/{service_id}/deployments', response_model=list[schemas_deployment.DeploymentResponse])
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

