import { apiClient } from "../../../lib/api-client";

export interface ChatParticipant {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
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
};
