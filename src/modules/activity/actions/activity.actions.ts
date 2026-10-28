import { apiClient } from "../../../lib/api-client";

export interface ActivityActor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface ActivityLogItem {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
  createdAt: string;
  actor: ActivityActor;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ActivityResponse {
  logs: ActivityLogItem[];
  userRole: string;
  isOrgAdminOrOwner: boolean;
  isLeaderOrCoLeader: boolean;
  leaderTeamIds: string[];
}

export const activityActions = {
  getActivities: async (params?: {
    organizationId?: string;
    teamId?: string;
    limit?: number;
  }): Promise<ActivityResponse> => {
    const query = new URLSearchParams();
    if (params?.organizationId) query.set("organizationId", params.organizationId);
    if (params?.teamId && params.teamId !== "ALL") query.set("teamId", params.teamId);
    if (params?.limit) query.set("limit", String(params.limit));

    const qs = query.toString();
    const endpoint = `/activity${qs ? `?${qs}` : ""}`;
    return apiClient<ActivityResponse>(endpoint);
  },
};
