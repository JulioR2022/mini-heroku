from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class ServiceBase(BaseModel):
    name: str
    repo_url: Optional[str] = None
    root_dir: Optional[str] = None
    project_id: int

class ServiceRequest(ServiceBase):
    env_vars: Optional[Dict[str, str]] = None
    
class ServiceResponse(ServiceBase):
    id: int
    port: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ServiceUpdate(BaseModel):
    name:Optional[str] = None
    repo_url: Optional[str] = None
    root_dir: Optional[str] = None
    env_vars: Optional[Dict[str, str]] = None