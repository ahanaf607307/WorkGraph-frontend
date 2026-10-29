"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { activityActions, ActivityLogItem } from "../../modules/activity/actions/activity.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { formatRelativeDate, cn } from "../../lib/utils";
import {
  Activity,
  Filter,
  Search,
  Users,
  Shield,
  Layers,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Lock,
} from "lucide-react";
import {
  PermissionButton,
  PermissionModal,
  useFeaturePermission,
} from "../../components/shared/PermissionModal";

export const ActivityLogView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;



  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // Feature Permission Hook
  const { isSystemAdmin, hasPermission } = useFeaturePermission("ACTIVITY_LOG");
  const canAccessActivity = isSystemAdmin || hasPermission;

  // Fetch departments & squads for the Team filter dropdown
  const { data: departments = [] } = useQuery({
    queryKey: ["departments-activity", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId && canAccessActivity,
  });

  // Flatten all teams
  const allTeams = useMemo(() => {
    const list: Array<{ id: string; name: string; deptName: string }> = [];
    for (const d of departments) {
      if (d.teams && Array.isArray(d.teams)) {
        for (const t of d.teams) {
          list.push({ id: t.id, name: t.name, deptName: d.name });
        }
      }
    }
    return list;
  }, [departments]);

  // Fetch Activity Logs
  const {
    data: activityData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["activities", orgId, selectedTeamFilter],
    queryFn: () =>
      activityActions.getActivities({
        organizationId: orgId,
        teamId: selectedTeamFilter,
        limit: 100,
      }),
    enabled: !!orgId && canAccessActivity,
  });

  const logs = activityData?.logs || [];

  // Filter logs by search term and action type
  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchSearch =
        !searchTerm.trim() ||
        item.actor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.actor?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resourceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(item.metadata || {})
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchAction =
        actionFilter === "ALL" ||
        item.action.toUpperCase().includes(actionFilter.toUpperCase()) ||
        item.resourceType.toUpperCase() === actionFilter.toUpperCase();

      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("CHECKIN")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (act.includes("DELETE") || act.includes("REMOVE")) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (act.includes("UPDATE") || act.includes("OVERRIDE") || act.includes("EDIT")) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
  };

  if (!canAccessActivity) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-zinc-950 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Activity logs are restricted to Workspace Admin and authorized members. Contact your Workspace Admin for permission.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <span>Workspace Activity Log & Audit Trail</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time audit log of team actions, task changes, check-ins, and administrative operations
          </p>
        </div>

        {/* Status & Permissions Buttons */}
        <div className="flex items-center gap-2">
          <PermissionButton onClick={() => setShowPermissionModal(true)} />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Workspace Activity Log</span>
          </div>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.06] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor, action, or metadata..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Team Filter Dropdown (Workspace Admin & Admins) */}
          {isSystemAdmin && (
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.03] px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.08]">
              <Users className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span className="text-3xs font-bold text-zinc-400 uppercase font-mono">
                Team:
              </span>
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Teams & Squads</option>
                {allTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.deptName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.03] px-2.5 py-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.08]">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Event Types</option>
              <option value="TASK">Task Activities</option>
              <option value="PROJECT">Project Events</option>
              <option value="ATTENDANCE">Attendance & Check-in</option>
              <option value="DEPARTMENT">Departments & Squads</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.06] space-y-2">
            <Activity className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              No activity logs recorded
            </h3>
            <p className="text-xs text-zinc-500">
              {selectedTeamFilter !== "ALL"
                ? "No activities found for the selected team."
                : "Operational actions and task activities will appear here automatically."}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const dateStr = formatRelativeDate(log.createdAt);
            const fullDate = new Date(log.createdAt).toLocaleString();

            return (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] hover:border-violet-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar name={log.actor?.name || "User"} size="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                        {log.actor?.name || "System Actor"}
                      </span>
                      <span className="text-3xs text-zinc-400 font-mono">
                        ({log.actor?.email})
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-3xs font-mono font-bold border uppercase tracking-wider",
                          getActionBadgeColor(log.action)
                        )}
                      >
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                        {log.resourceType}:
                      </span>
                      <span className="font-mono text-3xs text-zinc-500">
                        {log.resourceId}
                      </span>
                      {log.metadata && (
                        <span className="text-3xs text-zinc-500 bg-zinc-100 dark:bg-white/[0.04] px-2 py-0.5 rounded font-mono truncate max-w-md">
                          {typeof log.metadata === "string"
                            ? log.metadata
                            : JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-mono flex items-center sm:justify-end gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="text-3xs text-zinc-400 font-mono">
                    {fullDate}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Permission Management Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        featureKey="ACTIVITY_LOG"
        title="Activity Log Permissions"
        description="Grant permission to selected members to view workspace activity logs and audit trail."
      />
    </div>
  );
};
