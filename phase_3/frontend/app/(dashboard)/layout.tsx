"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Spinner from "@/components/ui/Spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render dashboard until auth is confirmed
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
