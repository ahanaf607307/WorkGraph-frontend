"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workloadActions } from "../../modules/workload/actions/workload.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { taskActions } from "../../modules/tasks/actions/task.actions";
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
} from "lucide-react";
import { formatDate } from "../../lib/utils";

export const TeamWorkloadView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
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
        return "bg-amber-500";
      case "BALANCED":
        return "bg-emerald-500";
      default:
        return "bg-sky-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Team Workload & Capacity Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Deterministic workload governance calculated from weekly capacities and assigned task estimates.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setInviteModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1.5" /> Add Member
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Total Team Members
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {workload?.summary.totalMembers ?? 0}
          </div>
          <span className="text-2xs text-slate-400 font-mono">
            {workload?.summary.totalWeeklyCapacity ?? 0}h total weekly capacity
          </span>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Assigned Open Workload
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {workload?.summary.totalOpenHours ?? 0}h
          </div>
          <span className="text-2xs text-slate-400 font-mono">Estimated active task effort</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Average Utilization
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {workload?.summary.averageUtilization ?? 0}%
          </div>
          <span className="text-2xs text-slate-400 font-mono">Team-wide capacity balance</span>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Overloaded Members
          </div>
          <div className="text-2xl font-bold text-rose-600">
            {workload?.summary.overloadedCount ?? 0}
          </div>
          <span className="text-2xs text-slate-400 font-mono">Require workload rebalancing</span>
        </Card>
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
          {(workload?.members || []).map((m) => (
            <Card
              key={m.memberId}
              className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400/60 dark:hover:border-amber-400/40 transition-all shadow-2xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Member Info */}
                <div className="flex items-center space-x-3.5">
                  <Avatar name={m.user.name} size="lg" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {m.user.name}
                      </span>
                      <span className="text-2xs font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {m.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{m.user.email}</div>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <div className="text-slate-400">Capacity</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {m.weeklyCapacityHours} hrs/wk
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-400">Assigned Open</div>
                    <div className="font-semibold text-amber-500">{m.assignedOpenHours} hrs</div>
                  </div>

                  <div>
                    <div className="text-slate-400">Active Tasks</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
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
                      <span className="text-slate-500">Utilization</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
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
          ))}
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
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>Task Deliverable</span>
              <span className="mr-2">Redistribute / Reassign</span>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5">
              {(selectedMember.tasks || []).length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No tasks currently assigned to this member.
                </div>
              ) : (
                selectedMember.tasks?.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-1 flex-1 truncate">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {t.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-2xs text-slate-400">
                        <span className="font-mono text-amber-500 font-semibold">{t.project.name}</span>
                        <span>•</span>
                        <span>{t.estimatedHours}h effort</span>
                        <span>•</span>
                        <span>Due {formatDate(t.dueDate)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReassignTask(t)}
                      className="shrink-0 text-xs"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 mr-1" /> Reassign
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
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

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
            id="inviteEmail"
            type="email"
            label="User Email Address"
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
              <option value="ADMIN">Admin</option>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                  role: inviteRole,
                  weeklyCapacityHours: inviteCapacity,
                })
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
