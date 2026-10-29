"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentActions, DepartmentItem, TeamItem } from "../../modules/departments/actions/department.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Skeleton } from "../../components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import {
  Users,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  Crown,
  UserCheck,
  Trash2,
  Edit3,
  UserPlus,
  X,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  PermissionButton,
  PermissionModal,
  useFeaturePermission,
} from "../../components/shared/PermissionModal";

export const getSquadFullRoster = (team: any) => {
  if (!team) return [];
  const memberMap = new Map<string, any>();

  // Add leader
  if (team.leader) {
    memberMap.set(team.leader.id, {
      id: `leader-${team.leader.id}`,
      userId: team.leader.id,
      user: team.leader,
      roleInSquad: "LEADER",
      designationName: "Squad Leader",
    });
  }

  // Add co-leader
  if (team.coLeader) {
    if (!memberMap.has(team.coLeader.id)) {
      memberMap.set(team.coLeader.id, {
        id: `coleader-${team.coLeader.id}`,
        userId: team.coLeader.id,
        user: team.coLeader,
        roleInSquad: "CO_LEADER",
        designationName: "Co-Leader",
      });
    }
  }

  // Add regular squad members
  (team.members || []).forEach((m: any) => {
    const uid = m.user?.id || m.userId;
    if (uid && memberMap.has(uid)) {
      const existing = memberMap.get(uid);
      if (m.designationRel?.name) {
        existing.designationName = `${existing.designationName} • ${m.designationRel.name}`;
      }
    } else if (uid) {
      memberMap.set(uid, {
        id: m.id || uid,
        userId: uid,
        user: m.user || { id: uid, name: m.name, email: m.email },
        roleInSquad: "MEMBER",
        designationName: m.designationRel?.name || "Member",
      });
    }
  });

  return Array.from(memberMap.values());
};

export const TeamView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "workspace_admin" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    (currentOrg?.myRole as string) === "system_admin" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN" ||
    (user?.role as string) === "system_owner" ||
    (user?.role as string) === "system_admin";

  const { hasPermission: hasTeamPermission } = useFeaturePermission("team");
  const canCreateTeam = isSystemAdmin || hasTeamPermission;

  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Create Team Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deptId, setDeptId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [leaderId, setLeaderId] = useState("");
  const [coLeaderId, setCoLeaderId] = useState("");

  // Inspect Squad Roster & Management Modal
  const [inspectTeam, setInspectTeam] = useState<TeamItem | null>(null);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [selectedOmUserId, setSelectedOmUserId] = useState("");
  const [activeInspectTab, setActiveInspectTab] = useState<"members" | "settings">("members");
  const [editTeamName, setEditTeamName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLeaderId, setEditLeaderId] = useState("");
  const [editCoLeaderId, setEditCoLeaderId] = useState("");

  const handleOpenInspectTeam = (team: TeamItem) => {
    setInspectTeam(team);
    setEditTeamName(team.name);
    setEditDescription(team.description || "");
    setEditLeaderId(team.leaderId || "");
    setEditCoLeaderId(team.coLeaderId || "");
    setSelectedOmUserId("");
    setActiveInspectTab("members");
  };

  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId");

  // Manage Permissions Modal
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Fetch departments and teams
  const {
    data: departments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId,
  });

  // Fetch organization members for dropdowns
  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", orgId],
    queryFn: () => userActions.getOrganizationMembers(orgId!),
    enabled: !!orgId,
  });

  // Flatten all teams with their parent department
  const allTeamsWithDept = useMemo(() => {
    const list: Array<TeamItem & { departmentName: string }> = [];
    for (const d of departments) {
      if (d.teams && Array.isArray(d.teams)) {
        for (const t of d.teams) {
          list.push({ ...t, departmentName: d.name });
        }
      }
    }
    return list;
  }, [departments]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return allTeamsWithDept.filter((t) => {
      const matchDept = selectedDeptFilter === "ALL" || t.departmentId === selectedDeptFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        t.name.toLowerCase().includes(q) ||
        t.departmentName.toLowerCase().includes(q) ||
        t.serviceType?.toLowerCase().includes(q) ||
        t.leader?.name?.toLowerCase().includes(q) ||
        t.coLeader?.name?.toLowerCase().includes(q);

      return matchDept && matchSearch;
    });
  }, [allTeamsWithDept, selectedDeptFilter, searchTerm]);

  // Auto-open squad when teamId is in URL
  useEffect(() => {
    if (teamIdParam && allTeamsWithDept.length > 0) {
      const match = allTeamsWithDept.find((t) => t.id === teamIdParam);
      if (match) {
        handleOpenInspectTeam(match);
      }
    }
  }, [teamIdParam, allTeamsWithDept]);

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: (data: {
      deptId: string;
      name: string;
      description?: string;
      leaderId?: string;
      coLeaderId?: string;
    }) =>
      departmentActions.createTeam(data.deptId, {
        name: data.name,
        description: data.description,
        leaderId: data.leaderId || undefined,
        coLeaderId: data.coLeaderId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success(`Team "${teamName}" created successfully!`);
      setShowCreateModal(false);
      setDeptId("");
      setTeamName("");
      setDescription("");
      setServiceType("");
      setLeaderId("");
      setCoLeaderId("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create team");
    },
  });

  // Delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => departmentActions.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Team removed successfully");
      if (inspectTeam) setInspectTeam(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete team"),
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: ({
      teamId,
      data,
    }: {
      teamId: string;
      data: Partial<{
        name: string;
        description: string;
        leaderId: string | null;
        coLeaderId: string | null;
      }>;
    }) => departmentActions.updateTeam(teamId, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Team settings updated successfully!");
      setInspectTeam((prev) => (prev ? { ...prev, ...updated } : null));
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update team"),
  });

  // Add member to team
  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      departmentActions.addMemberToTeam(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Member added to squad!");
      setNewMemberUserId("");
      // Refresh current inspect squad
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to add member"),
  });

  // Remove member from team
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      departmentActions.removeMemberFromTeam(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Member removed from squad");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove member"),
  });

  // Assign Operation Manager to team
  const assignOmMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      departmentActions.assignOperationManager(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Operation Manager assigned!");
      setSelectedOmUserId("");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign OM"),
  });

  // Remove Operation Manager from team
  const removeOmMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      departmentActions.removeOperationManager(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", orgId] });
      toast.success("Operation Manager unlinked");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove OM"),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId) {
      toast.error("Please select a Department for the squad");
      return;
    }
    if (!teamName.trim()) {
      toast.error("Please provide a Squad name");
      return;
    }
    createTeamMutation.mutate({
      deptId,
      name: teamName.trim(),
      description: description.trim() || undefined,
      leaderId: leaderId || undefined,
      coLeaderId: coLeaderId || undefined,
    });
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-500" />
            <span>Squads & Teams Directory</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage organization squads, cross-department teams, leadership hierarchy, and operational members
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Permission Button (Workspace Admin Only) */}
          <PermissionButton onClick={() => setShowPermissionModal(true)} />

          {/* Create Team Button */}
          {canCreateTeam && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-md shadow-violet-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team / Squad</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-zinc-400">Total Squads</span>
            <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
              {allTeamsWithDept.length}
            </div>
            <span className="text-3xs text-zinc-500">Across {departments.length} departments</span>
          </div>
          <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-500">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-zinc-400">Active Squad Leaders</span>
            <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
              {allTeamsWithDept.filter((t) => t.leaderId).length}
            </div>
            <span className="text-3xs text-zinc-500">Squads with designated lead</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-zinc-400">Total Squad Members</span>
            <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
              {allTeamsWithDept.reduce((acc, t) => acc + (t.members?.length || 0), 0)}
            </div>
            <span className="text-3xs text-zinc-500">Personnel assigned to squads</span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0f1118] p-3 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08]">
        {/* Department Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1">
          <button
            type="button"
            onClick={() => setSelectedDeptFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedDeptFilter === "ALL"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            All Departments
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDeptFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedDeptFilter === d.id
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search squad, leader, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Squad Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="p-14 text-center space-y-4 rounded-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">No Squads Found</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {canCreateTeam
                ? "Create a squad under a department using the button above."
                : "No squads match the current department or search filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const squadRoster = getSquadFullRoster(team);
            const memberCount = squadRoster.length;

            return (
              <div
                key={team.id}
                onClick={() => handleOpenInspectTeam(team)}
                className="p-5 rounded-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] hover:border-violet-500/50 hover:shadow-lg dark:hover:shadow-violet-950/20 transition-all flex flex-col justify-between space-y-4 shadow-xs cursor-pointer group"
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-zinc-950 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {team.name}
                      </h3>
                      <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 inline-block mt-1">
                        {team.departmentName}
                      </span>
                    </div>

                    {isSystemAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast(`Delete squad "${team.name}"?`, {
                            description: "Are you sure you want to permanently delete this squad?",
                            action: {
                              label: "Delete",
                              onClick: () => deleteTeamMutation.mutate(team.id),
                            },
                            cancel: { label: "Cancel", onClick: () => {} },
                          });
                        }}
                        title="Delete squad"
                        className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {team.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {team.description}
                    </p>
                  )}
                </div>

                {/* Leadership info */}
                <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-white/[0.04] text-xs">
                  {/* Leader */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-3xs font-medium text-zinc-400 uppercase tracking-wider">
                      Leader:
                    </span>
                    {team.leader ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={team.leader.name} size="sm" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                          {team.leader.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-3xs italic">Unassigned</span>
                    )}
                  </div>

                  {/* Co-Leader */}
                  {team.coLeader && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xs font-medium text-zinc-400 uppercase tracking-wider">
                        Co-Leader:
                      </span>
                      <div className="flex items-center gap-2">
                        <Avatar name={team.coLeader.name} size="sm" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                          {team.coLeader.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Operation Managers */}
                  {team.operationManagers && team.operationManagers.length > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> OM:
                      </span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-[170px]">
                        {team.operationManagers.map((om: any) => om.user?.name || om.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer: Member avatars stack & action */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {squadRoster.slice(0, 4).map((m: any) => (
                        <Avatar key={m.userId} name={m.user?.name} size="sm" />
                      ))}
                    </div>
                    <span className="text-3xs font-semibold text-zinc-500">
                      {memberCount} member{memberCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInspectTeam(team);
                    }}
                    className="text-xs group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all cursor-pointer"
                  >
                    Manage Squad
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team / Squad Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Squad / Team"
          description="Initialize a dedicated team under an existing department"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2 text-xs">
            {/* Department */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Department *
              </label>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Squad / Team Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Mobile Engineering Squad Alpha"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Leader Select */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Team Leader (Optional)
              </label>
              <select
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
              >
                <option value="">Select Leader...</option>
                {members.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Co-Leader Select */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Co-Leader (Optional)
              </label>
              <select
                value={coLeaderId}
                onChange={(e) => setCoLeaderId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
              >
                <option value="">Select Co-Leader...</option>
                {members.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                placeholder="Core responsibilities, technologies, or objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={createTeamMutation.isPending || !deptId || !teamName.trim()}
              >
                {createTeamMutation.isPending ? "Creating..." : "Create Squad"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect Squad Roster & Management Modal */}
      {inspectTeam && (() => {
        const currentInspectedTeam =
          allTeamsWithDept.find((t) => t.id === inspectTeam.id) || inspectTeam;
        const fullRoster = getSquadFullRoster(currentInspectedTeam);
        const currentMembers = currentInspectedTeam.members || [];

        return (
          <Modal
            isOpen={!!inspectTeam}
            onClose={() => setInspectTeam(null)}
            title={`${currentInspectedTeam.name} — Squad Hub`}
            description={`Manage squad details, leadership, and assigned members (${fullRoster.length} members)`}
            maxWidth="lg"
          >
            <div className="space-y-4 pt-2 text-xs">
              {/* Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-white/[0.06] pb-2">
                <button
                  type="button"
                  onClick={() => setActiveInspectTab("members")}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                    activeInspectTab === "members"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                  )}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Members ({fullRoster.length})</span>
                </button>

                {isSystemAdmin && (
                  <button
                    type="button"
                    onClick={() => setActiveInspectTab("settings")}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                      activeInspectTab === "settings"
                        ? "bg-violet-600 text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                    )}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Squad Settings & Update</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Member Roster & Member Management */}
              {activeInspectTab === "members" && (
                <div className="space-y-3">
                  {/* Add Member Row (Admins) */}
                  {isSystemAdmin && (
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08]">
                      <select
                        value={newMemberUserId}
                        onChange={(e) => setNewMemberUserId(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none text-zinc-900 dark:text-white cursor-pointer"
                      >
                        <option value="">Select workspace member to add...</option>
                        {members
                          ?.filter((m: any) => !fullRoster.some((r: any) => r.userId === m.user.id))
                          ?.map((m: any) => (
                            <option key={m.user.id} value={m.user.id}>
                              {m.user.name} ({m.user.email})
                            </option>
                          ))}
                      </select>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!newMemberUserId || addMemberMutation.isPending}
                        onClick={() =>
                          addMemberMutation.mutate({
                            teamId: currentInspectedTeam.id,
                            userId: newMemberUserId,
                          })
                        }
                        className="text-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
                      </Button>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {fullRoster.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-white/[0.02] rounded-2xl">
                        No members currently assigned to this squad.
                      </div>
                    ) : (
                      fullRoster.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={m.user?.name} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-900 dark:text-white truncate">
                                  {m.user?.name}
                                </span>
                                {m.roleInSquad === "LEADER" && (
                                  <span className="text-3xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                                    Leader
                                  </span>
                                )}
                                {m.roleInSquad === "CO_LEADER" && (
                                  <span className="text-3xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/20">
                                    Co-Leader
                                  </span>
                                )}
                                {m.designationName && m.roleInSquad === "MEMBER" && (
                                  <span className="text-3xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                                    {m.designationName}
                                  </span>
                                )}
                              </div>
                              <span className="text-3xs text-zinc-400 block truncate">
                                {m.user?.email}
                              </span>
                            </div>
                          </div>

                          {m.roleInSquad === "MEMBER" && isSystemAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                removeMemberMutation.mutate({
                                  teamId: currentInspectedTeam.id,
                                  userId: m.userId,
                                })
                              }
                              title="Remove member from squad"
                              className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          {m.roleInSquad !== "MEMBER" && (
                            <span className="text-3xs text-zinc-400 font-mono">
                              Leadership
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Squad Settings & Update */}
              {activeInspectTab === "settings" && isSystemAdmin && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Squad Name *
                    </label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Team Leader
                      </label>
                      <select
                        value={editLeaderId}
                        onChange={(e) => setEditLeaderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white cursor-pointer"
                      >
                        <option value="">No leader assigned</option>
                        {members.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Co-Leader
                      </label>
                      <select
                        value={editCoLeaderId}
                        onChange={(e) => setEditCoLeaderId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white cursor-pointer"
                      >
                        <option value="">No co-leader assigned</option>
                        {members.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Operation Manager (OM) Section */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.06] space-y-2">
                    <label className="block font-semibold text-zinc-700 dark:text-zinc-300">
                      Operation Manager (OM)
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedOmUserId}
                        onChange={(e) => setSelectedOmUserId(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white cursor-pointer"
                      >
                        <option value="">Select workspace member to assign as OM...</option>
                        {members.map((m: any) => (
                          <option key={m.user.id} value={m.user.id}>
                            {m.user.name} ({m.user.email})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={!selectedOmUserId || assignOmMutation.isPending}
                        onClick={() =>
                          assignOmMutation.mutate({
                            teamId: currentInspectedTeam.id,
                            userId: selectedOmUserId,
                          })
                        }
                        className="text-xs shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Add OM
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentInspectedTeam.operationManagers && currentInspectedTeam.operationManagers.length > 0 ? (
                        currentInspectedTeam.operationManagers.map((om: any) => (
                          <span
                            key={om.id || om.userId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                            <span>{om.user?.name || om.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                removeOmMutation.mutate({
                                  teamId: currentInspectedTeam.id,
                                  userId: om.userId,
                                })
                              }
                              className="text-emerald-500 hover:text-rose-500 ml-1 text-sm leading-none cursor-pointer"
                              title="Unlink Operation Manager"
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-3xs text-zinc-400 italic">No Operation Manager currently assigned</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Update & Delete */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast(`Delete squad "${currentInspectedTeam.name}"?`, {
                          description: "Are you sure you want to permanently delete this squad?",
                          action: {
                            label: "Delete",
                            onClick: () => deleteTeamMutation.mutate(currentInspectedTeam.id),
                          },
                          cancel: { label: "Cancel", onClick: () => {} },
                        });
                      }}
                      className="text-rose-600 hover:text-white hover:bg-rose-600 border-rose-200 dark:border-rose-900/40 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Squad
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={updateTeamMutation.isPending || !editTeamName.trim()}
                      onClick={() =>
                        updateTeamMutation.mutate({
                          teamId: currentInspectedTeam.id,
                          data: {
                            name: editTeamName.trim(),
                            description: editDescription.trim(),
                            leaderId: editLeaderId || null,
                            coLeaderId: editCoLeaderId || null,
                          },
                        })
                      }
                      className="text-xs"
                    >
                      {updateTeamMutation.isPending ? "Updating..." : "Update Squad Details"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setInspectTeam(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Access Permissions / Delegation Modal */}
      {/* Access Permissions Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        featureKey="team"
        title="Team & Squad Management Permissions"
        description="Authorize specific administrators or leaders to create squads, assign leaders, and configure teams."
      />
    </div>
  );
};
