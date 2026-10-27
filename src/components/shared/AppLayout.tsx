"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MessageSquare, Clock, Users, RefreshCw, LogOut } from "lucide-react";

export const AppLayout: React.FC<{
  children: React.ReactNode;
  noPadding?: boolean;
  hideSidebar?: boolean;
}> = ({ children, noPadding = false, hideSidebar = false }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname === "/chat";
  const { user, currentOrg, isLoading, refreshOrganizations, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshOrganizations();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#0b0d14] p-6">
        <div className="space-y-4 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 text-white font-extrabold flex items-center justify-center mx-auto text-xl shadow-lg shadow-violet-500/20 animate-pulse">
            W
          </div>
          <p className="text-sm text-zinc-400 font-medium">Loading Work Graph workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isSystemOwner = user?.role === "SYSTEM_OWNER";
  const isPendingApproval =
    !isSystemOwner &&
    currentOrg &&
    (currentOrg.isApproved === false || currentOrg.membershipStatus === "PENDING");

  const isWaitingTeamAssignment =
    !isSystemOwner &&
    currentOrg &&
    currentOrg.isApproved !== false &&
    currentOrg.membershipStatus !== "PENDING" &&
    currentOrg.myRole === "MEMBER" &&
    !currentOrg.teamId;

  // Gate 1: Pending Member Workspace Approval
  if (isPendingApproval) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] dark:bg-[#090a0f] p-6">
        <div className="w-full max-w-md p-7 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Pending Authorization
            </span>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              Waiting for Approval
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your member account for <strong className="text-zinc-900 dark:text-zinc-200">{currentOrg.name}</strong> is awaiting authorization from the Workspace Administrator.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] text-start space-y-1.5 text-2xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-zinc-300 font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Workspace Code:</span>
              <span className="text-violet-400 font-bold">{currentOrg.workspaceCode || "Registered"}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-400 font-bold">Awaiting Review</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex-1 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Gate 2: Approved, but Waiting for Team / Squad Assignment
  if (isWaitingTeamAssignment) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] dark:bg-[#090a0f] p-6">
        <div className="w-full max-w-md p-7 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-violet-500/10 text-violet-500 border border-violet-500/20">
              Workspace Approved
            </span>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
              Waiting for Team Assignment
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your registration is approved! Before accessing boards and operational stations, an Administrator must assign you to your designated Squad or Team.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] text-start space-y-1.5 text-2xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Workspace:</span>
              <span className="text-zinc-300 font-medium">{currentOrg.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="text-violet-400 font-medium">Team Member</span>
            </div>
            <div className="flex justify-between">
              <span>Squad / Team:</span>
              <span className="text-amber-400 font-bold">Unassigned</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex-1 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Check Status"}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] dark:bg-[#090a0f] font-sans transition-colors relative">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main
          className={
            noPadding
              ? "flex-1 overflow-hidden p-0 bg-white dark:bg-[#090a0f] transition-colors flex flex-col"
              : "flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-[#f8fafc] dark:bg-[#090a0f] transition-colors"
          }
        >
          {noPadding ? children : <div className="w-full space-y-6">{children}</div>}
        </main>
      </div>

      {/* Floating Messenger Quick Button (Bottom Right) */}
      {!isChat && (
        <Link
          href="/chat"
          title="Open Messages & Chat"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="sr-only">Open Messages & Chat</span>
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#090a0f] rounded-full shadow-xs" />
        </Link>
      )}
    </div>
  )
};
