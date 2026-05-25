from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class ServiceBase(BaseModel):
    name: str
    repo_url: Optional[str] = None
    root_dir: Optional[str] = None

class ServiceRequest(ServiceBase):
    env_vars: Optional[Dict[str, str]] = None
    project_id: int

class ServiceResponse(ServiceBase):
    id: int
    project_id: int
    port: Optional[int] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
    