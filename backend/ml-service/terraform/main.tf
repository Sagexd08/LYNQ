terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ===== Data Sources =====

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ===== S3 Bucket for ML Models =====

resource "aws_s3_bucket" "ml_models" {
  bucket = var.s3_bucket_name

  tags = merge(var.tags, {
    Name = "LYNQ ML Models"
  })
}

resource "aws_s3_bucket_versioning" "ml_models" {
  bucket = aws_s3_bucket.ml_models.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "ml_models" {
  bucket = aws_s3_bucket.ml_models.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "ml_models" {
  bucket = aws_s3_bucket.ml_models.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ===== IAM Role for EC2 =====

resource "aws_iam_role" "ec2_role" {
  name = var.iam_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "ec2_s3_policy" {
  name = "${var.iam_role_name}-s3"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.ml_models.arn,
          "${aws_s3_bucket.ml_models.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "ec2_ssm_policy" {
  name = "${var.iam_role_name}-ssm"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/lynq/ml-service/*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "ec2_cloudwatch_policy" {
  name = "${var.iam_role_name}-cloudwatch"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.iam_role_name}-profile"
  role = aws_iam_role.ec2_role.name
}

# ===== Security Group =====

resource "aws_security_group" "ml_service" {
  name        = "lynq-ml-service-sg"
  description = "Security group for LYNQ ML Service"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks

    description = "ML Service API"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr_blocks

    description = "SSH access"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]

    description = "All outbound traffic"
  }

  tags = merge(var.tags, {
    Name = "LYNQ ML Service SG"
  })
}

# ===== EC2 Instance =====

resource "aws_instance" "ml_service" {
  count                = var.instance_count
  ami                  = data.aws_ami.ubuntu.id
  instance_type        = var.instance_type
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name
  vpc_security_group_ids = [aws_security_group.ml_service.id]

  user_data = base64encode(file("${path.module}/../scripts/ec2-user-data.sh"))

  monitoring              = true
  associate_public_ip_address = var.associate_public_ip

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "lynq-ml-service-root"
    }
  }

  tags = merge(var.tags, {
    Name = "lynq-ml-service-${count.index + 1}"
  })

  depends_on = [
    aws_iam_role_policy.ec2_s3_policy,
    aws_iam_role_policy.ec2_ssm_policy,
    aws_iam_role_policy.ec2_cloudwatch_policy
  ]
}

# ===== CloudWatch Log Group =====

resource "aws_cloudwatch_log_group" "ml_service" {
  name              = "/aws/ec2/lynq-ml-service"
  retention_in_days = var.log_retention_days

  tags = merge(var.tags, {
    Name = "LYNQ ML Service Logs"
  })
}

# ===== Outputs =====

output "ml_service_instance_ids" {
  description = "IDs of the EC2 instances running ML Service"
  value       = aws_instance.ml_service[*].id
}

output "ml_service_private_ips" {
  description = "Private IP addresses of ML Service instances"
  value       = aws_instance.ml_service[*].private_ip
}

output "ml_service_public_ips" {
  description = "Public IP addresses of ML Service instances (if applicable)"
  value       = aws_instance.ml_service[*].public_ip
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for ML models"
  value       = aws_s3_bucket.ml_models.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role for EC2 instances"
  value       = aws_iam_role.ec2_role.arn
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.ml_service.id
}

# ===== Data Sources =====

data "aws_caller_identity" "current" {}
