#!/bin/bash
set -e

echo "=========================================="
echo "Starting COMPETIQ Full-Stack Services..."
echo "=========================================="

# Absolute path to repository root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Root directory: $ROOT_DIR"

# Determine Python path using absolute paths
if [ -f "$ROOT_DIR/backend/venv/bin/python3" ]; then
  PYTHON_BIN="$ROOT_DIR/backend/venv/bin/python3"
elif [ -f "$ROOT_DIR/backend/venv/bin/python" ]; then
  PYTHON_BIN="$ROOT_DIR/backend/venv/bin/python"
elif [ -f "/app/backend/venv/bin/python3" ]; then
  PYTHON_BIN="/app/backend/venv/bin/python3"
elif command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Error: Python executable not found."
  exit 1
fi

echo "Using Python executable: $PYTHON_BIN"
export PYTHONPATH="$ROOT_DIR/backend:$PYTHONPATH"

# Navigate to backend directory and start FastAPI on 0.0.0.0:8000 with nohup
echo "Starting FastAPI backend service on http://0.0.0.0:8000..."
cd "$ROOT_DIR/backend"
nohup $PYTHON_BIN -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend process launched with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend health probe..."
MAX_RETRIES=30
COUNT=0
HEALTHY=0

while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "FastAPI backend is online and healthy!"
    HEALTHY=1
    break
  fi
  sleep 1
  COUNT=$((COUNT + 1))
done

if [ $HEALTHY -eq 0 ]; then
  echo "Warning: Backend did not report healthy within 30s. Checking logs:"
  cat /tmp/backend.log || true
fi

# Return to root directory
cd "$ROOT_DIR"

# Start Next.js frontend on public PORT (Railway passes $PORT)
PORT="${PORT:-3000}"
echo "Starting Next.js frontend on 0.0.0.0:$PORT..."
exec npx next start -p "$PORT" -H 0.0.0.0
