from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str
    repo_url: Optional[str] = None
    port: Optional[int] = None

class ProjectRequest(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    status:str
    created_at:datetime

    class Config:
        from_attributes = True