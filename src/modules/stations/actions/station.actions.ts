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
  activeProfiles?: ProfileItem[];
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

  createStation: async (data?: { name?: string; stationNumber?: number }): Promise<StationItem> => {
    return apiClient<StationItem>("/stations", {
      method: "POST",
      body: JSON.stringify(data || {}),
    });
  },

  deleteStation: async (stationId: string): Promise<void> => {
    return apiClient<void>(`/stations/${stationId}`, {
      method: "DELETE",
    });
  },

  joinStation: async (data: {
    stationId?: string;
    stationNumber?: number;
    profileId?: string;
    profileIds?: string[];
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

  updateProfile: async (
    profileId: string,
    data: {
      name?: string;
      username?: string;
      serviceId?: string | null;
      platform?: string;
    }
  ): Promise<ProfileItem> => {
    return apiClient<ProfileItem>(`/stations/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteProfile: async (profileId: string): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/stations/profiles/${profileId}`, {
      method: "DELETE",
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

  getMyActiveStation: async (): Promise<StationItem | null> => {
    return apiClient<StationItem | null>("/stations/my-active");
  },

  validateProfileUsername: async (
    username: string
  ): Promise<{
    valid: boolean;
    username?: string;
    profile?: {
      id: string;
      name: string;
      username: string;
      serviceId?: string | null;
      serviceName?: string | null;
      stationedUser?: { id: string; name: string; email: string } | null;
    };
    message: string;
  }> => {
    return apiClient(
      `/stations/validate-profile?username=${encodeURIComponent(username)}`
    );
  },
};
