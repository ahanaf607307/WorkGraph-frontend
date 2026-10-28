import { apiClient } from "../../../lib/api-client";

export type MeetingStatus = "UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED";

export interface MeetingItem {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  link: string;
  status: MeetingStatus;
  scheduledAt: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface MeetingPermissionUser {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleInOrg: string;
  designation: string;
  canAccess: boolean;
  canCreate: boolean;
  isOwner: boolean;
}

export interface UserMeetingAccess {
  canAccess: boolean;
  canCreate: boolean;
  isSystemAdmin: boolean;
}

export const meetingActions = {
  getMeetings: async (orgId?: string, status?: string): Promise<MeetingItem[]> => {
    const params = new URLSearchParams();
    if (orgId) params.append("organizationId", orgId);
    if (status && status !== "ALL") params.append("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<MeetingItem[]>(`/meetings${query}`);
  },

  createMeeting: async (data: {
    organizationId?: string;
    title: string;
    description?: string;
    link: string;
    scheduledAt?: string;
  }): Promise<MeetingItem> => {
    return apiClient<MeetingItem>("/meetings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateMeetingStatus: async (
    meetingId: string,
    status: MeetingStatus,
    orgId?: string
  ): Promise<MeetingItem> => {
    const query = orgId ? `?organizationId=${orgId}` : "";
    return apiClient<MeetingItem>(`/meetings/${meetingId}/status${query}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  deleteMeeting: async (meetingId: string, orgId?: string): Promise<{ success: boolean }> => {
    const query = orgId ? `?organizationId=${orgId}` : "";
    return apiClient<{ success: boolean }>(`/meetings/${meetingId}${query}`, {
      method: "DELETE",
    });
  },

  getPermissions: async (orgId?: string): Promise<MeetingPermissionUser[]> => {
    const query = orgId ? `?organizationId=${orgId}` : "";
    return apiClient<MeetingPermissionUser[]>(`/meetings/permissions${query}`);
  },

  updatePermission: async (data: {
    organizationId?: string;
    userId: string;
    canAccess: boolean;
    canCreate: boolean;
  }): Promise<any> => {
    return apiClient<any>("/meetings/permissions", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getMyAccess: async (orgId?: string): Promise<UserMeetingAccess> => {
    const query = orgId ? `?organizationId=${orgId}` : "";
    return apiClient<UserMeetingAccess>(`/meetings/my-access${query}`);
  },
};
