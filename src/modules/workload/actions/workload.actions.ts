import { apiClient } from "../../../lib/api-client";
import { WorkloadResponse } from "../types/workload.types";

export const workloadActions = {
  fetchOrganizationWorkload: async (
    organizationId: string,
    filters?: { memberId?: string; projectId?: string }
  ): Promise<WorkloadResponse> => {
    const params = new URLSearchParams();
    if (filters?.memberId) params.append("memberId", filters.memberId);
    if (filters?.projectId) params.append("projectId", filters.projectId);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<WorkloadResponse>(`/organizations/${organizationId}/workload${query}`);
  },
};
