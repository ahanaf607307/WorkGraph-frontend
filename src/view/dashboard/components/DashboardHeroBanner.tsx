"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Plus, MessageSquare, Building2 } from "lucide-react";

interface DashboardHeroBannerProps {
  userName?: string;
  workspaceName?: string;
  myRole?: string;
}

export const DashboardHeroBanner: React.FC<DashboardHeroBannerProps> = ({
  userName,
  workspaceName,
  myRole,
}) => {
  return (
    <div className="w-full p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm relative overflow-hidden border border-zinc-200 dark:border-zinc-800">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs">
              Work Graph Enterprise
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {workspaceName || "Workspace"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
              Role: {myRole || "MEMBER"}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
            Welcome back, {userName || "Colleague"}!
          </h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Real-time enterprise project governance, cross-team workload capacity, deterministic risk engine, and live squad channels.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10">
          <Link href="/projects/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> New Project
            </Button>
          </Link>
          <Link href="/chat">
            <Button
              variant="outline"
              size="md"
            >
              <MessageSquare className="w-4 h-4 mr-1.5 text-orange-500" /> Messages
            </Button>
          </Link>
          <Link href="/departments">
            <Button
              variant="outline"
              size="md"
            >
              <Building2 className="w-4 h-4 mr-1.5 text-orange-500" /> Squads & Hierarchy
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
