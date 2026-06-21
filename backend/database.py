from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

class Base(DeclarativeBase):
    pass

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://julio:postgres@localhost:5432/mini-heroku')

# Canal de comunicação (consultas sql)
engine = create_engine(DATABASE_URL)

local_session = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine # canal de comunicação a ser utilizado
)

def get_db():
    db = local_session()
    try:
        yield db
    finally:
        db.close()
