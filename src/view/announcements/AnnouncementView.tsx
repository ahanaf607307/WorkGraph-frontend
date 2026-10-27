"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  announcementActions,
  AnnouncementItem,
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

  const isSystemOwner =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    currentOrg?.myRole === "OWNER";

  // Load announcements (available for both system owner and workspace members)
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => announcementActions.getAnnouncements(),
  });

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              System Updates & Announcements
            </h1>
            <p className="text-xs text-zinc-500">
              Live enterprise system releases, infrastructure updates, and feature rollout changelogs
            </p>
          </div>
        </div>

        {isSystemOwner && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Update</span>
          </button>
        )}
      </div>

      {/* Announcements Timeline */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading system announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No System Updates Yet
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            System Administrators and System Owner post platform changelogs, scheduled maintenances, and feature releases here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-colors space-y-5"
            >
              {/* Top metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {item.tag || "System Update"}
                  </span>

                  {item.version && (
                    <span className="px-2.5 py-0.5 rounded-lg text-2xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {item.version}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-2xs text-zinc-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Title & Content */}
              <div>
                <h2 className="text-lg font-bold text-zinc-950 dark:text-white mb-2">
                  {item.title}
                </h2>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50/70 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 font-sans">
                  {item.content}
                </div>
              </div>

              {/* Author footer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-2xs">
                <div className="flex items-center gap-2">
                  <Avatar name={item.author?.name} size="sm" />
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.author?.name || "System Admin"}
                    </span>
                    <span className="text-zinc-400 ml-2 font-mono">
                      ({item.author?.role || "System Management"})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Official Update</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  <MessageSquare className="w-4 h-4 text-violet-500" />
                  <span>Discussion & Comments ({item.comments?.length || 0})</span>
                </div>

                {/* Comment list */}
                {item.comments && item.comments.length > 0 && (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {item.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar name={comment.user?.name} size="sm" />
                            <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                              {comment.user?.name}
                            </span>
                            <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
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
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 pl-6 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Comment input form */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[item.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(item.id);
                      }
                    }}
                    placeholder="Write a comment or query on this update..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
                  />
                  <button
                    type="button"
                    disabled={submittingCommentId === item.id || !commentInputs[item.id]?.trim()}
                    onClick={() => handleAddComment(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {submittingCommentId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Publish System Update</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Broadcast official updates and changelogs to all workspace members
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Update Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Work Graph 2.0 Release - Real-Time Socket.IO & Media Uploads"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Tag / Category
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="System Update">System Update</option>
                  <option value="Major Release">Major Release</option>
                  <option value="Security Patch">Security Patch</option>
                  <option value="Maintenance">Maintenance Window</option>
                  <option value="Feature Drop">Feature Drop</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.4.0"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Changelog / Release Details *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Detail what changes, improvements, and fixes were implemented in this system update..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createAnnouncementMutation.isPending}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {createAnnouncementMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Broadcast Update</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
