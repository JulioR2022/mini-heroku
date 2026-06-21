from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Project(Base):
    __tablename__ = 'project'

    id= Column(Integer, primary_key= True, index= True)
    user_id= Column(Integer, ForeignKey('user.id'))
    name = Column(String, unique=True, index= True)
    created_at = Column(
        DateTime, 
        default= lambda: datetime.now(timezone.utc)
    )
    user = relationship('User', back_populates= 'projects')
    services = relationship('Service', back_populates= 'project', cascade='all, delete-orphan')
