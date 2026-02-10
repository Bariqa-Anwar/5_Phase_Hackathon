"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard", label: "Tasks", icon: ListTodo },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 lg:hidden">
          <span className="text-lg font-semibold text-slate-50">Menu</span>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
