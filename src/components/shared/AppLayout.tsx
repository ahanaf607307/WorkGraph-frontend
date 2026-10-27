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
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0b0d14] p-6">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Pending Authorization
            </span>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white">
              Waiting for Approval
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your member account for <strong className="text-zinc-900 dark:text-zinc-200">{currentOrg.name}</strong> is awaiting authorization from the Workspace Administrator. You will gain full dashboard access as soon as you are approved.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 text-start space-y-1 text-2xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Account:</span>
              <span className="text-zinc-300 font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span>Workspace Code:</span>
              <span className="text-violet-400 font-bold">{currentOrg.workspaceCode || "Registered"}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-400 font-bold">Awaiting Admin Review</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Refresh Status"}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
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
      <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 dark:bg-[#0b0d14] p-6">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-violet-500/10 text-violet-500 border border-violet-500/20">
              Workspace Approved
            </span>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white">
              Waiting for Team Assignment
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Your registration has been approved! Before accessing workspace projects, boards, and stations, an Administrator or Team Lead must assign you to your designated Squad or Team.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 text-start space-y-1 text-2xs text-zinc-400 font-mono">
            <div className="flex justify-between">
              <span>Workspace:</span>
              <span className="text-zinc-300 font-bold">{currentOrg.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Role:</span>
              <span className="text-violet-400 font-bold">Team Member</span>
            </div>
            <div className="flex justify-between">
              <span>Squad / Team:</span>
              <span className="text-amber-400 font-bold">Unassigned</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Checking..." : "Check Status"}</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
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
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-[#07090e] font-sans transition-colors relative">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main
          className={
            noPadding
              ? "flex-1 overflow-hidden p-0 bg-white dark:bg-zinc-950 transition-colors flex flex-col"
              : "flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-50/70 dark:bg-[#07090e] transition-colors"
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
          className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/20 cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
          <span className="sr-only">Open Messages & Chat</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-xs animate-pulse" />
        </Link>
      )}
    </div>
  );
};
