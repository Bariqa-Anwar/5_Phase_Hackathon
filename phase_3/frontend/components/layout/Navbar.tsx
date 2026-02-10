"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { signOut } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api-client";
import { LogOut, User, Menu } from "lucide-react";

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    clearTokenCache();
    await signOut();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-slate-800 bg-slate-900 px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="mr-3 rounded-md p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand */}
      <h1 className="text-lg font-semibold text-slate-50">Task Manager</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">{user?.email || "User"}</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1 w-56 rounded-lg border border-slate-800 bg-slate-900 py-1 shadow-lg shadow-black/20">
            <div className="border-b border-slate-800 px-4 py-2">
              <p className="text-sm font-medium text-slate-100">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
