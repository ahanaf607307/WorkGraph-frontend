"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Building,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MessageSquare,
  Network,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/avatar";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, organizations, currentOrg, setCurrentOrg, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/projects", icon: FolderKanban },
    { label: "Messages & Chat", href: "/chat", icon: MessageSquare },
    { label: "Departments & Hierarchy", href: "/departments", icon: Network },
    { label: "Team & Workload", href: "/team", icon: Users },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Workspace Settings", href: "/settings/workspace", icon: Building },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-20 shrink-0 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header & Workspace Switcher */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="relative w-full">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center justify-between w-full p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-black flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  {currentOrg?.name?.[0]?.toUpperCase() || "W"}
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                    {currentOrg?.name || "WorkGraph"}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono truncate">
                    {currentOrg?.myRole || "WORKSPACE"}
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
            </button>

            {/* Organizations Dropdown */}
            {showOrgDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 p-1">
                <div className="text-2xs font-bold uppercase text-zinc-400 px-3 py-1.5">
                  Your Workspaces
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setCurrentOrg(org);
                      setShowOrgDropdown(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer",
                      currentOrg?.id === org.id
                        ? "bg-amber-400 text-black font-bold shadow-2xs"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-2xs opacity-80 font-mono ml-2 uppercase">
                      {org.myRole}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center py-1">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-base shadow-sm">
              W
            </div>
          </div>
        )}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer",
                isActive
                  ? "bg-zinc-950 text-amber-400 dark:bg-amber-400 dark:text-black shadow-sm font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-transform group-hover:scale-105",
                  isActive ? "text-amber-400 dark:text-black" : "text-zinc-400 dark:text-zinc-500"
                )}
              />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile & Collapse Toggle */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div
          className={cn(
            "flex items-center space-x-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50",
            isCollapsed && "justify-center p-1"
          )}
        >
          <Avatar name={user?.name} size="sm" />
          {!isCollapsed && (
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-2xs text-slate-500 truncate">{user?.email}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
