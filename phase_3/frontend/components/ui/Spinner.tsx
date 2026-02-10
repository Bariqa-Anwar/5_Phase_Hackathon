import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "white";
}

export default function Spinner({
  size = "md",
  variant = "primary",
  className,
  ...props
}: SpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const variants = {
    primary: "border-slate-700 border-t-emerald-500",
    white: "border-slate-600 border-t-white",
  };

  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full",
        sizes[size],
        variants[variant],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
