"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Search,
  Check,
  Sparkles,
  Sun,
  Moon,
  Building2,
  ChevronDown,
  Shield,
  Circle,
  XCircle,
  AlertCircle,
  StickyNote,
  Users,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { userActions } from "../../modules/users/actions/user.actions";
import { attendanceActions } from "../../modules/attendance/actions/attendance.actions";
import { Avatar } from "../ui/avatar";
import { NotificationItem } from "../../modules/users/types/user.types";
import { getSocket } from "../../lib/socket";
import { toast } from "sonner";
import { formatRelativeDate, cn } from "../../lib/utils";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, currentOrg, organizations, setCurrentOrg } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  // Workspace Member Presence & Status State
  const [currentStatus, setCurrentStatus] = useState<"PRESENT" | "ABSENT" | "OFFLINE" | "NOTE">("PRESENT");
  const [statusNote, setStatusNote] = useState<string>("");
  const [noteDraft, setNoteDraft] = useState<string>("");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [workspaceStatuses, setWorkspaceStatuses] = useState<any[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const list = await userActions.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // ignore
    }
  };

  const loadWorkspaceStatuses = async () => {
    if (!currentOrg?.id) return;
    try {
      const list = await attendanceActions.getWorkspaceStatuses(currentOrg.id);
      setWorkspaceStatuses(list || []);

      // If current user has an entry, set currentStatus
      if (user?.id) {
        const myEntry = list.find((item: any) => item.userId === user.id);
        if (myEntry) {
          if (myEntry.status === "ABSENT") setCurrentStatus("ABSENT");
          else if (myEntry.status === "OFFLINE") setCurrentStatus("OFFLINE");
          else if (myEntry.status === "NOTE" || myEntry.notes) {
            setCurrentStatus(myEntry.status === "NOTE" ? "NOTE" : "PRESENT");
            setStatusNote(myEntry.notes || "");
            setNoteDraft(myEntry.notes || "");
          } else {
            setCurrentStatus("PRESENT");
          }
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    loadWorkspaceStatuses();

    const socket = getSocket();
    socket.on("notification:created", (notif: NotificationItem) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast.info(notif.title, {
        description: notif.message,
      });
    });

    socket.on("member:status_updated", (payload: any) => {
      if (payload.organizationId === currentOrg?.id) {
        setWorkspaceStatuses((prev) => {
          const index = prev.findIndex((item) => item.userId === payload.userId);
          const updatedItem = {
            userId: payload.userId,
            status: payload.status,
            notes: payload.note,
            user: payload.user,
            updatedAt: payload.updatedAt,
          };
          if (index >= 0) {
            const next = [...prev];
            next[index] = { ...next[index], ...updatedItem };
            return next;
          }
          return [updatedItem, ...prev];
        });

        if (payload.userId === user?.id) {
          setCurrentStatus(payload.status);
          setStatusNote(payload.note || "");
        } else if (payload.note) {
          toast.info(`${payload.user?.name || "Member"} set a status note:`, {
            description: payload.note,
          });
        }
      }
    });

    return () => {
      socket.off("notification:created");
      socket.off("member:status_updated");
    };
  }, [currentOrg?.id, user?.id]);

  const handleUpdateStatus = async (
    status: "PRESENT" | "ABSENT" | "OFFLINE" | "NOTE",
    noteText?: string
  ) => {
    if (!currentOrg?.id) {
      toast.error("Please select a workspace first");
      return;
    }
    setIsUpdatingStatus(true);
    try {
      await attendanceActions.updateMyStatus(currentOrg.id, {
        status,
        note: noteText !== undefined ? noteText : (status === "NOTE" ? noteDraft : statusNote),
      });
      setCurrentStatus(status);
      if (noteText !== undefined) {
        setStatusNote(noteText);
      } else if (status === "NOTE") {
        setStatusNote(noteDraft);
      }
      toast.success(
        status === "PRESENT"
          ? "Status marked as Present"
          : status === "ABSENT"
          ? "Status marked as Absent"
          : status === "OFFLINE"
          ? "Status marked as Offline"
          : "Workspace status note shared with everyone!"
      );
      if (status !== "NOTE") {
        setShowStatusMenu(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update presence status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
    if (pathname.startsWith("/queue")) return "Desk & Operations Queue";
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
    if (pathname.startsWith("/team")) return "Squads & Teams Directory";
    if (pathname.startsWith("/workload")) return "Workload & Capacity Analytics";
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
          <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentOrg.name?.[0]?.toUpperCase() || "W"}
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 max-w-[170px] truncate">
                {currentOrg.name}
              </span>
              <span className="text-3xs font-mono font-bold bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 border border-zinc-200 dark:border-zinc-700 px-1 py-0.2 rounded uppercase">
                {currentOrg.myRole === "OWNER" || (currentOrg.myRole as string) === "SYSTEM_ADMIN" || currentOrg.myRole === "WORKSPACE_ADMIN"
                  ? "Workspace Admin"
                  : currentOrg.myRole}
              </span>
            </div>
          </div>
        ) : null}

        {/* Member Presence Status & Workspace Note Selector (Replaced message icon) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            title={
              currentStatus === "PRESENT"
                ? "Status: Present (Green)"
                : currentStatus === "ABSENT"
                ? "Status: Absent (Red)"
                : currentStatus === "OFFLINE"
                ? "Status: Offline (Cross)"
                : "Status: Custom Note Set (Yellow)"
            }
            className={cn(
              "p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer",
              currentStatus === "PRESENT" &&
                "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 ring-2 ring-emerald-500/20",
              currentStatus === "ABSENT" &&
                "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 ring-2 ring-rose-500/20",
              currentStatus === "OFFLINE" &&
                "bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-500 dark:text-zinc-400 border-zinc-500/30",
              currentStatus === "NOTE" &&
                "bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 dark:text-amber-400 border-amber-500/40 ring-2 ring-amber-500/25 animate-pulse"
            )}
          >
            {currentStatus === "PRESENT" && (
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            {currentStatus === "ABSENT" && (
              <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
            )}
            {currentStatus === "OFFLINE" && <XCircle className="w-4 h-4 text-zinc-400" />}
            {currentStatus === "NOTE" && <StickyNote className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Status Selection & Workspace Note Popover Menu */}
          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-84 md:w-96 rounded-2xl bg-white/95 dark:bg-[#0f1118]/95 backdrop-blur-xl border border-zinc-200/80 dark:border-white/[0.08] shadow-2xl p-4 z-[9999] animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06] mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-zinc-950 dark:text-white">
                      My Workspace Presence & Note
                    </span>
                  </div>
                  <button
                    onClick={() => setShowStatusMenu(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 4 Status Option Buttons */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {/* 1. Green: Present */}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("PRESENT")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group",
                      currentStatus === "PRESENT"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                        : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-emerald-500/30"
                    )}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mb-1.5 shadow-sm shadow-emerald-500/50 group-hover:scale-110 transition-transform" />
                    <span className="text-3xs font-semibold">Present</span>
                  </button>

                  {/* 2. Red: Absent */}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("ABSENT")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group",
                      currentStatus === "ABSENT"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold"
                        : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-rose-500/30"
                    )}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500 mb-1.5 shadow-sm shadow-rose-500/50 group-hover:scale-110 transition-transform" />
                    <span className="text-3xs font-semibold">Absent</span>
                  </button>

                  {/* 3. Cross: Offline */}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("OFFLINE")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group",
                      currentStatus === "OFFLINE"
                        ? "bg-zinc-500/15 border-zinc-500/40 text-zinc-800 dark:text-zinc-200 font-bold"
                        : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-zinc-500/30"
                    )}
                  >
                    <XCircle className="w-4 h-4 text-zinc-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-3xs font-semibold">Offline</span>
                  </button>

                  {/* 4. Yellow: Note */}
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("NOTE")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer text-center group",
                      currentStatus === "NOTE"
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold"
                        : "bg-zinc-50 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 hover:border-amber-500/30"
                    )}
                  >
                    <StickyNote className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-3xs font-semibold">Note</span>
                  </button>
                </div>

                {/* Yellow Note Editor Block */}
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-3xs font-bold font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5" />
                      <span>Workspace Note (Public to Workspace)</span>
                    </label>
                    {statusNote && (
                      <span className="text-4xs text-amber-600/70 dark:text-amber-400/70 font-mono">
                        Active Note
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="e.g. Taking 30m break / Out for doctor appointment / In client meeting..."
                      className="w-full text-xs p-2 rounded-lg border border-amber-500/30 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-4xs text-zinc-400">
                      Visible to all registered members in this workspace
                    </span>
                    <button
                      type="button"
                      disabled={isUpdatingStatus || !noteDraft.trim()}
                      onClick={() => handleUpdateStatus("NOTE", noteDraft)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-black font-bold text-3xs rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>Set Note</span>
                    </button>
                  </div>
                </div>

                {/* Workspace Team Notes & Presence Feed */}
                <div className="space-y-2 border-t border-zinc-100 dark:border-white/[0.06] pt-3 max-h-48 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between text-3xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Team Status & Notes Today</span>
                    </span>
                    <span>{workspaceStatuses.length} Members</span>
                  </div>

                  {workspaceStatuses.length === 0 ? (
                    <div className="text-center py-3 text-3xs text-zinc-400">
                      No status notes shared yet today.
                    </div>
                  ) : (
                    workspaceStatuses.map((entry: any) => {
                      const isMe = entry.userId === user?.id;
                      const isEntryNote = entry.status === "NOTE" || !!entry.notes;
                      return (
                        <div
                          key={entry.userId || entry.id}
                          className={cn(
                            "p-2 rounded-xl flex items-start justify-between gap-2 border text-3xs",
                            isMe
                              ? "bg-violet-500/5 border-violet-500/20"
                              : "bg-zinc-50/50 dark:bg-white/[0.02] border-zinc-200/50 dark:border-white/[0.04]"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar name={entry.user?.name || "Member"} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                  {entry.user?.name || "Workspace Member"}
                                </span>
                                {isMe && (
                                  <span className="text-4xs px-1 bg-violet-600 text-white rounded font-mono">
                                    You
                                  </span>
                                )}
                              </div>
                              {entry.notes && (
                                <p className="text-amber-600 dark:text-amber-400 mt-0.5 font-medium break-words">
                                  "{entry.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 font-mono">
                            {entry.status === "PRESENT" && (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Present
                              </span>
                            )}
                            {entry.status === "ABSENT" && (
                              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                Absent
                              </span>
                            )}
                            {entry.status === "OFFLINE" && (
                              <span className="flex items-center gap-1 text-zinc-400">
                                <XCircle className="w-3 h-3" />
                                Offline
                              </span>
                            )}
                            {isEntryNote && entry.status === "NOTE" && (
                              <span className="flex items-center gap-1 text-amber-500 font-bold">
                                <StickyNote className="w-3 h-3 text-amber-500" />
                                Note
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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
