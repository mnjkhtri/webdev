import asyncio
import random
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Literal
from src.middleware import get_api_key

router = APIRouter(
    prefix="/ws/test", 
    tags=["test"],
)

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
    
    **WebSocket URL**: `ws://localhost:5000/ws/test/{client_id}`

    **Description**: 
    This is a duplex WebSocket endpoint where:
    - The server sends random numbers every 3 seconds to the connected client.
    - Clients can send text messages to the server, which are broadcast to all connected clients.

    **Message Flow**:
    - **Client → Server**: Raw text (string) is sent. It will be wrapped into a broadcast message and sent to all clients.
    - **Server → Client**: JSON messages based on `ServerMessage` schema.

    **Schemas**:
    
    - **Client-to-Server Message**:
      - Type: `string`
      - Example: `"Hello everyone!"`
      - Notes: Must be a plain text message. The server will wrap this into a broadcast message.

    - **Server-to-Client Message (ServerMessage)**:
      ```json
      {
        "type": "data" | "broadcast",
        "content": "string",
        "client_id": "string"
      }
      ```
      - **type**: 
        - `"data"` – Automatically sent by the server with random numbers.
        - `"broadcast"` – Sent when a client sends a message to be shared with all.
      - **content**: 
        - For `"data"` type, a random number as a string.
        - For `"broadcast"` type, the original client message.
      - **client_id**: Identifier of the client who sent or received the message.

    **Usage Instructions**:
    1. Open a WebSocket connection to: `ws://localhost:5000/ws/test/{client_id}`.
    2. Send plain text messages.
    3. Listen for JSON messages from the server.
    4. Expect periodic random number messages and any broadcasted messages from other clients.

    """
    return {
        "WebSocket URL": "ws://localhost:5000/ws/test/{client_id}",
        "Description": "Duplex WebSocket communication endpoint with random number generation and broadcasting.",
        "Message Flow": {
            "Client-to-Server": {
                "type": "string (plain text)",
                "example": "Hello everyone!",
                "notes": "The server will convert this into a broadcast message."
            },
            "Server-to-Client (ServerMessage)": {
                "type": "'data' | 'broadcast'",
                "content": "string",
                "client_id": "string",
                "example": {
                    "type": "broadcast",
                    "content": "Hello everyone!",
                    "client_id": "client123"
                }
            }
        },
        "Instructions": [
            "Connect using a WebSocket client.",
            "Send plain text messages to broadcast to all clients.",
            "Listen for random 'data' messages and other clients' 'broadcast' messages."
        ]
    }