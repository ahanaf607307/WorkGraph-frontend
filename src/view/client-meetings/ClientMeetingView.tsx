"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  clientMeetingActions,
  ClientMeetingItem,
  ClientMeetingStatus,
} from "../../modules/client-meetings/actions/client-meeting.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { stationActions, ProfileItem } from "../../modules/stations/actions/station.actions";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { getSocket } from "../../lib/socket";
import {
  Video,
  Plus,
  ExternalLink,
  Copy,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Radio,
  Trash2,
  Calendar,
  Briefcase,
  UserCheck,
  Globe,
  Sparkles,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

export const ClientMeetingView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating a new meeting
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileUsername, setProfileUsername] = useState<string>("");
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // Determine user permissions
  const orgRole = (currentOrg?.myRole || "").toUpperCase();
  const userRole = (user?.role || "").toUpperCase();
  const isPrivileged =
    userRole === "SYSTEM_OWNER" ||
    userRole === "SYSTEM_ADMIN" ||
    userRole === "WORKSPACE_ADMIN" ||
    orgRole === "SYSTEM_ADMIN" ||
    orgRole === "WORKSPACE_ADMIN" ||
    orgRole === "ADMIN" ||
    orgRole === "OWNER";

  const deptName = (currentOrg as any)?.department?.name?.toLowerCase() || "";
  const deptCode = (currentOrg as any)?.department?.code?.toUpperCase() || "";
  const isSalesMember =
    !isPrivileged &&
    (deptName.includes("sale") ||
      deptName.includes("seal") ||
      deptCode === "SALES" ||
      user?.email?.toLowerCase().includes("sales"));

  // Fetch client meetings
  const {
    data: meetings = [],
    isLoading: loadingMeetings,
    refetch,
  } = useQuery({
    queryKey: ["client-meetings", orgId, statusFilter, projectFilter],
    queryFn: () =>
      clientMeetingActions.getClientMeetings(
        projectFilter !== "ALL" ? projectFilter : undefined,
        statusFilter !== "ALL" ? statusFilter : undefined
      ),
    enabled: !!orgId,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => projectActions.fetchProjects(orgId),
    enabled: !!orgId,
  });

  // Fetch client profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["stations-profiles", orgId],
    queryFn: () => stationActions.getProfiles(),
    enabled: !!orgId,
  });

  // Socket listener for real-time updates
  useEffect(() => {
    if (!orgId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleClientMeetingUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["client-meetings", orgId] });
    };

    socket.on("client-meeting:created", handleClientMeetingUpdate);
    socket.on("client-meeting:status_updated", handleClientMeetingUpdate);
    socket.on("client-meeting:deleted", handleClientMeetingUpdate);

    return () => {
      socket.off("client-meeting:created", handleClientMeetingUpdate);
      socket.off("client-meeting:status_updated", handleClientMeetingUpdate);
      socket.off("client-meeting:deleted", handleClientMeetingUpdate);
    };
  }, [orgId, queryClient]);

  // Create meeting mutation
  const createMeetingMutation = useMutation({
    mutationFn: (data: {
      projectId: string;
      profileUsername: string;
      profileId?: string;
      link: string;
      title?: string;
      description?: string;
      scheduledAt?: string;
    }) => clientMeetingActions.createClientMeeting(data),
    onSuccess: () => {
      toast.success("Client meeting created successfully & team notified!");
      queryClient.invalidateQueries({ queryKey: ["client-meetings", orgId] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to create client meeting");
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ClientMeetingStatus }) =>
      clientMeetingActions.updateClientMeetingStatus(id, status),
    onSuccess: () => {
      toast.success("Meeting status updated");
      queryClient.invalidateQueries({ queryKey: ["client-meetings", orgId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update status");
    },
  });

  // Delete meeting mutation
  const deleteMeetingMutation = useMutation({
    mutationFn: (id: string) => clientMeetingActions.deleteClientMeeting(id),
    onSuccess: () => {
      toast.success("Meeting deleted");
      queryClient.invalidateQueries({ queryKey: ["client-meetings", orgId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete meeting");
    },
  });

  const resetForm = () => {
    setSelectedProjectId("");
    setSelectedProfileId("");
    setProfileUsername("");
    setMeetingTitle("");
    setMeetingLink("");
    setDescription("");
    setScheduledAt("");
  };

  const handleProfileSelect = (profId: string) => {
    setSelectedProfileId(profId);
    const found = profiles.find((p) => p.id === profId);
    if (found) {
      setProfileUsername(found.username || found.name);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSalesMember) {
      toast.error("Only Sales members can create client meetings");
      return;
    }
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    if (!profileUsername.trim()) {
      toast.error("Please enter or select a profile username");
      return;
    }
    if (!meetingLink.trim()) {
      toast.error("Please enter a meeting link");
      return;
    }

    createMeetingMutation.mutate({
      projectId: selectedProjectId,
      profileUsername: profileUsername.trim(),
      profileId: selectedProfileId || undefined,
      title: meetingTitle.trim() || undefined,
      link: meetingLink.trim(),
      description: description.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied to clipboard!");
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch =
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.profileUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [meetings, searchTerm]);

  return (
    <div className="flex-1 w-full space-y-6 p-4 md:p-8 animate-fade-in text-neutral-900 dark:text-neutral-100">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Client Meetings</h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {filteredMeetings.length}
                </span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Create and join live client calls. Assigned project members are instantly notified.
              </p>
            </div>
          </div>
        </div>

        {isSalesMember && (
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              New Client Meeting
            </Button>
          </div>
        )}
      </div>

      {/* Controls & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between bg-neutral-50 dark:bg-neutral-900/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search meetings by profile, project or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-1 text-xs">
            {["ALL", "UPCOMING", "LIVE", "COMPLETED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1 rounded-md font-medium transition-colors",
                  statusFilter === st
                    ? "bg-violet-600 text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                )}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meetings Grid / Cards */}
      {loadingMeetings ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="mx-auto w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold">No Client Meetings Found</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
            {searchTerm || statusFilter !== "ALL"
              ? "Try adjusting your filters or search term to see other meetings."
              : "No meetings have been scheduled yet. Click below to schedule a new client meeting."}
          </p>
          {isSalesMember && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Create First Meeting
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((meeting) => {
            const isLive = meeting.status === "LIVE";
            const isCompleted = meeting.status === "COMPLETED";
            const isUpcoming = meeting.status === "UPCOMING";

            return (
              <div
                key={meeting.id}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900/80 border transition-all duration-200 hover:shadow-lg",
                  isLive
                    ? "border-red-500/40 ring-1 ring-red-500/20 bg-red-500/[0.02]"
                    : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                )}
              >
                <div>
                  {/* Top Row: Badges & Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Project Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        <Briefcase className="w-3 h-3" />
                        {meeting.project?.name || "Project"}
                      </span>

                      {/* Profile Username Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                        <UserCheck className="w-3 h-3 text-neutral-400" />
                        @{meeting.profileUsername}
                      </span>
                    </div>

                    {/* Status Indicator */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase",
                        isLive && "bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400 animate-pulse border border-red-300 dark:border-red-800",
                        isUpcoming && "bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                        isCompleted && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
                        meeting.status === "CANCELLED" && "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      )}
                    >
                      {isLive && <Radio className="w-3 h-3 animate-ping" />}
                      {meeting.status}
                    </span>
                  </div>

                  {/* Meeting Title & Topic */}
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
                    {meeting.title}
                  </h3>

                  {meeting.description && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-3 leading-relaxed">
                      {meeting.description}
                    </p>
                  )}

                  {/* Scheduled Time & Creator */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {meeting.scheduledAt
                          ? format(parseISO(meeting.scheduledAt), "PPP 'at' p")
                          : "Scheduled now"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar
                        src={meeting.createdBy?.avatarUrl || undefined}
                        name={meeting.createdBy?.name || "User"}
                        size="sm"
                        className="w-4 h-4 text-[10px]"
                      />
                      <span>Created by {meeting.createdBy?.name || "Sales Member"}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    {/* Join Meeting Button */}
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-700 shadow-sm hover:shadow transition-all"
                    >
                      <Video className="w-4 h-4" />
                      Join Meeting
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>

                    {/* Copy Link Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(meeting.link)}
                      className="h-10 px-3 rounded-xl border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      title="Copy meeting link"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Status Toggles & Management */}
                  {(isPrivileged || meeting.createdById === user?.id || isSalesMember) && (
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                      <div className="flex items-center gap-1">
                        {isUpcoming && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: meeting.id, status: "LIVE" })
                            }
                            className="px-2 py-1 rounded-md text-[11px] font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            Mark Live
                          </button>
                        )}
                        {isLive && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: meeting.id, status: "COMPLETED" })
                            }
                            className="px-2 py-1 rounded-md text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          >
                            Mark Completed
                          </button>
                        )}
                        {!isCompleted && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: meeting.id, status: "COMPLETED" })
                            }
                            className="px-2 py-1 rounded-md text-[11px] font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            Finish
                          </button>
                        )}
                      </div>

                      {(isPrivileged || meeting.createdById === user?.id) && (
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this client meeting?")) {
                              deleteMeetingMutation.mutate(meeting.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Large Modal for Creating New Client Meeting */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8">
            {/* Modal Close Button */}
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="absolute top-5 right-5 z-50 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors pointer-events-auto"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="pr-12 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">New Client Meeting</h2>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    Schedule a client meeting. Project team members will be notified automatically with the join link.
                  </p>
                </div>
              </div>
            </div>

            {/* Creation Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Select Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name} {proj.clientName ? `(${proj.clientName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profile Selection & Username */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Profile Username <span className="text-red-500">*</span>
                  </label>
                  {profiles.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedProfileId}
                        onChange={(e) => handleProfileSelect(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="">-- Select from existing profiles or type below --</option>
                        {profiles.map((prof) => (
                          <option key={prof.id} value={prof.id}>
                            @{prof.username || prof.name} ({prof.platform || "Profile"})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Or enter custom username..."
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        required
                        className="w-full px-3.5 py-2 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. john_doe_client"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  )}
                </div>
              </div>

              {/* Meeting Title / Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Meeting Title / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Review & Client Feedback Call"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Meeting Link & Scheduled Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Meeting Link (Google Meet / Zoom) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="url"
                      placeholder="https://meet.google.com/xyz-abc or Zoom link"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Schedule Date & Time (Optional)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Description / Agenda
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide call instructions, discussion agenda or client requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-neutral-50 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="rounded-xl border-neutral-200 dark:border-neutral-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMeetingMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md px-6 gap-2"
                >
                  {createMeetingMutation.isPending ? (
                    <>Creating & Notifying...</>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create & Notify Team
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
