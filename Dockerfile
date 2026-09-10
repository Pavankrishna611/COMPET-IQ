# Multi-stage / Unified Full-Stack Container for COMPETIQ (Next.js 14 + FastAPI)
FROM node:20-bookworm-slim AS base

# Install Python 3.11, build tools, curl, and certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# 2. Setup Python environment and install backend requirements
COPY backend/requirements.txt ./backend/
RUN python3 -m venv /app/backend/venv && \
    /app/backend/venv/bin/pip install --upgrade pip && \
    /app/backend/venv/bin/pip install -r ./backend/requirements.txt

# 3. Copy full source code
COPY . .

# 4. Build Next.js production frontend
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 5. Make startup script executable
RUN chmod +x ./start.sh

# Expose default public port
EXPOSE 3000

ENV PORT=3000
CMD ["./start.sh"]
