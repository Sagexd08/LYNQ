# Example terraform.tfvars for LYNQ ML Service
# Copy to terraform.tfvars and update with your actual values

aws_region = "us-east-1"

# Replace with your VPC ID
vpc_id = "vpc-xxxxxxxxx"

instance_type  = "t3.medium"
instance_count = 2

root_volume_size = 30

iam_role_name   = "lynq-ml-ec2-role"
s3_bucket_name  = "lynq-ml-models"

# Allow access from your private network or load balancer
allowed_cidr_blocks = [
  "10.0.0.0/8"
]

# Restrict SSH to bastion hosts
allowed_ssh_cidr_blocks = [
  "10.0.1.0/24"
]

associate_public_ip = false

log_retention_days = 30

tags = {
  Project     = "LYNQ"
  Component   = "ML-Service"
  Environment = "production"
  ManagedBy   = "Terraform"
  Owner       = "ml-team"
}
