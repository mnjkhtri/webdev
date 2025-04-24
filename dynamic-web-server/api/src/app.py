from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import chat
from src.routers import todo
from src.middleware import add_process_time_header
from src.db.conn import Base, engine

app = FastAPI()

"""
CORS (Cross-Origin Resource Sharing) controls how a frontend (running in a browser) can communicate with a backend from a different origin 
(i.e., a different protocol, domain, or port).
"""
# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/hello")
def hello():
    return {"message": "thanks claude lol"}

"""
A middleware is a function that works with every request before it is processed by any specific path operation. 
And also with every response before returning it.
"""
app.middleware("http")(add_process_time_header)

# Include Todo router
Base.metadata.create_all(bind=engine)
app.include_router(todo.router)

"""
The WebSocket API makes it possible to open a two-way interactive communication session between 
the user's browser and a server. 
With this API, you can send messages to a server and receive responses without having to poll the server for a reply.
"""
app.include_router(chat.router)