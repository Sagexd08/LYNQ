#!/bin/bash
# Complete LYNQ ML Service EC2 Deployment Script
# This script handles everything needed for deployment

set -e

echo "=========================================="
echo "LYNQ ML Service - EC2 Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/lynq-ml-service"
REPO_URL="https://github.com/Sagexd08/LYNQ.git"

# Step 1: Install System Dependencies
echo -e "${GREEN}[1/8] Installing system dependencies...${NC}"
sudo yum update -y
sudo yum install -y git docker curl wget

# Step 2: Start and Enable Docker
echo -e "${GREEN}[2/8] Setting up Docker...${NC}"
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user 2>/dev/null || true

# Step 3: Install Docker Compose
echo -e "${GREEN}[3/8] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose installed: $(docker-compose --version)"
else
    echo "Docker Compose already installed: $(docker-compose --version)"
fi

# Step 4: Create Application Directory
echo -e "${GREEN}[4/8] Creating application directory...${NC}"
sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Step 5: Clone Repository
echo -e "${GREEN}[5/8] Cloning repository...${NC}"
TEMP_DIR="/tmp/lynq-deploy-$$"
sudo rm -rf "$TEMP_DIR"
sudo git clone "$REPO_URL" "$TEMP_DIR" || {
    echo -e "${RED}Error: Failed to clone repository${NC}"
    echo "Trying alternative method..."
    # Alternative: Download files directly
    sudo mkdir -p "$TEMP_DIR/backend/ml-service"
    cd "$TEMP_DIR/backend/ml-service"
    sudo curl -o Dockerfile "https://raw.githubusercontent.com/Sagexd08/LYNQ/main/backend/ml-service/Dockerfile" || true
    sudo curl -o docker-compose.yml "https://raw.githubusercontent.com/Sagexd08/LYNQ/main/backend/ml-service/docker-compose.yml" || true
    sudo curl -o requirements.txt "https://raw.githubusercontent.com/Sagexd08/LYNQ/main/backend/ml-service/requirements.txt" || true
    cd "$APP_DIR"
}

# Step 6: Copy ML Service Files
echo -e "${GREEN}[6/8] Copying ML service files...${NC}"
if [ -d "$TEMP_DIR/backend/ml-service" ]; then
    echo "Copying from repository structure..."
    sudo cp -r "$TEMP_DIR/backend/ml-service"/* . 2>/dev/null || true
    sudo cp -r "$TEMP_DIR/backend/ml-service"/.[!.]* . 2>/dev/null || true
else
    echo -e "${YELLOW}Warning: Standard structure not found, checking alternatives...${NC}"
    # Try to find ml-service directory
    if [ -d "$TEMP_DIR/ml-service" ]; then
        sudo cp -r "$TEMP_DIR/ml-service"/* .
    else
        echo -e "${RED}Error: Could not find ML service files${NC}"
        echo "Available directories in repo:"
        ls -la "$TEMP_DIR" || true
        exit 1
    fi
fi

# Clean up temp directory
sudo rm -rf "$TEMP_DIR"

# Step 7: Create .env File
echo -e "${GREEN}[7/8] Creating environment configuration...${NC}"
sudo tee .env > /dev/null << 'ENVEOF'
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1
API_KEY=dev-api-key
ENABLE_SHAP=true
PRELOAD_MODEL=false
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO
ENVEOF

# Ensure app directory exists
sudo mkdir -p app

# Step 8: Build and Deploy
echo -e "${GREEN}[8/8] Building and deploying Docker container...${NC}"

# Stop any existing containers
sudo docker-compose down 2>/dev/null || true

# Build the image
echo "Building Docker image (this may take a few minutes)..."
sudo docker-compose build --no-cache || {
    echo -e "${RED}Build failed. Checking Docker status...${NC}"
    sudo systemctl status docker
    exit 1
}

# Start the service
echo "Starting ML service..."
sudo docker-compose up -d

# Wait for service to start
echo "Waiting for service to start..."
sleep 10

# Step 9: Verify Deployment
echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Verification"
echo "==========================================${NC}"
echo ""

# Check container status
echo "Container Status:"
sudo docker-compose ps

echo ""
echo "Testing health endpoint..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    curl -s http://localhost:8000/health | head -5
else
    echo -e "${YELLOW}⚠ Health check returned: $HEALTH_CHECK${NC}"
    echo "Checking logs..."
    sudo docker-compose logs --tail=50
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Service Management Commands:"
echo "  View logs:    sudo docker-compose logs -f"
echo "  Restart:      sudo docker-compose restart"
echo "  Stop:         sudo docker-compose down"
echo "  Status:       sudo docker-compose ps"
echo ""
echo "Test from outside EC2:"
echo "  curl http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000/health"
echo ""
