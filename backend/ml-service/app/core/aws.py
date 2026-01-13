"""AWS SDK Configuration and Service Initialization"""

import boto3
from botocore.exceptions import ClientError
import logging
from functools import lru_cache
from app.core.config import settings

logger = logging.getLogger(__name__)


class AWSConfig:
    """Handles AWS service initialization and configuration"""
    
    _s3_client = None
    _cloudwatch_client = None
    _ssm_client = None
    
    @classmethod
    def get_s3_client(cls):
        """Get or create S3 client"""
        if cls._s3_client is None:
            try:
                cls._s3_client = boto3.client(
                    "s3",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                logger.info(f"S3 client initialized for region {settings.AWS_REGION}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {str(e)}")
                raise
        return cls._s3_client
    
    @classmethod
    def get_cloudwatch_client(cls):
        """Get or create CloudWatch client for logging metrics"""
        if cls._cloudwatch_client is None:
            try:
                cls._cloudwatch_client = boto3.client(
                    "cloudwatch",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                logger.info("CloudWatch client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize CloudWatch client: {str(e)}")
                raise
        return cls._cloudwatch_client
    
    @classmethod
    def get_ssm_client(cls):
        """Get or create SSM Parameter Store client"""
        if cls._ssm_client is None:
            try:
                cls._ssm_client = boto3.client(
                    "ssm",
                    region_name=settings.AWS_REGION,
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                )
                logger.info("SSM client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize SSM client: {str(e)}")
                raise
        return cls._ssm_client


class S3ModelLoader:
    """Handles downloading models from S3"""
    
    def __init__(self):
        self.s3_client = AWSConfig.get_s3_client()
        self.logger = logger
    
    def download_model(self, bucket: str, key: str, local_path: str) -> bool:
        """
        Download model from S3 to local storage
        
        Args:
            bucket: S3 bucket name
            key: S3 object key/path
            local_path: Local file path to save to
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.logger.info(f"Downloading model from s3://{bucket}/{key} to {local_path}")
            self.s3_client.download_file(bucket, key, local_path)
            self.logger.info(f"Successfully downloaded model to {local_path}")
            return True
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "NoSuchKey":
                self.logger.error(f"Model not found at s3://{bucket}/{key}")
            elif error_code == "NoSuchBucket":
                self.logger.error(f"Bucket {bucket} does not exist")
            else:
                self.logger.error(f"AWS error downloading model: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error downloading model: {str(e)}")
            return False
    
    def upload_model(self, local_path: str, bucket: str, key: str) -> bool:
        """
        Upload model from local storage to S3
        
        Args:
            local_path: Local file path
            bucket: S3 bucket name
            key: S3 object key/path
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            self.logger.info(f"Uploading model from {local_path} to s3://{bucket}/{key}")
            self.s3_client.upload_file(local_path, bucket, key)
            self.logger.info(f"Successfully uploaded model to s3://{bucket}/{key}")
            return True
        except ClientError as e:
            self.logger.error(f"AWS error uploading model: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error uploading model: {str(e)}")
            return False


class CloudWatchMetrics:
    """Handles CloudWatch metrics and logging"""
    
    def __init__(self, namespace: str = "LYNQ-ML-Service"):
        self.cloudwatch = AWSConfig.get_cloudwatch_client()
        self.namespace = namespace
        self.logger = logger
    
    def put_metric(self, metric_name: str, value: float, unit: str = "None", dimensions: dict = None):
        """
        Put a custom metric to CloudWatch
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
            dimensions: Dict of dimension name/value pairs
        """
        try:
            metric_data = {
                "MetricName": metric_name,
                "Value": value,
                "Unit": unit,
            }
            
            if dimensions:
                metric_data["Dimensions"] = [
                    {"Name": k, "Value": str(v)} for k, v in dimensions.items()
                ]
            
            self.cloudwatch.put_metric_data(
                Namespace=self.namespace,
                MetricData=[metric_data]
            )
            self.logger.debug(f"Sent metric {metric_name} to CloudWatch")
        except Exception as e:
            self.logger.error(f"Error sending metric to CloudWatch: {str(e)}")
    
    def log_inference_metric(self, model_name: str, latency_ms: float, success: bool):
        """
        Log inference metrics to CloudWatch
        
        Args:
            model_name: Name of the model used
            latency_ms: Inference latency in milliseconds
            success: Whether inference was successful
        """
        self.put_metric(
            "InferenceLatency",
            latency_ms,
            unit="Milliseconds",
            dimensions={"ModelName": model_name, "Success": str(success)}
        )


# Singleton instance
@lru_cache()
def get_aws_config() -> AWSConfig:
    """Get AWS configuration singleton"""
    return AWSConfig()


@lru_cache()
def get_s3_loader() -> S3ModelLoader:
    """Get S3 model loader singleton"""
    return S3ModelLoader()


@lru_cache()
def get_cloudwatch_metrics() -> CloudWatchMetrics:
    """Get CloudWatch metrics singleton"""
    return CloudWatchMetrics()
