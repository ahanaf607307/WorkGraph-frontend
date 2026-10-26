"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { RiskBadge } from "../../../components/shared/RiskBadge";
import { Flame, CheckCircle2 } from "lucide-react";
import { formatDate } from "../../../lib/utils";

interface RiskBottlenecksCardProps {
  highRiskTasks?: any[];
  isLoading: boolean;
}

export const RiskBottlenecksCard: React.FC<RiskBottlenecksCardProps> = ({ highRiskTasks = [], isLoading }) => {
  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center space-x-2">
          <Flame className="w-5 h-5 text-rose-500" />
          <div>
            <CardTitle>Deadline Risk Engine</CardTitle>
            <CardDescription>Deterministic bottleneck & overdue task detection</CardDescription>
          </div>
        </div>
        <Link href="/analytics" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
          Risk report →
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : highRiskTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-emerald-600 flex flex-col items-center">
            <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
            All tasks are currently on track with healthy deadline buffers!
          </div>
        ) : (
          highRiskTasks.map((task) => (
            <div
              key={task.id}
              className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 bg-rose-50/20 dark:bg-rose-950/20 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-950 dark:text-white truncate max-w-[280px]">
                  {task.title}
                </span>
                <RiskBadge riskLevel={task.riskLevel} />
              </div>
              <div className="text-3xs text-rose-600 dark:text-rose-400 font-medium">
                {task.riskReasons?.[0] || "Critical deadline risk"}
              </div>
              <div className="flex items-center justify-between text-3xs text-zinc-400 pt-1 font-mono">
                <span>Assigned: {task.assignee?.name || "Unassigned"}</span>
                <span>Due: {formatDate(task.dueDate)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
