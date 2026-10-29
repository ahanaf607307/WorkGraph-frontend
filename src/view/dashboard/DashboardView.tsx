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
import { SystemOwnerPlatformView } from "./components/SystemOwnerPlatformView";

export const DashboardView: React.FC = () => {
  const { user, currentOrg } = useAuth();

  if (user?.role === "SYSTEM_OWNER") {
    return <SystemOwnerPlatformView />;
  }

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

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId,
  });

  const allTeams = departments.flatMap((d) => d.teams || []);

  const orgRole = (currentOrg?.myRole || "").toUpperCase();
  const userRole = (user?.role || "").toUpperCase();
  const isWorkspaceAdminOrAdmin =
    userRole === "SYSTEM_OWNER" ||
    userRole === "SYSTEM_ADMIN" ||
    userRole === "WORKSPACE_ADMIN" ||
    orgRole === "SYSTEM_ADMIN" ||
    orgRole === "WORKSPACE_ADMIN" ||
    orgRole === "ADMIN" ||
    orgRole === "OWNER";

  const userTeamIds = React.useMemo(() => {
    if (isWorkspaceAdminOrAdmin) return [];
    const set = new Set<string>();
    if (currentOrg?.teamId) set.add(currentOrg.teamId);
    allTeams.forEach((t) => {
      if (t.leaderId === user?.id || t.coLeaderId === user?.id) set.add(t.id);
      if (t.members?.some((m: any) => m.userId === user?.id || m.user?.id === user?.id)) set.add(t.id);
    });
    return Array.from(set);
  }, [isWorkspaceAdminOrAdmin, currentOrg?.teamId, allTeams, user?.id]);

  const scopedTeams = isWorkspaceAdminOrAdmin
    ? allTeams
    : allTeams.filter((t) => userTeamIds.includes(t.id));

  const scopedProjects = React.useMemo(() => {
    if (isWorkspaceAdminOrAdmin || !projects) return projects;
    return projects.filter((p) => p.teamId && userTeamIds.includes(p.teamId));
  }, [isWorkspaceAdminOrAdmin, projects, userTeamIds]);

  return (
    <div className="w-full space-y-6 select-none">
      {/* 1. Executive Hero Banner */}
      <DashboardHeroBanner
        userName={user?.name}
        workspaceName={currentOrg?.name}
        myRole={currentOrg?.myRole}
        canCreateProject={isWorkspaceAdminOrAdmin}
      />

      {/* 2. Overview Content */}
      <div className="space-y-6">
        {/* Top 6 KPI Metric Cards */}
        <DashboardMetricCards
          overview={overview}
          isLoading={loadingOverview}
          totalTeamsCount={scopedTeams.length}
          departmentsCount={isWorkspaceAdminOrAdmin ? departments.length : (scopedTeams.length > 0 ? 1 : 0)}
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
        <SquadsOverviewStrip allTeams={scopedTeams} />

        {/* Recent Projects & Risk Engine Bottlenecks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <RecentProjectsCard projects={scopedProjects} isLoading={loadingProjects} />
          <RiskBottlenecksCard highRiskTasks={highRiskTasks} isLoading={loadingRisks} />
        </div>

        {/* Full-Width Personal Open Tasks Board */}
        <MyOpenTasksCard myTasks={myTasks} isLoading={loadingMyTasks} />
      </div>
    </div>
  );
};
