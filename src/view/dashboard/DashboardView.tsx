"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { analyticsActions } from "../../modules/analytics/actions/analytics.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Avatar } from "../../components/ui/avatar";
import { Progress } from "../../components/ui/progress";
import { Skeleton } from "../../components/ui/skeleton";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatDate, formatRelativeDate } from "../../lib/utils";

const STATUS_COLORS: Record<string, string> = {
  TODO: "#64748b",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#a855f7",
  DONE: "#10b981",
};

export const DashboardView: React.FC = () => {
  const { user, currentOrg } = useAuth();
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

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => projectActions.fetchProjects(orgId),
    enabled: !!orgId,
  });

  const { data: myTasks, isLoading: loadingMyTasks } = useQuery({
    queryKey: ["tasks", "my", orgId, user?.id],
    queryFn: () => taskActions.fetchTasks({ organizationId: orgId, assigneeId: user?.id }),
    enabled: !!orgId && !!user?.id,
  });

  const { data: highRiskTasks, isLoading: loadingRisks } = useQuery({
    queryKey: ["tasks", "high-risk", orgId],
    queryFn: async () => {
      const all = await taskActions.fetchTasks({ organizationId: orgId });
      return all.filter((t) => t.riskLevel === "HIGH" || t.riskLevel === "OVERDUE").slice(0, 5);
    },
    enabled: !!orgId,
  });

  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: () => userActions.getActivities(),
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white shadow-xl relative overflow-hidden border border-zinc-800">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Workspace Dashboard
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {currentOrg?.name || "WorkGraph"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-sm text-zinc-300 max-w-xl">
            Here is your live project status, team workload capacity, and deterministic risk metrics.
          </p>
        </div>
        <div className="flex items-center space-x-3 relative z-10">
          <Link href="/projects/new">
            <Button variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> New Project
            </Button>
          </Link>
          <Link href="/team">
            <Button variant="outline" size="md" className="border-slate-700 hover:bg-slate-800 text-white">
              <Users className="w-4 h-4 mr-1.5" /> Team Workload
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 6 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-amber-500" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {overview?.activeProjects ?? 0}
            </div>
          )}
          <span className="text-2xs text-slate-400 font-mono">
            {overview?.totalProjects ?? 0} total initiatives
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Tasks</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {overview?.totalTasks ?? 0}
            </div>
          )}
          <span className="text-2xs text-slate-400 font-mono">
            {overview?.openTasks ?? 0} open tasks
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-emerald-600">
              {overview?.completedTasks ?? 0}
            </div>
          )}
          <span className="text-2xs text-slate-400 font-mono">
            {overview?.completionRate ?? 0}% completion rate
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Overdue Tasks</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-rose-600">
              {overview?.overdueTasks ?? 0}
            </div>
          )}
          <span className="text-2xs text-rose-500 font-medium">Past target deadline</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High Risk Tasks</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-amber-600">
              {overview?.highRiskTasks ?? 0}
            </div>
          )}
          <span className="text-2xs text-slate-400 font-mono">Rule-based risk alerts</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Team Capacity</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          {loadingOverview ? (
            <Skeleton className="h-7 w-12" />
          ) : (
            <div className="text-2xl font-bold text-purple-600">
              {overview?.teamUtilization ?? 0}%
            </div>
          )}
          <span className="text-2xs text-slate-400 font-mono">
            {overview?.summary?.totalMembers ?? 0} members active
          </span>
        </Card>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completion Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sprint & Completion Velocity</CardTitle>
            <CardDescription>Daily completed vs newly opened tasks over the last 14 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
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
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCompleted)"
                      name="Completed Tasks"
                    />
                    <Area
                      type="monotone"
                      dataKey="created"
                      stroke="#6366f1"
                      strokeWidth={2}
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

        {/* Task Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Live distribution across workflow stages</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {loadingBreakdowns ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <div className="w-full">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdowns?.statusBreakdown || []}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {(breakdowns?.statusBreakdown || []).map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {(breakdowns?.statusBreakdown || []).map((s) => (
                    <div key={s.name} className="flex items-center space-x-2 text-xs">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[s.name] || "#94a3b8" }}
                      />
                      <span className="text-slate-600 dark:text-slate-400 capitalize">
                        {s.name.replace("_", " ").toLowerCase()}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 ml-auto">
                        {s.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects and High-Risk Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Ongoing initiatives and target milestones</CardDescription>
            </div>
            <Link href="/projects" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProjects ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (projects || []).length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No active projects yet. Create your first project to get started!
              </div>
            ) : (
              (projects || []).slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="block p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-400/60 dark:hover:border-amber-400/40 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      {p.name}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2.5">
                    {p.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center space-x-2">
                      <span>{p.metrics.progress}% complete</span>
                      <span>•</span>
                      <span>{p.metrics.totalTasks} tasks</span>
                    </div>
                    <span>Due {formatDate(p.dueDate)}</span>
                  </div>
                  <Progress value={p.metrics.progress} className="mt-2 h-1.5" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* High Risk / Blocked Tasks Engine Output */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
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
            {loadingRisks ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (highRiskTasks || []).length === 0 ? (
              <div className="text-center py-8 text-sm text-emerald-600 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
                All tasks are currently on track with healthy deadline buffers!
              </div>
            ) : (
              highRiskTasks?.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-rose-50/20 dark:bg-rose-950/10 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-[280px]">
                      {task.title}
                    </span>
                    <RiskBadge riskLevel={task.riskLevel} />
                  </div>
                  <div className="text-2xs text-rose-600 dark:text-rose-400 font-medium">
                    {task.riskReasons?.[0] || "Critical deadline risk"}
                  </div>
                  <div className="flex items-center justify-between text-2xs text-slate-400 pt-1">
                    <span>Assigned to: {task.assignee?.name || "Unassigned"}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Open Assignments</CardTitle>
            <CardDescription>Tasks specifically assigned to you</CardDescription>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {myTasks?.length ?? 0} assigned
          </span>
        </CardHeader>
        <CardContent>
          {loadingMyTasks ? (
            <Skeleton className="h-24 w-full" />
          ) : (myTasks || []).length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              You have no active open tasks assigned at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {myTasks?.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                    {t.title}
                  </div>
                  <div className="flex items-center justify-between text-2xs text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{t.estimatedHours}h effort</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      Due {formatDate(t.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
