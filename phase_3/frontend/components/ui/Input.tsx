"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
            {props.required && <span className="ml-1 text-red-400">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition-colors",
            "placeholder:text-slate-500",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
