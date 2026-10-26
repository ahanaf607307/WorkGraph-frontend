export const APP_CONFIG = {
  name: "WorkGraph",
  description: "Intelligent Project & Workload Manager",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000",
  tokenKey: "workgraph_access_token",
  userKey: "workgraph_user",
  currentOrgKey: "workgraph_active_org_id",
};

export const TASK_STATUSES = [
  { value: "TODO", label: "To Do", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800" },
  { value: "IN_REVIEW", label: "In Review", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800" },
  { value: "DONE", label: "Done", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800" },
] as const;

export const TASK_PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-slate-50 text-slate-600 border-slate-200" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "HIGH", label: "High", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "URGENT", label: "Urgent", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export const RISK_LEVELS = [
  { value: "LOW", label: "Low Risk", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "MEDIUM", label: "Medium Risk", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "HIGH", label: "High Risk", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "OVERDUE", label: "Overdue", color: "bg-red-50 text-red-700 border-red-200 font-semibold" },
] as const;

export const WORKLOAD_STATUSES = [
  { value: "UNDERUTILIZED", label: "Underutilized (<50%)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "BALANCED", label: "Balanced (50-100%)", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "HIGH", label: "High Workload (100-125%)", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "OVERLOADED", label: "Overloaded (>125%)", color: "text-red-600 bg-red-50 border-red-200" },
] as const;
