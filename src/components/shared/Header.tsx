"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Check, Sparkles, Sun, Moon, MessageSquare, Building2, ChevronDown, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { userActions } from "../../modules/users/actions/user.actions";
import { NotificationItem } from "../../modules/users/types/user.types";
import { getSocket } from "../../lib/socket";
import { toast } from "sonner";
import { formatRelativeDate, cn } from "../../lib/utils";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, currentOrg, organizations, setCurrentOrg } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const loadNotifications = async () => {
    try {
      const list = await userActions.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();

    const socket = getSocket();
    socket.on("notification:created", (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(notif.title, {
        description: notif.message,
      });
    });

    return () => {
      socket.off("notification:created");
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await userActions.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const getBreadcrumbTitle = () => {
    if (pathname.startsWith("/newsfeed")) return "Global News Feed";
    if (pathname.startsWith("/workspaces")) return "Company Workspace Registry & Approval Queue";
    if (pathname.startsWith("/chat")) return "Direct & Team Messages";
    if (pathname.startsWith("/attendance")) return "Daily Attendance & Work Log Tracker";
    if (pathname.startsWith("/targets")) return "Monthly Targets & Objectives Hub";
    if (pathname.startsWith("/notices")) return "Workspace Notice Board";
    if (pathname.startsWith("/announcements")) return "System Updates & Announcements";
    if (pathname.startsWith("/departments")) return "Department & Team";
    if (pathname.startsWith("/dashboard")) return "Dashboard Overview";
    if (pathname.startsWith("/projects/new")) return "Create New Project";
    if (pathname.includes("/board")) return "Kanban Board";
    if (pathname.includes("/list")) return "Task List";
    if (pathname.startsWith("/projects/")) return "Project Overview";
    if (pathname.startsWith("/projects")) return "Projects & Initiatives";
    if (pathname.startsWith("/team")) return "Team & Workload Utilization";
    if (pathname.startsWith("/analytics")) return "Productivity & Risk Analytics";
    if (pathname.startsWith("/notifications")) return "Notifications";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Work Graph";
  };

  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-15 border-b border-zinc-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-xl px-5 flex items-center justify-between sticky top-0 z-40 select-none transition-colors">
      <div className="flex items-center space-x-3">
        <h1 className="text-sm font-bold text-zinc-950 dark:text-white tracking-tight">
          {getBreadcrumbTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-2.5">
        {/* Company Registration Badge / Workspace Switcher (Right Side) */}
        {user?.role === "SYSTEM_OWNER" ? (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-violet-500/10 dark:bg-violet-950/40 border border-violet-500/20 text-violet-700 dark:text-violet-300 font-bold text-xs">
            <Shield className="w-4 h-4 text-violet-500" />
            <span>Platform Super-Admin</span>
          </div>
        ) : currentOrg ? (
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.04] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200/60 dark:border-white/[0.06] transition-all cursor-pointer"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentOrg.name?.[0]?.toUpperCase() || "W"}
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 max-w-[150px] truncate">
                  {currentOrg.name}
                </span>
                <span className="text-3xs font-mono font-bold bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 border border-zinc-200 dark:border-zinc-700 px-1 py-0.2 rounded uppercase">
                  {currentOrg.myRole === "OWNER" ? "Admin" : currentOrg.myRole}
                </span>
              </div>
              {organizations.length > 1 && (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              )}
            </button>

            {showOrgDropdown && organizations.length > 1 && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowOrgDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 dark:bg-[#0f1118]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl p-2 z-[9999] animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-2xs font-bold uppercase text-zinc-400 px-3 py-1.5">
                    Switch Workspace
                  </div>
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setCurrentOrg(org);
                        setShowOrgDropdown(false);
                      }}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer",
                        currentOrg.id === org.id
                          ? "bg-violet-600 text-white font-bold"
                          : "hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-3xs uppercase font-mono opacity-80">
                        {org.myRole === "OWNER" ? "ADMIN" : org.myRole}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Quick Link to Messages */}
        <Link
          href="/chat"
          title="Direct & Group Messages"
          className="p-2 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
        </Link>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>

        {/* Real-time Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-xl hover:bg-zinc-100/80 dark:hover:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white dark:ring-[#090a0f]" />
            )}
          </button>

          {showNotifMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowNotifMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white/95 dark:bg-[#0f1118]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl p-4 z-[9999] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06] mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-zinc-950 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.2 rounded-full text-2xs bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium flex items-center cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-sm text-zinc-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl text-xs transition-colors ${
                        n.isRead
                          ? "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400"
                          : "bg-amber-50/80 dark:bg-amber-950/20 text-zinc-950 dark:text-white border border-amber-200 dark:border-amber-900/40"
                      }`}
                    >
                      <div className="font-semibold">{n.title}</div>
                      <div className="mt-0.5 text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {n.message}
                      </div>
                      <div className="mt-1 text-2xs text-zinc-400 font-mono">
                        {formatRelativeDate(n.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  View full notification history →
                </Link>
              </div>
            </div>
          </>
          )}
        </div>
      </div>
    </header>
  );
};
