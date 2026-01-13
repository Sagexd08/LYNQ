# AWS Deployment Guide for LYNQ ML Service

## Overview

This guide covers deploying the LYNQ ML inference service on AWS Free Tier (EC2 t2.micro) with S3 model storage. The service will run on AWS and integrate with the NodeJS backend.

## Architecture

```
NodeJS Backend (Railway/Fly.io)
    ↓
AWS EC2 t2.micro (FastAPI ML Service)
    ↓
AWS S3 (Model Storage)
    ↓
AWS Secrets Manager (Optional - API Keys)
```

## Prerequisites

- AWS Account (Free Tier eligible)
- AWS CLI installed and configured
- Docker installed locally (for building images)
- SSH key pair for EC2 access
- Domain name (optional, for production)

## Step 1: Create S3 Bucket for Models

### 1.1 Create Bucket

```bash
# Using AWS CLI
aws s3 mb s3://lynq-models --region us-east-1

# Or via AWS Console:
# 1. Go to S3 Console
# 2. Click "Create bucket"
# 3. Name: lynq-models
# 4. Region: us-east-1 (or your preferred region)
# 5. Uncheck "Block all public access" (or configure as needed)
# 6. Create bucket
```

### 1.2 Upload Model Files

```bash
# Upload model files to S3
aws s3 cp ./ml-service/models/credit_model.pkl s3://lynq-models/models/credit_model_v1.pkl
aws s3 cp ./ml-service/models/scaler.pkl s3://lynq-models/models/credit_model_v1_scaler.pkl
aws s3 cp ./ml-service/models/feature_config.json s3://lynq-models/models/credit_model_v1_config.json

# Or via AWS Console:
# 1. Navigate to lynq-models bucket
# 2. Create folder: models/
# 3. Upload files:
#    - credit_model_v1.pkl          (XGBoost classifier model, ~2-5 MB)
#    - credit_model_v1_scaler.pkl   (StandardScaler for feature normalization, ~1-2 KB)
#    - credit_model_v1_config.json  (Feature configuration and model metadata, ~1 KB)
#
# Model File Details:
# - credit_model_v1.pkl: Trained XGBoost classifier for credit risk prediction
#   - Model Type: XGBoost Classifier
#   - Features: 12 (wallet_age_days, total_transactions, total_volume_usd, etc.)
#   - Performance: Accuracy 99.99%, F1 Score 99.95%, ROC-AUC 1.0000
#   - Training Samples: 100,000 synthetic DeFi lending records
#   - Default Rate: ~8% (imbalanced dataset)
#
# - credit_model_v1_scaler.pkl: StandardScaler for feature normalization
#   - Ensures all features are on the same scale (mean=0, std=1)
#   - Required for consistent model predictions
#
# - credit_model_v1_config.json: Model metadata and feature configuration
#   - Feature names and order
#   - Model version (v1.0.0)
#   - Training metrics and performance statistics
#   - Creation timestamp
```

### 1.3 Configure Bucket Policy (Optional)

For EC2 instance access, create a bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/lynq-ml-ec2-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lynq-models",
        "arn:aws:s3:::lynq-models/*"
      ]
    }
  ]
}
```

## Step 2: Create IAM Role for EC2

### 2.1 Create IAM Role

**Via AWS Console:**

1. Go to IAM → Roles → Create role
2. Select "AWS service" → "EC2"
3. Click "Next"
4. Attach policies:
   - `AmazonS3ReadOnlyAccess` (or custom policy for your bucket)
5. Role name: `lynq-ml-ec2-role`
6. Create role

**Custom Policy (if needed):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::lynq-models",
        "arn:aws:s3:::lynq-models/*"
      ]
    }
  ]
}
```

### 2.2 Create IAM User (Alternative - for Access Keys)

If not using IAM roles, create a user:

1. Go to IAM → Users → Create user
2. Username: `lynq-ml-service`
3. Attach policy: `AmazonS3ReadOnlyAccess`
4. Create access key (save credentials securely)

## Step 3: Launch EC2 Instance

### 3.1 Launch Instance

**Via AWS Console:**

1. Go to EC2 → Instances → Launch instance
2. **Name**: `lynq-ml-service`
3. **AMI**: Amazon Linux 2023 (Free Tier eligible)
4. **Instance type**: t2.micro (Free Tier)
5. **Key pair**: Create new or select existing
6. **Network settings**:
   - Create security group: `lynq-ml-sg`
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 8000) from anywhere (or specific IPs)
7. **Configure storage**: 8 GB gp3 (Free Tier)
8. **Advanced details**:
   - IAM instance profile: `lynq-ml-ec2-role`
9. Launch instance

### 3.2 Security Group Configuration

**Inbound Rules:**
- SSH (22) - Your IP only
- HTTP (8000) - 0.0.0.0/0 (or specific IPs for production)
- HTTPS (443) - Optional, if using ALB

**Outbound Rules:**
- All traffic (default)

## Step 4: Connect to EC2 Instance

### 4.1 SSH Connection

```bash
# Get instance public IP from EC2 console
ssh -i your-key.pem ec2-user@YOUR_EC2_IP

# Or using AWS Systems Manager Session Manager (no SSH key needed)
aws ssm start-session --target i-YOUR_INSTANCE_ID
```

### 4.2 Install Docker

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install docker -y

# Start Docker service
sudo service docker start

# Add ec2-user to docker group
sudo usermod -a -G docker ec2-user

# Log out and back in, or:
newgrp docker

# Verify installation
docker --version
```

### 4.3 Install Docker Compose (Optional)

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

## Step 5: Deploy ML Service

### 5.1 Option A: Docker Image from Registry

**Build and push to ECR or Docker Hub:**

```bash
# On your local machine
cd backend/ml-service

# Build image
docker build -t lynq-ml-service:latest .

# Tag for ECR (replace with your account ID and region)
docker tag lynq-ml-service:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lynq-ml-service:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lynq-ml-service:latest
```

**Or push to Docker Hub:**

```bash
docker tag lynq-ml-service:latest YOUR_DOCKERHUB_USERNAME/lynq-ml-service:latest
docker push YOUR_DOCKERHUB_USERNAME/lynq-ml-service:latest
```

**Pull and run on EC2:**

```bash
# Login to registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Or Docker Hub
docker login

# Pull image
docker pull YOUR_REGISTRY/lynq-ml-service:latest

# Run container
docker run -d \
  --name lynq-ml-service \
  -p 8000:8000 \
  -e MODEL_SOURCE=s3 \
  -e S3_BUCKET=lynq-models \
  -e S3_KEY=models/credit_model_v1.pkl \
  -e AWS_REGION=us-east-1 \
  -e API_KEY=your-secure-api-key-here \
  -e ENABLE_SHAP=true \
  -e HOST=0.0.0.0 \
  -e PORT=8000 \
  YOUR_REGISTRY/lynq-ml-service:latest
```

### 5.2 Option B: Direct Git Clone and Build

**On EC2 instance:**

```bash
# Install Git
sudo yum install git -y

# Install Python 3.11 (if not using Docker)
sudo yum install python3.11 python3.11-pip -y

# Clone repository
git clone YOUR_REPO_URL
cd LYNQ/backend/ml-service

# Create .env file
cat > .env << EOF
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1
API_KEY=your-secure-api-key-here
ENABLE_SHAP=true
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
EOF

# Build and run with Docker
docker build -t lynq-ml-service .
docker run -d --name lynq-ml -p 8000:8000 --env-file .env lynq-ml-service
```

## Step 6: Configure Environment Variables

### 6.1 Using .env File (Docker)

Create `.env` file on EC2:

```bash
nano .env
```

```env
# Model Configuration
MODEL_SOURCE=s3
S3_BUCKET=lynq-models
S3_KEY=models/credit_model_v1.pkl
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM role)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# API Security
API_KEY=your-secure-api-key-min-32-chars

# Feature Flags
ENABLE_SHAP=true
PRELOAD_MODEL=false

# Server Configuration
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

### 6.2 Using AWS Secrets Manager (Recommended for Production)

**Create secret:**

```bash
aws secretsmanager create-secret \
  --name lynq/ml-service/config \
  --secret-string '{
    "API_KEY": "your-secure-api-key",
    "AWS_ACCESS_KEY_ID": "your-key",
    "AWS_SECRET_ACCESS_KEY": "your-secret"
  }' \
  --region us-east-1
```

**Update IAM role to allow Secrets Manager access:**

Add policy to `lynq-ml-ec2-role`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:lynq/ml-service/config-*"
    }
  ]
}
```

## Step 7: Set Up Process Manager (PM2 or systemd)

### 7.1 Using systemd (Recommended)

**Create service file:**

```bash
sudo nano /etc/systemd/system/lynq-ml.service
```

```ini
[Unit]
Description=LYNQ ML Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/lynq-ml
ExecStart=/usr/bin/docker run --rm --name lynq-ml-service -p 8000:8000 --env-file /home/ec2-user/lynq-ml/.env YOUR_REGISTRY/lynq-ml-service:latest
ExecStop=/usr/bin/docker stop lynq-ml-service
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable lynq-ml
sudo systemctl start lynq-ml
sudo systemctl status lynq-ml
```

### 7.2 Using Docker Compose

**Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  ml-service:
    image: YOUR_REGISTRY/lynq-ml-service:latest
    container_name: lynq-ml-service
    ports:
      - "8000:8000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Run:**

```bash
docker-compose up -d
docker-compose logs -f
```

## Step 8: Verify Deployment

### 8.1 Health Check

```bash
# From EC2 instance
curl http://localhost:8000/health

# From your local machine
curl http://YOUR_EC2_IP:8000/health
```

**Expected response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_version": "v1.0.0",
  "uptime_seconds": 123
}
```

### 8.2 Test Credit Scoring

```bash
curl -X POST http://YOUR_EC2_IP:8000/api/ml/credit-score \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: your-api-key" \
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f2bE92",
    "wallet_age_days": 365,
    "total_transactions": 150,
    "total_volume_usd": 50000.0,
    "defi_interactions": 25,
    "loan_amount": 1000.0,
    "collateral_value_usd": 1500.0,
    "term_months": 3,
    "previous_loans": 2,
    "successful_repayments": 2,
    "defaults": 0,
    "reputation_score": 75
  }'
```

## Step 9: Update Backend Configuration

### 9.1 Update Backend .env

Add ML service URL to your backend `.env`:

```env
# ML Service Configuration
ML_SERVICE_URL=http://YOUR_EC2_IP:8000
# Or with domain:
# ML_SERVICE_URL=https://ml.lynq.io

ML_API_KEY=your-secure-api-key-here
```

### 9.2 Test Backend Connection

```bash
# From backend server or local machine
curl http://YOUR_EC2_IP:8000/health \
  -H "X-API-KEY: your-api-key"
```

## Step 10: Set Up Domain and SSL (Optional)

### 10.1 Using Route 53

1. Create hosted zone in Route 53
2. Add A record pointing to EC2 IP
3. Update backend `ML_SERVICE_URL` to use domain

### 10.2 Using CloudFront (Recommended)

1. Create CloudFront distribution
2. Origin: EC2 IP or ALB
3. SSL certificate from ACM
4. Update backend to use CloudFront URL

### 10.3 Using Application Load Balancer

1. Create ALB in same VPC as EC2
2. Create target group with EC2 instance
3. Configure HTTPS listener with ACM certificate
4. Update security group to allow ALB traffic

## Step 11: Monitoring and Logging

### 11.1 CloudWatch Logs

**Create log group:**

```bash
aws logs create-log-group --log-group-name /aws/ec2/lynq-ml-service
```

**Configure Docker logging driver:**

Update docker run command:
```bash
docker run -d \
  --name lynq-ml-service \
  --log-driver awslogs \
  --log-opt awslogs-group=/aws/ec2/lynq-ml-service \
  --log-opt awslogs-region=us-east-1 \
  --log-opt awslogs-stream-prefix=ml-service \
  -p 8000:8000 \
  --env-file .env \
  YOUR_REGISTRY/lynq-ml-service:latest
```

### 11.2 CloudWatch Metrics

Install CloudWatch agent (optional):

```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm
```

## Step 12: Auto-Scaling (Future - Not Free Tier)

For production scaling (requires paid tier):

1. Create Launch Template with EC2 configuration
2. Create Auto Scaling Group
3. Configure scaling policies
4. Set up Application Load Balancer

## Cost Optimization (Free Tier)

### Free Tier Limits:
- **EC2 t2.micro**: 750 hours/month
- **S3**: 5 GB storage, 20,000 GET requests
- **Data Transfer**: 1 GB out/month
- **CloudWatch**: 5 GB logs, 10 custom metrics

### Tips:
- Use single EC2 instance (no load balancer)
- Store only essential model files in S3
- Compress model files before upload
- Use CloudWatch sparingly
- Monitor usage in AWS Cost Explorer

## Security Best Practices

### 1. Network Security
- Restrict security group to specific IPs (not 0.0.0.0/0)
- Use VPC with private subnets
- Consider VPN or bastion host

### 2. Access Control
- Use IAM roles instead of access keys
- Rotate API keys regularly
- Use AWS Secrets Manager for sensitive data

### 3. Application Security
- Keep Docker images updated
- Use non-root user in containers
- Enable HTTPS in production
- Implement rate limiting

## Troubleshooting

### Service Not Starting

```bash
# Check Docker logs
docker logs lynq-ml-service

# Check systemd logs
sudo journalctl -u lynq-ml -f

# Check if port is in use
sudo netstat -tulpn | grep 8000
```

### Model Not Loading

```bash
# Test S3 access
aws s3 ls s3://lynq-models/models/

# Check IAM role permissions
aws sts get-caller-identity

# Verify environment variables
docker exec lynq-ml-service env | grep S3
```

### High Latency

- Check EC2 instance metrics in CloudWatch
- Consider upgrading instance type (not free tier)
- Optimize model size
- Use model caching

## Maintenance

### Update Model

```bash
# Upload new model to S3
aws s3 cp new_model.pkl s3://lynq-models/models/credit_model_v2.pkl

# Update environment variable
# Edit .env: S3_KEY=models/credit_model_v2.pkl

# Restart service
sudo systemctl restart lynq-ml
```

### Update Application

```bash
# Pull new image
docker pull YOUR_REGISTRY/lynq-ml-service:latest

# Restart container
sudo systemctl restart lynq-ml
```

## Backup and Recovery

### Model Backup

```bash
# Backup model files
aws s3 sync s3://lynq-models s3://lynq-models-backup
```

### Configuration Backup

```bash
# Backup .env file
cp .env .env.backup

# Or store in S3
aws s3 cp .env s3://lynq-models-backup/config/.env
```

## Quick Reference

### Important URLs
- EC2 Console: https://console.aws.amazon.com/ec2
- S3 Console: https://console.aws.amazon.com/s3
- IAM Console: https://console.aws.amazon.com/iam
- CloudWatch: https://console.aws.amazon.com/cloudwatch

### Key Commands

```bash
# SSH to instance
ssh -i key.pem ec2-user@EC2_IP

# View logs
docker logs -f lynq-ml-service

# Restart service
sudo systemctl restart lynq-ml

# Check status
sudo systemctl status lynq-ml

# Test health
curl http://localhost:8000/health
```

## Next Steps

1. ✅ Set up Supabase (you'll provide credentials)
2. ✅ Configure backend with Supabase credentials
3. ✅ Update backend ML_SERVICE_URL to EC2 IP
4. ✅ Test end-to-end flow
5. ⏭️ Set up monitoring alerts
6. ⏭️ Configure auto-scaling (when needed)
7. ⏭️ Set up CI/CD pipeline

---

## Supabase Integration

Once you provide Supabase credentials, update the backend `.env`:

```env
# Supabase Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The backend will automatically use Supabase for:
- Authentication
- Database operations
- Row Level Security (RLS)

---

**Status**: Ready for Supabase credentials and final configuration
