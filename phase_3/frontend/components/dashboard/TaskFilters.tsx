"use client";

import { TaskStatus } from "@/types/task";
import { cn } from "@/lib/cn";

const filterOptions: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: TaskStatus.PENDING, label: "Pending" },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
  { value: TaskStatus.COMPLETED, label: "Completed" },
];

interface TaskFiltersProps {
  activeFilter: TaskStatus | "all";
  onFilterChange: (status: TaskStatus | "all") => void;
}

export default function TaskFilters({
  activeFilter,
  onFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            activeFilter === option.value
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
