"""Health check endpoint."""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    """Return application health status."""
    return {
        "status": "ok",
        "service": "ReconScope API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }
