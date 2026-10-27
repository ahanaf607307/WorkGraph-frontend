import { apiClient } from "../../../lib/api-client";

export interface DesignationItem {
  id: string;
  organizationId: string;
  departmentId?: string | null;
  department?: { id: string; name: string; code?: string } | null;
  name: string;
  code?: string | null;
  title?: string | null;
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
    title?: string;
    departmentId?: string | null;
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
      title: string;
      departmentId: string | null;
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
