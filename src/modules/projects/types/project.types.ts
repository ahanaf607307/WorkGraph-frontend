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

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  orderIndex: number;
  orderId?: string | null;
  startDate?: string | null;
  deadline?: string | null;
  endDate?: string | null;
  budget?: number | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | string;
  quotationUrl?: string | null;
  orderDocumentsUrl?: string | null;
  recordingUrl?: string | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  category?: string | null;
  uploadedById?: string | null;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  orderId?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  salesPersonName?: string | null;
  profileName?: string | null;
  platformName?: string | null;
  budget?: number | null;
  currency?: string | null;
  serviceType?: string | null;
  departmentId?: string | null;
  department?: { id: string; name: string; code?: string | null } | null;
  teamId?: string | null;
  team?: {
    id: string;
    name: string;
    serviceType?: string | null;
    leader?: User | null;
    coLeader?: User | null;
    members?: any[];
  } | null;
  clientHealth?: "GOOD" | "ATTENTION" | "AT_RISK" | "CRITICAL" | string | null;
  meetingRecordingUrl?: string | null;
  conversationDocUrl?: string | null;
  phases?: ProjectPhase[];
  documents?: ProjectDocument[];
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
