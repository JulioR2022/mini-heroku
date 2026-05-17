from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class Deployment(Base):
    __tablename__ = 'deployments'
    id = Column(Integer, primary_key= True, index= True)
    project_id = Column(Integer, ForeignKey('projects.id'))
    status = Column(String, default='builds')
    created_at = Column(
        DateTime,
        default= lambda: datetime.now(timezone.utc)
    )
    project = relationship("Project", back_populates="deployments")