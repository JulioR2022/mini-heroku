from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas import schemas_user
from auth import get_current_user, get_hash_password, create_access_token, verify_password
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
    return {'access_token':token, 'token_type':'bearer'}

