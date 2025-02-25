from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import items, models, drip, todo
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
FastAPI allows defining path parameters using Python's string formatting syntax. 
Path parameters can have type annotations, enabling automatic data conversion and validation. 
Path operations are evaluated in order, meaning specific paths must be declared before generic ones.
"""
app.include_router(items.router)

"""
To restrict a path parameter to specific values, use Enum
"""
app.include_router(models.router)

"""
Clients send data to your API using a request body, usually in JSON format, while the API responds with a response body. 
Unlike path or query parameters, request bodies are used when submitting structured data. 
FastAPI leverages Pydantic models to handle request bodies efficiently, ensuring type validation
"""
app.include_router(drip.router)

"""
A middleware is a function that works with every request before it is processed by any specific path operation. 
And also with every response before returning it.
"""
app.middleware("http")(add_process_time_header)

# Include Todo router
Base.metadata.create_all(bind=engine)
app.include_router(todo.router)