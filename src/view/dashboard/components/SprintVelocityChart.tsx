"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface SprintVelocityChartProps {
  trends?: Array<{ date: string; completed: number; created: number }>;
  isLoading: boolean;
}

export const SprintVelocityChart: React.FC<SprintVelocityChartProps> = ({ trends, isLoading }) => {
  return (
    <Card className="xl:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Sprint & Delivery Velocity</CardTitle>
          <CardDescription>Daily completed vs newly opened tasks over the last 14 days</CardDescription>
        </div>
        <span className="px-2.5 py-1 rounded-full text-3xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          Deterministic Trajectory
        </span>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends || []}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => val.slice(5)}
                  stroke="#71717a"
                  fontSize={11}
                />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderRadius: "12px",
                    border: "1px solid #27272a",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Completed Tasks"
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  name="Created Tasks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
