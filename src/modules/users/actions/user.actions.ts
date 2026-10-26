import { apiClient } from "../../../lib/api-client";
import { Organization } from "../../auth/types/auth.types";
import { OrganizationMember, ActivityItem, NotificationItem } from "../types/user.types";

export const userActions = {
  getUserOrganizations: async (): Promise<Organization[]> => {
    return apiClient<Organization[]>("/organizations/my-organizations");
  },

  getOrganizationMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
    return apiClient<OrganizationMember[]>(`/organizations/${organizationId}/members`);
  },

  inviteMember: async (
    organizationId: string,
    data: { email: string; role?: string; weeklyCapacityHours?: number }
  ): Promise<OrganizationMember> => {
    return apiClient<OrganizationMember>(`/organizations/${organizationId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateMember: async (
    organizationId: string,
    userId: string,
    data: { role?: string; weeklyCapacityHours?: number }
  ): Promise<OrganizationMember> => {
    return apiClient<OrganizationMember>(
      `/organizations/${organizationId}/members/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  },

  removeMember: async (organizationId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/organizations/${organizationId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  getActivities: async (): Promise<ActivityItem[]> => {
    return apiClient<ActivityItem[]>("/activity");
  },

  getNotifications: async (): Promise<NotificationItem[]> => {
    return apiClient<NotificationItem[]>("/notifications");
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    return apiClient<void>(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  markAllNotificationsAsRead: async (): Promise<void> => {
    return apiClient<void>("/notifications/read-all", {
      method: "PATCH",
    });
  },
};
