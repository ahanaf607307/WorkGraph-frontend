import { apiClient } from "../../../lib/api-client";

export interface DesignationItem {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  hierarchyLevel: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { members: number };
}

export const designationActions = {
  getDesignations: async (organizationId?: string): Promise<DesignationItem[]> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<DesignationItem[]>(`/designations${query}`);
  },

  createDesignation: async (data: {
    name: string;
    code?: string;
    description?: string;
    hierarchyLevel?: number;
  }): Promise<DesignationItem> => {
    return apiClient<DesignationItem>("/designations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDesignation: async (
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description: string;
      hierarchyLevel: number;
    }>
  ): Promise<DesignationItem> => {
    return apiClient<DesignationItem>(`/designations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteDesignation: async (id: string): Promise<void> => {
    return apiClient<void>(`/designations/${id}`, {
      method: "DELETE",
    });
  },
};
