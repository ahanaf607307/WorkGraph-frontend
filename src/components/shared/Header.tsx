"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Check, Sparkles, Sun, Moon, MessageSquare } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { userActions } from "../../modules/users/actions/user.actions";
import { NotificationItem } from "../../modules/users/types/user.types";
import { getSocket } from "../../lib/socket";
import { toast } from "sonner";
import { formatRelativeDate } from "../../lib/utils";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, currentOrg } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

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
    if (pathname.startsWith("/chat")) return "Direct & Team Messages";
    if (pathname.startsWith("/departments")) return "Departments, Teams & Hierarchy";
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
    return "WorkGraph";
  };

  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10 select-none transition-colors">
      <div className="flex items-center space-x-3">
        <h1 className="text-base font-bold text-zinc-950 dark:text-white">
          {getBreadcrumbTitle()}
        </h1>
        {currentOrg && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 font-mono border border-zinc-200 dark:border-zinc-700">
            {currentOrg.name}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Link to Messages */}
        <Link
          href="/chat"
          title="Direct & Group Messages"
          className="p-2 text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-amber-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-2xs"
        >
          <MessageSquare className="w-4.5 h-4.5" />
        </Link>

        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2 text-zinc-700 hover:text-black dark:text-zinc-300 dark:hover:text-amber-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline text-xs font-semibold text-amber-400">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-zinc-800" />
              <span className="hidden md:inline text-xs font-semibold text-zinc-800">Dark</span>
            </>
          )}
        </button>

        {/* Real-time Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-zinc-600 hover:text-black dark:text-zinc-300 dark:hover:text-amber-400 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-black animate-pulse" />
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-zinc-950 dark:text-white">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.2 rounded-full text-2xs bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-semibold flex items-center cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
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
          )}
        </div>
      </div>
    </header>
  );
};
