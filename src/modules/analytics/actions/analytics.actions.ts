import { apiClient } from "../../../lib/api-client";
import { AnalyticsOverview, TaskBreakdown, CompletionTrendPoint } from "../types/analytics.types";

export const analyticsActions = {
  fetchOverview: async (organizationId?: string): Promise<AnalyticsOverview> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<AnalyticsOverview>(`/analytics/overview${query}`);
  },

  fetchTaskBreakdown: async (organizationId?: string): Promise<TaskBreakdown> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<TaskBreakdown>(`/analytics/tasks${query}`);
  },

  fetchCompletionTrends: async (organizationId?: string): Promise<CompletionTrendPoint[]> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<CompletionTrendPoint[]>(`/analytics/completion-trends${query}`);
  },
};
