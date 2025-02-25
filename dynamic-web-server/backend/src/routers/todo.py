# src/routers/todo.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.db import conn, models
from pydantic import BaseModel

"""
When designing schemas, consider the data flow from request to response.
What fields will the user provide when creating/updating a todo? (title, description, completed status)
What fields should be returned in the response? (id, title, description, completed status)
Ensure type safety and optional values where necessary to allow flexibility in requests.
"""
class schemas:

    # Base schema for Todo
    class TodoBase(BaseModel):
        title: str
        description: str | None = None
        completed: bool = False

    # Schema for creating a Todo
    class TodoCreate(TodoBase):
        pass

    # Schema for updating a Todo
    class TodoUpdate(TodoBase):
        pass

    # Schema for response including ID
    class TodoResponse(TodoBase):
        id: int
        class Config:
            from_attributes = True

"""
Define CRUD operations for interacting with the database
Always use the request and response schemas defined earlier to maintain consistency.
This ensures input validation, prevents unexpected fields, and keeps responses structured correctly.
When designing CRUD functions, think about efficiency and data integrity.
Ensure database commits happen only after all necessary modifications.
Use proper error handling to manage cases where a todo item doesn't exist.
"""
class crud:

    # Create a new todo item
    def create_todo(db: Session, todo: schemas.TodoCreate):
        db_todo = models.Todo(**todo.model_dump())
        db.add(db_todo)
        db.commit()
        db.refresh(db_todo)
        return db_todo

    # Get a list of todos with optional pagination
    def get_todos(db: Session, skip: int = 0, limit: int = 10):
        return db.query(models.Todo).offset(skip).limit(limit).all()

    # Get a single todo by ID
    def get_todo(db: Session, todo_id: int):
        return db.query(models.Todo).filter(models.Todo.id == todo_id).first()

    # Update a todo item
    def update_todo(db: Session, todo_id: int, todo: schemas.TodoUpdate):
        db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
        if not db_todo:
            return None
        for key, value in todo.dict(exclude_unset=True).items():
            setattr(db_todo, key, value)
        db.commit()
        db.refresh(db_todo)
        return db_todo

    # Delete a todo item
    def delete_todo(db: Session, todo_id: int):
        db_todo = db.query(models.Todo).filter(models.Todo.id == todo_id).first()
        if not db_todo:
            return None
        db.delete(db_todo)
        db.commit()
        return db_todo

"""
Always use the CRUD functions defined earlier to handle data operations.
Ensure that only the request and response schemas are used to enforce consistency.
This maintains a clear separation of concerns between data processing (CRUD) and API handling (router).
"""

# Define API router for Todo
router = APIRouter(prefix="/api/v1/todos", tags=["todos"])

depends_db = Depends(conn.get_db)

# Endpoint to create a todo
@router.post("/", response_model=schemas.TodoResponse)
def create_todo(todo: schemas.TodoCreate, db: Session = depends_db):
    return crud.create_todo(db, todo)

# Endpoint to get a list of todos
@router.get("/", response_model=list[schemas.TodoResponse])
def read_todos(skip: int = 0, limit: int = 10, db: Session = depends_db):
    return crud.get_todos(db, skip=skip, limit=limit)

# Endpoint to get a single todo by ID
@router.get("/{todo_id}", response_model=schemas.TodoResponse)
def read_todo(todo_id: int, db: Session = depends_db):
    todo = crud.get_todo(db, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo

# Endpoint to update a todo
@router.put("/{todo_id}", response_model=schemas.TodoResponse)
def update_todo(todo_id: int, todo: schemas.TodoUpdate, db: Session = depends_db):
    updated_todo = crud.update_todo(db, todo_id, todo)
    if not updated_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return updated_todo

# Endpoint to delete a todo
@router.delete("/{todo_id}", response_model=schemas.TodoResponse)
def delete_todo(todo_id: int, db: Session = depends_db):
    deleted_todo = crud.delete_todo(db, todo_id)
    if not deleted_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return deleted_todo