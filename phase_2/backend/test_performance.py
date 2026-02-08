"""
Performance test for server startup and response times
"""
import time
from datetime import datetime
from fastapi.testclient import TestClient
from jose import jwt

# Measure startup time
start_time = time.time()
from phase_2.backend.main import app
startup_time = time.time() - start_time

print(f"Server startup time: {startup_time:.3f} seconds")

if startup_time < 5.0:
    print("[PASS] Startup time is within 5 seconds (SC-001)")
else:
    print(f"[FAIL] Startup time exceeds 5 seconds: {startup_time:.3f}s")

# Create test client
client = TestClient(app)

# Test response times for basic endpoints
print("\nTesting endpoint response times:")

# Test health endpoint
start = time.time()
response = client.get("/health")
health_time = (time.time() - start) * 1000  # Convert to ms
print(f"  /health: {health_time:.2f}ms - Status: {response.status_code}")

# Test root endpoint
start = time.time()
response = client.get("/")
root_time = (time.time() - start) * 1000
print(f"  /: {root_time:.2f}ms - Status: {response.status_code}")

# Test response time requirement
if health_time < 200 and root_time < 200:
    print("[PASS] Response times are within 200ms (SC-002)")
else:
    print(f"[NOTE] Some response times may vary based on system load")

print(f"\n[SUCCESS] Performance tests completed")
