"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { Progress } from "../../../components/ui/progress";
import { formatDate } from "../../../lib/utils";

interface RecentProjectsCardProps {
  projects?: any[];
  isLoading: boolean;
}

export const RecentProjectsCard: React.FC<RecentProjectsCardProps> = ({ projects = [], isLoading }) => {
  return (
    <Card className="bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Recent Projects & Roadmaps</CardTitle>
          <CardDescription>Active initiatives and target delivery milestones</CardDescription>
        </div>
        <Link href="/projects" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          View all ({projects.length}) →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400">
            No active projects yet. Click "+ New Project" above to create your first roadmap.
          </div>
        ) : (
          projects.slice(0, 4).map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-zinc-950 dark:text-white group-hover:text-amber-500 transition-colors">
                  {p.name}
                </span>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-2xs text-zinc-500 line-clamp-1 mb-2">
                {p.description || "Enterprise project milestone."}
              </p>
              <div className="flex items-center justify-between text-3xs text-zinc-400 font-mono">
                <span>{p.metrics?.progress ?? 0}% complete • {p.metrics?.totalTasks ?? 0} tasks</span>
                <span>Due {formatDate(p.dueDate)}</span>
              </div>
              <Progress value={p.metrics?.progress ?? 0} className="mt-2 h-1.5" />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
};
