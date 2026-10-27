import { apiClient } from "../../../lib/api-client";

export interface NewsfeedPostItem {
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
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
  likesCount: number;
  commentsCount: number;
}

export interface NewsfeedCommentItem {
  id: string;
  postId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  createdAt: string;
}

export interface NewsfeedFeedResponse {
  enabled: boolean;
  posts: NewsfeedPostItem[];
}

export const newsfeedActions = {
  getFeed: async (): Promise<NewsfeedFeedResponse> => {
    return apiClient<NewsfeedFeedResponse>("/newsfeed");
  },

  createPost: async (data: {
    content: string;
    imageUrl?: string;
  }): Promise<NewsfeedPostItem> => {
    return apiClient<NewsfeedPostItem>("/newsfeed/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  toggleLikePost: async (postId: string): Promise<{ liked: boolean }> => {
    return apiClient<{ liked: boolean }>(`/newsfeed/posts/${postId}/like`, {
      method: "POST",
    });
  },

  getComments: async (postId: string): Promise<NewsfeedCommentItem[]> => {
    return apiClient<NewsfeedCommentItem[]>(`/newsfeed/posts/${postId}/comments`);
  },

  addComment: async (postId: string, content: string): Promise<NewsfeedCommentItem> => {
    return apiClient<NewsfeedCommentItem>(`/newsfeed/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  toggleAccess: async (enabled: boolean): Promise<any> => {
    return apiClient<any>("/newsfeed/toggle-access", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });
  },
};
