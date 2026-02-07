"use client";

import { useState } from "react";
import { Task, TaskStatus, UpdateTaskRequest } from "@/types/task";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/cn";
import {
  Clock,
  CheckCircle,
  Loader,
  Trash2,
  ArrowRightCircle,
  RotateCcw,
} from "lucide-react";

const statusConfig: Record<
  TaskStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  [TaskStatus.PENDING]: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800",
    icon: Loader,
  },
  [TaskStatus.COMPLETED]: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
};

// Next status in the workflow: pending → in_progress → completed
const nextStatusMap: Record<TaskStatus, { status: TaskStatus; label: string }> =
  {
    [TaskStatus.PENDING]: {
      status: TaskStatus.IN_PROGRESS,
      label: "Start",
    },
    [TaskStatus.IN_PROGRESS]: {
      status: TaskStatus.COMPLETED,
      label: "Complete",
    },
    [TaskStatus.COMPLETED]: {
      status: TaskStatus.PENDING,
      label: "Reopen",
    },
  };

interface TaskCardProps {
  task: Task;
  onUpdate: (id: number, data: UpdateTaskRequest) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const status = statusConfig[task.status];
  const StatusIcon = status.icon;
  const next = nextStatusMap[task.status];

  const handleStatusChange = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(task.id, { status: next.status });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const isBusy = isUpdating || isDeleting;
  const NextIcon =
    task.status === TaskStatus.COMPLETED ? RotateCcw : ArrowRightCircle;

  return (
    <Card variant="bordered" className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
            status.className
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      {task.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-3">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <span>Created {formatDateTime(task.created_at)}</span>
        {task.updated_at !== task.created_at && (
          <span>Updated {formatDateTime(task.updated_at)}</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
        <Button
          size="sm"
          variant={task.status === TaskStatus.COMPLETED ? "outline" : "primary"}
          onClick={handleStatusChange}
          disabled={isBusy}
          isLoading={isUpdating}
        >
          {!isUpdating && <NextIcon className="mr-1 h-3.5 w-3.5" />}
          {next.label}
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={isBusy}
          isLoading={isDeleting}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {!isDeleting && <Trash2 className="mr-1 h-3.5 w-3.5" />}
          Delete
        </Button>
      </div>
    </Card>
  );
}
