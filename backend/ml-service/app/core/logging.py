import logging
import sys
import uuid
from typing import Optional
from contextvars import ContextVar


request_id_var: ContextVar[Optional[str]] = ContextVar('request_id', default=None)


def get_request_id() -> str:
    """Get or create a request ID for the current context."""
    request_id = request_id_var.get()
    if request_id is None:
        request_id = str(uuid.uuid4())
        request_id_var.set(request_id)
    return request_id


class RequestIDFilter(logging.Filter):
    """Logging filter to add request ID to log records."""
    
    def filter(self, record):
        record.request_id = get_request_id()
        return True


def setup_logging(log_level: str = "INFO"):
    """Setup structured logging with request ID support."""
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format='%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Add request ID filter to root logger
    root_logger = logging.getLogger()
    for handler in root_logger.handlers:
        handler.addFilter(RequestIDFilter())


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with request ID support."""
    logger = logging.getLogger(name)
    return logger
