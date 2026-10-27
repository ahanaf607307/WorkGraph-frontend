import { apiClient } from "../../../lib/api-client";

export interface AnnouncementCommentItem {
  id: string;
  announcementId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: string;
  };
}

export interface AnnouncementItem {
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
  tag?: string | null;
  version?: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: AnnouncementCommentItem[];
}

export const announcementActions = {
  getAnnouncements: async (): Promise<AnnouncementItem[]> => {
    return apiClient<AnnouncementItem[]>("/announcements");
  },

  createAnnouncement: async (data: {
    title: string;
    content: string;
    tag?: string;
    version?: string;
  }): Promise<AnnouncementItem> => {
    return apiClient<AnnouncementItem>("/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  addComment: async (
    announcementId: string,
    content: string
  ): Promise<AnnouncementCommentItem> => {
    return apiClient<AnnouncementCommentItem>(`/announcements/${announcementId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};
