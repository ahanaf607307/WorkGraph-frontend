"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { analyticsActions } from "../../modules/analytics/actions/analytics.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { DashboardHeroBanner } from "./components/DashboardHeroBanner";
import { DashboardMetricCards } from "./components/DashboardMetricCards";
import { SprintVelocityChart } from "./components/SprintVelocityChart";
import { TaskStatusPieChart } from "./components/TaskStatusPieChart";
import { SquadsOverviewStrip } from "./components/SquadsOverviewStrip";
import { RecentProjectsCard } from "./components/RecentProjectsCard";
import { RiskBottlenecksCard } from "./components/RiskBottlenecksCard";
import { MyOpenTasksCard } from "./components/MyOpenTasksCard";
import { NewsfeedSection } from "./components/NewsfeedSection";
import { SystemOwnerPlatformView } from "./components/SystemOwnerPlatformView";
import { LayoutDashboard, Newspaper, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

export const DashboardView: React.FC = () => {
  const { user, currentOrg } = useAuth();

  if (user?.role === "SYSTEM_OWNER") {
    return <SystemOwnerPlatformView />;
  }

  const orgId = currentOrg?.id;

  const [activeTab, setActiveTab] = useState<"overview" | "newsfeed">("overview");

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

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId,
  });

  const allTeams = departments.flatMap((d) => d.teams || []);

  return (
    <div className="w-full space-y-6 select-none">
      {/* 1. Executive Hero Banner */}
      <DashboardHeroBanner
        userName={user?.name}
        workspaceName={currentOrg?.name}
        myRole={currentOrg?.myRole}
      />

      {/* 2. Dashboard Mode Switcher (Overview vs Newsfeed) */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
            activeTab === "overview"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Analytics & Workload</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("newsfeed")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
            activeTab === "newsfeed"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          )}
        >
          <Newspaper className="w-4 h-4" />
          <span>Team Newsfeed</span>
          <span className="px-1.5 py-0.2 rounded-full text-3xs font-mono font-semibold bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
            Live
          </span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      {activeTab === "newsfeed" ? (
        <NewsfeedSection />
      ) : (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Cards */}
          <DashboardMetricCards
            overview={overview}
            isLoading={loadingOverview}
            totalTeamsCount={allTeams.length}
            departmentsCount={departments.length}
          />

          {/* Sprint Velocity & Task Status Distribution Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
            <SprintVelocityChart trends={trends} isLoading={loadingTrends} />
            <TaskStatusPieChart
              statusBreakdown={breakdowns?.statusBreakdown}
              isLoading={loadingBreakdowns}
            />
          </div>

          {/* Departments & Squads Overview Strip */}
          <SquadsOverviewStrip allTeams={allTeams} />

          {/* Recent Projects & Risk Engine Bottlenecks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <RecentProjectsCard projects={projects} isLoading={loadingProjects} />
            <RiskBottlenecksCard highRiskTasks={highRiskTasks} isLoading={loadingRisks} />
          </div>

          {/* Full-Width Personal Open Tasks Board */}
          <MyOpenTasksCard myTasks={myTasks} isLoading={loadingMyTasks} />
        </div>
      )}
    </div>
  );
};
