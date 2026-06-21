from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__= 'user'
    id= Column(Integer, primary_key= True, index=True)
    name= Column(String(50), nullable= False, unique= True)
    password= Column(String, nullable=False)
    account_type = Column(String(20), default='free', nullable=False)
    created_at= Column(
        DateTime, 
        default= lambda: datetime.now(timezone.utc)
    )
    projects = relationship('Project', back_populates= 'user', cascade='all, delete-orphan')
