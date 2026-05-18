from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Project(Base):
    __tablename__ = 'projects'

    id= Column(Integer, primary_key= True, index= True)
    user_id= Column(Integer, ForeignKey('user.id'))
    name = Column(String, unique=True, index= True)
    repo_url = Column(String, nullable= True)
    port = Column(Integer, nullable= True)
    status = Column(String, default= 'stopped')
    created_at = Column(
        DateTime, 
        default= lambda: datetime.now(timezone.utc)
    )
    deployments = relationship('Deployment', back_populates= 'project')
    user = relationship('User', back_populates= 'projects')
