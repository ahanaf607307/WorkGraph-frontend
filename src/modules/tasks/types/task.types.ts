import { User } from "../../auth/types/auth.types";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "OVERDUE";

export interface TaskDependencyItem {
  dependencyId: string;
  task: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string | null;
  };
}

export interface TaskComment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: User | null;
  createdById: string;
  createdBy?: User;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours: number;
  riskLevel?: RiskLevel;
  riskReasons?: string[];
  project?: {
    id: string;
    name: string;
    organizationId: string;
  };
  predecessorDependencies?: Array<{
    predecessorTask: {
      id: string;
      title: string;
      status: TaskStatus;
    };
  }>;
  comments?: TaskComment[];
  _count?: {
    comments: number;
    predecessorDependencies: number;
    dependentDependencies: number;
  };
  createdAt: string;
  updatedAt: string;
}
