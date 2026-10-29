"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  newsfeedActions,
  NewsfeedPostItem,
} from "../../modules/newsfeed/actions/newsfeed.actions";
import { uploadActions } from "../../modules/upload/actions/upload.actions";
import { Avatar } from "../../components/ui/avatar";
import {
  Newspaper,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Send,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  Sparkles,
  Building2,
  Trash2,
  Share2,
  Globe,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  User as UserIcon,
  Pencil,
} from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export const NewsfeedView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Comments drawer / active post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Edit Post State
  const [editingPost, setEditingPost] = useState<NewsfeedPostItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState("");
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);

  const isPrivileged =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN";

  // Fetch global newsfeed
  const {
    data: feedData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["newsfeed", orgId],
    queryFn: () => newsfeedActions.getFeed(),
  });

  const isEnabled = feedData?.enabled ?? true;
  const canAdminister = isPrivileged || (feedData?.isPrivileged ?? false);
  const posts = feedData?.posts || [];

  // Fetch comments for active post
  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ["newsfeed-comments", activeCommentsPostId],
    queryFn: () => newsfeedActions.getComments(activeCommentsPostId!),
    enabled: !!activeCommentsPostId,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; imageUrl?: string }) =>
      newsfeedActions.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      setPostContent("");
      setPostImage("");
      toast.success("Post published to the global newsfeed!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish post");
    },
  });

  // Edit post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({ id, content, imageUrl }: { id: string; content: string; imageUrl?: string }) =>
      newsfeedActions.updatePost(id, { content, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      setEditingPost(null);
      toast.success("Post updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update post");
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => newsfeedActions.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      toast.success("Post deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete post");
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => newsfeedActions.toggleLikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update like");
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ postId, text }: { postId: string; text: string }) =>
      newsfeedActions.addComment(postId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed-comments", activeCommentsPostId] });
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      setCommentText("");
      toast.success("Comment added!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add comment");
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => newsfeedActions.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed-comments", activeCommentsPostId] });
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      toast.success("Comment removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete comment");
    },
  });

  // Toggle feed access mutation (Company Admin / System Owner)
  const toggleAccessMutation = useMutation({
    mutationFn: (newEnabled: boolean) => newsfeedActions.toggleAccess(newEnabled),
    onSuccess: (_, newEnabled) => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed"] });
      toast.success(
        newEnabled
          ? "Newsfeed access has been turned ON for your company members"
          : "Newsfeed access has been turned OFF for your company members"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update company newsfeed access");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadActions.uploadFile(file);
      setPostImage(res.url);
      toast.success("Photo attached!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    try {
      setIsUploadingEditImage(true);
      const res = await uploadActions.uploadFile(file);
      setEditImage(res.url);
      toast.success("Photo attached to post!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingEditImage(false);
    }
  };

  const handleOpenEditModal = (post: NewsfeedPostItem) => {
    setEditingPost(post);
    setEditContent(post.content);
    setEditImage(post.imageUrl || "");
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editContent.trim() && !editImage) {
      toast.error("Please enter some content or attach an image");
      return;
    }
    updatePostMutation.mutate({
      id: editingPost.id,
      content: editContent.trim(),
      imageUrl: editImage || undefined,
    });
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postImage) {
      toast.error("Please enter a message or attach an image");
      return;
    }
    createPostMutation.mutate({
      content: postContent.trim(),
      imageUrl: postImage || undefined,
    });
  };

  const handleCommentSubmit = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate({ postId, text: commentText.trim() });
  };

  const handleSharePost = (postId: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/newsfeed#post-${postId}`;
      navigator.clipboard.writeText(url);
      toast.success("Post link copied to clipboard!");
    }
  };

  // RESTRICTED ACCESS SCREEN (If feed disabled for user's company and user is not admin)
  if (!isEnabled && !canAdminister) {
    return (
      <div className="p-6 md:p-10 max-w-2xl mx-auto my-12">
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#10121b] border border-rose-200 dark:border-rose-950/60 p-8 md:p-12 text-center shadow-2xl space-y-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
              Access Restricted
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Newsfeed Access Disabled
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              Your company administrator for{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">
                {currentOrg?.name || "your organization"}
              </strong>{" "}
              has turned off access to the Global Newsfeed. Team members cannot view, post, or interact with feed updates at this time.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/20"
            >
              <span>Back to Overview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                  Global News Feed
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Platform Stream
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Connect and share updates with everyone across the entire platform
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-zinc-200/60 dark:border-white/[0.08]"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Admin / Governance Control Panel */}
      {canAdminister && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent dark:from-violet-950/40 dark:via-zinc-900/40 dark:to-[#0f1118] border border-violet-500/20 dark:border-violet-500/20 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">
                    Company Newsfeed Access Governance
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
                      isEnabled
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                    )}
                  >
                    {isEnabled ? "ACCESS: ON" : "ACCESS: OFF"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-xl">
                  {currentOrg?.name ? (
                    <>
                      Manage newsfeed availability for members of{" "}
                      <strong className="text-zinc-700 dark:text-zinc-300">
                        {currentOrg.name}
                      </strong>
                      . When toggled OFF, your team members will be locked out of the newsfeed.
                    </>
                  ) : (
                    "Manage global newsfeed availability for your workspace members."
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleAccessMutation.mutate(!isEnabled)}
              disabled={toggleAccessMutation.isPending}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0",
                isEnabled
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
              )}
            >
              {toggleAccessMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isEnabled ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Turn Access OFF</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Turn Access ON</span>
                </>
              )}
            </button>
          </div>

          {/* Admin warning if disabled */}
          {!isEnabled && (
            <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Access is currently OFF for team members.</strong> Regular members see a locked screen and cannot post or view posts. You can preview and moderate because you hold administrative privileges.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Post Creator Box */}
      <div className="rounded-3xl bg-white dark:bg-[#11131c] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3.5">
          <Avatar name={user?.name} size="md" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-950 dark:text-white">
                  {user?.name || "You"}
                </span>
                {currentOrg?.name && (
                  <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {currentOrg.name}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-violet-500" />
                Global Public Post
              </span>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={3}
              placeholder="Share an update, shoutout, milestone, or idea with the whole system..."
              className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 leading-relaxed resize-none placeholder:text-zinc-400 text-zinc-900 dark:text-white transition-all"
            />

            {/* Attached Photo Preview */}
            {postImage && (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/[0.1] max-h-64 bg-black/10">
                <img
                  src={uploadActions.getFileUrl(postImage)}
                  alt="Attachment preview"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPostImage("")}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white transition-colors cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 dark:bg-white/[0.05] dark:hover:bg-violet-950/40 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/50 dark:border-white/[0.06]">
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-violet-500" />
                )}
                <span>{isUploadingImage ? "Uploading..." : "Attach Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handlePostSubmit}
                disabled={
                  createPostMutation.isPending || (!postContent.trim() && !postImage)
                }
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>
                  {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
                </span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Posts Stream */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500 mx-auto" />
          <p className="text-xs text-zinc-400">Loading global stream...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="p-14 text-center space-y-4 bg-white dark:bg-[#11131c] rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <Newspaper className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              No Global Newsfeed Posts Yet
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              Be the first to share an update, milestone, or celebration with everyone across the system!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const hasImage = !!post.imageUrl;
            const imgUrl = hasImage ? uploadActions.getFileUrl(post.imageUrl) : null;
            const isCommentsOpen = activeCommentsPostId === post.id;
            const isPostAuthor = post.authorId === user?.id;
            const canDeletePost =
              isPostAuthor ||
              canAdminister ||
              user?.role === "SYSTEM_OWNER" ||
              user?.role === "system_owner";

            return (
              <article
                key={post.id}
                id={`post-${post.id}`}
                className="bg-white dark:bg-[#11131c] rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] shadow-sm overflow-hidden hover:border-zinc-300 dark:hover:border-white/[0.14] transition-all"
              >
                {/* Author & Header */}
                <div className="p-5 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author?.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-950 dark:text-white">
                          {post.author?.name || "Team Member"}
                        </span>
                        {/* Company Badge */}
                        {post.organization?.name && (
                          <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/60 dark:border-white/[0.08] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-violet-500" />
                            <span>{post.organization.name}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                        {new Date(post.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(post.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSharePost(post.id)}
                      title="Copy link to post"
                      className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {canDeletePost && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(post)}
                        title="Edit post"
                        className="p-1.5 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/40 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}

                    {canDeletePost && (
                      <button
                        type="button"
                        onClick={() => {
                          toast("Delete this post?", {
                            description: "Are you sure you want to permanently delete this post?",
                            action: {
                              label: "Delete",
                              onClick: () => deletePostMutation.mutate(post.id),
                            },
                            cancel: { label: "Cancel", onClick: () => {} },
                          });
                        }}
                        title="Delete post"
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="px-5 py-2">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Attached Image */}
                {imgUrl && (
                  <div className="mt-3 w-full bg-zinc-100 dark:bg-black/30 overflow-hidden max-h-[480px] flex items-center justify-center">
                    <img
                      src={imgUrl}
                      alt="Post visual attachment"
                      className="w-full h-auto object-cover max-h-[480px]"
                    />
                  </div>
                )}

                {/* Actions: Likes & Comments */}
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between mt-3 bg-zinc-50/60 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-5">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => toggleLikeMutation.mutate(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        post.isLiked
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4 transition-transform active:scale-125",
                          post.isLiked &&
                            "fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400"
                        )}
                      />
                      <span>{post.likesCount} Likes</span>
                    </button>

                    {/* Comment button */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentsPostId(isCommentsOpen ? null : post.id)
                      }
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        isCommentsOpen
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-zinc-500 hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
                      )}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400">
                    ID: {post.id.slice(0, 8)}
                  </span>
                </div>

                {/* Expanded Comments Drawer */}
                {isCommentsOpen && (
                  <div className="p-5 bg-zinc-50 dark:bg-[#0c0e15] border-t border-zinc-100 dark:border-white/[0.06] space-y-3.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      <span>Comments ({comments.length})</span>
                      <button
                        type="button"
                        onClick={() => setActiveCommentsPostId(null)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        Collapse
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
                      {loadingComments ? (
                        <div className="text-xs text-zinc-400 text-center py-3 flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                          <span>Loading comments...</span>
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-xs text-zinc-400 text-center py-3">
                          No comments yet. Be the first to reply!
                        </div>
                      ) : (
                        comments.map((c) => {
                          const isCommentAuthor = c.userId === user?.id;
                          const canDeleteComment =
                            isCommentAuthor || isPostAuthor || canAdminister;

                          return (
                            <div
                              key={c.id}
                              className="p-3 rounded-2xl bg-white dark:bg-[#141722] border border-zinc-200/60 dark:border-white/[0.06] flex items-start justify-between gap-3"
                            >
                              <div className="flex items-start gap-2.5 flex-1">
                                <Avatar name={c.user?.name} size="sm" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                                    <span className="font-bold text-zinc-950 dark:text-white">
                                      {c.user?.name || "User"}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      {new Date(c.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                    {c.content}
                                  </p>
                                </div>
                              </div>

                              {canDeleteComment && (
                                <button
                                  type="button"
                                  onClick={() => deleteCommentMutation.mutate(c.id)}
                                  title="Delete comment"
                                  className="text-zinc-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add comment form */}
                    <form
                      onSubmit={(e) => handleCommentSubmit(e, post.id)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        placeholder="Write a constructive comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder:text-zinc-400 text-zinc-900 dark:text-white transition-all"
                      />
                      <button
                        type="submit"
                        disabled={
                          addCommentMutation.isPending || !commentText.trim()
                        }
                        className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm shadow-violet-500/20 flex items-center gap-1.5 text-xs font-bold"
                      >
                        <span>Reply</span>
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <Modal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          title="Edit Newsfeed Post"
          description="Update your post message or image for the whole organization"
          maxWidth="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Post Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                placeholder="Edit your post message..."
                className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 leading-relaxed resize-none text-zinc-900 dark:text-white"
              />
            </div>

            {/* Attached Photo Preview in Edit Modal */}
            {editImage && (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-white/[0.1] max-h-56 bg-black/10">
                <img
                  src={uploadActions.getFileUrl(editImage)}
                  alt="Edit preview"
                  className="w-full h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setEditImage("")}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white transition-colors cursor-pointer shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-violet-50 hover:text-violet-600 dark:bg-white/[0.05] dark:hover:bg-violet-950/40 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer border border-zinc-200/50 dark:border-white/[0.06]">
                {isUploadingEditImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-violet-500" />
                )}
                <span>{isUploadingEditImage ? "Uploading..." : editImage ? "Change Photo" : "Attach Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  disabled={isUploadingEditImage}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePostMutation.isPending || (!editContent.trim() && !editImage)}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {updatePostMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
