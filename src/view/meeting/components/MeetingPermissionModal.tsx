"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/modal";
import { Avatar } from "../../../components/ui/avatar";
import { Skeleton } from "../../../components/ui/skeleton";
import { meetingActions, MeetingPermissionUser } from "../../../modules/meeting/actions/meeting.actions";
import { ShieldCheck, Video, Eye, Lock } from "lucide-react";
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

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["meeting-permissions", orgId],
    queryFn: () => meetingActions.getPermissions(orgId),
    enabled: isOpen && !!orgId,
  });

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meeting-permissions", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-meeting-access", orgId] });
      toast.success("Meeting permission updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update permission");
    },
  });

  const handleToggle = (
    user: MeetingPermissionUser,
    type: "canAccess" | "canCreate"
  ) => {
    if (user.isOwner) {
      toast.info("Workspace Admin always maintains master permissions");
      return;
    }

    const nextAccess =
      type === "canAccess" ? !user.canAccess : user.canAccess;
    // If losing page access, also cannot create meetings
    const nextCreate =
      type === "canCreate"
        ? !user.canCreate
        : nextAccess === false
        ? false
        : user.canCreate;

    // Optimistically update
    updatePermMutation.mutate({
      userId: user.userId,
      canAccess: nextAccess,
      canCreate: nextCreate,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Access & Creation Permissions"
      description="Workspace Admin can grant Leaders, Co-Leaders, and Admins permission to view the Meeting page and schedule meetings."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Permission Matrix Rules:</span>
            <p className="text-3xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              • <strong>Page Access</strong>: Allows the member to see the Meeting nav item and view scheduled meetings. Members with access will receive instant push notifications whenever a new meeting is created.<br />
              • <strong>Create Meeting</strong>: Allows the member to schedule new meetings and update status.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            No eligible leadership or admin members found in this workspace.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {users.map((u) => (
              <div
                key={u.userId}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/70 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} size="md" className="shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-950 dark:text-white truncate">
                        {u.name}
                      </span>
                      {u.isOwner && (
                        <span className="text-4xs px-2 py-0.5 rounded-md font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/20 shrink-0">
                          Workspace Admin
                        </span>
                      )}
                    </div>
                    <span className="text-3xs text-zinc-400 block truncate">
                      {u.email}
                    </span>
                    <span className="text-4xs text-violet-600 dark:text-violet-400 font-mono mt-0.5 block truncate">
                      {u.designation}
                    </span>
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.04]">
                  {/* Can Access Toggle */}
                  <button
                    type="button"
                    disabled={u.isOwner || updatePermMutation.isPending}
                    onClick={() => handleToggle(u, "canAccess")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border",
                      u.canAccess
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-2xs"
                        : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-300",
                      u.isOwner && "opacity-80 cursor-not-allowed"
                    )}
                    title={u.isOwner ? "Owner always has access" : "Toggle Page Access"}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Page</span>
                    {u.canAccess && <span className="text-3xs font-bold">✓</span>}
                  </button>

                  {/* Can Create Toggle */}
                  <button
                    type="button"
                    disabled={u.isOwner || updatePermMutation.isPending}
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
                    <span>Create Meeting</span>
                    {u.canCreate && <span className="text-3xs font-bold">✓</span>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
