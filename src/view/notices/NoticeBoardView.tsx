"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  noticeActions,
  NoticeItem,
  NoticeCommentItem,
} from "../../modules/notice/actions/notice.actions";
import { uploadActions } from "../../modules/upload/actions/upload.actions";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import {
  BellRing,
  Plus,
  Heart,
  MessageSquare,
  Upload,
  X,
  AlertTriangle,
  Clock,
  Send,
  Sparkles,
  Edit3,
  Check,
  Calendar,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export const NoticeBoardView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"GENERAL" | "IMPORTANT" | "URGENT">("GENERAL");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Comment input state
  const [commentText, setCommentText] = useState("");

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const isAdminOrOwner =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "BUSINESS_OWNER";

  // Load notices
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices", orgId],
    queryFn: () => noticeActions.getNotices(),
    enabled: !!orgId,
  });

  // Selected notice object
  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) || null;

  // Load comments for active notice modal
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ["notice-comments", selectedNoticeId],
    queryFn: () => noticeActions.getComments(selectedNoticeId!),
    enabled: !!selectedNoticeId,
  });

  // Create notice mutation
  const createNoticeMutation = useMutation({
    mutationFn: (data: {
      title: string;
      content: string;
      priority: "GENERAL" | "IMPORTANT" | "URGENT";
      imageUrl?: string;
    }) => noticeActions.createNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices", orgId] });
      setShowCreateModal(false);
      setTitle("");
      setContent("");
      setImageUrl("");
      setPriority("GENERAL");
      toast.success("Notice published to workspace!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish notice");
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (id: string) => noticeActions.toggleLikeNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices", orgId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update like");
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ noticeId, text }: { noticeId: string; text: string }) =>
      noticeActions.addComment(noticeId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notice-comments", selectedNoticeId] });
      queryClient.invalidateQueries({ queryKey: ["notices", orgId] });
      setCommentText("");
      toast.success("Comment added");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add comment");
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) =>
      noticeActions.updateComment(commentId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notice-comments", selectedNoticeId] });
      setEditingCommentId(null);
      setEditingCommentText("");
      toast.success("Comment updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update comment");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadActions.uploadFile(file);
      setImageUrl(res.url);
      toast.success("Notice banner image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    createNoticeMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      priority,
      imageUrl: imageUrl || undefined,
    });
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedNoticeId) return;
    addCommentMutation.mutate({ noticeId: selectedNoticeId, text: commentText.trim() });
  };

  const handleStartEditComment = (comment: NoticeCommentItem) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    editCommentMutation.mutate({ commentId, text: editingCommentText.trim() });
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return (
          <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            URGENT
          </span>
        );
      case "IMPORTANT":
        return (
          <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800">
            IMPORTANT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            GENERAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Workspace Notice Board
            </h1>
            <p className="text-xs text-zinc-500">
              Official company notices, circulars, announcements, and policy broadcasts
            </p>
          </div>
        </div>

        {isAdminOrOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 w-fit cursor-pointer shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </Button>
        )}
      </div>

      {/* Notices Grid: Compact Initial Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto">
            <BellRing className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Notices Published Yet
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Workspace administrators can post important updates, documents, and news here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {notices.map((notice) => {
            const hasImage = !!notice.imageUrl;
            const bannerUrl = hasImage ? uploadActions.getFileUrl(notice.imageUrl) : null;

            return (
              <div
                key={notice.id}
                onClick={() => setSelectedNoticeId(notice.id)}
                className="flex flex-col justify-between bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-lg hover:border-orange-500/50 dark:hover:border-orange-500/40 transition-all duration-200 cursor-pointer group"
                title="Click to view full notice & discussion"
              >
                <div>
                  {/* Banner Image Preview */}
                  {bannerUrl ? (
                    <div className="w-full h-36 bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                      <img
                        src={bannerUrl}
                        alt={notice.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-2 bg-gradient-to-r from-orange-500 to-amber-500" />
                  )}

                  <div className="p-4 space-y-2.5">
                    {/* Priority & Date */}
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(notice.priority)}
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-sm font-bold text-zinc-950 dark:text-white line-clamp-2 group-hover:text-orange-500 transition-colors leading-snug">
                      {notice.title}
                    </h2>

                    {/* Author Info */}
                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <Avatar name={notice.author?.name} size="sm" />
                      <div className="truncate">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate">
                          {notice.author?.name || "Administrator"}
                        </span>
                        <span className="text-3xs text-zinc-400 font-mono">
                          {notice.author?.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Reaction count & Comment count */}
                <div className="px-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center gap-1 font-semibold text-rose-500/90">
                      <Heart
                        className={cn(
                          "w-3.5 h-3.5",
                          notice.isLiked && "fill-rose-500 text-rose-500"
                        )}
                      />
                      <span>{notice.likesCount}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-orange-500/90">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{notice.commentsCount}</span>
                    </span>
                  </div>

                  <span className="text-3xs font-bold text-orange-600 dark:text-orange-400 group-hover:underline">
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notice Detail & Discussion Modal */}
      {selectedNotice && (
        <Dialog
          open={!!selectedNoticeId}
          onOpenChange={(open) => !open && setSelectedNoticeId(null)}
        >
          <DialogContent maxWidth="xl" className="max-h-[88vh] overflow-y-auto space-y-5 p-6">
            <DialogHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getPriorityBadge(selectedNotice.priority)}
                  <span className="text-3xs font-mono text-zinc-400 uppercase">
                    Official Notice
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{new Date(selectedNotice.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <DialogTitle className="text-lg md:text-xl font-black text-zinc-950 dark:text-white leading-tight">
                {selectedNotice.title}
              </DialogTitle>

              <div className="flex items-center space-x-2.5 pt-2">
                <Avatar name={selectedNotice.author?.name} size="sm" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">
                    {selectedNotice.author?.name || "Administrator"}
                  </div>
                  <div className="text-3xs text-zinc-400 font-mono">
                    {selectedNotice.author?.email}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Banner Image */}
            {selectedNotice.imageUrl && (
              <div className="w-full max-h-72 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800">
                <img
                  src={uploadActions.getFileUrl(selectedNotice.imageUrl)}
                  alt={selectedNotice.title}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Full Notice Description */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line select-text">
              {selectedNotice.content}
            </div>

            {/* Reaction Bar */}
            <div className="flex items-center justify-between py-2 border-y border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => toggleLikeMutation.mutate(selectedNotice.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                  selectedNotice.isLiked
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:text-rose-600"
                )}
              >
                <Heart
                  className={cn(
                    "w-4 h-4",
                    selectedNotice.isLiked && "fill-rose-600 text-rose-600 dark:fill-rose-400"
                  )}
                />
                <span>
                  {selectedNotice.isLiked ? "Liked" : "Like"} ({selectedNotice.likesCount})
                </span>
              </button>

              <div className="text-xs font-semibold text-zinc-400 font-mono flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span>{comments.length} Comments</span>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Discussion & Member Comments
              </h3>

              {/* Add Comment Input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment or response..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="px-3.5 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </Button>
              </form>

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {loadingComments ? (
                  <div className="text-center py-4 text-xs text-zinc-400">
                    Loading comments...
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    No comments yet. Be the first to share feedback!
                  </div>
                ) : (
                  comments.map((c) => {
                    const isMyComment = c.userId === user?.id;
                    const isEditing = editingCommentId === c.id;

                    return (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Avatar name={c.user?.name} size="sm" />
                            <div>
                              <div className="font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-1.5">
                                <span>{c.user?.name || "Member"}</span>
                                {c.isEdited && (
                                  <span className="text-[10px] font-mono text-zinc-400 font-normal italic">
                                    (edited)
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                {new Date(c.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                • {new Date(c.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {isMyComment && !isEditing && (
                            <button
                              type="button"
                              onClick={() => handleStartEditComment(c)}
                              className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                        </div>

                        {/* Comment Body / Edit View */}
                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              rows={2}
                              className="w-full text-xs p-2.5 rounded-xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none"
                            />
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs h-7 px-2.5"
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveEditComment(c.id)}
                                disabled={editCommentMutation.isPending}
                                className="text-xs h-7 px-3 bg-orange-500 hover:bg-orange-600 text-white"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-800 dark:text-zinc-200 pl-8 leading-relaxed whitespace-pre-line select-text">
                            {c.content}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Publish Notice Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent maxWidth="md" className="space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>Publish Official Notice</DialogTitle>
            <DialogDescription>
              Broadcast an official announcement, memo, or update to everyone in your workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Notice Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Annual Company Offsite & Quarter Planning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Broadcast Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="GENERAL">General Notice</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Banner Image (Optional)
                </label>
                <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-orange-500 text-zinc-600 dark:text-zinc-300 text-xs cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  <span>{isUploadingImage ? "Uploading..." : imageUrl ? "Replace Image" : "Upload Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {imageUrl && (
              <div className="relative rounded-2xl overflow-hidden h-28 border border-zinc-200 dark:border-zinc-800">
                <img
                  src={uploadActions.getFileUrl(imageUrl)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Notice Content / Memo Body *
              </label>
              <textarea
                placeholder="Write full circular, guidelines, policy, or meeting points..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                disabled={createNoticeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createNoticeMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Publish Notice
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
