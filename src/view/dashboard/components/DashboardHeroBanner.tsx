"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Plus, MessageSquare, Building2 } from "lucide-react";

interface DashboardHeroBannerProps {
  userName?: string;
  workspaceName?: string;
  myRole?: string;
  canCreateProject?: boolean;
}

export const DashboardHeroBanner: React.FC<DashboardHeroBannerProps> = ({
  userName,
  workspaceName,
  myRole,
  canCreateProject = false,
}) => {
  return (
    <div className="w-full p-6 md:p-7 rounded-2xl bg-white dark:bg-[#0f1118] text-zinc-900 dark:text-white shadow-xs relative overflow-hidden border border-zinc-200/70 dark:border-white/[0.06]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/8 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs">
              Work Graph Enterprise
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60">
              {workspaceName || "Workspace"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
              Role: {myRole || "MEMBER"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Welcome back, {userName || "Colleague"}!
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Real-time enterprise project governance, cross-team workload capacity, deterministic risk engine, and live squad channels.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          {canCreateProject && (
            <Link href="/projects/new">
              <Button variant="primary" size="md">
                <Plus className="w-4 h-4 mr-1.5" /> New Project
              </Button>
            </Link>
          )}
          <Link href="/chat">
            <Button
              variant="outline"
              size="md"
            >
              <MessageSquare className="w-4 h-4 mr-1.5 text-violet-500" /> Messages
            </Button>
          </Link>
          <Link href="/departments">
            <Button
              variant="outline"
              size="md"
            >
              <Building2 className="w-4 h-4 mr-1.5 text-violet-500" /> Squads & Hierarchy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
