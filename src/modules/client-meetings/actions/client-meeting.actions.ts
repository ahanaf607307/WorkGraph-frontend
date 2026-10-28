import { apiClient } from "../../../lib/api-client";

export type ClientMeetingStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface ClientMeetingItem {
  id: string;
  organizationId: string;
  projectId: string;
  profileId?: string | null;
  profileUsername: string;
  title: string;
  description?: string | null;
  link: string;
  status: ClientMeetingStatus;
  scheduledAt: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: string;
  };
  project: {
    id: string;
    name: string;
    status: string;
    priority: string;
    clientName?: string | null;
  };
  profile?: {
    id: string;
    name: string;
    username: string;
    platform: string;
    email?: string | null;
  } | null;
}

export const clientMeetingActions = {
  getClientMeetings: async (projectId?: string, status?: string): Promise<ClientMeetingItem[]> => {
    const params = new URLSearchParams();
    if (projectId) params.append("projectId", projectId);
    if (status && status !== "ALL") params.append("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<ClientMeetingItem[]>(`/client-meetings${query}`);
  },

  createClientMeeting: async (data: {
    projectId: string;
    profileUsername: string;
    profileId?: string;
    link: string;
    title?: string;
    description?: string;
    scheduledAt?: string;
  }): Promise<ClientMeetingItem> => {
    return apiClient<ClientMeetingItem>("/client-meetings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateClientMeetingStatus: async (
    meetingId: string,
    status: ClientMeetingStatus
  ): Promise<ClientMeetingItem> => {
    return apiClient<ClientMeetingItem>(`/client-meetings/${meetingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  deleteClientMeeting: async (meetingId: string): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/client-meetings/${meetingId}`, {
      method: "DELETE",
    });
  },
};
