"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsActions } from "../../modules/analytics/actions/analytics.actions";
import { workloadActions } from "../../modules/workload/actions/workload.actions";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { Skeleton } from "../../components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { CheckCircle2, TrendingUp, AlertTriangle, Users, Clock, Award } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#64748b",
  MEDIUM: "#f59e0b",
  HIGH: "#f97316",
  URGENT: "#ef4444",
};

export const AnalyticsView: React.FC = () => {
  const { currentOrg } = useAuth();
  const orgId = currentOrg?.id;

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analytics-overview", orgId],
    queryFn: () => analyticsActions.fetchOverview(orgId),
    enabled: !!orgId,
  });

  const { data: breakdowns, isLoading: loadingBreakdowns } = useQuery({
    queryKey: ["analytics-tasks", orgId],
    queryFn: () => analyticsActions.fetchTaskBreakdown(orgId),
    enabled: !!orgId,
  });

  const { data: trends, isLoading: loadingTrends } = useQuery({
    queryKey: ["analytics-trends", orgId],
    queryFn: () => analyticsActions.fetchCompletionTrends(orgId),
    enabled: !!orgId,
  });

  const { data: workload, isLoading: loadingWorkload } = useQuery({
    queryKey: ["workload", orgId],
    queryFn: () => workloadActions.fetchOrganizationWorkload(orgId!),
    enabled: !!orgId,
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Productivity & Workload Intelligence
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Formula-based metrics and operational velocity aggregated from live PostgreSQL data.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Overall Completion Rate</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white">
            {overview?.completionRate ?? 0}%
          </div>
          <span className="text-2xs text-zinc-400 font-mono">
            {overview?.completedTasks ?? 0} of {overview?.totalTasks ?? 0} tasks done
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Active Sprint Load</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {overview?.openTasks ?? 0}
          </div>
          <span className="text-2xs text-zinc-400 font-mono">Tasks pending completion</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Overdue Work</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {overview?.overdueTasks ?? 0}
          </div>
          <span className="text-2xs text-rose-500 font-mono">Past scheduled due date</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Team Workload Utilization</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {overview?.teamUtilization ?? 0}%
          </div>
          <span className="text-2xs text-zinc-400 font-mono">
            Assigned Open Hours / Total Capacity
          </span>
        </Card>
      </div>

      {/* Velocity and Priority Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Velocity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Completion Trends (14-Day Velocity)</CardTitle>
            <CardDescription>Daily completed tasks compared to newly opened tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends || []}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => val.slice(5)}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderRadius: "12px",
                        border: "none",
                        color: "#fff",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Completed Tasks"
                    />
                    <Line
                      type="monotone"
                      dataKey="created"
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Created Tasks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Criticality breakdown across active work</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBreakdowns ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <div className="w-full">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdowns?.priorityBreakdown || []}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" fontSize={10} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {(breakdowns?.priorityBreakdown || []).map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PRIORITY_COLORS[entry.name] || "#6366f1"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                  {(breakdowns?.priorityBreakdown || []).map((p) => (
                    <div key={p.name} className="flex justify-between items-center">
                      <span className="text-zinc-500 capitalize">{p.name.toLowerCase()} Priority</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workload Distribution Across Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Workload Distribution Across Team Members</CardTitle>
          <CardDescription>
            Formula: Utilization % = Assigned Open Hours / Weekly Capacity Hours × 100
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingWorkload ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <div className="space-y-4">
              {(workload?.members || []).map((m) => (
                <div key={m.memberId} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-zinc-950 dark:text-white">{m.user.name}</span>
                      <span className="text-2xs text-zinc-400 font-mono">
                        ({m.assignedOpenHours}h assigned / {m.weeklyCapacityHours}h cap)
                      </span>
                    </div>
                    <span className="font-bold font-mono text-zinc-800 dark:text-zinc-200">
                      {m.utilizationPercentage}%
                    </span>
                  </div>
                  <Progress
                    value={m.utilizationPercentage}
                    indicatorColor={
                      m.utilizationPercentage > 125
                        ? "bg-rose-500"
                        : m.utilizationPercentage > 100
                        ? "bg-amber-500"
                        : m.utilizationPercentage < 50
                        ? "bg-sky-500"
                        : "bg-emerald-500"
                    }
                    className="h-2.5"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
