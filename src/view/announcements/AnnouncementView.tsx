"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  announcementActions,
} from "../../modules/announcement/actions/announcement.actions";
import { Avatar } from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  Megaphone,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const AnnouncementView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("System Update");
  const [version, setVersion] = useState("v1.5.0");

  // Comment input per announcement
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [inspectAnnouncementId, setInspectAnnouncementId] = useState<string | null>(null);

  const isSystemOwner =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner";

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementActions.getAnnouncements(),
  });

  const inspectAnnouncement =
    announcements.find((a) => a.id === inspectAnnouncementId) || null;

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      tag?: string;
      version?: string;
    }) => announcementActions.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setVersion("");
      toast.success("System announcement published successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create announcement");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    createAnnouncementMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      tag: tag.trim(),
      version: version.trim() || undefined,
    });
  };

  const handleAddComment = async (announcementId: string) => {
    const commentText = commentInputs[announcementId]?.trim();
    if (!commentText) return;

    setSubmittingCommentId(announcementId);
    try {
      await announcementActions.addComment(announcementId, commentText);
      setCommentInputs((prev) => ({ ...prev, [announcementId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Comment added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmittingCommentId(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Sleek Open Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>System Updates & Announcements</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Enterprise system releases, infrastructure updates, and feature rollout changelogs
          </p>
        </div>

        {isSystemOwner && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish Update</span>
          </button>
        )}
      </div>

      {/* Announcements Timeline */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white dark:bg-[#0f1118] rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            No System Updates Yet
          </h3>
          <p className="text-2xs text-zinc-400 max-w-sm mx-auto">
            Platform changelogs and announcements will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              onClick={() => setInspectAnnouncementId(item.id)}
              className="p-5 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs hover:border-violet-500/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3.5"
            >
              {/* Top metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500" />
                    <span>{item.tag || "System Update"}</span>
                  </span>

                  {item.version && (
                    <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-zinc-100 dark:bg-white/[0.05] text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-white/[0.06]">
                      {item.version}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-3xs text-zinc-400 font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Title only (Initial description hidden as per requirements) */}
              <div className="py-1">
                <h2 className="text-sm md:text-base font-bold text-zinc-950 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                  {item.title}
                </h2>
              </div>

              {/* Author footer & Call-to-action */}
              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-white/[0.04] text-3xs">
                <div className="flex items-center gap-2">
                  <Avatar name={item.author?.name} size="sm" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {item.author?.name || "Workspace Admin"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-500" />
                    <span>{item.comments?.length || 0}</span>
                  </div>
                  <span className="font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INSPECT UPDATE DETAILS & DISCUSSION DIALOG */}
      <Dialog
        open={!!inspectAnnouncement}
        onOpenChange={(open) => {
          if (!open) setInspectAnnouncementId(null);
        }}
      >
        <DialogContent className="w-full sm:max-w-2xl md:max-w-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
          {inspectAnnouncement && (
            <>
              {/* Header */}
              <div className="p-6 border-b border-zinc-200/60 dark:border-white/[0.06] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-violet-500" />
                      <span>{inspectAnnouncement.tag || "System Update"}</span>
                    </span>
                    {inspectAnnouncement.version && (
                      <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-white/[0.06]">
                        {inspectAnnouncement.version}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-3xs text-zinc-400 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(inspectAnnouncement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <DialogTitle className="text-base md:text-lg font-bold text-zinc-950 dark:text-white leading-tight">
                  {inspectAnnouncement.title}
                </DialogTitle>

                <div className="flex items-center gap-2 text-3xs text-zinc-500 dark:text-zinc-400">
                  <Avatar name={inspectAnnouncement.author?.name} size="sm" />
                  <span>
                    Published by{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {inspectAnnouncement.author?.name || "Workspace Admin"}
                    </strong>
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium ml-2">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Official Update</span>
                  </div>
                </div>
              </div>

              {/* Body: Changelog & Discussions */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Description Content */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Release Notes & Details
                  </h4>
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.05] text-xs md:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-line font-sans">
                    {inspectAnnouncement.content}
                  </div>
                </div>

                {/* Discussions */}
                <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <MessageSquare className="w-4 h-4 text-violet-500" />
                    <span>Discussion & Inquiries ({inspectAnnouncement.comments?.length || 0})</span>
                  </div>

                  {/* Comment list */}
                  {inspectAnnouncement.comments && inspectAnnouncement.comments.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {inspectAnnouncement.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.04] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar name={comment.user?.name} size="sm" />
                              <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                                {comment.user?.name}
                              </span>
                              <span className="text-3xs font-mono px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-white/[0.05] text-zinc-500">
                                {comment.user?.role || "MEMBER"}
                              </span>
                            </div>
                            <span className="text-3xs text-zinc-400 font-mono">
                              {new Date(comment.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 pl-7 leading-relaxed">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic py-2">
                      No responses yet. Feel free to leave a question or feedback below.
                    </p>
                  )}

                  {/* Comment input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={commentInputs[inspectAnnouncement.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [inspectAnnouncement.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(inspectAnnouncement.id);
                        }
                      }}
                      placeholder="Write your feedback, question, or comment..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={
                        submittingCommentId === inspectAnnouncement.id ||
                        !commentInputs[inspectAnnouncement.id]?.trim()
                      }
                      onClick={() => handleAddComment(inspectAnnouncement.id)}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {submittingCommentId === inspectAnnouncement.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Post</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm font-bold">Publish System Update</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Broadcast announcements and release notes to all workspace members
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Update Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Work Graph 2.0 Release - Real-Time Communication"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Tag / Category
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="System Update">System Update</option>
                  <option value="Major Release">Major Release</option>
                  <option value="Security Patch">Security Patch</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Feature Drop">Feature Drop</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.4.0"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Changelog / Release Details *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Describe updates, fixes, and improvements implemented..."
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAnnouncementMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {createAnnouncementMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <span>Broadcast Update</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
