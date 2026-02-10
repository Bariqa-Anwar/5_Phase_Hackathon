"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      placeholder,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-slate-300"
          >
            {label}
            {props.required && <span className="ml-1 text-red-400">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
