"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const STATUS_COLORS: Record<string, string> = {
  TODO: "#71717a",
  IN_PROGRESS: "#f59e0b",
  IN_REVIEW: "#a855f7",
  DONE: "#10b981",
};

interface TaskStatusPieChartProps {
  statusBreakdown?: Array<{ name: string; count: number }>;
  isLoading: boolean;
}

export const TaskStatusPieChart: React.FC<TaskStatusPieChartProps> = ({
  statusBreakdown = [],
  isLoading,
}) => {
  return (
    <Card className="xl:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="pb-2">
        <CardTitle>Tasks by Workflow Stage</CardTitle>
        <CardDescription>Live distribution across Kanban statuses</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center">
        {isLoading ? (
          <Skeleton className="h-56 w-full" />
        ) : (
          <div className="w-full">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                  >
                    {statusBreakdown.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || "#71717a"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderRadius: "10px",
                      border: "1px solid #27272a",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              {statusBreakdown.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center space-x-2 text-xs p-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/40"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[s.name] || "#71717a" }}
                  />
                  <span className="text-zinc-600 dark:text-zinc-300 capitalize truncate">
                    {s.name.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="font-bold text-zinc-950 dark:text-white ml-auto font-mono">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
