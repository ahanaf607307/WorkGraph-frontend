"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/modal";
import { Avatar } from "../../../components/ui/avatar";
import { Skeleton } from "../../../components/ui/skeleton";
import { meetingActions, MeetingPermissionUser } from "../../../modules/meeting/actions/meeting.actions";
import { departmentActions } from "../../../modules/departments/actions/department.actions";
import { serviceActions } from "../../../modules/services/actions/service.actions";
import {
  ShieldCheck,
  Video,
  Eye,
  Users,
  Building2,
  Briefcase,
  Search,
  CheckCheck,
  Ban,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

interface MeetingPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId?: string;
}

export const MeetingPermissionModal: React.FC<MeetingPermissionModalProps> = ({
  isOpen,
  onClose,
  orgId,
}) => {
  const queryClient = useQueryClient();

  // Mode: "ALL" | "DEPARTMENT" | "SERVICE"
  const [filterMode, setFilterMode] = useState<"ALL" | "DEPARTMENT" | "SERVICE">("ALL");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // 1. Fetch all members with permissions
  const {
    data: users = [],
    isLoading: loadingUsers,
  } = useQuery({
    queryKey: ["meeting-permissions", orgId],
    queryFn: () => meetingActions.getPermissions(orgId),
    enabled: isOpen && !!orgId,
  });

  // 2. Fetch departments dynamically from API / DB
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: isOpen && !!orgId,
  });

  // 3. Fetch services dynamically from API / DB
  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => serviceActions.getServices(),
    enabled: isOpen && !!orgId,
  });

  // Single permission toggle mutation
  const updatePermMutation = useMutation({
    mutationFn: (payload: {
      userId: string;
      canAccess: boolean;
      canCreate: boolean;
    }) =>
      meetingActions.updatePermission({
        organizationId: orgId,
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-permissions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-access", orgId] });
      toast.success("Meeting permission updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update permission");
    },
  });

  // Bulk update mutation (All, Department-wise, Service-wise, or Selected Users)
  const bulkUpdateMutation = useMutation({
    mutationFn: (payload: {
      scope: "ALL" | "DEPARTMENT" | "SERVICE" | "USERS";
      departmentId?: string;
      serviceId?: string;
      userIds?: string[];
      canAccess?: boolean;
      canCreate?: boolean;
    }) =>
      meetingActions.bulkUpdatePermissions({
        organizationId: orgId,
        ...payload,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-permissions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-access", orgId] });
      toast.success(`Updated meeting permissions for ${data.updatedCount || "target"} member(s)!`);
      setSelectedUserIds([]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Bulk permission update failed");
    },
  });

  // Filtered members based on mode, department, service, search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
          (u.serviceName && u.serviceName.toLowerCase().includes(q)) ||
          (u.designation && u.designation.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Department filter
      if (filterMode === "DEPARTMENT" && selectedDeptId !== "ALL") {
        if (u.departmentId !== selectedDeptId) return false;
      }

      // Service filter
      if (filterMode === "SERVICE" && selectedServiceId !== "ALL") {
        if (u.serviceId !== selectedServiceId) return false;
      }

      return true;
    });
  }, [users, filterMode, selectedDeptId, selectedServiceId, searchQuery]);

  // Handle single toggle
  const handleToggle = (
    user: MeetingPermissionUser,
    type: "canAccess" | "canCreate"
  ) => {
    if (user.isOwner) {
      toast.info("Workspace Admin always maintains full permissions");
      return;
    }

    const nextAccess = type === "canAccess" ? !user.canAccess : user.canAccess;
    const nextCreate =
      type === "canCreate"
        ? !user.canCreate
        : nextAccess === false
        ? false
        : user.canCreate;

    updatePermMutation.mutate({
      userId: user.userId,
      canAccess: nextAccess,
      canCreate: nextCreate,
    });
  };

  // Multi-select toggle
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllFiltered = () => {
    const selectable = filteredUsers.filter((u) => !u.isOwner).map((u) => u.userId);
    if (selectedUserIds.length === selectable.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectable);
    }
  };

  // Trigger bulk permission action
  const handleBulkAction = (actionType: "GRANT_ALL" | "GRANT_VIEW" | "REVOKE_ALL") => {
    const canAccess = actionType !== "REVOKE_ALL";
    const canCreate = actionType === "GRANT_ALL";

    // If specific users are checked, use USERS scope
    if (selectedUserIds.length > 0) {
      bulkUpdateMutation.mutate({
        scope: "USERS",
        userIds: selectedUserIds,
        canAccess,
        canCreate,
      });
      return;
    }

    // Otherwise apply to current scope
    if (filterMode === "DEPARTMENT" && selectedDeptId !== "ALL") {
      bulkUpdateMutation.mutate({
        scope: "DEPARTMENT",
        departmentId: selectedDeptId,
        canAccess,
        canCreate,
      });
    } else if (filterMode === "SERVICE" && selectedServiceId !== "ALL") {
      bulkUpdateMutation.mutate({
        scope: "SERVICE",
        serviceId: selectedServiceId,
        canAccess,
        canCreate,
      });
    } else {
      bulkUpdateMutation.mutate({
        scope: "ALL",
        canAccess,
        canCreate,
      });
    }
  };

  const isBusy = updatePermMutation.isPending || bulkUpdateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Access & Creation Permissions"
      description="Configure workspace-wide, department-wise, or service-wise permissions for viewing and scheduling meetings."
      maxWidth="2xl"
    >
      <div className="space-y-4 pt-1">
        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block text-2xs uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Scope-Based Access Matrix
            </span>
            <p className="text-3xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Select <strong>All Members</strong>, filter by <strong>Department</strong> or <strong>Service</strong> to grant or revoke meeting permissions in bulk. Individual permissions can also be toggled anytime.
            </p>
          </div>
        </div>

        {/* Scope Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-white/[0.04] p-1 border border-zinc-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setFilterMode("ALL");
                setSelectedDeptId("ALL");
                setSelectedServiceId("ALL");
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                filterMode === "ALL"
                  ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Members</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("DEPARTMENT")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                filterMode === "DEPARTMENT"
                  ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>By Department</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMode("SERVICE")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
                filterMode === "SERVICE"
                  ? "bg-white dark:bg-zinc-800 text-violet-600 dark:text-violet-400 shadow-2xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>By Service</span>
            </button>
          </div>

          {/* Department or Service Dropdown */}
          {filterMode === "DEPARTMENT" && (
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments ({departments.length})</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          )}

          {filterMode === "SERVICE" && (
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-medium focus:border-violet-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Services ({services.length})</option>
              {services.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search & Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member, role, dept, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none placeholder:text-zinc-400"
            />
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleBulkAction("GRANT_VIEW")}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-3xs font-bold border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="Grant page access only to current group"
            >
              <Eye className="w-3 h-3" />
              <span>{selectedUserIds.length > 0 ? `Grant View (${selectedUserIds.length})` : "Grant View to All"}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleBulkAction("GRANT_ALL")}
              className="px-2.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-3xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="Grant view and create meeting access to current group"
            >
              <Video className="w-3 h-3" />
              <span>{selectedUserIds.length > 0 ? `Grant Create (${selectedUserIds.length})` : "Grant Create to All"}</span>
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleBulkAction("REVOKE_ALL")}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-3xs font-bold border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              title="Revoke all meeting access from current group"
            >
              <Ban className="w-3 h-3" />
              <span>Revoke All</span>
            </button>
          </div>
        </div>

        {/* Member Select All Counter */}
        <div className="flex items-center justify-between px-1 text-3xs text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
          >
            {selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.filter((u) => !u.isOwner).length ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>
              {selectedUserIds.length > 0
                ? `Deselect All (${selectedUserIds.length} selected)`
                : `Select All Filtered (${filteredUsers.filter((u) => !u.isOwner).length})`}
            </span>
          </button>
          <span>Showing {filteredUsers.length} of {users.length} members</span>
        </div>

        {/* Member List */}
        {loadingUsers ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200/60 dark:border-white/[0.04]">
            No members match the current filter or search criteria.
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.userId);
              return (
                <div
                  key={u.userId}
                  className={cn(
                    "p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    isSelected
                      ? "bg-violet-500/5 border-violet-500/30"
                      : "bg-zinc-50/70 dark:bg-white/[0.02] border-zinc-200/70 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/[0.12]"
                  )}
                >
                  {/* Left: Checkbox + User Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {!u.isOwner && (
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(u.userId)}
                        className="text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 cursor-pointer shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <Avatar name={u.name} size="md" className="shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">
                          {u.name}
                        </span>
                        {u.isOwner && (
                          <span className="text-4xs px-2 py-0.5 rounded-md font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/20 shrink-0">
                            Workspace Admin
                          </span>
                        )}
                        {u.departmentName && (
                          <span className="text-4xs px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 font-mono font-medium shrink-0">
                            🏢 {u.departmentName}
                          </span>
                        )}
                        {u.serviceName && (
                          <span className="text-4xs px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-medium shrink-0">
                            💼 {u.serviceName}
                          </span>
                        )}
                      </div>
                      <span className="text-3xs text-zinc-400 block truncate mt-0.5">
                        {u.email}
                      </span>
                      <span className="text-4xs text-violet-600 dark:text-violet-400 font-mono block truncate">
                        {u.designation || u.roleInOrg}
                      </span>
                    </div>
                  </div>

                  {/* Right: Permission Toggles */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.04]">
                    {/* View Page Toggle */}
                    <button
                      type="button"
                      disabled={u.isOwner || isBusy}
                      onClick={() => handleToggle(u, "canAccess")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border",
                        u.canAccess
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs"
                          : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300",
                        u.isOwner && "opacity-80 cursor-not-allowed"
                      )}
                      title={u.isOwner ? "Owner always has access" : "Toggle View Permission"}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                      {u.canAccess && <span className="text-3xs font-bold">✓</span>}
                    </button>

                    {/* Create Meeting Toggle */}
                    <button
                      type="button"
                      disabled={u.isOwner || isBusy}
                      onClick={() => handleToggle(u, "canCreate")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border",
                        u.canCreate
                          ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                          : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300",
                        u.isOwner && "opacity-80 cursor-not-allowed"
                      )}
                      title={u.isOwner ? "Owner can always create" : "Toggle Create Permission"}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Create</span>
                      {u.canCreate && <span className="text-3xs font-bold">✓</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
