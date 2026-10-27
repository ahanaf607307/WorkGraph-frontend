"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth";
import {
  newsfeedActions,
  NewsfeedPostItem,
} from "../../../modules/newsfeed/actions/newsfeed.actions";
import { uploadActions } from "../../../modules/upload/actions/upload.actions";
import { Avatar } from "../../../components/ui/avatar";
import {
  Newspaper,
  Image as ImageIcon,
  Heart,
  MessageSquare,
  Send,
  Upload,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

export const NewsfeedSection: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Comments drawer / active post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const isSuperAdmin =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    currentOrg?.myRole === "OWNER";

  // Fetch newsfeed
  const { data: feedData, isLoading } = useQuery({
    queryKey: ["newsfeed", orgId],
    queryFn: () => newsfeedActions.getFeed(),
    enabled: !!orgId,
  });

  const isEnabled = feedData?.enabled ?? true;
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
      queryClient.invalidateQueries({ queryKey: ["newsfeed", orgId] });
      setPostContent("");
      setPostImage("");
      toast.success("Post published to newsfeed!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish post");
    },
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: (postId: string) => newsfeedActions.toggleLikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed", orgId] });
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
      queryClient.invalidateQueries({ queryKey: ["newsfeed", orgId] });
      setCommentText("");
      toast.success("Comment added!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add comment");
    },
  });

  // Toggle feed access mutation
  const toggleAccessMutation = useMutation({
    mutationFn: (newEnabled: boolean) => newsfeedActions.toggleAccess(newEnabled),
    onSuccess: (data, newEnabled) => {
      queryClient.invalidateQueries({ queryKey: ["newsfeed", orgId] });
      toast.success(
        newEnabled ? "Newsfeed Access is now ON" : "Newsfeed Access turned OFF"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update access");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const res = await uploadActions.uploadFile(file);
      setPostImage(res.url);
      toast.success("Photo attached to post!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postImage) {
      toast.error("Please enter some text or attach an image");
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

  // If feed is disabled and current user is NOT Super Admin, show required exact notice:
  if (!isEnabled && !isSuperAdmin) {
    return (
      <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400">
            Access Off Now
          </h2>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            Workspace Super Admin has toggled newsfeed access off. Public posting, likes, and comments are currently disabled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Super Admin Control Bar */}
      {isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Super Admin Newsfeed Governance</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-3xs font-mono font-bold",
                    isEnabled
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  )}
                >
                  {isEnabled ? "ACCESS: ON" : "ACCESS: OFF"}
                </span>
              </div>
              <p className="text-2xs text-zinc-500">
                You have permission to toggle newsfeed availability across the entire workspace.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleAccessMutation.mutate(!isEnabled)}
            disabled={toggleAccessMutation.isPending}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 w-fit",
              isEnabled
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            )}
          >
            {isEnabled ? (
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
      )}

      {/* If feed is disabled but user is Super Admin, show status warning */}
      {!isEnabled && isSuperAdmin && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center">
          <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
            Access Off Now (Visible to Members as Restricted)
          </div>
          <p className="text-xs text-rose-500/90 mt-0.5">
            Regular members see &quot;Access Off Now&quot;. You can turn access back ON using the button above.
          </p>
        </div>
      )}

      {/* Post Creator Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <Avatar name={user?.name} size="md" />
          <div className="flex-1 space-y-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={3}
              placeholder="Share an update, shoutout, milestone, or idea with the entire team..."
              className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-orange-500 leading-relaxed resize-none placeholder:text-zinc-400"
            />

            {/* Attached Photo Preview */}
            {postImage && (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-56">
                <img
                  src={uploadActions.getFileUrl(postImage)}
                  alt="Post Attachment"
                  className="w-full h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPostImage("")}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer">
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-orange-500" />
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
                disabled={createPostMutation.isPending || (!postContent.trim() && !postImage)}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{createPostMutation.isPending ? "Posting..." : "Publish Post"}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Posts */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-zinc-400">Loading newsfeed...</div>
      ) : posts.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto">
            <Newspaper className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Newsfeed Posts Yet
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Be the first to share a post, celebratory milestone, or team picture!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const hasImage = !!post.imageUrl;
            const imgUrl = hasImage ? uploadActions.getFileUrl(post.imageUrl) : null;
            const isCommentsOpen = activeCommentsPostId === post.id;

            return (
              <div
                key={post.id}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden"
              >
                {/* Author Header */}
                <div className="p-5 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={post.author?.name} size="md" />
                    <div>
                      <div className="text-xs font-bold text-zinc-950 dark:text-white">
                        {post.author?.name || "Member"}
                      </div>
                      <div className="text-3xs text-zinc-400">
                        {new Date(post.createdAt).toLocaleDateString()} at{" "}
                        {new Date(post.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <span className="text-3xs font-mono font-bold uppercase text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
                    Feed Post
                  </span>
                </div>

                {/* Post Content */}
                <div className="px-5 py-2">
                  <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Post Image (Multer) */}
                {imgUrl && (
                  <div className="mt-3 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden max-h-96">
                    <img
                      src={imgUrl}
                      alt="Post content"
                      className="w-full h-auto object-cover max-h-96"
                    />
                  </div>
                )}

                {/* Actions: Likes & Comments */}
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between mt-3 bg-zinc-50/50 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-5">
                    {/* Like button */}
                    <button
                      type="button"
                      onClick={() => toggleLikeMutation.mutate(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        post.isLiked
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-zinc-500 hover:text-rose-600 dark:text-zinc-400"
                      )}
                    >
                      <Heart
                        className={cn(
                          "w-4 h-4",
                          post.isLiked && "fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400"
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
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-zinc-500 hover:text-orange-600 dark:text-zinc-400"
                      )}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount} Comments</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Comments */}
                {isCommentsOpen && (
                  <div className="p-5 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Comments ({comments.length})
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                      {loadingComments ? (
                        <div className="text-2xs text-zinc-400 text-center py-2">
                          Loading comments...
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="text-2xs text-zinc-400 text-center py-2">
                          No comments yet on this post.
                        </div>
                      ) : (
                        comments.map((c) => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-start gap-2.5"
                          >
                            <Avatar name={c.user?.name} size="sm" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-2xs mb-0.5">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                  {c.user?.name || "User"}
                                </span>
                                <span className="text-3xs text-zinc-400 font-mono">
                                  {new Date(c.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment input form */}
                    <form
                      onSubmit={(e) => handleCommentSubmit(e, post.id)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-orange-500 placeholder:text-zinc-400"
                      />
                      <button
                        type="submit"
                        disabled={addCommentMutation.isPending || !commentText.trim()}
                        className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
