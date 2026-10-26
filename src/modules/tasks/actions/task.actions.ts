import { apiClient } from "../../../lib/api-client";
import { Task, TaskComment, TaskDependencyItem, TaskStatus } from "../types/task.types";
import { TaskFormData } from "../schemas/task.schema";

export const taskActions = {
  fetchTasks: async (filters: {
    projectId?: string;
    organizationId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
    overdue?: boolean;
  }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters.projectId) params.append("projectId", filters.projectId);
    if (filters.organizationId) params.append("organizationId", filters.organizationId);
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.assigneeId) params.append("assigneeId", filters.assigneeId);
    if (filters.search) params.append("search", filters.search);
    if (filters.overdue) params.append("overdue", "true");

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<Task[]>(`/tasks${query}`);
  },

  fetchTaskById: async (taskId: string): Promise<Task> => {
    return apiClient<Task>(`/tasks/${taskId}`);
  },

  createTask: async (projectId: string, data: TaskFormData & { predecessorTaskIds?: string[] }): Promise<Task> => {
    return apiClient<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        projectId,
      }),
    });
  },

  updateTask: async (taskId: string, data: Partial<TaskFormData>): Promise<Task> => {
    return apiClient<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<Task> => {
    return apiClient<Task>(`/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  updateTaskAssignee: async (taskId: string, assigneeId: string | null): Promise<Task> => {
    return apiClient<Task>(`/tasks/${taskId}/assignee`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeId }),
    });
  },

  deleteTask: async (taskId: string): Promise<void> => {
    return apiClient<void>(`/tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  addComment: async (taskId: string, content: string): Promise<TaskComment> => {
    return apiClient<TaskComment>(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },

  fetchDependencies: async (taskId: string): Promise<{
    prerequisites: TaskDependencyItem[];
    dependents: TaskDependencyItem[];
  }> => {
    return apiClient<{
      prerequisites: TaskDependencyItem[];
      dependents: TaskDependencyItem[];
    }>(`/tasks/${taskId}/dependencies`);
  },

  addDependency: async (taskId: string, predecessorTaskId: string): Promise<any> => {
    return apiClient(`/tasks/${taskId}/dependencies`, {
      method: "POST",
      body: JSON.stringify({ predecessorTaskId }),
    });
  },

  removeDependency: async (dependencyId: string): Promise<void> => {
    return apiClient<void>(`/tasks/dependencies/${dependencyId}`, {
      method: "DELETE",
    });
  },
};
