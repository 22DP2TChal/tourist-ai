#!/bin/bash

# AI Tourist — startup script
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Create virtual environment if needed
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# Install / upgrade dependencies
echo "Installing dependencies..."
venv/bin/pip install -q \
  fastapi==0.111.0 \
  "uvicorn[standard]==0.29.0" \
  sqlalchemy==2.0.30 \
  psycopg2-binary \
  bcrypt==4.2.1 \
  python-jose[cryptography] \
  python-multipart \
  python-dotenv \
  openai \
  "pydantic[email]" \
  pydantic-settings \
  httpx

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Created .env — please edit it and add your API keys before starting!"
  echo ""
fi

echo ""
echo "Starting AI Tourist server..."
echo "Open http://localhost:8000 in your browser"
echo ""

venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
