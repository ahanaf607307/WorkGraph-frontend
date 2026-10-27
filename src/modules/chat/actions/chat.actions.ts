import { apiClient } from "../../../lib/api-client";

export interface ChatParticipant {
  id: string;
  userId: string;
  role?: "OWNER" | "ADMIN" | "MEMBER";
  isAdmin?: boolean;
  lastReadAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  content: string;
  attachments?: any;
  readBy: string[];
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  organizationId: string;
  type: "DIRECT" | "GROUP";
  name?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  isBlocked?: boolean;
  blockedById?: string | null;
  lastMessageAt?: string | null;
  lastMessage?: ChatMessageItem | null;
  participants: ChatParticipant[];
  unreadCount?: number;
}

export const chatActions = {
  getConversations: async (): Promise<ConversationItem[]> => {
    return apiClient<ConversationItem[]>("/chat/conversations");
  },

  getOrCreateDirectConversation: async (targetUserId: string): Promise<ConversationItem> => {
    return apiClient<ConversationItem>("/chat/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ targetUserId }),
    });
  },

  createGroupConversation: async (data: {
    name: string;
    description?: string;
    participantUserIds: string[];
  }): Promise<ConversationItem> => {
    return apiClient<ConversationItem>("/chat/conversations/group", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateConversation: async (
    conversationId: string,
    data: { name?: string; description?: string; avatarUrl?: string }
  ): Promise<ConversationItem> => {
    return apiClient<ConversationItem>(`/chat/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  blockConversation: async (conversationId: string): Promise<any> => {
    return apiClient<any>(`/chat/conversations/${conversationId}/block`, {
      method: "POST",
    });
  },

  unblockConversation: async (conversationId: string): Promise<any> => {
    return apiClient<any>(`/chat/conversations/${conversationId}/unblock`, {
      method: "POST",
    });
  },

  getConversationMedia: async (conversationId: string): Promise<any[]> => {
    return apiClient<any[]>(`/chat/conversations/${conversationId}/media`);
  },

  addParticipants: async (conversationId: string, userIds: string[]): Promise<any> => {
    return apiClient<any>(`/chat/conversations/${conversationId}/participants`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  },

  removeParticipant: async (conversationId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/chat/conversations/${conversationId}/participants/${userId}`, {
      method: "DELETE",
    });
  },

  getMessages: async (conversationId: string, limit: number = 50): Promise<ChatMessageItem[]> => {
    return apiClient<ChatMessageItem[]>(`/chat/conversations/${conversationId}/messages?limit=${limit}`);
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessageItem> => {
    return apiClient<ChatMessageItem>(`/chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content, attachments }),
    });
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    return apiClient<void>(`/chat/conversations/${conversationId}/read`, {
      method: "POST",
    });
  },

  deleteMessage: async (messageId: string, conversationId?: string): Promise<void> => {
    const url = conversationId
      ? `/chat/conversations/${conversationId}/messages/${messageId}`
      : `/chat/messages/${messageId}`;
    return apiClient<void>(url, {
      method: "DELETE",
    });
  },

  searchUsers: async (query?: string): Promise<any[]> => {
    const q = query ? `?query=${encodeURIComponent(query)}` : "";
    return apiClient<any[]>(`/chat/users${q}`);
  },
};

