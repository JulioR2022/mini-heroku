from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class ProjectBase(BaseModel):
    name: str
    repo_url: Optional[str] = None
    root_dir: Optional[str] = None
    env_vars: Optional[Dict[str, str]] = None
    

class ProjectRequest(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    port: Optional[int] = None
    status:str
    created_at:datetime

    class Config:
        from_attributes = True