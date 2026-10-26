import { User } from "../../auth/types/auth.types";
import { Task } from "../../tasks/types/task.types";

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks?: number;
  todoTasks: number;
  overdueTasks: number;
  progress: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  startDate?: string | null;
  dueDate?: string | null;
  createdBy: User;
  members: User[];
  metrics: ProjectMetrics;
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRiskSummary {
  projectId: string;
  summary: {
    totalTasks: number;
    highRiskCount: number;
    overdueCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
  risks: Array<{
    taskId: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    estimatedHours: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "OVERDUE";
    riskReasons: string[];
    assignee?: User | null;
  }>;
}
