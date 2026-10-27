"use client";

import React, { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Monitor,
  Building2,
  HelpCircle,
  CalendarCheck2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BellRing,
  Megaphone,
  Target,
  FolderKanban,
  FileText,
  Activity,
  AlertCircle,
  Table,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/avatar";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, currentOrg, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSystemOwner = user?.role === "SYSTEM_OWNER";

  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const navItems = isSystemOwner
    ? [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Queue", href: "/workspaces", icon: Layers },
        { label: "Global Updates", href: "/announcements", icon: Megaphone },
      ]
    : [
        { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { label: "Employees", href: "/team", icon: Users },
        { label: "Services", href: "/services", icon: Layers },
        { label: "Profiles", href: "/profiles", icon: Monitor },
        { label: "Teams", href: "/departments", icon: Building2 },
        { label: "Issue Sheet", href: "/issues", icon: HelpCircle },
        { label: "Update Sheet", href: "/updates", icon: Table },
        { label: "Station", href: "/stations", icon: Monitor },
        { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
        { label: "Targets", href: "/targets", icon: Target },
        { label: "Projects", href: "/projects", icon: FolderKanban },
        { label: "Notice Board", href: "/notices", icon: BellRing },
        { label: "Complains", href: "/complains", icon: AlertCircle },
        { label: "Activity Log", href: "/analytics", icon: Activity },
        ...(isSystemAdminOrAdmin
          ? [{ label: "Settings", href: "/settings/workspace", icon: Settings }]
          : []),
      ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0b0d14] transition-all duration-300 z-20 shrink-0 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 w-full">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-violet-500/20 shrink-0">
              W
            </div>
            <div className="truncate">
              <div className="text-base font-extrabold text-zinc-950 dark:text-white tracking-tight flex items-center gap-1.5">
                Work Graph
                {isSystemOwner && (
                  <span className="text-3xs font-mono font-bold bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30 px-1 py-0.2 rounded">
                    SUPER
                  </span>
                )}
              </div>
              <div className="text-2xs text-zinc-400 font-medium truncate">
                {isSystemOwner ? "Platform Governance" : currentOrg?.name || "Enterprise Workspace"}
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-full flex justify-center py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center font-black text-base shadow-sm">
              W
            </div>
          </div>
        )}
      </div>

      {/* Navigation Items (Styled to match Screenshot 2) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer",
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "w-4.5 h-4.5 shrink-0 transition-transform group-hover:scale-105",
                  isActive ? "text-white" : "text-zinc-400 dark:text-zinc-500 group-hover:text-violet-400"
                )}
              />
              {!isCollapsed && <span className="tracking-tight">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Announcements Shortcut */}
      <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <Link
          href="/announcements"
          title="System Updates & Changelog"
          className={cn(
            "flex items-center space-x-2.5 p-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs",
            pathname === "/announcements"
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25"
              : "bg-violet-50/80 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 border border-violet-200 dark:border-violet-800/60",
            isCollapsed && "justify-center p-2"
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between truncate">
              <span className="truncate">Announcements</span>
              <span className="text-3xs px-1.5 py-0.5 rounded-full bg-violet-200/80 dark:bg-violet-900/80 text-violet-900 dark:text-violet-200 font-mono font-bold shrink-0">
                Update
              </span>
            </div>
          )}
        </Link>
      </div>


      {/* Footer Profile & Collapse Toggle */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <div
          className={cn(
            "flex items-center space-x-3 p-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-900",
            isCollapsed && "justify-center p-1"
          )}
        >
          <Avatar name={user?.name} size="sm" />
          {!isCollapsed && (
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-2xs text-zinc-500 truncate">{user?.email}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
