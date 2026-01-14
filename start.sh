#!/bin/sh

# Railway startup script
# This script runs migrations (if needed) and then starts the server

echo "Starting Railway deployment..."

# Run migrations (will fail gracefully if tables already exist)
echo "Running database migrations..."
npm run migrate || echo "Migration completed or already run"

# Start the server
echo "Starting server..."
npm start

