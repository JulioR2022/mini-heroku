from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    name:str
    
class UserRequest(UserBase):
    password:str

class UserResponse(UserBase):
    id:int
    created_at:datetime
    
    class Config:
        from_attributes = True