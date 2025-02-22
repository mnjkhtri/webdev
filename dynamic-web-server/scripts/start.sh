#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

# Start the backend
echo "Starting Flask backend..."
cd backend
python3 src/app.py &

# Start the frontend
echo "Starting Next.js frontend..."
cd ../frontend
npm run dev &

# Wait for both processes
wait