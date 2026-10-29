"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { permissionActions, PermissionUser } from "../../modules/permissions/actions/permission.actions";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { ShieldCheck, Lock, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Hook to manage delegated permissions for a specific module/feature in the workspace.
 * Workspace Admin (OWNER, WORKSPACE_ADMIN, SYSTEM_OWNER) always has master permission.
 * Other users only have permission if explicitly delegated by Workspace Admin in the database.
 */
export function useFeaturePermission(featureKey: string) {
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "workspace_admin" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    (currentOrg?.myRole as string) === "system_admin" ||
    user?.role === "SYSTEM_OWNER" ||
    (user?.role as string) === "system_owner" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN" ||
    (user?.role as string) === "system_admin";

  const { data: permCheck } = useQuery({
    queryKey: ["feature-perm-check", orgId, user?.id, featureKey],
    queryFn: () => permissionActions.checkPermission(orgId, featureKey),
    enabled: !!orgId && !!user?.id && !isSystemAdmin,
    staleTime: 5000,
  });

  const hasPermission = isSystemAdmin || (permCheck?.canManage ?? false);

  return {
    isSystemAdmin,
    hasPermission,
  };
}

interface PermissionButtonProps {
  onClick: () => void;
  className?: string;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  onClick,
  className = "",
}) => {
  const { currentOrg, user } = useAuth();
  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "workspace_admin" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    (currentOrg?.myRole as string) === "system_admin" ||
    user?.role === "SYSTEM_OWNER" ||
    (user?.role as string) === "system_owner" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN" ||
    (user?.role as string) === "system_admin";

  // Only Workspace Admin can grant/manage module permissions
  if (!isSystemAdmin) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-all shadow-xs cursor-pointer ${className}`}
      title="Configure Member Permissions"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
      <span>Permissions</span>
    </button>
  );
};

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureKey: string;
  title?: string;
  description?: string;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  featureKey,
  title = "Module Permissions & Authorization",
  description = "Grant create, add, or override authorization to selected workspace admins & leaders.",
}) => {
  const queryClient = useQueryClient();
  const { currentOrg } = useAuth();
  const orgId = currentOrg?.id;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["feature-permissions", orgId, featureKey],
    queryFn: () => permissionActions.getPermissions(orgId, featureKey),
    enabled: !!orgId && isOpen,
  });

  const updatePermMutation = useMutation({
    mutationFn: (payload: { userId: string; canManage: boolean; canAccess: boolean }) =>
      permissionActions.updatePermission({
        organizationId: orgId,
        featureKey,
        ...payload,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["feature-permissions", orgId, featureKey] });
      queryClient.invalidateQueries({ queryKey: ["feature-perm-check", orgId] });
      toast.success(
        variables.canManage
          ? "Permission granted successfully!"
          : "Permission revoked successfully."
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update permission");
    },
  });

  const handleToggle = (user: PermissionUser) => {
    if (user.isOwner) {
      toast.info("Workspace Admin always maintains master permissions");
      return;
    }

    const nextState = !user.canManage;
    updatePermMutation.mutate({
      userId: user.userId,
      canAccess: nextState,
      canManage: nextState,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="2xl"
    >
      <div className="space-y-4 pt-2 text-xs">
        <div className="p-3.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/50 dark:border-violet-900/40 text-violet-900 dark:text-violet-200 text-xs leading-relaxed flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <span>
            <strong>Admin Notice:</strong> You hold master privileges. Members granted permission below are stored in the database and will be authorized to create, edit, or adjust records in this section.
          </span>
        </div>

        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-400">Loading members...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">No members found</div>
          ) : (
            users.map((u: PermissionUser) => {
              const isOwner = u.isOwner;
              const isGranted = isOwner || u.canManage;

              return (
                <div
                  key={u.userId}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Avatar name={u.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs">
                          {u.name}
                        </span>
                        <span className="text-3xs px-2 py-0.5 rounded uppercase font-mono font-bold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                          {u.designation || u.roleInOrg}
                        </span>
                      </div>
                      <span className="text-3xs text-zinc-400 block truncate font-mono mt-0.5">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  {isOwner ? (
                    <span className="text-3xs font-semibold px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                      Master Owner
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={updatePermMutation.isPending}
                      onClick={() => handleToggle(u)}
                      className={`px-3.5 py-1.5 rounded-xl text-3xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isGranted
                          ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-violet-600 hover:text-white"
                      }`}
                    >
                      {isGranted ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Permitted</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Authorize</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
