# AWS Quick Start - LYNQ ML Service

## 5-Minute Setup Guide

### Prerequisites
- AWS Account
- AWS CLI configured (`aws configure`)
- SSH key pair

### Step 1: Create S3 Bucket (2 minutes)

```bash
# Create bucket
aws s3 mb s3://lynq-models --region us-east-1

# Upload model (if you have one)
aws s3 cp ./models/credit_model.pkl s3://lynq-models/models/credit_model_v1.pkl
```

### Step 2: Create IAM Role (1 minute)

1. AWS Console → IAM → Roles → Create role
2. Select "EC2"
3. Attach policy: `AmazonS3ReadOnlyAccess`
4. Name: `lynq-ml-ec2-role`
5. Create

### Step 3: Launch EC2 (2 minutes)

1. EC2 Console → Launch instance
2. AMI: Amazon Linux 2023
3. Instance: t2.micro
4. Security group: Allow port 8000 from anywhere
5. IAM role: `lynq-ml-ec2-role`
6. Launch

### Step 4: Deploy Service

```bash
# SSH to instance
ssh -i key.pem ec2-user@EC2_IP

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
newgrp docker

# Run ML service
docker run -d \
  --name lynq-ml \
  -p 8000:8000 \
  -e MODEL_SOURCE=s3 \
  -e S3_BUCKET=lynq-models \
  -e S3_KEY=models/credit_model_v1.pkl \
  -e AWS_REGION=us-east-1 \
  -e API_KEY=your-api-key \
  YOUR_DOCKERHUB_USERNAME/lynq-ml-service:latest
```

### Step 5: Test

```bash
curl http://EC2_IP:8000/health
```

### Step 6: Update Backend

```env
ML_SERVICE_URL=http://EC2_IP:8000
ML_API_KEY=your-api-key
```

**Done!** 🎉

For detailed instructions, see `AWS_DEPLOYMENT_GUIDE.md`
