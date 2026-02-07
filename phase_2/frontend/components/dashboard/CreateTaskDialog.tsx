"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Dialog, {
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { TaskStatus, TASK_CONSTRAINTS } from "@/types/task";
import { Plus } from "lucide-react";

// Zod schema aligned with backend TaskCreate + FR-015
const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TASK_CONSTRAINTS.TITLE_MIN_LENGTH, "Title is required")
    .max(
      TASK_CONSTRAINTS.TITLE_MAX_LENGTH,
      `Title must be ${TASK_CONSTRAINTS.TITLE_MAX_LENGTH} characters or less`
    ),
  description: z
    .string()
    .max(
      TASK_CONSTRAINTS.DESCRIPTION_MAX_LENGTH,
      `Description must be ${TASK_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters or less`
    )
    .optional()
    .or(z.literal("")),
  status: z.nativeEnum(TaskStatus),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const STATUS_OPTIONS = [
  { value: TaskStatus.PENDING, label: "Pending" },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress" },
  { value: TaskStatus.COMPLETED, label: "Completed" },
];

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormValues) => Promise<void>;
}

export default function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
}: CreateTaskDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskStatus.PENDING,
    },
    mode: "onBlur", // FR-015: validate on blur
  });

  const handleClose = useCallback(() => {
    reset();
    setApiError(null);
    setIsSubmitting(false);
    onClose();
  }, [onClose, reset]);

  const handleFormSubmit = useCallback(
    async (data: CreateTaskFormValues) => {
      setIsSubmitting(true);
      setApiError(null);
      try {
        await onSubmit({
          title: data.title.trim(),
          description: data.description || undefined,
          status: data.status,
        });
        // On success: reset form and close (parent handles toast + refetch)
        reset();
        setApiError(null);
      } catch (err) {
        // FR-060: preserve form data on error
        const message =
          err instanceof Error ? err.message : "Failed to create task";
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, reset]
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogClose onClose={handleClose} />
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent className="space-y-4">
          {/* API error banner */}
          {apiError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              {apiError}
            </div>
          )}

          {/* Title field - required */}
          <Input
            label="Title"
            placeholder="What needs to be done?"
            error={errors.title?.message}
            required
            fullWidth
            {...register("title")}
          />

          {/* Description field - optional */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Add more details (optional)"
              rows={3}
              className={`flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none ${
                errors.description ? "border-red-500 focus:ring-red-500" : ""
              }`}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-600" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status dropdown - defaults to pending */}
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            fullWidth
            error={errors.status?.message}
            {...register("status")}
          />
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Task
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
