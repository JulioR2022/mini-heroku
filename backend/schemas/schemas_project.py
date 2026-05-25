from pydantic import BaseModel
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    
class ProjectRequest(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at:datetime

    class Config:
        from_attributes = True