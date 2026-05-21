from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DeploymentBase(BaseModel):
    project_id:int
    status:str
    
class DeploymentRequest(DeploymentBase):
    pass

class DeploymentResponse(DeploymentBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True