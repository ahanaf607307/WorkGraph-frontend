import { apiClient } from "../../../lib/api-client";
import { ProfileItem } from "../../stations/actions/station.actions";
import { ServiceItem } from "../../services/actions/service.actions";

export interface ProfileQueryItem {
  id: string;
  organizationId: string;
  profileId: string;
  serviceId?: string | null;
  authorId: string;
  title: string;
  description: string;
  documentUrl?: string | null;
  linkUrl?: string | null;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
  responseNotes?: string | null;
  profile?: ProfileItem;
  service?: ServiceItem | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    employeeId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const issueSheetActions = {
  getQueries: async (filters?: {
    profileId?: string;
    serviceId?: string;
    status?: string;
  }): Promise<ProfileQueryItem[]> => {
    const params = new URLSearchParams();
    if (filters?.profileId) params.append("profileId", filters.profileId);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.status) params.append("status", filters.status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<ProfileQueryItem[]>(`/issues${query}`);
  },

  createQuery: async (data: {
    profileId: string;
    title: string;
    description: string;
    documentUrl?: string;
    linkUrl?: string;
    priority?: string;
  }): Promise<ProfileQueryItem> => {
    return apiClient<ProfileQueryItem>("/issues", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    queryId: string,
    data: {
      status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
      responseNotes?: string;
    }
  ): Promise<ProfileQueryItem> => {
    return apiClient<ProfileQueryItem>(`/issues/${queryId}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
