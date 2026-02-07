---
name: fastapi-logic
description: Backend API development with FastAPI, Pydantic validation, and Python 3.13 features.
---

# FastAPI Backend Logic

## Instructions
1. **Standard Routes**: Implement GET, POST, PUT, DELETE as per the REST spec.
2. **Input Validation**: Use Pydantic models (BaseModel) to validate task titles and descriptions.
3. **Dependency Injection**: Use `Depends()` to inject the Database Session and Auth User.
4. **FastAPI Tags**: Group routes under "Tasks" and "Auth" for clean Swagger documentation.

## Example Pattern
```python
@router.post("/tasks", status_code=201)
async def create_task(data: TaskCreate, user = Depends(get_current_user)):
    return service.create_task(data, user.id)