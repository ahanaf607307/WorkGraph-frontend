"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { queueActions, QueueItem } from "../../modules/queue/actions/queue.actions";
import { stationActions } from "../../modules/stations/actions/station.actions";
import { serviceActions, ServiceItem } from "../../modules/services/actions/service.actions";
import { uploadActions } from "../../modules/upload/actions/upload.actions";
import { SalesStationGate } from "../../components/shared/SalesStationGate";
import { Avatar } from "../../components/ui/avatar";
import { Modal } from "../../components/ui/modal";
import {
  Inbox,
  PlusCircle,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Paperclip,
  Send,
  Loader2,
  Building2,
  Monitor,
  User,
  MessageSquare,
  Sparkles,
  Link as LinkIcon,
  Check,
  ChevronDown,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export const QueueView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Queue Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [profileInput, setProfileInput] = useState("");
  const [validProfile, setValidProfile] = useState<any | null>(null);
  const [isValidatingProfile, setIsValidatingProfile] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [serviceId, setServiceId] = useState("");
  const [clientName, setClientName] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");

  // Inspect Queue Modal state (Details & Thread)
  const [inspectQueueId, setInspectQueueId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLinkUrl, setCommentLinkUrl] = useState("");
  const [commentFileUrl, setCommentFileUrl] = useState("");
  const [isUploadingCommentFile, setIsUploadingCommentFile] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Check if current user is Sales member
  const deptName = (currentOrg as any)?.department?.name?.toLowerCase() || "";
  const deptCode = (currentOrg as any)?.department?.code?.toUpperCase() || "";
  const isSalesMember =
    deptName.includes("sale") || deptName.includes("seal") || deptCode === "SALES";
  const isPrivileged =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN";

  // Non-sales members (or privileged) can create queues
  const canCreateQueue = !isSalesMember || isPrivileged;

  // Fetch Services for dropdown
  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ["services", orgId],
    queryFn: () => serviceActions.getServices(),
    enabled: !!orgId,
  });

  // Fetch Queues with auto-refetch polling interval
  const {
    data: queues = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<QueueItem[]>({
    queryKey: ["queues", orgId, activeTab],
    queryFn: () => queueActions.getQueues(activeTab),
    enabled: !!orgId,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Real-time inspected queue item from data cache
  const inspectQueue = useMemo(
    () => queues.find((q) => q.id === inspectQueueId) || null,
    [queues, inspectQueueId]
  );

  // Real-time profile validation debounce
  const validationTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!profileInput.trim()) {
      setValidProfile(null);
      setValidationError("");
      setIsValidatingProfile(false);
      return;
    }

    setIsValidatingProfile(true);
    setValidationError("");

    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    validationTimerRef.current = setTimeout(async () => {
      try {
        const res = await stationActions.validateProfileUsername(profileInput.trim());
        if (res.valid && res.profile) {
          setValidProfile(res.profile);
          setValidationError("");
          if (res.profile.serviceId) {
            setServiceId(res.profile.serviceId);
          }
        } else {
          setValidProfile(null);
          setValidationError(res.message || "Profile not found.");
        }
      } catch {
        setValidProfile(null);
        setValidationError("Could not verify profile.");
      } finally {
        setIsValidatingProfile(false);
      }
    }, 350);

    return () => {
      if (validationTimerRef.current) clearTimeout(validationTimerRef.current);
    };
  }, [profileInput]);

  // Create Queue Mutation
  const createQueueMutation = useMutation({
    mutationFn: (data: {
      profileName: string;
      serviceId?: string;
      clientName: string;
      orderId?: string;
      message: string;
    }) => queueActions.createQueue(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await refetch();
      toast.success("Queue request submitted successfully!");
      setShowCreateModal(false);
      setProfileInput("");
      setValidProfile(null);
      setValidationError("");
      setServiceId("");
      setClientName("");
      setOrderId("");
      setMessage("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create queue request");
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      queueActions.updateQueue(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await refetch();
      toast.success("Queue status updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status"),
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: ({
      queueId,
      content,
      linkUrl,
      documentUrl,
    }: {
      queueId: string;
      content: string;
      linkUrl?: string;
      documentUrl?: string;
    }) => queueActions.addComment(queueId, { content, linkUrl, documentUrl }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["queues"] });
      await refetch();
      setCommentText("");
      setCommentLinkUrl("");
      setCommentFileUrl("");
      setShowLinkInput(false);
      toast.success("Response posted to queue!");
    },
    onError: (err: any) => toast.error(err.message || "Failed to post comment"),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCommentFile(true);
      const res = await uploadActions.uploadFile(file);
      setCommentFileUrl(res.url);
      toast.success("File attached!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploadingCommentFile(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validProfile) {
      toast.error("Please enter and verify a valid profile name");
      return;
    }
    if (!clientName.trim()) {
      toast.error("Client Name is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    createQueueMutation.mutate({
      profileName: profileInput.trim(),
      serviceId: serviceId || undefined,
      clientName: clientName.trim(),
      orderId: orderId.trim() || undefined,
      message: message.trim(),
    });
  };

  const handleCommentSubmit = (e: React.FormEvent, queueId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({
      queueId,
      content: commentText.trim(),
      linkUrl: commentLinkUrl.trim() || undefined,
      documentUrl: commentFileUrl || undefined,
    });
  };

  const filteredQueues = queues.filter((q) => {
    const s = searchTerm.toLowerCase();
    return (
      q.clientName.toLowerCase().includes(s) ||
      (q.orderId && q.orderId.toLowerCase().includes(s)) ||
      q.profile.name.toLowerCase().includes(s) ||
      q.profile.username.toLowerCase().includes(s) ||
      q.message.toLowerCase().includes(s) ||
      q.createdBy.name.toLowerCase().includes(s)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "IN_PROGRESS":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "CANCELLED":
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    }
  };

  return (
    <SalesStationGate>
      <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
                Desk & Operations Queue
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                Live Sales Handover
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Submit and resolve operational tasks, client deliverables, and order inquiries with stationed sales members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              title="Refetch queues"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-600 dark:text-zinc-300 transition-colors border border-zinc-200/60 dark:border-white/[0.08] cursor-pointer"
            >
              <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
            </button>

            {canCreateQueue ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Queue</span>
              </button>
            ) : (
              <div
                title="Only Operations, BDT, and Admins can create queue requests for Sales."
                className="text-xs text-zinc-400 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800"
              >
                Sales Desk Mode
              </div>
            )}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-white/[0.06] overflow-x-auto">
            {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setActiveTab(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                  activeTab === status
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                )}
              >
                {status === "ALL"
                  ? "All Queues"
                  : status === "IN_PROGRESS"
                  ? "In Progress"
                  : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search queue requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Queues Responsive Grid (4 columns on large devices) */}
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
            <p className="text-xs text-zinc-400">Loading queue items...</p>
          </div>
        ) : filteredQueues.length === 0 ? (
          <div className="p-14 text-center space-y-4 rounded-3xl bg-white dark:bg-[#11131c] border border-zinc-200/80 dark:border-white/[0.08]">
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
              <Inbox className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                No Queue Requests Found
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                {canCreateQueue
                  ? "Submit a new queue request using the button above to assign tasks to stationed sales profiles."
                  : "No queue requests currently assigned to your active station profile."}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredQueues.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => setInspectQueueId(item.id)}
                  className="group relative rounded-2xl bg-white dark:bg-[#11131c] border border-zinc-200/80 dark:border-white/[0.08] hover:border-blue-500/50 dark:hover:border-blue-500/50 p-4.5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer text-left space-y-3"
                >
                  {/* Top Bar: Client Name, Order ID, and Status */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-zinc-950 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                          {item.clientName}
                        </h4>
                        {item.orderId && (
                          <span className="text-3xs font-mono font-bold bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/60 dark:border-white/[0.08] px-1.5 py-0.5 rounded text-zinc-700 dark:text-zinc-300 mt-0.5 inline-block">
                            {item.orderId}
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-3xs font-bold border whitespace-nowrap shrink-0",
                          getStatusBadge(item.status)
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Profile & Service Line tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-3xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1 truncate max-w-[180px]">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">@{item.profile.username}</span>
                      </span>

                      {item.service && (
                        <span className="text-3xs font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/[0.06] truncate max-w-[140px]">
                          {item.service.name}
                        </span>
                      )}
                    </div>

                    {/* Message Preview */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Card Bottom: Station Desk & Comments count */}
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-3xs text-zinc-400">
                    <div className="flex items-center gap-1.5 truncate max-w-[130px]">
                      <Monitor className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
                        {item.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-400">
                        <MessageSquare className="w-3 h-3 text-zinc-400" />
                        <span>{item.comments?.length || 0}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Queue Details & Response Thread */}
        {inspectQueue && (
          <Modal
            isOpen={!!inspectQueue}
            onClose={() => {
              setInspectQueueId(null);
              setCommentText("");
              setCommentLinkUrl("");
              setCommentFileUrl("");
              setShowLinkInput(false);
            }}
            maxWidth="4xl"
          >
            <div className="space-y-5">
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-200/60 dark:border-white/[0.08]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
                      {inspectQueue.clientName}
                    </h2>
                    {inspectQueue.orderId && (
                      <span className="text-2xs font-mono font-bold bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/60 dark:border-white/[0.08] px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                        Order: {inspectQueue.orderId}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                    <span>Created by {inspectQueue.createdBy.name}</span>
                    <span>•</span>
                    <span>
                      {new Date(inspectQueue.createdAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(inspectQueue.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Status Switcher / Pill */}
                <div className="flex items-center gap-2">
                  {isPrivileged ||
                  isSalesMember ||
                  (inspectQueue.assignedToId && inspectQueue.assignedToId === user?.id) ||
                  inspectQueue.createdById === user?.id ? (
                    <div className="relative">
                      <select
                        value={inspectQueue.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: inspectQueue.id,
                            status: e.target.value,
                          })
                        }
                        className={cn(
                          "appearance-none px-3 py-1.5 pr-7 rounded-xl text-xs font-bold border cursor-pointer focus:outline-none transition-all",
                          getStatusBadge(inspectQueue.status)
                        )}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold border",
                        getStatusBadge(inspectQueue.status)
                      )}
                    >
                      {inspectQueue.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] space-y-0.5">
                  <div className="text-3xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Profile
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      {inspectQueue.profile.name} (@{inspectQueue.profile.username})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] space-y-0.5">
                  <div className="text-3xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Service Line
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-violet-500" />
                    <span>{inspectQueue.service?.name || "General Service"}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] space-y-0.5">
                  <div className="text-3xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Station Desk Assignee
                  </div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{inspectQueue.assignedTo?.name || "Unassigned Station"}</span>
                  </div>
                </div>
              </div>

              {/* Request Message Box */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Request Message
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                  {inspectQueue.message}
                </div>
              </div>

              {/* Thread Discussion / Comments */}
              <div className="space-y-3 pt-2 border-t border-zinc-200/60 dark:border-white/[0.08]">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Discussion & Responses ({inspectQueue.comments?.length || 0})</span>
                  </span>
                </div>

                {/* Comments List */}
                <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                  {inspectQueue.comments?.length === 0 ? (
                    <div className="text-xs text-zinc-400 text-center py-5 bg-zinc-50/50 dark:bg-white/[0.01] rounded-2xl border border-zinc-200/50 dark:border-white/[0.04]">
                      No responses posted yet. Post a status note, link, or file attachment below.
                    </div>
                  ) : (
                    inspectQueue.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#141722] border border-zinc-200/60 dark:border-white/[0.06] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-2xs mb-0.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={c.user.name} size="sm" />
                            <span className="font-bold text-zinc-950 dark:text-white">
                              {c.user.name}
                            </span>
                          </div>
                          <span className="text-3xs text-zinc-400 font-mono">
                            {new Date(c.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-700 dark:text-zinc-300 pl-7 leading-relaxed whitespace-pre-line">
                          {c.content}
                        </p>

                        {/* Link URL pill */}
                        {c.linkUrl && (
                          <div className="pl-7 pt-1">
                            <a
                              href={c.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-3xs font-semibold hover:underline border border-blue-500/20"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{c.linkUrl}</span>
                            </a>
                          </div>
                        )}

                        {/* Document file attachment pill */}
                        {c.documentUrl && (
                          <div className="pl-7 pt-1">
                            <a
                              href={uploadActions.getFileUrl(c.documentUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-3xs font-semibold hover:underline border border-emerald-500/20"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Attached Document / File</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input Form */}
                <form
                  onSubmit={(e) => handleCommentSubmit(e, inspectQueue.id)}
                  className="space-y-2 pt-2 border-t border-zinc-200/60 dark:border-white/[0.06]"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Write a response or update note..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white"
                    />

                    {/* Link Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(!showLinkInput)}
                      title="Add Link"
                      className={cn(
                        "p-2.5 rounded-xl border transition-colors cursor-pointer",
                        showLinkInput || commentLinkUrl
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-white dark:bg-[#141722] border-zinc-200 dark:border-white/[0.08] text-zinc-500 hover:text-blue-500"
                      )}
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>

                    {/* File Attachment Button */}
                    <label className="p-2.5 rounded-xl border bg-white dark:bg-[#141722] border-zinc-200 dark:border-white/[0.08] text-zinc-500 hover:text-emerald-500 transition-colors cursor-pointer">
                      {isUploadingCommentFile ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                      ) : (
                        <Paperclip
                          className={cn(
                            "w-4 h-4",
                            commentFileUrl && "text-emerald-500"
                          )}
                        />
                      )}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isUploadingCommentFile}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={addCommentMutation.isPending || !commentText.trim()}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>Reply</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Optional Link input bar */}
                  {showLinkInput && (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder="Paste link URL (e.g. https://...)..."
                        value={commentLinkUrl}
                        onChange={(e) => setCommentLinkUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#141722] border border-blue-300 dark:border-blue-900/60 text-xs text-blue-600 dark:text-blue-400 placeholder:text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCommentLinkUrl("");
                          setShowLinkInput(false);
                        }}
                        className="text-xs text-zinc-400 hover:text-rose-500 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {/* File preview badge */}
                  {commentFileUrl && (
                    <div className="flex items-center gap-2 text-3xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-md w-fit border border-emerald-500/20">
                      <Check className="w-3 h-3" />
                      <span>File attached to response</span>
                      <button
                        type="button"
                        onClick={() => setCommentFileUrl("")}
                        className="ml-1 text-rose-500 hover:underline cursor-pointer"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Queue Modal (Matching 2nd Image) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
              onClick={() => setShowCreateModal(false)}
            />

            {/* Dialog Container */}
            <div className="relative w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl bg-[#0d1017] border border-zinc-800 p-6 sm:p-8 shadow-2xl z-10 space-y-5 text-white">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Create Queue
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Submit a new request for the sales team.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer pointer-events-auto z-50 shrink-0"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
                {/* 1. Profile with Real-time Check */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Profile <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Paste the exact profile name"
                      value={profileInput}
                      onChange={(e) => setProfileInput(e.target.value)}
                      className={cn(
                        "w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border text-white placeholder:text-zinc-500 focus:outline-none transition-all",
                        validProfile
                          ? "border-emerald-500/80 focus:border-emerald-500"
                          : validationError
                          ? "border-rose-500 focus:border-rose-500"
                          : "border-zinc-800 focus:border-blue-500"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isValidatingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : validProfile ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : validationError ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : null}
                    </div>
                  </div>

                  {/* Real-time verification notice */}
                  {validProfile ? (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Verified: <strong>{validProfile.name}</strong> (@{validProfile.username})
                        {validProfile.stationedUser
                          ? ` • Stationed: ${validProfile.stationedUser.name}`
                          : " • (No member currently on station)"}
                      </span>
                    </div>
                  ) : validationError ? (
                    <div className="text-[11px] text-rose-400 pt-0.5">
                      {validationError}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      Enter the profile name shared with you. Names are not listed for privacy.
                    </p>
                  )}
                </div>

                {/* 2. Service Line (optional) */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Service Line <span className="text-zinc-500 font-normal">(optional)</span>
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-zinc-800 text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="">Select a service line...</option>
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name} {srv.code ? `(${srv.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Client Name */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corporation"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* 4. Order ID (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Order ID <span className="text-zinc-500 font-normal">Optional</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-9876"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#141824] border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* 5. Message */}
                <div className="space-y-1.5">
                  <label className="block text-zinc-300 font-semibold">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what you need from the sales team..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#141824] border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      createQueueMutation.isPending ||
                      !validProfile ||
                      !clientName.trim() ||
                      !message.trim()
                    }
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    {createQueueMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    <span>Create Queue</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SalesStationGate>
  );
};
