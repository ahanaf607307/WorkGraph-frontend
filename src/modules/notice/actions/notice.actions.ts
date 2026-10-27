import { apiClient } from "../../../lib/api-client";

export interface NoticeItem {
  id: string;
  organizationId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: string;
  };
  title: string;
  content: string;
  priority: "GENERAL" | "IMPORTANT" | "URGENT";
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  likesCount: number;
  commentsCount: number;
}

export interface NoticeCommentItem {
  id: string;
  noticeId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  isEdited?: boolean;
  createdAt: string;
}

export const noticeActions = {
  getNotices: async (): Promise<NoticeItem[]> => {
    return apiClient<NoticeItem[]>("/notices");
  },

  createNotice: async (data: {
    title: string;
    content: string;
    priority?: "GENERAL" | "IMPORTANT" | "URGENT";
    imageUrl?: string;
  }): Promise<NoticeItem> => {
    return apiClient<NoticeItem>("/notices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  toggleLikeNotice: async (noticeId: string): Promise<{ liked: boolean }> => {
    return apiClient<{ liked: boolean }>(`/notices/${noticeId}/like`, {
      method: "POST",
    });
  },

  getComments: async (noticeId: string): Promise<NoticeCommentItem[]> => {
    return apiClient<NoticeCommentItem[]>(`/notices/${noticeId}/comments`);
  },

  addComment: async (noticeId: string, content: string): Promise<NoticeCommentItem> => {
    return apiClient<NoticeCommentItem>(`/notices/${noticeId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  updateComment: async (commentId: string, content: string): Promise<NoticeCommentItem> => {
    return apiClient<NoticeCommentItem>(`/notices/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
  },
};
