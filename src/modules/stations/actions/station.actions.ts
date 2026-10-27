import { apiClient } from "../../../lib/api-client";

export interface ProfileItem {
  id: string;
  organizationId: string;
  name: string;
  username: string;
  serviceId?: string | null;
  service?: { id: string; name: string; code?: string | null } | null;
  platform?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  activeStations?: Array<{
    id: string;
    name: string;
    stationNumber: number;
    status: string;
    currentUser?: { id: string; name: string } | null;
  }>;
}

export interface StationItem {
  id: string;
  organizationId: string;
  stationNumber: number;
  name: string;
  status: "ACTIVE" | "OCCUPIED" | "MAINTENANCE";
  currentUserId?: string | null;
  currentProfileId?: string | null;
  joinedAt?: string | null;
  currentProfile?: ProfileItem | null;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    employeeId?: string | null;
  } | null;
}

export const stationActions = {
  getStations: async (): Promise<StationItem[]> => {
    return apiClient<StationItem[]>("/stations");
  },

  joinStation: async (data: {
    stationId?: string;
    stationNumber?: number;
    profileId: string;
  }): Promise<StationItem> => {
    return apiClient<StationItem>("/stations/join", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  leaveStation: async (stationId: string): Promise<StationItem> => {
    return apiClient<StationItem>(`/stations/leave/${stationId}`, {
      method: "POST",
    });
  },

  getProfiles: async (serviceId?: string): Promise<ProfileItem[]> => {
    const query = serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : "";
    return apiClient<ProfileItem[]>(`/stations/profiles${query}`);
  },

  createProfile: async (data: {
    name: string;
    username: string;
    serviceId?: string;
    platform?: string;
  }): Promise<ProfileItem> => {
    return apiClient<ProfileItem>("/stations/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  checkUsername: async (
    username: string
  ): Promise<{ available: boolean; username: string; message: string }> => {
    return apiClient<{ available: boolean; username: string; message: string }>(
      `/stations/check-username?username=${encodeURIComponent(username)}`
    );
  },

  updateMemberService: async (
    userId: string,
    serviceId: string | null
  ): Promise<any> => {
    return apiClient(`/stations/members/${userId}/service`, {
      method: "PATCH",
      body: JSON.stringify({ serviceId }),
    });
  },
};
