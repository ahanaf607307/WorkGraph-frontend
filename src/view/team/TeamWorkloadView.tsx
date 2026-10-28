"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workloadActions } from "../../modules/workload/actions/workload.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
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
  UserPlus,
  ArrowRightLeft,
  Calendar,
  Filter,
} from "lucide-react";
import { formatDate } from "../../lib/utils";

export const TeamWorkloadView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const isPrivilegedLeader =
    isSystemAdminOrAdmin ||
    currentOrg?.designation === "TEAM_LEADER" ||
    currentOrg?.designation === "CO_LEADER" ||
    currentOrg?.designation === "OPERATION_MANAGER" ||
    currentOrg?.designation === "GENERAL_MANAGER" ||
    currentOrg?.designation === "PROJECT_MANAGER";

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCapacity, setInviteCapacity] = useState(40);
  const [inviteRole, setInviteRole] = useState("MEMBER");

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
    enabled: !!orgId && isSystemAdminOrAdmin,
  });

  // Filter members: regular members only see their squad team members; admins see all with department & search filters
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
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (m: any) =>
          m.user?.name?.toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q) ||
          m.department?.name?.toLowerCase().includes(q) ||
          m.team?.name?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [workload?.members, isSystemAdminOrAdmin, selectedDeptFilter, searchTerm, currentOrg, user?.id]);

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role?: string; weeklyCapacityHours?: number }) =>
      userActions.inviteMember(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      setInviteModalOpen(false);
      setInviteEmail("");
      toast.success("Team member invited successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to add member", {
        description: err.message || "User not found or already in workspace",
      });
    },
  });

  const reassignTaskMutation = useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string }) =>
      taskActions.updateTaskAssignee(taskId, assigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setReassignTask(null);
      toast.success("Task reassigned successfully! Workload updated.");
    },
    onError: (err: any) => {
      toast.error("Reassignment failed", { description: err.message });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OVERLOADED":
        return <Badge variant="danger">Overloaded (&gt;125%)</Badge>;
      case "HIGH":
        return <Badge variant="warning">High Workload (100-125%)</Badge>;
      case "BALANCED":
        return <Badge variant="success">Balanced (50-100%)</Badge>;
      default:
        return <Badge variant="info">Underutilized (&lt;50%)</Badge>;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "OVERLOADED":
        return "bg-rose-500";
      case "HIGH":
        return "bg-violet-400";
      case "BALANCED":
        return "bg-emerald-500";
      default:
        return "bg-sky-500";
    }
  };

  return (
    <div className="space-y-6 select-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <span>{isSystemAdminOrAdmin ? "Team & Workload Utilization" : "My Squad Team Members"}</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time team capacities, active task efforts, and automated workload governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-semibold transition-colors cursor-pointer"
          >
            {showGuide ? "Hide Guide" : "💡 How Team Page Works"}
          </button>

          {isSystemAdminOrAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setInviteModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Explainer Guide */}
      {showGuide && (
        <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-800/40 space-y-2.5 text-xs text-zinc-700 dark:text-zinc-300 transition-all">
          <h3 className="font-bold text-violet-900 dark:text-violet-200 text-sm flex items-center gap-2">
            <span>Team & Workload Management Guide</span>
          </h3>
          <p className="leading-relaxed">
            This page provides automatic capacity tracking for all squad and department members to prevent burnout and ensure fast task delivery:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0f1118] border border-violet-200/60 dark:border-white/[0.06]">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">1. Weekly Capacity (Hours)</span>
              <span className="text-3xs text-zinc-500 leading-normal block">
                Standard hours an employee is scheduled to work each week (default: 40 hrs/wk).
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0f1118] border border-violet-200/60 dark:border-white/[0.06]">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">2. Utilization Calculation</span>
              <span className="text-3xs text-zinc-500 leading-normal block">
                (Assigned Open Task Hours / Weekly Capacity) × 100%. If &gt;125%, member is marked <strong>Overloaded</strong>.
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-[#0f1118] border border-violet-200/60 dark:border-white/[0.06]">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block mb-0.5">3. Inspect & Reassign</span>
              <span className="text-3xs text-zinc-500 leading-normal block">
                Leaders can click "Inspect Tasks" to review any member's deliverables and reassign tasks to members with free capacity.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Total Team Members
          </div>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white">
            {workload?.summary.totalMembers ?? 0}
          </div>
          <span className="text-2xs text-zinc-400 font-mono">
            {workload?.summary.totalWeeklyCapacity ?? 0}h total weekly capacity
          </span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Assigned Open Workload
          </div>
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {workload?.summary.totalOpenHours ?? 0}h
          </div>
          <span className="text-2xs text-zinc-400 font-mono">Estimated active task effort</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Average Utilization
          </div>
          <div className="text-2xl font-bold text-zinc-950 dark:text-white">
            {workload?.summary.averageUtilization ?? 0}%
          </div>
          <span className="text-2xs text-zinc-400 font-mono">Team-wide capacity balance</span>
        </Card>

        <Card className="p-4 bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
            Overloaded Members
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {workload?.summary.overloadedCount ?? 0}
          </div>
          <span className="text-2xs text-zinc-400 font-mono">Require workload rebalancing</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member name, email, squad, or role..."
            className="w-full pl-3.5 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] text-zinc-900 dark:text-white outline-none focus:border-violet-500"
          />
        </div>

        {isSystemAdminOrAdmin && departments && departments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-violet-500" /> Dept:
            </span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="text-xs rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Team Member Workload Cards */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {displayedMembers.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <div className="text-zinc-400 text-sm">
                No members found for this view.
              </div>
            </Card>
          ) : (
            displayedMembers.map((m) => (
              <Card
                key={m.memberId}
                className="p-5 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0f1118] hover:border-violet-500/40 transition-all shadow-2xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Member Info */}
                  <div className="flex items-center space-x-3.5">
                    <Avatar name={m.user.name} size="lg" />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-base font-bold text-zinc-950 dark:text-white">
                          {m.user.name}
                        </span>
                        <span className="text-3xs font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {m.role}
                        </span>
                        {m.department?.name && (
                          <span className="text-3xs font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                            {m.department.name}
                          </span>
                        )}
                        {m.team?.name && (
                          <span className="text-3xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            {m.team.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{m.user.email}</div>
                    </div>
                  </div>

                {/* Metrics Breakdown */}
                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <div className="text-zinc-400">Capacity</div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {m.weeklyCapacityHours} hrs/wk
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-400">Assigned Open</div>
                    <div className="font-semibold text-violet-600 dark:text-violet-400">{m.assignedOpenHours} hrs</div>
                  </div>

                  <div>
                    <div className="text-zinc-400">Active Tasks</div>
                    <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {m.activeTasksCount} tasks
                    </div>
                  </div>

                  {m.overdueTasksCount > 0 && (
                    <div>
                      <div className="text-rose-500">Overdue</div>
                      <div className="font-bold text-rose-600">
                        {m.overdueTasksCount} overdue
                      </div>
                    </div>
                  )}

                  <div>{getStatusBadge(m.workloadStatus)}</div>
                </div>

                {/* Utilization Gauge & Action Button */}
                <div className="flex items-center space-x-4 min-w-[220px]">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-2xs font-semibold">
                      <span className="text-zinc-500">Utilization</span>
                      <span className="font-bold text-zinc-950 dark:text-white">
                        {m.utilizationPercentage}%
                      </span>
                    </div>
                    <Progress
                      value={m.utilizationPercentage}
                      indicatorColor={getProgressColor(m.workloadStatus)}
                      className="h-2"
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMember(m)}
                    className="shrink-0 text-xs"
                  >
                    Inspect Tasks ({m.tasks?.length ?? 0})
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    )}

      {/* Inspect Member Assigned Tasks & Rebalance Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`${selectedMember.user.name}'s Workload Breakdown`}
          description={`Assigned ${selectedMember.assignedOpenHours}h open effort against ${selectedMember.weeklyCapacityHours}h weekly capacity (${selectedMember.utilizationPercentage}% utilized).`}
          maxWidth="2xl"
        >
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span>Task Deliverable</span>
              <span className="mr-2">Redistribute / Reassign</span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5">
              {(selectedMember.tasks || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No tasks currently assigned to this member.
                </div>
              ) : (
                selectedMember.tasks?.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-1 flex-1 truncate">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <span className="font-semibold text-zinc-950 dark:text-white truncate">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-2xs text-zinc-400">
                        <span className="font-mono text-amber-500 font-semibold">{t.project.name}</span>
                        <span>•</span>
                        <span>{t.estimatedHours}h effort</span>
                        <span>•</span>
                        <span>Due {formatDate(t.dueDate)}</span>
                      </div>
                    </div>

                    {isPrivilegedLeader ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReassignTask(t)}
                        className="shrink-0 text-xs"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Reassign
                      </Button>
                    ) : (
                      <span className="text-2xs text-zinc-400 italic font-mono">Assigned</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
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
          title="Reassign Task Deliverable"
          description={`Redistribute "${reassignTask.title}" (${reassignTask.estimatedHours}h) to balance team capacity.`}
          maxWidth="md"
        >
          <div className="space-y-4 mt-2">
            <Select
              id="targetAssignee"
              label="Select New Team Member"
              value={targetAssigneeId}
              onChange={(e) => setTargetAssigneeId(e.target.value)}
            >
              <option value="">Select member...</option>
              {workload?.members
                .filter((m) => m.user.id !== selectedMember?.user.id)
                .map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.utilizationPercentage}% utilized, {m.assignedOpenHours}h open)
                  </option>
                ))}
            </Select>

            <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setReassignTask(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!targetAssigneeId || reassignTaskMutation.isPending}
                onClick={() =>
                  reassignTaskMutation.mutate({
                    taskId: reassignTask.id,
                    assigneeId: targetAssigneeId,
                  })
                }
              >
                Confirm Reassignment
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Add Team Member to Workspace"
        description="Add a registered member by email and configure their weekly working capacity."
        maxWidth="md"
      >
        <div className="space-y-4 mt-2">
          <Input
            id="inviteName"
            type="text"
            label="Full Name (Optional)"
            placeholder="e.g. John Doe"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />

          <Input
            id="inviteEmail"
            type="email"
            label="User Email Address *"
            placeholder="e.g. user2@test.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="capacity"
              type="number"
              label="Weekly Capacity (Hours)"
              value={inviteCapacity}
              onChange={(e) => setInviteCapacity(Number(e.target.value))}
            />

            <Select
              id="role"
              label="Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="MEMBER">Member</option>
              <option value="CO_LEADER">Co-Leader</option>
              <option value="TEAM_LEADER">Team Leader</option>
              <option value="ADMIN">Admin</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </Select>
          </div>

          <p className="text-3xs text-zinc-400">
            If this user does not have an account yet, one will automatically be created with default password <span className="font-mono text-orange-600 dark:text-orange-400">123456</span>.
          </p>

          <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!inviteEmail || inviteMemberMutation.isPending}
              onClick={() =>
                inviteMemberMutation.mutate({
                  email: inviteEmail,
                  name: inviteName,
                  role: inviteRole,
                  weeklyCapacityHours: inviteCapacity,
                } as any)
              }
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
