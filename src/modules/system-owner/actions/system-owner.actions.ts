import { apiClient } from "../../../lib/api-client";

export interface SystemPlatformOverview {
  metrics: {
    totalOrganizations: number;
    pendingApprovals: number;
    approvedOrganizations: number;
    totalUsers: number;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    industry?: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
    companySize?: string | null;
    phone?: string | null;
    website?: string | null;
    country?: string | null;
    createdAt: string;
    createdBy?: {
      id: string;
      name: string;
      email: string;
      employeeId?: string | null;
      createdAt: string;
    };
    _count: {
      members: number;
    };
  }>;
}

export const systemOwnerActions = {
  getPlatformOverview: async (): Promise<SystemPlatformOverview> => {
    return apiClient<SystemPlatformOverview>("/organizations/system-overview");
  },

  updateCompanyStatus: async (
    orgId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED"
  ): Promise<any> => {
    return apiClient<any>(`/organizations/${orgId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  provisionSystemAdmin: async (data: {
    companyName: string;
    adminName: string;
    adminEmail: string;
    password?: string;
    industry?: string;
    companySize?: string;
    phone?: string;
    website?: string;
    country?: string;
  }): Promise<any> => {
    return apiClient<any>("/organizations/provision-system-admin", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateWorkspaceRegistryInfo: async (
    orgId: string,
    data: {
      name?: string;
      slug?: string;
      industry?: string;
      companySize?: string;
      phone?: string;
      website?: string;
      country?: string;
      status?: string;
      workspaceCode?: string;
      adminName?: string;
      adminEmail?: string;
    }
  ): Promise<any> => {
    return apiClient<any>(`/organizations/${orgId}/registry-info`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
