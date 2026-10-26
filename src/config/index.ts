export const APP_CONFIG = {
  name: "Work Graph",
  description: "Intelligent Project & Workload Manager",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000",
  tokenKey: "workgraph_access_token",
  userKey: "workgraph_user",
  currentOrgKey: "workgraph_active_org_id",
};

export const TASK_STATUSES = [
  { value: "TODO", label: "To Do", color: "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 font-medium" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700 font-medium" },
  { value: "IN_REVIEW", label: "In Review", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-medium" },
  { value: "DONE", label: "Done", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-medium" },
] as const;

export const TASK_PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-medium" },
  { value: "MEDIUM", label: "Medium", color: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 font-medium" },
  { value: "HIGH", label: "High", color: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 font-medium" },
  { value: "URGENT", label: "Urgent", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 font-semibold" },
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
