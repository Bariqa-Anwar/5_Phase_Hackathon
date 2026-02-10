"use client";

import { Task, UpdateTaskRequest } from "@/types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onUpdate: (id: number, data: UpdateTaskRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TaskList({ tasks, onUpdate, onDelete }: TaskListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
