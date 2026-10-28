import { apiClient } from "../../../lib/api-client";

export interface DepartmentItem {
  id: string;
  organizationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  managerId?: string | null;
  isDefault?: boolean;
  manager?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  teams: TeamItem[];
  _count?: { members: number; teams: number };
}

export interface TeamItem {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  description?: string | null;
  serviceType?: string | null;
  leaderId?: string | null;
  coLeaderId?: string | null;
  leader?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  coLeader?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  operationManagers?: Array<{
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
  }>;
  members?: Array<{
    id: string;
    userId: string;
    user: { id: string; name: string; email: string; avatarUrl?: string | null };
    designationRel?: { name: string; code?: string } | null;
  }>;
  _count?: { members: number };
}

export interface HierarchyData {
  organization: { id: string; name: string; slug: string };
  executiveLeadership: any[];
  projectManagers: any[];
  operationManagers: any[];
  departments: DepartmentItem[];
  designations: any[];
  totalMembers: number;
  totalDepartments: number;
  totalTeams: number;
}

export const departmentActions = {
  getDepartments: async (organizationId?: string): Promise<DepartmentItem[]> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<DepartmentItem[]>(`/departments${query}`);
  },

  createDepartment: async (data: { name: string; code?: string; description?: string; managerId?: string }): Promise<DepartmentItem> => {
    return apiClient<DepartmentItem>("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDepartment: async (id: string, data: Partial<{ name: string; code: string; description: string; managerId: string | null }>): Promise<DepartmentItem> => {
    return apiClient<DepartmentItem>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteDepartment: async (id: string): Promise<void> => {
    return apiClient<void>(`/departments/${id}`, {
      method: "DELETE",
    });
  },

  createTeam: async (departmentId: string, data: { name: string; description?: string; leaderId?: string; coLeaderId?: string }): Promise<TeamItem> => {
    return apiClient<TeamItem>(`/departments/${departmentId}/teams`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTeam: async (teamId: string, data: Partial<{ name: string; description: string; leaderId: string | null; coLeaderId: string | null }>): Promise<TeamItem> => {
    return apiClient<TeamItem>(`/departments/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    return apiClient<void>(`/departments/teams/${teamId}`, {
      method: "DELETE",
    });
  },

  assignOperationManager: async (teamId: string, userId: string): Promise<any> => {
    return apiClient<any>(`/departments/teams/${teamId}/operation-managers`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  removeOperationManager: async (teamId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/departments/teams/${teamId}/operation-managers/${userId}`, {
      method: "DELETE",
    });
  },

  updateMemberHierarchy: async (
    userId: string,
    data: {
      designation?: string;
      designationId?: string | null;
      customDesignation?: string | null;
      departmentId?: string | null;
      teamId?: string | null;
      weeklyCapacityHours?: number;
    }
  ): Promise<any> => {
    return apiClient<any>(`/departments/members/${userId}/hierarchy`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  getHierarchy: async (organizationId?: string): Promise<HierarchyData> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient<HierarchyData>(`/departments/hierarchy${query}`);
  },

  addMemberToTeam: async (teamId: string, userId: string): Promise<any> => {
    return apiClient<any>(`/departments/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  removeMemberFromTeam: async (teamId: string, userId: string): Promise<void> => {
    return apiClient<void>(`/departments/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });
  },
};
