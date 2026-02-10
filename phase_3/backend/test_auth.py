"""
Test script for JWT authentication middleware
Tests valid, invalid, and missing token scenarios
"""
import os
from datetime import datetime, timedelta, UTC
from pathlib import Path
from dotenv import load_dotenv
from jose import jwt
from fastapi.testclient import TestClient
from main import app

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

# Create test client
client = TestClient(app)


def create_test_token(user_id: str, expiry_minutes: int = 30) -> str:
    """Create a test JWT token with given user_id"""
    payload = {
        "sub": user_id,
        "exp": datetime.now(UTC) + timedelta(minutes=expiry_minutes),
        "iat": datetime.now(UTC),
    }
    return jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=ALGORITHM)


def test_valid_token():
    """Test /protected endpoint with valid token"""
    print("\n[TEST 1] Valid token test:")
    token = create_test_token("user123")
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 200
    assert response.json()["user_id"] == "user123"
    print("  [PASS] Valid token authenticated successfully")


def test_invalid_token():
    """Test /protected endpoint with invalid token"""
    print("\n[TEST 2] Invalid token test:")
    response = client.get(
        "/protected",
        headers={"Authorization": "Bearer invalid_token_here"}
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 401
    print("  [PASS] Invalid token rejected correctly")


def test_missing_token():
    """Test /protected endpoint without token"""
    print("\n[TEST 3] Missing token test:")
    response = client.get("/protected")
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 401  # FastAPI HTTPBearer returns 401 for missing token
    print("  [PASS] Missing token rejected correctly")


def test_expired_token():
    """Test /protected endpoint with expired token"""
    print("\n[TEST 4] Expired token test:")
    # Create token that expired 1 minute ago
    payload = {
        "sub": "user123",
        "exp": datetime.now(UTC) - timedelta(minutes=1),
        "iat": datetime.now(UTC) - timedelta(minutes=10),
    }
    expired_token = jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=ALGORITHM)
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()
    print("  [PASS] Expired token rejected correctly")


def test_token_without_sub():
    """Test /protected endpoint with token missing 'sub' claim"""
    print("\n[TEST 5] Token without 'sub' claim test:")
    payload = {
        "exp": datetime.now(UTC) + timedelta(minutes=30),
        "iat": datetime.now(UTC),
    }
    token = jwt.encode(payload, BETTER_AUTH_SECRET, algorithm=ALGORITHM)
    response = client.get(
        "/protected",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"  Status: {response.status_code}")
    print(f"  Response: {response.json()}")
    assert response.status_code == 401
    print("  [PASS] Token without 'sub' claim rejected correctly")


if __name__ == "__main__":
    print("=" * 60)
    print("JWT Authentication Middleware Tests")
    print("=" * 60)

    try:
        test_valid_token()
        test_invalid_token()
        test_missing_token()
        test_expired_token()
        test_token_without_sub()

        print("\n" + "=" * 60)
        print("All tests PASSED!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
    except Exception as e:
        print(f"\n[ERROR] {e}")
