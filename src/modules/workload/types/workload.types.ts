import { User } from "../../auth/types/auth.types";

export interface MemberWorkload {
  memberId: string;
  user: User;
  role: string;
  designation?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string } | null;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
  weeklyCapacityHours: number;
  assignedOpenHours: number;
  activeTasksCount: number;
  overdueTasksCount: number;
  completedTasksCount: number;
  utilizationPercentage: number;
  workloadStatus: "UNDERUTILIZED" | "BALANCED" | "HIGH" | "OVERLOADED";
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    estimatedHours: number;
    dueDate: string | null;
    project: {
      id: string;
      name: string;
    };
  }>;
}

export interface WorkloadResponse {
  members: MemberWorkload[];
  summary: {
    totalMembers: number;
    totalOpenHours: number;
    totalWeeklyCapacity: number;
    averageUtilization: number;
    overloadedCount: number;
    highWorkloadCount: number;
    balancedCount: number;
    underutilizedCount: number;
  };
}
