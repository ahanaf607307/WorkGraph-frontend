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
import { UserPlus, Trash2, Building, ShieldCheck } from "lucide-react";

export const WorkspaceSettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCapacity, setInviteCapacity] = useState(40);
  const [inviteRole, setInviteRole] = useState("MEMBER");

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

  const isOwnerOrAdmin = currentOrg?.myRole === "OWNER" || currentOrg?.myRole === "ADMIN";

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

        {isOwnerOrAdmin && (
          <Button variant="primary" size="md" onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Invite Member
          </Button>
        )}
      </div>

      {/* Workspace Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Info</CardTitle>
          <CardDescription>Workspace metadata and current user role</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Weekly Capacity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
                        {isOwnerOrAdmin && m.userId !== user?.id ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              updateMemberMutation.mutate({
                                userId: m.userId,
                                data: { role: e.target.value },
                              })
                            }
                            className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none cursor-pointer"
                          >
                            <option value="MEMBER" className="cursor-pointer">MEMBER</option>
                            <option value="ADMIN" className="cursor-pointer">ADMIN</option>
                            <option value="OWNER" className="cursor-pointer">OWNER</option>
                          </select>
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
                        {isOwnerOrAdmin && m.userId !== user?.id && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${m.user.name} from organization?`)) {
                                removeMemberMutation.mutate(m.userId);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
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
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Owner</option>
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
    </div>
  );
};
