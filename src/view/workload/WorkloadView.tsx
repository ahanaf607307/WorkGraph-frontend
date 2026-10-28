"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workloadActions } from "../../modules/workload/actions/workload.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Modal } from "../../components/ui/modal";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";
import {
  Users,
  Clock,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  ArrowRightLeft,
  Calendar,
  Filter,
  BarChart3,
  Search,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

export const WorkloadView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN";

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"team_summary" | "members">("team_summary");
  const [expandedSquadIds, setExpandedSquadIds] = useState<string[]>([]);

  const toggleExpandSquad = (squadId: string) => {
    setExpandedSquadIds((prev) =>
      prev.includes(squadId) ? prev.filter((id) => id !== squadId) : [...prev, squadId]
    );
  };

  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Reassign Task modal
  const [reassignTask, setReassignTask] = useState<any | null>(null);
  const [targetAssigneeId, setTargetAssigneeId] = useState("");

  const { data: workload, isLoading } = useQuery({
    queryKey: ["workload", orgId],
    queryFn: () => workloadActions.fetchOrganizationWorkload(orgId!),
    enabled: !!orgId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId!),
    enabled: !!orgId,
  });

  // Flatten teams for the team dropdown
  const allTeams = useMemo(() => {
    const list: Array<{ id: string; name: string; deptId: string; deptName: string }> = [];
    for (const d of departments) {
      if (d.teams && Array.isArray(d.teams)) {
        for (const t of d.teams) {
          list.push({ id: t.id, name: t.name, deptId: d.id, deptName: d.name });
        }
      }
    }
    return list;
  }, [departments]);

  // Compute Squad-by-Squad Team Workload Rollup
  const teamWorkloadRollup = useMemo(() => {
    if (!departments || departments.length === 0) return [];
    const list: any[] = [];
    for (const d of departments) {
      if (selectedDeptFilter && d.id !== selectedDeptFilter) continue;
      if (d.teams && Array.isArray(d.teams)) {
        for (const t of d.teams) {
          if (selectedTeamFilter !== "ALL" && t.id !== selectedTeamFilter) continue;

          const squadMembers = (workload?.members || []).filter(
            (m: any) => m.teamId === t.id || m.team?.id === t.id
          );

          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const matchesSquad =
              t.name.toLowerCase().includes(q) ||
              d.name.toLowerCase().includes(q) ||
              squadMembers.some((sm: any) =>
                sm.user?.name?.toLowerCase().includes(q) ||
                sm.user?.email?.toLowerCase().includes(q)
              );
            if (!matchesSquad) continue;
          }

          const totalCapacity = squadMembers.reduce(
            (sum: number, m: any) => sum + (m.weeklyCapacityHours || 40),
            0
          );
          const totalAllocated = squadMembers.reduce(
            (sum: number, m: any) => sum + (m.assignedHours || 0),
            0
          );
          const utilization =
            totalCapacity > 0 ? Math.round((totalAllocated / totalCapacity) * 100) : 0;

          let status = "BALANCED";
          if (utilization > 100) status = "OVERLOADED";
          else if (utilization > 80) status = "HIGH";
          else if (utilization < 30 && squadMembers.length > 0) status = "UNDERUTILIZED";

          list.push({
            id: t.id,
            name: t.name,
            deptId: d.id,
            deptName: d.name,
            leader: t.leader,
            coLeader: t.coLeader,
            description: t.description,
            members: squadMembers,
            memberCount: squadMembers.length,
            totalCapacity,
            totalAllocated,
            utilization,
            status,
          });
        }
      }
    }
    return list;
  }, [departments, workload?.members, selectedDeptFilter, selectedTeamFilter, searchTerm]);

  // Filter members: regular members only see their squad team members; admins see all with department, team & search filters
  const displayedMembers = useMemo(() => {
    if (!workload?.members) return [];
    let list = workload.members;
    if (!isSystemAdminOrAdmin) {
      list = list.filter(
        (m: any) =>
          m.user.id === user?.id ||
          (currentOrg?.teamId && m.teamId === currentOrg?.teamId) ||
          (currentOrg?.departmentId && m.departmentId === currentOrg?.departmentId)
      );
    }
    if (selectedDeptFilter) {
      list = list.filter((m: any) => m.departmentId === selectedDeptFilter);
    }
    if (selectedTeamFilter !== "ALL") {
      list = list.filter((m: any) => m.teamId === selectedTeamFilter || m.team?.id === selectedTeamFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m: any) =>
          m.user?.name?.toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q) ||
          m.department?.name?.toLowerCase().includes(q) ||
          m.team?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [workload, isSystemAdminOrAdmin, user, currentOrg, selectedDeptFilter, selectedTeamFilter, searchTerm]);

  // Reassign mutation
  const reassignMutation = useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string }) =>
      taskActions.updateTask(taskId, { assigneeId }),
    onSuccess: () => {
      toast.success("Task reassigned successfully");
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      setReassignTask(null);
      setTargetAssigneeId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to reassign task"),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OVERLOADED":
        return "text-red-600 bg-red-500/10 border-red-500/30";
      case "HIGH":
        return "text-amber-600 bg-amber-500/10 border-amber-500/30";
      case "BALANCED":
        return "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
      case "UNDERUTILIZED":
        return "text-blue-600 bg-blue-500/10 border-blue-500/30";
      default:
        return "text-zinc-600 bg-zinc-500/10 border-zinc-500/30";
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500" />
            <span>Workload & Capacity Analytics</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor team and squad capacity utilization, task allocations, and prevent employee burnout
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setViewMode("team_summary")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "team_summary"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Rollup</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("members")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "members"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Individual Members</span>
            </button>
          </div>

          {/* Global summary stats */}
          {workload && (
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#11131c] border border-zinc-200/80 dark:border-white/[0.08] flex items-center gap-2">
                <span className="text-zinc-400">Total Allocated:</span>
                <strong className="text-zinc-950 dark:text-white">
                  {workload.summary?.totalOpenHours ?? (workload as any).totalAllocatedHours ?? 0} hrs
                </strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#11131c] border border-zinc-200/80 dark:border-white/[0.08] flex items-center gap-2">
                <span className="text-zinc-400">Total Capacity:</span>
                <strong className="text-zinc-950 dark:text-white">
                  {workload.summary?.totalWeeklyCapacity ?? (workload as any).totalCapacityHours ?? 0} hrs
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-[#0f1118] border-zinc-200/80 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Total Tracked Members</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-2">
            {workload?.members?.length || 0}
          </div>
          <span className="text-3xs text-zinc-400">Across {departments.length} departments & {allTeams.length} squads</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border-zinc-200/80 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Average Utilization</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-2">
            {Math.round(workload?.summary?.averageUtilization ?? (workload as any)?.overallUtilization ?? 0)}%
          </div>
          <span className="text-3xs text-zinc-400">Allocated vs available hours</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border-zinc-200/80 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Overloaded Members</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {workload?.members?.filter((m: any) => m.workloadStatus === "OVERLOADED" || m.workloadStatus === "HIGH").length || 0}
          </div>
          <span className="text-3xs text-zinc-400">Exceeding safe capacity threshold</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border-zinc-200/80 dark:border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Balanced / Healthy</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {workload?.members?.filter((m: any) => m.workloadStatus === "BALANCED").length || 0}
          </div>
          <span className="text-3xs text-zinc-400">Optimal sprint workload distribution</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0f1118] p-3 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search member, email, team, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.04] px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.08]">
              <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {allTeams.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.04] px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.08]">
              <Users className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Squads & Teams</option>
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.deptName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Workload Views */}
      {viewMode === "team_summary" ? (
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-3xl" />
            ))
          ) : teamWorkloadRollup.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-[#0f1118] rounded-3xl border border-zinc-200/80 dark:border-white/[0.08]">
              No squads found matching your criteria.
            </div>
          ) : (
            teamWorkloadRollup.map((squad: any) => {
              const isExpanded = expandedSquadIds.includes(squad.id);

              return (
                <div
                  key={squad.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] hover:border-violet-500/30 transition-all space-y-4 shadow-xs"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                          {squad.name}
                        </h3>
                        <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          {squad.deptName}
                        </span>
                        <span
                          className={`text-3xs font-bold px-2 py-0.5 rounded-md border ${getStatusColor(
                            squad.status
                          )}`}
                        >
                          {squad.status}
                        </span>
                      </div>
                      {squad.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {squad.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-3xs text-zinc-400 pt-1">
                        <span>Leader: {squad.leader ? squad.leader.name : "Unassigned"}</span>
                        {squad.coLeader && <span>• Co-Leader: {squad.coLeader.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs shrink-0">
                      <div>
                        <div className="text-3xs text-zinc-400 uppercase font-mono">Members</div>
                        <div className="font-bold text-zinc-950 dark:text-white text-sm">
                          {squad.memberCount}
                        </div>
                      </div>

                      <div>
                        <div className="text-3xs text-zinc-400 uppercase font-mono">Allocated / Capacity</div>
                        <div className="font-bold text-zinc-950 dark:text-white text-sm">
                          {squad.totalAllocated} / {squad.totalCapacity} hrs
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xs text-zinc-400 uppercase font-mono">Utilization</div>
                        <div className="font-black text-violet-600 dark:text-violet-400 text-sm">
                          {squad.utilization}%
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpandSquad(squad.id)}
                        className="text-xs cursor-pointer"
                      >
                        {isExpanded ? "Hide Members" : `View Roster (${squad.memberCount})`}
                      </Button>
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-3xs text-zinc-400">
                      <span>Squad Capacity Allocation</span>
                      <span className="font-bold">{squad.utilization}%</span>
                    </div>
                    <Progress value={Math.min(squad.utilization, 100)} className="h-2" />
                  </div>

                  {/* Expanded squad members list */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] space-y-2">
                      <div className="text-3xs font-bold text-zinc-400 uppercase font-mono px-1">
                        Squad Members Workload Breakdown
                      </div>
                      {squad.members.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-white/[0.02] rounded-xl">
                          No members assigned to this squad yet.
                        </div>
                      ) : (
                        squad.members.map((m: any) => {
                          const mUtil = Math.round(m.utilizationPercentage || 0);
                          return (
                            <div
                              key={m.id}
                              className="p-3 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar name={m.user?.name} size="sm" />
                                <div className="min-w-0">
                                  <div className="font-bold text-zinc-900 dark:text-white truncate">
                                    {m.user?.name}
                                  </div>
                                  <div className="text-3xs text-zinc-400 truncate">
                                    {m.user?.email}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-xs shrink-0">
                                <span
                                  className={`text-3xs font-bold px-2 py-0.5 rounded-md border ${getStatusColor(
                                    m.workloadStatus
                                  )}`}
                                >
                                  {m.workloadStatus}
                                </span>
                                <div className="font-mono text-zinc-800 dark:text-zinc-200 text-xs">
                                  {m.assignedHours || 0} / {m.weeklyCapacityHours || 40} hrs ({mUtil}%)
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedMember(m)}
                                  className="text-3xs px-2.5 py-1"
                                >
                                  Tasks ({m.activeTasksCount || 0})
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Members Workload List */
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))
          ) : displayedMembers.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400 bg-white dark:bg-[#0f1118] rounded-2xl border border-zinc-200/80 dark:border-white/[0.08]">
              No member workload records match your search criteria.
            </div>
          ) : (
            displayedMembers.map((m: any) => {
              const utilization = Math.round(m.utilizationPercentage || 0);

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] hover:border-violet-500/30 transition-all space-y-3 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.user?.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-zinc-950 dark:text-white">
                            {m.user?.name}
                          </span>
                          {/* Status Badge */}
                          <span
                            className={`text-3xs font-bold px-2 py-0.5 rounded-md border ${getStatusColor(
                              m.workloadStatus
                            )}`}
                          >
                            {m.workloadStatus}
                          </span>
                          {m.team?.name && (
                            <span className="text-3xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium">
                              Squad: {m.team.name}
                            </span>
                          )}
                          {m.department?.name && (
                            <span className="text-3xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 font-medium">
                              {m.department.name}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">{m.user?.email}</span>
                      </div>
                    </div>

                    {/* Hours stats & inspect button */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="font-bold text-zinc-950 dark:text-white">
                          {m.assignedHours || 0} / {m.weeklyCapacityHours || 40} hrs
                        </div>
                        <span className="text-3xs text-zinc-400">{m.activeTasksCount || 0} active tasks</span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMember(m)}
                        className="text-xs"
                      >
                        View Tasks
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-3xs text-zinc-400">
                      <span>Capacity Allocated</span>
                      <span className="font-bold">{utilization}%</span>
                    </div>
                    <Progress value={Math.min(utilization, 100)} className="h-2" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Member Tasks Inspect Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`${selectedMember.user?.name}'s Active Workload`}
          description={`Assigned tasks, deadlines, and hour estimates (${selectedMember.activeTasksCount || 0} tasks)`}
          maxWidth="2xl"
        >
          <div className="space-y-4 pt-2">
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {!selectedMember.tasks || selectedMember.tasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-400">
                  No active tasks currently assigned to this member.
                </div>
              ) : (
                selectedMember.tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-white truncate">
                        {task.title}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-3xs text-zinc-400">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                        {task.estimatedHours && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-violet-500" />
                            {task.estimatedHours} hrs
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSystemAdminOrAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReassignTask(task);
                        }}
                        className="text-xs shrink-0"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1 text-violet-500" />
                        Reassign
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reassign Task Modal */}
      {reassignTask && (
        <Modal
          isOpen={!!reassignTask}
          onClose={() => setReassignTask(null)}
          title="Reassign Task"
          description={`Transfer "${reassignTask.title}" to another available member`}
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Select New Assignee
              </label>
              <select
                value={targetAssigneeId}
                onChange={(e) => setTargetAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
              >
                <option value="">Choose a team member...</option>
                {workload?.members
                  ?.filter((m: any) => m.user.id !== reassignTask.assigneeId)
                  ?.map((m: any) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name} ({m.workloadStatus} - {m.assignedHours || 0}/{m.weeklyCapacityHours || 40} hrs)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setReassignTask(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!targetAssigneeId || reassignMutation.isPending}
                onClick={() =>
                  reassignMutation.mutate({
                    taskId: reassignTask.id,
                    assigneeId: targetAssigneeId,
                  })
                }
              >
                {reassignMutation.isPending ? "Reassigning..." : "Confirm Reassign"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
