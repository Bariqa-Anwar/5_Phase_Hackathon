"use client";

import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export interface ToastProps {
  id: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  message,
  variant = "info",
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const variants = {
    success: {
      container: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
      icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    },
    error: {
      container: "bg-red-500/10 border-red-500/20 text-red-300",
      icon: <XCircle className="h-5 w-5 text-red-400" />,
    },
    warning: {
      container: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
      icon: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    },
    info: {
      container: "bg-sky-500/10 border-sky-500/20 text-sky-300",
      icon: <AlertCircle className="h-5 w-5 text-sky-400" />,
    },
  };

  const { container, icon } = variants[variant];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 shadow-lg shadow-black/20",
        "animate-in slide-in-from-right duration-300",
        container
      )}
      role="alert"
    >
      {icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="rounded-md p-1 hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Toast Container
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm"
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </div>
  );
}
