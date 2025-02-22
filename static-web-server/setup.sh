#!/bin/bash

# Update and install Nginx
echo "Installing Nginx..."
sudo apt install nginx -y

# Start Nginx
echo "Starting Nginx..."
sudo systemctl start nginx

# Remove default index.html and copy new static files
echo "Deploying static files..."
sudo rm -rf /var/www/html/*
sudo cp -r . /var/www/html/

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "Setup complete! Open http://localhost in your browser."