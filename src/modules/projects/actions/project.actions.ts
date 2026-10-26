import { apiClient } from "../../../lib/api-client";
import { Project, ProjectRiskSummary } from "../types/project.types";
import { ProjectFormData } from "../schemas/project.schema";

export const projectActions = {
  fetchProjects: async (organizationId?: string, status?: string, search?: string): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (organizationId) params.append("organizationId", organizationId);
    if (status) params.append("status", status);
    if (search) params.append("search", search);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<Project[]>(`/projects${query}`);
  },

  fetchProjectById: async (projectId: string): Promise<Project> => {
    return apiClient<Project>(`/projects/${projectId}`);
  },

  createProject: async (organizationId: string, data: ProjectFormData): Promise<Project> => {
    return apiClient<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        organizationId,
      }),
    });
  },

  updateProject: async (projectId: string, data: Partial<ProjectFormData>): Promise<Project> => {
    return apiClient<Project>(`/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    return apiClient<void>(`/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  fetchProjectRisks: async (projectId: string): Promise<ProjectRiskSummary> => {
    return apiClient<ProjectRiskSummary>(`/projects/${projectId}/risks`);
  },
};
