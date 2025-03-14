import asyncio
import random
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError
from typing import List, Literal

router = APIRouter(prefix="/ws/test", tags=["test"])

class ServerMessage(BaseModel):
    """Base model for all messages sent from server"""
    type: Literal["data", "broadcast"]
    content: str
    client_id: str

# Manage connected clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: ServerMessage):
        message_json = message.model_dump_json()
        for connection in self.active_connections:
            await connection.send_text(message_json)

manager = ConnectionManager()

@router.websocket("/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    send_random_task = asyncio.create_task(send_random_numbers(websocket, client_id))
    
    try:
        while True:
            data = await websocket.receive_text()
            # Process message and send response
            response = ServerMessage(
                type="broadcast",
                content=data,
                client_id=client_id
            )
            await manager.broadcast(response)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        send_random_task.cancel()
        print(f"Client {client_id} disconnected.")

async def send_random_numbers(websocket: WebSocket, client_id: str):
    try:
        while True:
            # Generate random number message
            random_message = ServerMessage(
                type="data",
                content=str(random.randint(1, 100)),
                client_id=client_id
            )
            await websocket.send_text(random_message.model_dump_json())
            await asyncio.sleep(3)
    except Exception:
        # If the websocket is closed or an error occurs, exit the loop.
        pass

@router.get("/docs", include_in_schema=True)
async def websocket_docs():
    """
    WebSocket documentation (manually added to OpenAPI).
    - **Connect to WebSocket**: `ws://localhost:5000/ws/test/{client_id}`
    - **Receive Messages**: Receive JSON that conforms to the ServerMessage schema
    """
    return {
        "WebSocket URL": "ws://localhost:5000/ws/test/{client_id}",
        "Description": "Duplex WebSocket communication endpoint with random number generation.",
        "Message Formats": {
            "ServerMessage": {
                "type": "string - 'data', 'broadcast'",
                "content": "string - message content"
            }
        },
        "Instructions": "Connect with a WebSocket client. Send properly formatted JSON messages."
    }