"""
Database connection and session management
Uses SQLModel with Neon Serverless PostgreSQL
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlmodel import create_engine, Session

# Load environment variables from .env file (looks in parent directory)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Load database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable is required. "
        "Please set it in the .env file with your Neon PostgreSQL connection string."
    )

# Create database engine with connection pooling
# Configuration optimized for Neon Serverless PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_size=10,              # Number of connections to keep open
    max_overflow=20,           # Additional connections when pool is full
    pool_timeout=30,           # Seconds to wait for available connection
    pool_recycle=3600,         # Recycle connections after 1 hour (Neon best practice)
    pool_pre_ping=True,        # Verify connections before use (enables auto-reconnection)
    echo=False,                # Set to True for SQL query logging during development
)


def get_session():
    """
    FastAPI dependency for database sessions.

    Usage:
        @app.get("/items")
        def get_items(session: Session = Depends(get_session)):
            items = session.exec(select(Item)).all()
            return items
    """
    with Session(engine) as session:
        yield session
