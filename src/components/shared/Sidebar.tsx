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
  Activity,
  AlertCircle,
  Table,
  Newspaper,
  Inbox,
  BarChart3,
  Video,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Avatar } from "../ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, currentOrg, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSystemOwner = user?.role === "SYSTEM_OWNER";
  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const isPrivileged =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    user?.role === "SYSTEM_ADMIN" ||
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    currentOrg?.myRole === "ADMIN";

  const deptName = (currentOrg as any)?.department?.name?.toLowerCase() || "";
  const deptCode = (currentOrg as any)?.department?.code?.toUpperCase() || "";
  const isSalesMember =
    !isPrivileged &&
    (deptName.includes("sale") || deptName.includes("seal") || deptCode === "SALES" || user?.email?.toLowerCase().includes("sales"));

  const isLeaderOrCoLeader =
    (currentOrg as any)?.designation === "TEAM_LEADER" ||
    (currentOrg as any)?.designation === "CO_LEADER";

  const canAccessManagementDirectory = isSystemAdminOrAdmin || isLeaderOrCoLeader;

  const sections: NavSection[] = isSystemOwner
    ? [
        {
          items: [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Approval Queue", href: "/workspaces", icon: Layers },
            { label: "Announcements", href: "/announcements", icon: Megaphone },
          ],
        },
      ]
    : [
        {
          title: "Main",
          items: [
            { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { label: "Projects", href: "/projects", icon: FolderKanban },
            ...(!isSalesMember ? [{ label: "Team", href: "/team", icon: Users }] : []),
            { label: "Workload", href: "/workload", icon: BarChart3 },
            { label: "Meeting", href: "/meeting", icon: Video },
          ],
        },
        {
          title: "Desk & Operations",
          items: [
            { label: "Stations", href: "/stations", icon: Monitor },
            { label: "Update Sheet", href: "/updates", icon: Table },
            { label: "Issue Sheet", href: "/issues", icon: HelpCircle },
            { label: "Queue", href: "/queue", icon: Inbox },
          ],
        },
        {
          title: "Directory & Goals",
          items: [
            ...(canAccessManagementDirectory
              ? [
                  { label: "Departments", href: "/departments", icon: Building2 },
                  { label: "Services", href: "/services", icon: Layers },
                ]
              : []),
            ...(canAccessManagementDirectory || isSalesMember
              ? [
                  { label: "Client Profiles", href: "/profiles", icon: Monitor },
                  { label: "Client Meeting", href: "/client-meetings", icon: Video },
                ]
              : []),
            { label: "Targets", href: "/targets", icon: Target },
          ],
        },
        {
          title: "Workspace & Logs",
          items: [
            { label: "Attendance", href: "/attendance", icon: CalendarCheck2 },
            { label: "Notice Board", href: "/notices", icon: BellRing },
            { label: "Complaints Vault", href: "/complains", icon: AlertCircle },
            ...(isSystemAdminOrAdmin || isLeaderOrCoLeader
              ? [{ label: "Activity Log", href: "/activity", icon: Activity }]
              : []),
          ],
        },
        ...(isSystemAdminOrAdmin
          ? [
              {
                title: "Settings",
                items: [
                  { label: "Workspace Settings", href: "/settings/workspace", icon: Settings },
                ],
              },
            ]
          : []),
      ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-zinc-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0c0e15] transition-all duration-300 z-30 shrink-0 select-none",
        isCollapsed ? "w-18" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 w-full">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-violet-500/20 shrink-0">
              W
            </div>
            <div className="truncate flex-1">
              <div className="text-sm font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-1.5">
                <span>Work Graph</span>
                {isSystemOwner && (
                  <span className="text-[9px] font-mono font-bold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-1 py-0.2 rounded">
                    SUPER
                  </span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400 font-normal truncate">
                {isSystemOwner ? "Platform Oversight" : currentOrg?.name || "Workspace"}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center py-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              W
            </div>
          </div>
        )}
      </div>

      {/* Navigation Group Sections */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {sections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            {!isCollapsed && sec.title && (
              <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {sec.title}
              </div>
            )}
            {sec.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group cursor-pointer",
                    isActive
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-600/30 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] hover:text-zinc-950 dark:hover:text-zinc-100",
                    isCollapsed && "justify-center px-0 py-2"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive
                        ? "text-white"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-violet-500 dark:group-hover:text-violet-400"
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Announcements Badge (Refined) */}
      {!isSystemOwner && (
        <div className="px-3 py-2 border-t border-zinc-200/50 dark:border-white/[0.06]">
          <Link
            href="/announcements"
            className={cn(
              "flex items-center space-x-2 p-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
              pathname === "/announcements"
                ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-white/[0.03]",
              isCollapsed && "justify-center px-0"
            )}
          >
            <div className="w-6 h-6 rounded-lg bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 flex items-center justify-between truncate">
                <span className="text-2xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Updates
                </span>
                <span className="text-3xs px-1.5 py-0.2 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-mono font-bold">
                  New
                </span>
              </div>
            )}
          </Link>
        </div>
      )}

      {/* Footer Profile & Collapse Toggle */}
      <div className="p-2.5 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-1.5">
        <div
          className={cn(
            "flex items-center space-x-2.5 p-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.04]",
            isCollapsed && "justify-center p-1"
          )}
        >
          <Avatar name={user?.name} size="sm" />
          {!isCollapsed && (
            <div className="truncate flex-1">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user?.name || "User"}
              </div>
              <div className="text-3xs text-zinc-400 truncate">{user?.email}</div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center py-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors text-xs cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </aside>
  );
};
