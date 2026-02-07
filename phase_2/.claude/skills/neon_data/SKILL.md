---
name: neon-data
description: Database architecture using Neon Serverless Postgres and SQLModel ORM.
---

# Neon & SQLModel Data Layer

## Instructions
1. **Model Definition**: Use `SQLModel(table=True)` for the `User` and `Task` tables.
2. **Relationships**: Link Tasks to Users via `user_id` foreign keys.
3. **Connection Pooling**: Use the `psycopg` driver optimized for serverless "scale-to-zero" environments.
4. **Data Isolation**: Never return tasks that don't belong to the authenticated `user_id`.

## Example Model
```python
class Task(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    completed: bool = False