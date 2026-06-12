from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models.project import Project
from models.service import Service
from auth import get_current_user, get_current_user_ws
from docker_service import deploy_database_container
from log_manager import manager
from routers import user, project, service

@asynccontextmanager
async def lifespan(app:FastAPI):
    manager.loop = asyncio.get_running_loop()
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title='mini heroku API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(project.router)
app.include_router(service.router)

@app.get('/')
def read_root():
    return {'message': 'API Mini Heroku Funcionando'}

@app.websocket('/ws/logs/{service_name}')
async def get_logs(service_name:str,
             websocket:WebSocket, 
             db:Session = Depends(get_db)):
    
    await websocket.accept()
    try:
        token = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
    except asyncio.TimeoutError:
        await websocket.close(code = 4001)
        return

    user_id = get_current_user_ws(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    service = db.query(Service).join(Project).filter(
        Project.user_id == user_id,
        Service.name == service_name
    ).first()

    if not service:
        await websocket.close(code=4004)
        return
    
    await manager.connect(service_name, websocket)
    await manager.wait_disconnect(service_name, websocket)

@app.post('/database')
def post_database(db_name:str,
                  db_password,
                  user_id:int = Depends(get_current_user)):
    return deploy_database_container(db_name, db_password)