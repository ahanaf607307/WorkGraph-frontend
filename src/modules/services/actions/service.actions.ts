import { apiClient } from "../../../lib/api-client";

export interface ServiceItem {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    profiles?: number;
    members?: number;
  };
}

export const serviceActions = {
  getServices: async (): Promise<ServiceItem[]> => {
    return apiClient<ServiceItem[]>("/services");
  },

  createService: async (data: {
    name: string;
    code?: string;
    description?: string;
  }): Promise<ServiceItem> => {
    return apiClient<ServiceItem>("/services", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateService: async (
    serviceId: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      status?: string;
    }
  ): Promise<ServiceItem> => {
    return apiClient<ServiceItem>(`/services/${serviceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteService: async (serviceId: string): Promise<{ success: boolean }> => {
    return apiClient<{ success: boolean }>(`/services/${serviceId}`, {
      method: "DELETE",
    });
  },
};
