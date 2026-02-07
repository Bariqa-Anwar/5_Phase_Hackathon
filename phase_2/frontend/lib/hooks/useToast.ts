"use client";

import { useState, useCallback, useMemo } from "react";

export interface Toast {
  id: string;
  message: string;
  variant?: "success" | "error" | "warning" | "info";
  duration?: number;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${++toastCount}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (message: string, duration?: number) =>
        addToast({ message, variant: "success", duration }),
      error: (message: string, duration?: number) =>
        addToast({ message, variant: "error", duration }),
      warning: (message: string, duration?: number) =>
        addToast({ message, variant: "warning", duration }),
      info: (message: string, duration?: number) =>
        addToast({ message, variant: "info", duration }),
    }),
    [addToast]
  );

  return {
    toasts,
    toast,
    removeToast,
  };
}
