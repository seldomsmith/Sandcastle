#!/bin/bash
# Antigravity Simulation Starter
# Set the local Node.js path and start the Vite development server

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="$PROJECT_DIR/.tools/bin:$PATH"

echo "🚀 Starting Antigravity Simulation (Node $(node -v))"
npm run dev
