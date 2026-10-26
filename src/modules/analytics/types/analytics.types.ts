export interface AnalyticsOverview {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  highRiskTasks: number;
  teamUtilization: number;
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

export interface TaskBreakdown {
  statusBreakdown: Array<{ name: string; count: number }>;
  priorityBreakdown: Array<{ name: string; count: number }>;
}

export interface CompletionTrendPoint {
  date: string;
  completed: number;
  created: number;
}
