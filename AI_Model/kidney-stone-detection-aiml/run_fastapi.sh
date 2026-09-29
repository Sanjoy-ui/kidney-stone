#!/bin/bash

# FastAPI Server Startup Script
# This script starts the Kidney Stone Detection FastAPI server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python3 is not installed${NC}"
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Activate virtual environment if present
if [ -d "venv" ]; then
    echo -e "${GREEN}Activating virtual environment (venv)...${NC}"
    source venv/bin/activate
fi

# Check if requirements are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
python3 -c "import fastapi" 2>/dev/null || {
    echo -e "${YELLOW}Installing required packages...${NC}"
    pip install -r requirements.txt
}

# Check if model exists
if [ ! -f "models/best_model.h5" ]; then
    echo -e "${RED}Error: Model file not found at models/best_model.h5${NC}"
    echo -e "${YELLOW}Please train the model first using: python3 train_cnn.py${NC}"
    exit 1
fi

# Get port from argument or use default
PORT=${1:-8000}

# Start the server
echo -e "${GREEN}Starting Kidney Stone Detection API server...${NC}"
echo -e "${GREEN}API will be available at: http://localhost:$PORT${NC}"
echo -e "${GREEN}Documentation at: http://localhost:$PORT/docs${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

python3 fastapi_server.py $PORT
