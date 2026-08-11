"""
ReconScope — FastAPI application entry point.

Initializes the database, configures CORS, and registers API routes.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.db import init_db
from app.api.scans import router as scans_router
from app.api.health import router as health_router
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — initialize resources on startup."""
    logger.info("ReconScope starting up...")
    init_db()
    logger.info("ReconScope ready")
    yield
    logger.info("ReconScope shutting down")


app = FastAPI(
    title="ReconScope API",
    description="Web Reconnaissance Automation Framework for authorized security testing",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global exception handler — never expose stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred"},
    )


# Register routers
app.include_router(health_router)
app.include_router(scans_router)


@app.get("/")
async def root():
    return {"message": "ReconScope API", "docs": "/api/docs"}
