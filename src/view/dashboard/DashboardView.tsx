"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { analyticsActions } from "../../modules/analytics/actions/analytics.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
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
  MessageSquare,
  Building2,
  Crown,
  Star,
  Activity,
  Layers,
  Sparkles,
  ShieldAlert,
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
  TODO: "#71717a",
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
      return all.filter((t) => t.riskLevel === "HIGH" || t.riskLevel === "OVERDUE").slice(0, 6);
    },
    enabled: !!orgId,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId,
  });

  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: () => userActions.getActivities(),
  });

  const allTeams = (departments || []).flatMap((d) => d.teams || []);

  return (
    <div className="w-full space-y-6 select-none">
      {/* Full-Width Executive Hero Banner */}
      <div className="w-full p-6 md:p-8 rounded-3xl bg-zinc-950 text-white shadow-xl relative overflow-hidden border border-zinc-800/80">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-400 text-black shadow-2xs">
                Work Graph Enterprise
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">
                {currentOrg?.name || "Workspace"}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-zinc-900 text-amber-400 border border-amber-400/30">
                Role: {currentOrg?.myRole || "MEMBER"}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">
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
              <Button variant="outline" size="md" className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white hover:border-amber-400">
                <MessageSquare className="w-4 h-4 mr-1.5 text-amber-400" /> Messages
              </Button>
            </Link>
            <Link href="/departments">
              <Button variant="outline" size="md" className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white hover:border-amber-400">
                <Building2 className="w-4 h-4 mr-1.5 text-amber-400" /> Squads & Hierarchy
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards - Full Width Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Active Projects</span>
            <FolderKanban className="w-4.5 h-4.5 text-amber-500" />
          </div>
          {loadingOverview ? (
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

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Total Tasks</span>
            <TrendingUp className="w-4.5 h-4.5 text-blue-500" />
          </div>
          {loadingOverview ? (
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

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Completion Rate</span>
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          {loadingOverview ? (
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

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Risk Bottlenecks</span>
            <Flame className="w-4.5 h-4.5 text-rose-500" />
          </div>
          {loadingOverview ? (
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

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Team Capacity</span>
            <Users className="w-4.5 h-4.5 text-amber-500" />
          </div>
          {loadingOverview ? (
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

        <Card className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase font-mono">Squads & Units</span>
            <Layers className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-zinc-950 dark:text-white">
            {allTeams.length}
          </div>
          <span className="text-3xs text-zinc-400 font-mono">
            Across {departments?.length || 0} departments
          </span>
        </Card>
      </div>

      {/* Middle Analytics Grid - Full Width (Velocity Chart + Pie Breakdown + Squad Overview) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        {/* Sprint & Completion Velocity Area Chart (7 columns) */}
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

        {/* Task Status Distribution (5 columns) */}
        <Card className="xl:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle>Tasks by Workflow Stage</CardTitle>
            <CardDescription>Live distribution across Kanban statuses</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {loadingBreakdowns ? (
              <Skeleton className="h-56 w-full" />
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
                        paddingAngle={5}
                      >
                        {(breakdowns?.statusBreakdown || []).map((entry) => (
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
                  {(breakdowns?.statusBreakdown || []).map((s) => (
                    <div key={s.name} className="flex items-center space-x-2 text-xs p-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/40">
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
      </div>

      {/* Departments & Squads Quick Overview Strip */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-zinc-950 dark:text-white uppercase font-mono tracking-wider">
              Departments & Operational Squads ({allTeams.length} units)
            </h2>
          </div>
          <Link href="/departments" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
            Manage squads & hierarchy →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(allTeams || []).slice(0, 3).map((team) => (
            <div
              key={team.id}
              className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {team.name}
                </span>
                <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300">
                  {team._count?.members || 0} members
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-2xs">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Crown className="w-3 h-3" /> Leader:
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                    {team.leader?.name || "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-2xs">
                  <span className="flex items-center gap-1 text-indigo-500 font-bold">
                    <Star className="w-3 h-3" /> Co-Leader:
                  </span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                    {team.coLeader?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              {team.operationManagers && team.operationManagers.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-3xs">
                  <span className="text-zinc-400 font-mono">Operation Manager:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                    {team.operationManagers.map((om) => om.user.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Projects & Risk Engine Grid - Full Width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Active Projects List */}
        <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Projects & Roadmaps</CardTitle>
              <CardDescription>Active initiatives and target delivery milestones</CardDescription>
            </div>
            <Link href="/projects" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
              View all ({projects?.length || 0}) →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingProjects ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (projects || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400">
                No active projects yet. Click "+ New Project" above to create your first roadmap.
              </div>
            ) : (
              (projects || []).slice(0, 4).map((p) => (
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
                    <span>{p.metrics.progress}% complete • {p.metrics.totalTasks} tasks</span>
                    <span>Due {formatDate(p.dueDate)}</span>
                  </div>
                  <Progress value={p.metrics.progress} className="mt-2 h-1.5" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Deterministic Risk Bottlenecks */}
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
            {loadingRisks ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (highRiskTasks || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-emerald-600 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-500" />
                All tasks are currently on track with healthy deadline buffers!
              </div>
            ) : (
              highRiskTasks?.map((task) => (
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
      </div>

      {/* Full Width My Tasks Board */}
      <Card className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>My Open Assignments</CardTitle>
            <CardDescription>Tasks specifically assigned to your profile across squads</CardDescription>
          </div>
          <span className="text-xs text-zinc-500 font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
            {myTasks?.length ?? 0} assigned
          </span>
        </CardHeader>
        <CardContent>
          {loadingMyTasks ? (
            <Skeleton className="h-24 w-full" />
          ) : (myTasks || []).length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-400">
              You have no active open tasks assigned at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {myTasks?.slice(0, 8).map((t) => (
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
    </div>
  );
};
