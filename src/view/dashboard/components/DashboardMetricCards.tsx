"use client";

import React from "react";
import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { FolderKanban, TrendingUp, CheckCircle2, Flame, Users, Layers } from "lucide-react";

interface DashboardMetricCardsProps {
  overview?: {
    activeProjects?: number;
    totalProjects?: number;
    totalTasks?: number;
    openTasks?: number;
    completionRate?: number;
    completedTasks?: number;
    highRiskTasks?: number;
    overdueTasks?: number;
    teamUtilization?: number;
    summary?: {
      totalMembers?: number;
    };
  };
  isLoading: boolean;
  totalTeamsCount: number;
  departmentsCount: number;
}

export const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({
  overview,
  isLoading,
  totalTeamsCount,
  departmentsCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
      {/* 1. Active Projects */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Active Projects</span>
          <FolderKanban className="w-4.5 h-4.5 text-amber-500" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <div className="text-2xl font-black text-zinc-950 dark:text-white">
            {overview?.activeProjects ?? 0}
          </div>
        )}
        <span className="text-3xs text-zinc-400 font-mono">
          {overview?.totalProjects ?? 0} total initiatives
        </span>
      </Card>

      {/* 2. Total Tasks */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Total Tasks</span>
          <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <div className="text-2xl font-black text-zinc-950 dark:text-white">
            {overview?.totalTasks ?? 0}
          </div>
        )}
        <span className="text-3xs text-zinc-400 font-mono">
          {overview?.openTasks ?? 0} in progress
        </span>
      </Card>

      {/* 3. Completion Rate */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Completion Rate</span>
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overview?.completionRate ?? 0}%
          </div>
        )}
        <span className="text-3xs text-zinc-400 font-mono">
          {overview?.completedTasks ?? 0} tasks done
        </span>
      </Card>

      {/* 4. Risk Bottlenecks */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Risk Bottlenecks</span>
          <Flame className="w-4.5 h-4.5 text-rose-500" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {overview?.highRiskTasks ?? 0}
          </div>
        )}
        <span className="text-3xs text-rose-500 font-mono">
          {overview?.overdueTasks ?? 0} overdue tasks
        </span>
      </Card>

      {/* 5. Team Capacity */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Team Capacity</span>
          <Users className="w-4.5 h-4.5 text-amber-500" />
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <div className="text-2xl font-black text-zinc-950 dark:text-white">
            {overview?.teamUtilization ?? 0}%
          </div>
        )}
        <span className="text-3xs text-zinc-400 font-mono">
          {overview?.summary?.totalMembers ?? 0} squad members
        </span>
      </Card>

      {/* 6. Squads & Units */}
      <Card className="p-4.5 bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-2">
          <span className="text-xs font-bold uppercase font-mono">Squads & Units</span>
          <Layers className="w-4.5 h-4.5 text-indigo-500" />
        </div>
        <div className="text-2xl font-black text-zinc-950 dark:text-white">
          {totalTeamsCount}
        </div>
        <span className="text-3xs text-zinc-400 font-mono">
          Across {departmentsCount} departments
        </span>
      </Card>
    </div>
  );
};
