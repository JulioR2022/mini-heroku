from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DeploymentBase(BaseModel):
    service_id:int
    
class DeploymentRequest(DeploymentBase):
    pass

class DeploymentResponse(DeploymentBase):
    id: int
    status: Optional[str] = None
    created_at: datetime 
    class Config:
        from_attributes = True