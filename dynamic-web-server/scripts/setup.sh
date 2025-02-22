#!/bin/bash

# Move to project root directory
cd "$(dirname "$0")/.."

echo "Setting up backend and frontend environments..."

# === Backend Setup ===
echo "Creating and activating Python virtual environment..."
cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# === Frontend Setup ===
echo "Setting up Node.js environment..."
cd ../frontend

# Ensure correct Node.js version using nvm (if available)
if command -v nvm &> /dev/null; then
    echo "Using Node.js version from .nvmrc (if available)"
    nvm use || nvm install
else
    echo "nvm not found, using system Node.js version"
fi

echo "Installing Node.js dependencies..."
npm ci  # Uses package-lock.json for strict installations

echo "All dependencies installed successfully!"