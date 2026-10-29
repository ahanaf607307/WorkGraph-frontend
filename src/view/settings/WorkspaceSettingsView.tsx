"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Modal } from "../../components/ui/modal";
import { toast } from "sonner";
import { UserPlus, Trash2, Building, ShieldCheck, Copy, Check, Key } from "lucide-react";
import {
  PermissionButton,
  PermissionModal,
  useFeaturePermission,
} from "../../components/shared/PermissionModal";

export const WorkspaceSettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCapacity, setInviteCapacity] = useState(40);
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const { hasPermission: canInvite } = useFeaturePermission("settings");

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => userActions.getOrganizationMembers(orgId!),
    enabled: !!orgId,
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      userActions.updateMember(orgId!, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      toast.success("Member updated successfully");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => userActions.removeMember(orgId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      toast.success("Member removed from workspace");
    },
    onError: (err: any) => {
      toast.error("Cannot remove member", { description: err.message });
    },
  });

  const inviteMemberMutation = useMutation({
    mutationFn: (data: { email: string; role?: string; weeklyCapacityHours?: number }) =>
      userActions.inviteMember(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
      queryClient.invalidateQueries({ queryKey: ["workload", orgId] });
      setInviteModalOpen(false);
      setInviteEmail("");
      toast.success("Member added to workspace");
    },
    onError: (err: any) => {
      toast.error("Failed to add member", {
        description: err.message || "User not found or already in workspace",
      });
    },
  });

  const isOwnerOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "WORKSPACE_ADMIN" ||
    user?.role === "SYSTEM_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Workspace Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage organization members, role permissions, and individual weekly working capacities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <PermissionButton onClick={() => setShowPermissionModal(true)} />
          {canInvite && (
            <Button variant="primary" size="md" onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Workspace Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Info</CardTitle>
          <CardDescription>Workspace metadata, join code, and current user role</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-zinc-400 block mb-1">Organization Name</span>
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              {currentOrg?.name}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Workspace Slug</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {currentOrg?.slug}
            </span>
          </div>

          <div>
            <span className="text-zinc-400 block mb-1">Your Access Level</span>
            <Badge variant="default">{currentOrg?.myRole || "MEMBER"}</Badge>
          </div>

          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-3xs font-bold uppercase text-violet-700 dark:text-violet-300 flex items-center gap-1">
                <Key className="w-3 h-3" />
                Workspace Join Code
              </span>
              <button
                type="button"
                onClick={() => {
                  const code = currentOrg?.workspaceCode || "ACM-1001";
                  navigator.clipboard.writeText(code);
                  setCopiedCode(true);
                  toast.success(`Copied join code "${code}" to clipboard!`);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-2 py-0.5 rounded-md bg-violet-600 hover:bg-violet-700 text-white font-semibold text-3xs transition-all flex items-center gap-1 cursor-pointer"
                title="Copy Workspace Join Code"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-2.5 h-2.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
            <div className="font-mono font-black text-sm text-violet-900 dark:text-violet-200 tracking-wider">
              {currentOrg?.workspaceCode || "ACM-1001"}
            </div>
            <span className="text-3xs text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">
              Normal users enter this unique code during signup to join this workspace.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Members & Capacity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Members ({members?.length ?? 0})</CardTitle>
          <CardDescription>
            Configure weekly working hours for deterministic workload calculations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/70 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-white/[0.04] text-zinc-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Weekly Capacity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                  {members?.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Avatar name={m.user.name} size="sm" />
                          <div>
                            <div className="font-semibold text-zinc-950 dark:text-white">
                              {m.user.name}
                            </div>
                            <div className="text-zinc-400">{m.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {(currentOrg?.myRole === "OWNER" ||
                          (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
                          (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
                          user?.role === "SYSTEM_OWNER" ||
                          user?.role === "WORKSPACE_ADMIN" ||
                          user?.role === "SYSTEM_ADMIN") &&
                        m.userId !== user?.id &&
                        m.role !== "OWNER" &&
                        (m.role as string) !== "WORKSPACE_ADMIN" &&
                        (m.role as string) !== "SYSTEM_ADMIN" ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateMemberMutation.mutate({
                                 userId: m.userId,
                                 data: { role: e.target.value },
                              })
                            }
                            className="px-2 py-1 text-xs rounded-lg border border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#141722] text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer focus:border-violet-500/40"
                          >
                            <option value="MEMBER" className="cursor-pointer">Member</option>
                            <option value="CO_LEADER" className="cursor-pointer">Co-Leader</option>
                            <option value="TEAM_LEADER" className="cursor-pointer">Team Leader</option>
                            <option value="ADMIN" className="cursor-pointer">Admin</option>
                          </select>
                        ) : m.role === "OWNER" || m.role === "SYSTEM_ADMIN" || (m.role as string) === "WORKSPACE_ADMIN" ? (
                          <Badge variant="default" className="border-violet-200/60 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold">
                            🏢 Workspace Admin
                          </Badge>
                        ) : (
                          <Badge variant="default">{m.role}</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isOwnerOrAdmin ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              defaultValue={m.weeklyCapacityHours}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val !== m.weeklyCapacityHours) {
                                  updateMemberMutation.mutate({
                                    userId: m.userId,
                                    data: { weeklyCapacityHours: val },
                                  });
                                }
                              }}
                              className="w-16 px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono outline-none"
                            />
                            <span className="text-zinc-400">hours/week</span>
                          </div>
                        ) : (
                          <span className="font-mono">{m.weeklyCapacityHours} hours/week</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOwnerOrAdmin && m.userId !== user?.id && m.role !== "OWNER" && (
                          <button
                            onClick={() => {
                              toast(`Remove ${m.user.name}?`, {
                                description: "Are you sure you want to remove this member from the organization?",
                                action: {
                                  label: "Remove",
                                  onClick: () => removeMemberMutation.mutate(m.userId),
                                },
                                cancel: { label: "Cancel", onClick: () => {} },
                              });
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Member to Workspace"
        description="Add a colleague by email and define their initial weekly hours."
        maxWidth="md"
      >
        <div className="space-y-4 mt-2">
          <Input
            id="inviteEmail"
            type="email"
            label="User Email"
            placeholder="e.g. elena@test.com"
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
            </Select>
          </div>

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
                  role: inviteRole,
                  weeklyCapacityHours: inviteCapacity,
                })
              }
            >
              Invite Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Permissions Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        featureKey="settings"
        title="Workspace Invitation Permissions"
        description="Authorize selected admins to invite new employees into this workspace."
      />
    </div>
  );
};
