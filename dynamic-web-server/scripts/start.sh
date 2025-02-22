#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

# Start the backend
echo "Starting Flask backend..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Run FastAPI app with Uvicorn
uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload &

# Start the frontend
echo "Starting Next.js frontend..."
cd ../frontend
npm run dev &

# Wait for both processes
wait