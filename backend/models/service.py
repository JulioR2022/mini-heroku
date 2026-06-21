from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Service(Base):
    __tablename__ = 'service'
    
    id = Column(Integer, primary_key= True, index=True)
    project_id = Column(Integer, ForeignKey('project.id'))
    name = Column(String, unique=True, index= True)
    repo_url = Column(String, nullable= True)
    root_dir = Column(String, nullable= True)
    port = Column(Integer, nullable= True)
    env_vars = Column(JSON, nullable= True)
    status = Column(String, default='stopped')
    created_at = Column(
        DateTime, 
        default= lambda: datetime.now(timezone.utc)
    )
    project = relationship('Project', back_populates='services')
    deployments = relationship('Deployment', back_populates='service', cascade='all, delete-orphan')
