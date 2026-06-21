from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas import schemas_user
from auth import get_current_user, get_hash_password, create_access_token, verify_password
from models.project import Project
from models.service import Service
from plan_limits import get_plan_limits, PLAN_LIMITS

router = APIRouter(
    prefix='/user',
    tags=["User"]
)

@router.get('/me', response_model=schemas_user.UserResponse)
def get_user(user_id:int = Depends(get_current_user), db:Session = Depends(get_db)):
    user_ = db.query(User).filter(User.id == user_id).first()
    if not user_:
        raise HTTPException(
            status_code= 404,
            detail= "Usuário não encontrado"
        )
    return user_

@router.post('/register', response_model= schemas_user.UserResponse)
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

@router.post('/login')
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
    return {
        'access_token': token,
        'token_type': 'bearer',
        'account_type': user_.account_type
    }

@router.get('/plan', response_model=schemas_user.PlanInfo)
def get_user_plan(user_id:int = Depends(get_current_user), db:Session = Depends(get_db)):
    """
    Retorna informações detalhadas sobre o plano do usuário.
    """
    user_ = db.query(User).filter(User.id == user_id).first()
    if not user_:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    limits = get_plan_limits(user_.account_type)
     
    project_count = db.query(Project).filter(Project.user_id == user_id).count()
    service_count = (
        db.query(Service).join(Project).filter(
            Project.user_id == user_id
        ).count()
    )
    
    return {
        "account_type": user_.account_type,
        "limits": limits,
        "usage": {
            "projects": project_count,
            "services": service_count,
        }
    }

@router.patch('/upgrade', response_model=schemas_user.UserResponse)
def upgrade_account(
    upgrade: schemas_user.UserUpgradeRequest,
    user_id:int = Depends(get_current_user),
    db:Session = Depends(get_db)
    ):
    """
    Altera o tipo de conta do usuário.
    """
    if upgrade.account_type not in PLAN_LIMITS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de conta inválido. Opções: {list(PLAN_LIMITS.keys())}"
        )
    
    user_ = db.query(User).filter(User.id == user_id).first()
    if not user_:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    user_.account_type = upgrade.account_type
    db.commit()
    db.refresh(user_)
    return user_

