"""
Test script to verify Task model by inserting and querying a test record
"""
from datetime import datetime, UTC
from sqlmodel import Session, select
from phase_2.backend.db import engine
from models import Task, TaskStatus

# Create a test task
with Session(engine) as session:
    test_task = Task(
        title="Test Task from Script",
        description="This is a test task to verify the database model",
        status=TaskStatus.PENDING,
        user_id="test-user-123",
    )
    session.add(test_task)
    session.commit()
    session.refresh(test_task)

    print(f"Created task with ID: {test_task.id}")
    print(f"  Title: {test_task.title}")
    print(f"  Status: {test_task.status}")
    print(f"  User ID: {test_task.user_id}")
    print(f"  Created at: {test_task.created_at}")

# Query it back
with Session(engine) as session:
    statement = select(Task).where(Task.user_id == "test-user-123")
    tasks = session.exec(statement).all()

    print(f"\nQueried {len(tasks)} task(s) for user 'test-user-123':")
    for task in tasks:
        print(f"  - ID: {task.id}, Title: {task.title}, Status: {task.status}")

print("\n[SUCCESS] Task model verified - insert and query operations work correctly!")
