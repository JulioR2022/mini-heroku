from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name:str
    
class UserRequest(UserBase):
    password:str

class UserResponse(UserBase):
    id:int
    account_type:str
    created_at:datetime
    
    class Config:
        from_attributes = True

class UserUpgradeRequest(BaseModel):
    account_type: str

class PlanLimits(BaseModel):
    max_services: int
    max_projects: int
    mem_limit: str
    nano_cpus: int
    label: str

class PlanUsage(BaseModel):
    projects: int
    services: int

class PlanInfo(BaseModel):
    account_type: str
    limits: PlanLimits
    usage: PlanUsage
