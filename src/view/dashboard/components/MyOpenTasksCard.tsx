"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { StatusBadge } from "../../../components/shared/StatusBadge";
import { PriorityBadge } from "../../../components/shared/PriorityBadge";
import { formatDate } from "../../../lib/utils";

interface MyOpenTasksCardProps {
  myTasks?: any[];
  isLoading: boolean;
}

export const MyOpenTasksCard: React.FC<MyOpenTasksCardProps> = ({ myTasks = [], isLoading }) => {
  return (
    <Card className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>My Open Assignments</CardTitle>
          <CardDescription>Tasks specifically assigned to your profile across squads</CardDescription>
        </div>
        <span className="text-xs text-zinc-500 font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
          {myTasks.length} assigned
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : myTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400">
            You have no active open tasks assigned at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {myTasks.slice(0, 8).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 shadow-2xs space-y-2 hover:border-amber-400/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <div className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-1">
                  {t.title}
                </div>
                <div className="flex items-center justify-between text-3xs text-zinc-400 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60 font-mono">
                  <span>{t.estimatedHours}h effort</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Due {formatDate(t.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
