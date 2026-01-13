variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "VPC ID where EC2 instances will be launched"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "instance_count" {
  description = "Number of EC2 instances to launch"
  type        = number
  default     = 2
}

variable "root_volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 30
}

variable "iam_role_name" {
  description = "Name of the IAM role for EC2"
  type        = string
  default     = "lynq-ml-ec2-role"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for ML models"
  type        = string
  default     = "lynq-ml-models"
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the ML Service API"
  type        = list(string)
  default     = ["10.0.0.0/8"]  # Private network
}

variable "allowed_ssh_cidr_blocks" {
  description = "CIDR blocks allowed SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]  # Private network
}

variable "associate_public_ip" {
  description = "Associate public IP address with instances"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Project     = "LYNQ"
    Component   = "ML-Service"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}
