"""
JWT Authentication Middleware
Verifies Better Auth JWT tokens and extracts user identity
"""
import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, ExpiredSignatureError

# Load environment variables from .env file (same directory as this module)
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Load Better Auth secret for JWT verification
BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")

if not BETTER_AUTH_SECRET:
    raise ValueError(
        "BETTER_AUTH_SECRET environment variable is required. "
        "Please set it in the .env file with a secure secret (minimum 32 characters)."
    )

# JWT algorithm
ALGORITHM = "HS256"

# HTTP Bearer security scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    FastAPI dependency that verifies JWT token and extracts user_id.

    Args:
        credentials: HTTP Bearer token from Authorization header

    Returns:
        user_id: User identifier from JWT "sub" claim

    Raises:
        HTTPException 401: If token is invalid, expired, or missing user_id claim
    """
    token = credentials.credentials

    try:
        # Decode and verify JWT token
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=[ALGORITHM])

        # Extract user_id from "sub" claim
        user_id: Optional[str] = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user_id

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
