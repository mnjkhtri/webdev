from sqlalchemy import Column, Integer, String, Boolean
from src.db.conn import Base

# Define the Todo model, which represents the "todos" table in the database
class Todo(Base):
    # Set the table name in the database
    __tablename__ = "todos"
    # Define the columns of the table
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)