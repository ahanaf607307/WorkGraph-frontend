import { apiClient } from "../../../lib/api-client";

export interface PermissionUser {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleInOrg: string;
  designation: string;
  canAccess: boolean;
  canManage: boolean;
  isOwner: boolean;
}

export interface UserPermissionCheck {
  canAccess: boolean;
  canManage: boolean;
  isSystemAdmin: boolean;
}

export const permissionActions = {
  getPermissions: async (
    orgId?: string,
    featureKey = "general"
  ): Promise<PermissionUser[]> => {
    const params = new URLSearchParams();
    if (orgId) params.append("organizationId", orgId);
    params.append("featureKey", featureKey);
    return apiClient<PermissionUser[]>(`/permissions?${params.toString()}`);
  },

  updatePermission: async (data: {
    organizationId?: string;
    userId: string;
    featureKey: string;
    canAccess?: boolean;
    canManage?: boolean;
  }): Promise<any> => {
    return apiClient<any>("/permissions", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  checkPermission: async (
    orgId?: string,
    featureKey = "general"
  ): Promise<UserPermissionCheck> => {
    const params = new URLSearchParams();
    if (orgId) params.append("organizationId", orgId);
    params.append("featureKey", featureKey);
    return apiClient<UserPermissionCheck>(`/permissions/check?${params.toString()}`);
  },
};
