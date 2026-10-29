import { apiClient } from "../../../lib/api-client";

export interface MonthlyTargetItem {
  id: string;
  organizationId: string;
  departmentId?: string | null;
  teamId?: string | null;
  targetType: "DEPARTMENT" | "TEAM" | "SALES_GLOBAL" | "SALES_SERVICE" | string;
  month: number;
  year: number;
  title: string;
  description?: string | null;
  targetMetric: string;
  targetValue: number;
  achievedValue: number;
  progressPercentage: number;
  status: "IN_PROGRESS" | "ACHIEVED" | "AT_RISK" | "EXCEEDED";
  notes?: string | null;
  createdById: string;
  updatedById?: string | null;
  department?: { id: string; name: string; code?: string | null } | null;
  serviceId?: string | null;
  service?: { id: string; name: string; code?: string | null } | null;
  team?: {
    id: string;
    name: string;
    leaderId?: string | null;
    coLeaderId?: string | null;
    leader?: { id: string; name: string; email: string } | null;
    coLeader?: { id: string; name: string; email: string } | null;
  } | null;
  createdBy?: { id: string; name: string; email: string } | null;
  updatedBy?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const targetActions = {
  getTargets: async (
    organizationId: string,
    filters?: {
      departmentId?: string;
      teamId?: string;
      serviceId?: string;
      month?: number;
      year?: number;
      targetType?: string;
      periodType?: "MONTHLY" | "YEARLY";
    }
  ): Promise<MonthlyTargetItem[]> => {
    const params = new URLSearchParams();
    if (filters?.departmentId) params.append("departmentId", filters.departmentId);
    if (filters?.teamId) params.append("teamId", filters.teamId);
    if (filters?.serviceId) params.append("serviceId", filters.serviceId);
    if (filters?.month !== undefined) params.append("month", String(filters.month));
    if (filters?.year) params.append("year", String(filters.year));
    if (filters?.targetType) params.append("targetType", filters.targetType);
    if (filters?.periodType) params.append("periodType", filters.periodType);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<MonthlyTargetItem[]>(`/targets/${organizationId}${query}`);
  },

  createTarget: async (
    organizationId: string,
    data: {
      targetType: "DEPARTMENT" | "TEAM" | "SALES_GLOBAL" | "SALES_SERVICE" | string;
      periodType?: "MONTHLY" | "YEARLY";
      departmentId?: string;
      teamId?: string;
      serviceId?: string;
      month?: number;
      year?: number;
      title: string;
      description?: string;
      targetMetric?: string;
      targetValue: number;
    }
  ): Promise<MonthlyTargetItem> => {
    return apiClient<MonthlyTargetItem>(`/targets/${organizationId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTargetProgress: async (
    organizationId: string,
    targetId: string,
    data: {
      achievedValue?: number;
      status?: string;
      notes?: string;
    }
  ): Promise<MonthlyTargetItem> => {
    return apiClient<MonthlyTargetItem>(`/targets/${organizationId}/${targetId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};
