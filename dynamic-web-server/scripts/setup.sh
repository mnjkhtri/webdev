#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

# Install backend dependencies
echo "Installing Python dependencies..."
cd backend
pip install -r requirements.txt

# Install frontend dependencies
echo "Installing Node.js dependencies..."
cd ../frontend
npm install

echo "All dependencies installed successfully!"