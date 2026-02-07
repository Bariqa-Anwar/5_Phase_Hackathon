"""
Todo Backend API
FastAPI application with JWT authentication and SQLModel ORM
"""
import logging
from datetime import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlmodel import text

from db import engine
from auth import get_current_user
from routes.tasks import router as tasks_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Todo Backend API",
    description="""
    **Secure task management API** with JWT authentication and multi-user isolation.

    ## Features
    - JWT-based authentication via Better Auth
    - Multi-user data isolation (users can only access their own tasks)
    - RESTful CRUD operations for tasks
    - PostgreSQL database with SQLModel ORM
    - Comprehensive error handling and logging

    ## Authentication
    All protected endpoints require a valid JWT token in the Authorization header:
    ```
    Authorization: Bearer <your-jwt-token>
    ```
    """,
    version="0.1.0",
    contact={
        "name": "Backend API Support",
        "url": "https://github.com/yourusername/phase-2",
    },
    license_info={
        "name": "MIT",
    },
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure OpenAPI security scheme
def custom_openapi():
    """
    Customize OpenAPI schema to include Bearer token authentication.
    Uses FastAPI's get_openapi utility to avoid recursion.
    """
    if app.openapi_schema:
        return app.openapi_schema

    # Use get_openapi from fastapi.openapi.utils (not app.openapi())
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add Bearer authentication security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your JWT token from Better Auth"
        }
    }

    # Cache the schema
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(tasks_router)


@app.on_event("startup")
async def startup_event():
    """Test database connection on application startup"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise


@app.get("/")
def root():
    """Root endpoint - API information"""
    return {
        "name": "Todo Backend API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/protected")
def protected_endpoint(current_user: str = Depends(get_current_user)):
    """Protected endpoint that requires JWT authentication"""
    return {
        "message": "Access granted",
        "user_id": current_user,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
