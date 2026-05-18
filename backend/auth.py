import jwt
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os

SECRET_KEY = os.getenv('SECRET_KEY',  "Hm6v741qSccLfqAH5qXbmQKjOvTS/iObl0wyYkhl1aI=")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE =   300


pwd = CryptContext(schemes=['bcrypt'], deprecated='auto')
oaut2_scheme = OAuth2PasswordBearer(tokenUrl='login')

def create_access_token(data:dict):
    encode_ = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes= ACCESS_TOKEN_EXPIRE)
    encode_.update({'exp':expire})
    encoded = jwt.encode(
        payload=encode_,
        key=SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded

def get_hash_password(password:str):
    return pwd.hash(password)

def verify_password(password:str, hash_password):
    return pwd.verify(password, hash_password)

def get_current_user(token= Depends(oaut2_scheme)):
    try:
        payload = jwt.decode(
            token,
            key=SECRET_KEY,
            algorithms=ALGORITHM
        )
        user_id = payload.get('sub')
        if user_id is None:
            raise HTTPException(
                status_code = 401,
                detail= "Credencias inválidas"
            )
        return int(user_id)
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code = 401,
            detail= "Token expirado."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code= 301,
            detail= "Credenciais inválidas"
        )