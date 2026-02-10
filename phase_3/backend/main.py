"""
Todo Backend API
FastAPI application with JWT authentication and SQLModel ORM
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Load .env before any local imports that depend on environment variables
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from sqlmodel import text

from db import engine
from auth import get_current_user
from routes.tasks import router as tasks_router
from routes.chat import router as chat_router
from routes.diagnostics import router as diagnostics_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app):
    """Application lifespan: start MCP server subprocess and verify DB."""
    from agents.mcp import MCPServerStdio

    # DB connectivity check
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise

    # Resolve backend dir for subprocess cwd
    backend_dir = Path(__file__).parent.resolve()

    # Start MCP server subprocess (lives for the app's lifetime)
    # Use 'uv run' to ensure the subprocess uses the correct virtual environment
    try:
        async with MCPServerStdio(
            name="Todo Tools",
            params={
                "command": "uv",
                "args": ["run", "python", "mcp_server.py"],
                "cwd": str(backend_dir),
            },
            cache_tools_list=True,
            client_session_timeout_seconds=30,
        ) as mcp_server:
            app.state.mcp_server = mcp_server
            logger.info("MCP server subprocess started")

            # Diagnostic: verify MCP tools are actually reachable
            try:
                tools = await mcp_server.list_tools()
                tool_names = [t.name for t in tools]
                logger.info(f"MCP Server Health: OK — {len(tools)} tools registered: {tool_names}")
            except Exception as e:
                logger.error(f"MCP Server Health: FAILED to list tools — {e}")

            yield
    except Exception as e:
        logger.error(
            f"MCP server failed to start: {e}. "
            f"Ensure 'mcp_server.py' exists in the backend dir and is a valid MCP server script."
        )
        raise RuntimeError(
            f"MCP server handshake failed after 30s: {e}"
        ) from e

    logger.info("MCP server subprocess stopped")


# Initialize FastAPI app
app = FastAPI(
    lifespan=lifespan,
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
app.include_router(chat_router)
app.include_router(diagnostics_router)


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
