import asyncio
from fastapi import WebSocket
from typing import Dict, List

class LogManager:
    def __init__(self):
        #mapeia um serviço para diferentes sockets
        self.active_conn:Dict[str,List[WebSocket]] = {}
        self.loop = None
    
    async def connect(self,service_name,websocket:WebSocket):
        if service_name not in self.active_conn:
            self.active_conn[service_name] = []
        self.active_conn[service_name].append(websocket)

    def disconnect(self, service_name:str, websocket:WebSocket):
        if service_name in self.active_conn:
            if websocket in self.active_conn[service_name]:
                self.active_conn[service_name].remove(websocket)
            if not self.active_conn[service_name]:
                del self.active_conn[service_name]
    
    def broadcast_sync(self, service_name: str, message: str):
        if not message.strip():
            return
        if service_name in self.active_conn and self.loop:
            for connection in self.active_conn[service_name]:
                asyncio.run_coroutine_threadsafe(connection.send_text(message), self.loop)

    async def wait_disconnect(self, service_name:str, websocket:WebSocket):
        try:
            while True:
                await websocket.receive_text()
        except Exception:
            pass
        finally:
            self.disconnect(service_name, websocket)
        
manager = LogManager()