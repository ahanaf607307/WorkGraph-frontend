import { apiClient } from "../../../lib/api-client";

export interface QueueCommentItem {
  id: string;
  queueId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  linkUrl?: string | null;
  documentUrl?: string | null;
  createdAt: string;
}

export interface QueueItem {
  id: string;
  organizationId: string;
  profileId: string;
  profile: {
    id: string;
    name: string;
    username: string;
    service?: { id: string; name: string } | null;
  };
  serviceId?: string | null;
  service?: { id: string; name: string; code?: string | null } | null;
  clientName: string;
  orderId?: string | null;
  message: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  responseNote?: string | null;
  linkUrl?: string | null;
  documentUrl?: string | null;
  respondedAt?: string | null;
  respondedById?: string | null;
  respondedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  comments: QueueCommentItem[];
  _count?: { comments: number };
  createdAt: string;
  updatedAt: string;
}

export const queueActions = {
  getQueues: async (status?: string): Promise<QueueItem[]> => {
    const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    return apiClient<QueueItem[]>(`/queues${query}`);
  },

  createQueue: async (data: {
    profileName: string;
    serviceId?: string;
    clientName: string;
    orderId?: string;
    message: string;
  }): Promise<QueueItem> => {
    return apiClient<QueueItem>("/queues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateQueue: async (
    id: string,
    data: {
      status?: string;
      responseNote?: string;
      linkUrl?: string;
      documentUrl?: string;
    }
  ): Promise<QueueItem> => {
    return apiClient<QueueItem>(`/queues/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  addComment: async (
    id: string,
    data: {
      content: string;
      linkUrl?: string;
      documentUrl?: string;
    }
  ): Promise<QueueCommentItem> => {
    return apiClient<QueueCommentItem>(`/queues/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
