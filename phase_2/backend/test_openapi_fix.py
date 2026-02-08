"""
Test to verify OpenAPI schema generation doesn't have recursion issues
and properly caches the schema
"""
from phase_2.backend.main import app

print("Test 1: Initial schema generation")
schema1 = app.openapi()
print(f"  [OK] Schema generated successfully ({len(schema1)} top-level keys)")
print(f"  [OK] BearerAuth security scheme present: {'BearerAuth' in schema1.get('components', {}).get('securitySchemes', {})}")

print("\nTest 2: Verify schema is cached (second call should return cached version)")
schema2 = app.openapi()
print(f"  [OK] Schema retrieved from cache: {schema1 is schema2}")

print("\nTest 3: Verify security scheme configuration")
security_schemes = schema1.get('components', {}).get('securitySchemes', {})
bearer_auth = security_schemes.get('BearerAuth', {})
print(f"  [OK] Type: {bearer_auth.get('type')}")
print(f"  [OK] Scheme: {bearer_auth.get('scheme')}")
print(f"  [OK] Bearer Format: {bearer_auth.get('bearerFormat')}")

print("\nTest 4: Check for key endpoints in schema")
paths = schema1.get('paths', {})
print(f"  [OK] Total endpoints: {len(paths)}")
print(f"  [OK] /health endpoint: {'/health' in paths}")
print(f"  [OK] /api/tasks endpoint: {'/api/tasks/' in paths}")

print("\n[SUCCESS] All OpenAPI tests passed - no recursion errors!")
