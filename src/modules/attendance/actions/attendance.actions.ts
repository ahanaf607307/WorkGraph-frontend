import { apiClient } from "../../../lib/api-client";

export interface DailyTaskLogItem {
  id: string;
  attendanceId: string;
  organizationId: string;
  userId: string;
  projectId?: string | null;
  project?: { id: string; name: string } | null;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  timeSpentMinutes: number;
  date: string;
  updateMessage?: string | null;
  adminComment?: string | null;
  adminCommentedAt?: string | null;
  adminCommenterName?: string | null;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "LATE";
  workingMinutes: number;
  notes?: string | null;
  isManualOverride: boolean;
  overriddenById?: string | null;
  dailyTasks?: DailyTaskLogItem[];
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    employeeId?: string | null;
    avatarUrl?: string | null;
    organizationMemberships?: Array<{
      role?: string;
      department?: { id: string; name: string } | null;
      team?: { id: string; name: string } | null;
      designationRel?: { title?: string; name: string } | null;
    }>;
  };
}

export const attendanceActions = {
  checkIn: async (organizationId: string): Promise<AttendanceRecord> => {
    return apiClient<AttendanceRecord>(`/attendance/${organizationId}/check-in`, {
      method: "POST",
    });
  },

  checkOut: async (organizationId: string): Promise<AttendanceRecord> => {
    return apiClient<AttendanceRecord>(`/attendance/${organizationId}/check-out`, {
      method: "POST",
    });
  },

  getMyAttendance: async (
    organizationId: string,
    month?: number,
    year?: number
  ): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (month) params.append("month", String(month));
    if (year) params.append("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<AttendanceRecord[]>(`/attendance/${organizationId}/my${query}`);
  },

  addDailyTask: async (
    organizationId: string,
    data: {
      date?: string;
      projectId?: string;
      title: string;
      description?: string;
      status?: string;
      timeSpentMinutes?: number;
    }
  ): Promise<DailyTaskLogItem> => {
    return apiClient<DailyTaskLogItem>(`/attendance/${organizationId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDailyTask: async (
    organizationId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      timeSpentMinutes?: number;
      updateMessage?: string;
      adminComment?: string;
    }
  ): Promise<DailyTaskLogItem> => {
    return apiClient<DailyTaskLogItem>(`/attendance/${organizationId}/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getOrganizationAttendance: async (
    organizationId: string,
    date?: string,
    employeeId?: string,
    departmentId?: string
  ): Promise<AttendanceRecord[]> => {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (employeeId) params.append("employeeId", employeeId);
    if (departmentId) params.append("departmentId", departmentId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient<AttendanceRecord[]>(`/attendance/${organizationId}/admin/overview${query}`);
  },

  adminManualOverride: async (
    organizationId: string,
    data: {
      userId: string;
      date: string;
      checkInTime?: string | Date | null;
      checkOutTime?: string | Date | null;
      status?: string;
      notes?: string;
    }
  ): Promise<AttendanceRecord> => {
    return apiClient<AttendanceRecord>(`/attendance/${organizationId}/admin/override`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMemberAttendanceHistory: async (
    organizationId: string,
    memberId: string
  ): Promise<AttendanceRecord[]> => {
    return apiClient<AttendanceRecord[]>(`/attendance/${organizationId}/members/${memberId}/history`);
  },
};
