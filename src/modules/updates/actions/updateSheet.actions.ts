import { apiClient } from "../../../lib/api-client";
import { ProfileItem } from "../../stations/actions/station.actions";

export interface ProfileUpdateItem {
  id: string;
  organizationId: string;
  profileId: string;
  stationId?: string | null;
  authorId: string;
  title: string;
  message: string;
  documentUrl?: string | null;
  linkUrl?: string | null;
  status: "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  profile?: ProfileItem;
  station?: {
    id: string;
    stationNumber: number;
    name: string;
  } | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const updateSheetActions = {
  getUpdates: async (profileId?: string): Promise<ProfileUpdateItem[]> => {
    const query = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
    return apiClient<ProfileUpdateItem[]>(`/updates${query}`);
  },

  createUpdate: async (data: {
    profileId: string;
    title: string;
    message: string;
    documentUrl?: string;
    linkUrl?: string;
    priority?: string;
  }): Promise<ProfileUpdateItem> => {
    return apiClient<ProfileUpdateItem>("/updates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (
    updateId: string,
    status: "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED"
  ): Promise<ProfileUpdateItem> => {
    return apiClient<ProfileUpdateItem>(`/updates/${updateId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
