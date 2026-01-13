#!/bin/bash

# LYNQ ML Service EC2 User Data Script
# This script is run on EC2 instance startup with the lynq-ml-ec2-role IAM role attached
# It automatically downloads dependencies, pulls models from S3, and starts the service

set -e  # Exit on any error

echo "=== LYNQ ML Service EC2 Initialization Started ==="
echo "Instance ID: $(ec2-metadata --instance-id | cut -d ' ' -f 2)"
echo "Region: $(ec2-metadata --availability-zone | cut -d ' ' -f 2 | sed 's/.$//')"

# Update system packages
echo "Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    python3.11 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    awscli \
    jq

# Create application directory
APP_DIR="/opt/lynq-ml-service"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Create non-root user for the service
if ! id -u lynq-ml &>/dev/null; then
    useradd -m -s /bin/bash lynq-ml
fi

# Clone repository (or sync if already exists)
echo "Cloning LYNQ ML Service repository..."
git clone https://github.com/your-org/lynq-ml-service.git . || git pull origin main

# Create Python virtual environment
echo "Setting up Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Get AWS region
AWS_REGION=$(ec2-metadata --availability-zone | cut -d ' ' -f 2 | sed 's/.$//')

# Download model from S3 (using IAM role, no credentials needed)
echo "Downloading ML model from S3..."
mkdir -p models

# Get S3 bucket and key from SSM Parameter Store (optional, for security)
# Uncomment if you store these in Parameter Store:
# S3_BUCKET=$(aws ssm get-parameter --name "/lynq/ml-service/s3-bucket" --region "$AWS_REGION" --query 'Parameter.Value' --output text)
# S3_KEY=$(aws ssm get-parameter --name "/lynq/ml-service/s3-key" --region "$AWS_REGION" --query 'Parameter.Value' --output text)

# Or use defaults
S3_BUCKET="lynq-ml-models"
S3_KEY="models/credit-risk-v1.pkl"

aws s3 cp "s3://$S3_BUCKET/$S3_KEY" "models/credit_model.pkl" --region "$AWS_REGION"

if [ ! -f "models/credit_model.pkl" ]; then
    echo "ERROR: Failed to download model from S3!"
    exit 1
fi

echo "Model downloaded successfully"

# Create .env file with S3 configuration
# AWS credentials are NOT needed - IAM role will be used automatically
cat > .env << EOF
# LYNQ ML Service - EC2 Configuration
# AWS credentials are NOT set - boto3 will use EC2 IAM role (lynq-ml-ec2-role)

MODEL_SOURCE=s3
S3_BUCKET=$S3_BUCKET
S3_KEY=$S3_KEY
AWS_REGION=$AWS_REGION

# Leave credentials empty - IAM role will be used
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

API_KEY=$(aws ssm get-parameter --name "/lynq/ml-service/api-key" --region "$AWS_REGION" --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || echo "dev-api-key")

ENABLE_SHAP=true
PRELOAD_MODEL=false
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO
EOF

# Set proper permissions
chown -R lynq-ml:lynq-ml "$APP_DIR"
chmod 600 .env

# Create systemd service file
echo "Creating systemd service..."
sudo tee /etc/systemd/system/lynq-ml-service.service > /dev/null << 'EOF'
[Unit]
Description=LYNQ ML Service
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=lynq-ml
WorkingDirectory=/opt/lynq-ml-service
Environment="PATH=/opt/lynq-ml-service/venv/bin"
ExecStart=/opt/lynq-ml-service/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Resource limits
MemoryLimit=4G
CPUQuota=50%

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
echo "Enabling and starting the ML service..."
systemctl daemon-reload
systemctl enable lynq-ml-service
systemctl start lynq-ml-service

# Check service status
sleep 5
if systemctl is-active --quiet lynq-ml-service; then
    echo "✓ LYNQ ML Service is running"
else
    echo "✗ Failed to start service, checking logs:"
    systemctl status lynq-ml-service --no-pager
    journalctl -u lynq-ml-service -n 50 --no-pager
    exit 1
fi

# CloudWatch agent setup (optional, for monitoring)
echo "Setting up CloudWatch monitoring..."
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json > /dev/null << 'EOF'
{
  "metrics": {
    "namespace": "LYNQ-ML-Service",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Download and install CloudWatch agent
echo "Installing CloudWatch agent..."
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb
dpkg -i /tmp/amazon-cloudwatch-agent.deb

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

echo "=== LYNQ ML Service EC2 Initialization Completed Successfully ==="
echo "Service is running on port 8000"
echo "View logs with: journalctl -u lynq-ml-service -f"
