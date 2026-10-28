"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { meetingActions, MeetingItem, MeetingStatus } from "../../modules/meeting/actions/meeting.actions";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { MeetingPermissionModal } from "./components/MeetingPermissionModal";
import { CreateMeetingModal } from "./components/CreateMeetingModal";
import { getSocket } from "../../lib/socket";
import {
  Video,
  Plus,
  ShieldCheck,
  Calendar,
  ExternalLink,
  Copy,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Radio,
  Trash2,
  Lock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { format, isToday, isTomorrow } from "date-fns";

export const MeetingView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // 1. Check user meeting access permissions from backend
  const { data: myAccess, isLoading: loadingAccess } = useQuery({
    queryKey: ["my-meeting-access", orgId, user?.id],
    queryFn: () => meetingActions.getMyAccess(orgId),
    enabled: !!orgId && !!user?.id,
  });

  const isSystemAdmin =
    myAccess?.isSystemAdmin ||
    currentOrg?.myRole === "OWNER" ||
    user?.role === "SYSTEM_OWNER" ||
    (user?.role as string) === "system_owner";

  const canAccess = isSystemAdmin || (myAccess?.canAccess ?? false);
  const canCreate = isSystemAdmin || (myAccess?.canCreate ?? false);

  // 2. Fetch meetings
  const {
    data: meetings = [],
    isLoading: loadingMeetings,
    refetch,
  } = useQuery({
    queryKey: ["meetings", orgId, statusFilter],
    queryFn: () => meetingActions.getMeetings(orgId, statusFilter),
    enabled: !!orgId && canAccess,
  });

  // 3. Listen to real-time socket events
  useEffect(() => {
    if (!orgId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleMeetingEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgId] });
    };

    socket.on("meeting:created", handleMeetingEvent);
    socket.on("meeting:status_updated", handleMeetingEvent);
    socket.on("meeting:updated", handleMeetingEvent);
    socket.on("meeting:deleted", handleMeetingEvent);

    return () => {
      socket.off("meeting:created", handleMeetingEvent);
      socket.off("meeting:status_updated", handleMeetingEvent);
      socket.off("meeting:updated", handleMeetingEvent);
      socket.off("meeting:deleted", handleMeetingEvent);
    };
  }, [orgId, queryClient]);

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      link: string;
      scheduledAt: string;
    }) =>
      meetingActions.createMeeting({
        organizationId: orgId,
        ...data,
      }),
    onSuccess: (newMeeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgId] });
      toast.success(
        `Meeting "${newMeeting.title}" scheduled! Push notifications sent to all authorized members.`
      );
      setShowCreateModal(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule meeting");
    },
  });

  // Update meeting status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MeetingStatus }) =>
      meetingActions.updateMeetingStatus(id, status, orgId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgId] });
      toast.success(`Meeting status changed to ${variables.status}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => meetingActions.deleteMeeting(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings", orgId] });
      toast.success("Meeting removed successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete meeting");
    },
  });

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.createdBy?.name?.toLowerCase().includes(q);
      return matchSearch;
    });
  }, [meetings, searchTerm]);

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied to clipboard!");
  };

  const formatMeetingDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) {
        return `Today at ${format(d, "h:mm a")}`;
      }
      if (isTomorrow(d)) {
        return `Tomorrow at ${format(d, "h:mm a")}`;
      }
      return format(d, "MMM d, yyyy • h:mm a");
    } catch {
      return dateStr;
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: MeetingStatus) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            LIVE NOW
          </span>
        );
      case "UPCOMING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            Upcoming
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-white/[0.05] text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-white/[0.06]">
            Completed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // 1. Loading Access Check
  if (loadingAccess) {
    return (
      <div className="p-16 text-center space-y-3">
        <Skeleton className="h-10 w-48 mx-auto rounded-2xl" />
        <Skeleton className="h-5 w-64 mx-auto rounded-xl" />
      </div>
    );
  }

  // 2. Access Restricted View
  if (!canAccess) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] rounded-3xl space-y-4 shadow-sm my-8">
        <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
          Meeting Access Restricted
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          You do not currently have permission to access the workspace Meeting Hub.
          Please contact your <strong>System Admin</strong> or <strong>Workspace Owner</strong> to request access permission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
                Meeting Hub
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Schedule video syncs, launch instant rooms, and deliver push alerts to authorized members.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Permission Button for System Admin */}
          {isSystemAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPermissionModal(true)}
              className="text-xs font-semibold flex items-center gap-1.5 border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Permissions</span>
            </Button>
          )}

          {/* Schedule Meeting Button */}
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0f1118] p-3 rounded-2xl border border-zinc-200/80 dark:border-white/[0.08]">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1">
          {["ALL", "UPCOMING", "LIVE", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {st === "ALL" ? "All Meetings" : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search meeting, host, topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* Meeting Cards Grid */}
      {loadingMeetings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full rounded-3xl" />
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="p-14 text-center space-y-4 rounded-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08]">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-500 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              No Meetings Found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {canCreate
                ? "Schedule your first workspace sync or team standup using the button above."
                : "No scheduled meetings match the current status filter."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeetings.map((meeting) => {
            const isCreator = meeting.createdById === user?.id;
            const canManageMeeting = isSystemAdmin || isCreator;

            return (
              <div
                key={meeting.id}
                className={cn(
                  "p-5 rounded-3xl bg-white dark:bg-[#0f1118] border transition-all flex flex-col justify-between space-y-4 shadow-xs group",
                  meeting.status === "LIVE"
                    ? "border-rose-500/50 shadow-rose-950/10 dark:shadow-rose-950/20"
                    : "border-zinc-200/80 dark:border-white/[0.08] hover:border-violet-500/40"
                )}
              >
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {renderStatusBadge(meeting.status)}
                    <div className="flex items-center gap-1 text-2xs text-zinc-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{formatMeetingDate(meeting.scheduledAt)}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-zinc-950 dark:text-white line-clamp-2 leading-snug pt-1">
                    {meeting.title}
                  </h3>

                  {meeting.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                      {meeting.description}
                    </p>
                  )}
                </div>

                {/* Host Info */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={meeting.createdBy?.name || "Host"}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-900 dark:text-white block truncate text-2xs">
                        {meeting.createdBy?.name || "Host"}
                      </span>
                      <span className="text-3xs text-zinc-400 block truncate">
                        Host
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown for Manager/Host */}
                  {canManageMeeting && (
                    <select
                      value={meeting.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          id: meeting.id,
                          status: e.target.value as MeetingStatus,
                        })
                      }
                      className="px-2.5 py-1 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-3xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="UPCOMING">Upcoming</option>
                      <option value="LIVE">Live Now</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  )}
                </div>

                {/* Primary Actions: Join Meeting & Copy Link */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center gap-2">
                  <a
                    href={meeting.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Meeting</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                  </a>

                  <button
                    type="button"
                    onClick={() => copyMeetingLink(meeting.link)}
                    title="Copy meeting link"
                    className="p-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {canManageMeeting && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete meeting "${meeting.title}"?`)) {
                          deleteMeetingMutation.mutate(meeting.id);
                        }
                      }}
                      title="Delete meeting"
                      className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Permission Modal */}
      {isSystemAdmin && (
        <MeetingPermissionModal
          isOpen={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          orgId={orgId}
        />
      )}

      {/* Create Meeting Modal */}
      {canCreate && (
        <CreateMeetingModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={async (data) => {
            await createMeetingMutation.mutateAsync(data);
          }}
          isLoading={createMeetingMutation.isPending}
        />
      )}
    </div>
  );
};
