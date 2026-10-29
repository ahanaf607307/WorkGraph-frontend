"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  targetActions,
  MonthlyTargetItem,
} from "../../modules/targets/actions/target.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { serviceActions } from "../../modules/services/actions/service.actions";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  Target,
  PlusCircle,
  Network,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Edit3,
  Award,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const TargetsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [periodTab, setPeriodTab] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [activeTab, setActiveTab] = useState<"DEPARTMENT" | "TEAM">("DEPARTMENT");

  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "workspace_admin" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    (currentOrg?.myRole as string) === "system_admin" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN";

  // Query targets for selected period & year
  const { data: targets = [], isLoading } = useQuery({
    queryKey: ["targets", orgId, periodTab, periodTab === "MONTHLY" ? selectedMonth : 0, selectedYear],
    queryFn: () =>
      targetActions.getTargets(orgId!, {
        month: periodTab === "MONTHLY" ? selectedMonth : 0,
        year: selectedYear,
        periodType: periodTab,
      }),
    enabled: !!orgId,
  });

  // Query departments for creation modal
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId,
  });

  // Query services for service-wise target allocation
  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => serviceActions.getServices(),
    enabled: !!orgId,
  });

  // Query squads / teams
  const { data: hierarchy } = useQuery({
    queryKey: ["hierarchy", orgId],
    queryFn: () => departmentActions.getHierarchy(orgId),
    enabled: !!orgId,
  });

  // Extract all squads with department info
  const allTeams = React.useMemo(() => {
    if (!hierarchy?.departments) return [];
    return hierarchy.departments.flatMap((dept: any) =>
      (dept.teams || []).map((t: any) => ({
        ...t,
        departmentName: dept.name,
        departmentId: dept.id,
      }))
    );
  }, [hierarchy]);

  // Create Target Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetForm, setTargetForm] = useState<{
    periodType: "MONTHLY" | "YEARLY";
    targetType: "DEPARTMENT" | "TEAM";
    departmentId: string;
    teamId: string;
    serviceId: string;
    month: number;
    year: number;
    title: string;
    description: string;
    targetMetric: string;
    targetValue: number;
  }>({
    periodType: "MONTHLY",
    targetType: "DEPARTMENT",
    departmentId: "",
    teamId: "",
    serviceId: "",
    month: selectedMonth,
    year: selectedYear,
    title: "",
    description: "",
    targetMetric: "Story Points",
    targetValue: 100,
  });

  const createTargetMutation = useMutation({
    mutationFn: (data: typeof targetForm) => targetActions.createTarget(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets", orgId] });
      setIsCreateModalOpen(false);
      setTargetForm({
        periodType: periodTab,
        targetType: "DEPARTMENT",
        departmentId: "",
        teamId: "",
        serviceId: "",
        month: periodTab === "MONTHLY" ? selectedMonth : 0,
        year: selectedYear,
        title: "",
        description: "",
        targetMetric: "Story Points",
        targetValue: 100,
      });
      toast.success(
        targetForm.periodType === "YEARLY"
          ? "Yearly Target created successfully!"
          : "Monthly Target created successfully!"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create target");
    },
  });

  // Update Progress Modal State (For TL / CL / Admin)
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<MonthlyTargetItem | null>(null);
  const [progressForm, setProgressForm] = useState({
    achievedValue: 0,
    status: "IN_PROGRESS",
    notes: "",
  });

  const updateProgressMutation = useMutation({
    mutationFn: ({ targetId, data }: { targetId: string; data: typeof progressForm }) =>
      targetActions.updateTargetProgress(orgId!, targetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["targets", orgId] });
      setUpdateModalOpen(false);
      setSelectedTarget(null);
      toast.success("Target progress & description updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update target progress");
    },
  });

  // Filter targets for active tab
  const filteredTargets = targets.filter((t) => t.targetType === activeTab);

  // Year navigation
  const prevYear = () => setSelectedYear((y) => y - 1);
  const nextYear = () => setSelectedYear((y) => y + 1);

  // Month navigation
  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" }
  );

  const isLeaderOrCoLeader =
    (currentOrg as any)?.designation === "TEAM_LEADER" ||
    (currentOrg as any)?.designation === "CO_LEADER" ||
    allTeams.some((t: any) => t.leaderId === user?.id || t.coLeaderId === user?.id);

  const canSetTarget = isSystemAdminOrAdmin || isLeaderOrCoLeader;

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Sleek Open Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>{periodTab === "YEARLY" ? "Yearly Targets & Objectives" : "Monthly Targets & Objectives"}</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {periodTab === "YEARLY"
              ? "Establish annual deliverables and track department and squad yearly milestones"
              : "Configure department deliverables and monitor Team Leader monthly achievements"}
          </p>
        </div>

        {/* Mode Selector, Date Navigator & Create Target Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Primary Tab: Monthly vs Yearly */}
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-zinc-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setPeriodTab("MONTHLY")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                periodTab === "MONTHLY"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly</span>
            </button>
            <button
              type="button"
              onClick={() => setPeriodTab("YEARLY")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                periodTab === "YEARLY"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Yearly</span>
            </button>
          </div>

          {/* Date Selector */}
          {periodTab === "MONTHLY" ? (
            <div className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/[0.06] px-2 py-1 rounded-xl">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold px-2 text-zinc-800 dark:text-zinc-200">{monthName}</span>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/[0.06] px-2 py-1 rounded-xl">
              <button
                onClick={prevYear}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold px-2 text-zinc-800 dark:text-zinc-200">Year {selectedYear}</span>
              <button
                onClick={nextYear}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {canSetTarget && (
            <Button
              onClick={() => {
                setTargetForm((prev) => ({
                  ...prev,
                  periodType: periodTab,
                  month: periodTab === "MONTHLY" ? selectedMonth : 0,
                  year: selectedYear,
                  departmentId: departments[0]?.id || "",
                  teamId: allTeams[0]?.id || "",
                }));
                setIsCreateModalOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-3.5 py-1.5 rounded-xl text-xs shadow-sm shadow-violet-600/20 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Set Target</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs: Department Targets vs Team Targets */}
      <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-white/[0.06] pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("DEPARTMENT")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "DEPARTMENT"
                ? "bg-violet-600 text-white font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
            )}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Department Targets ({targets.filter((t) => t.targetType === "DEPARTMENT").length})</span>
          </button>

          <button
            onClick={() => setActiveTab("TEAM")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "TEAM"
                ? "bg-violet-600 text-white font-semibold"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squad Targets ({targets.filter((t) => t.targetType === "TEAM").length})</span>
          </button>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTargets.length === 0 ? (
          <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-zinc-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.02] p-6 space-y-2">
            <Target className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <div className="text-sm font-semibold text-zinc-900 dark:text-white">
              No {activeTab.toLowerCase()} targets configured for {periodTab === "YEARLY" ? `Year ${selectedYear}` : monthName}
            </div>
            <p className="text-2xs text-zinc-400 max-w-sm mx-auto">
              {isSystemAdminOrAdmin
                ? "Click 'Set Target' above to establish deliverables and milestone goals."
                : "Targets will be displayed here once configured by the Workspace Admin or management."}
            </p>
          </div>
        ) : (
          filteredTargets.map((target) => {
            // Check if current user can update this team target
            const isTeamLeadOrCoLead =
              target.team &&
              (target.team.leaderId === user?.id ||
                target.team.coLeaderId === user?.id ||
                currentOrg?.designation === "TEAM_LEADER" ||
                currentOrg?.designation === "CO_LEADER");

            const canUpdateThisTarget = isSystemAdminOrAdmin || isTeamLeadOrCoLead;

            return (
              <div
                key={target.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs hover:border-violet-500/30 transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Badge Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-2xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                        {target.targetType === "DEPARTMENT"
                          ? `🏢 ${target.department?.name || "General Department"}`
                          : `👥 Squad: ${target.team?.name || "Squad"}`}
                      </span>

                      <span className="font-mono font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-white/[0.08] text-3xs">
                        {target.month === 0 ? `📆 FY ${target.year} Annual` : `📅 ${new Date(target.year, target.month - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`}
                      </span>

                      {target.service && (
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 text-3xs">
                          ⚡ {target.service.name}
                        </span>
                      )}
                    </div>

                    <span
                      className={cn(
                        "font-mono font-bold px-2 py-0.5 rounded-full text-3xs",
                        target.status === "ACHIEVED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : target.status === "AT_RISK"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      )}
                    >
                      {target.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-zinc-950 dark:text-white leading-snug">
                      {target.title}
                    </h3>
                    {target.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {target.description}
                      </p>
                    )}
                  </div>

                  {/* Team Leadership Badges */}
                  {target.targetType === "TEAM" && target.team && (
                    <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-2xs space-y-1">
                      <div className="flex items-center justify-between text-zinc-500">
                        <span>Squad Lead (TL):</span>
                        <span className="font-bold text-zinc-900 dark:text-white">
                          {target.team.leader?.name || "Unassigned"}
                        </span>
                      </div>
                      {target.team.coLeader && (
                        <div className="flex items-center justify-between text-zinc-500">
                          <span>Co-Leader (CL):</span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {target.team.coLeader.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Bar & Metric Numbers */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-zinc-500">
                        {target.achievedValue} / {target.targetValue} {target.targetMetric}
                      </span>
                      <span className="text-violet-600 dark:text-violet-400">
                        {target.progressPercentage}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          target.progressPercentage >= 100
                            ? "bg-emerald-500"
                            : target.progressPercentage >= 50
                            ? "bg-violet-600"
                            : "bg-amber-400"
                        )}
                        style={{ width: `${Math.min(100, target.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Progress description / notes by TL */}
                  {target.notes && (
                    <div className="p-3 rounded-2xl bg-violet-50/50 dark:bg-zinc-800/80 border border-violet-100 dark:border-zinc-700/60 text-2xs space-y-1">
                      <div className="text-3xs font-bold uppercase font-mono text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Progress Update by TL / Management:
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                        "{target.notes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-3xs text-zinc-400 font-mono">
                    By {target.createdBy?.name || "Admin"}
                  </div>

                  {canUpdateThisTarget && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTarget(target);
                        setProgressForm({
                          achievedValue: target.achievedValue,
                          status: target.status,
                          notes: target.notes || "",
                        });
                        setUpdateModalOpen(true);
                      }}
                      className="text-2xs font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 mr-1 text-orange-500" />
                      Update Achievement
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set Monthly Target Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                Set Monthly Target ({monthName})
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTargetMutation.mutate(targetForm);
              }}
              className="space-y-4"
            >
              {/* Period Type: Monthly vs Yearly */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Duration Period
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() =>
                      setTargetForm({
                        ...targetForm,
                        periodType: "MONTHLY",
                        month: selectedMonth || 1,
                      })
                    }
                    className={cn(
                      "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      targetForm.periodType === "MONTHLY"
                        ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Monthly Target</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTargetForm({
                        ...targetForm,
                        periodType: "YEARLY",
                        month: 0,
                      })
                    }
                    className={cn(
                      "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                      targetForm.periodType === "YEARLY"
                        ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Yearly Target</span>
                  </button>
                </div>
              </div>

              {/* Month & Year Selection */}
              <div className="grid grid-cols-2 gap-2">
                {targetForm.periodType === "MONTHLY" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Month *
                    </label>
                    <select
                      value={targetForm.month || selectedMonth}
                      onChange={(e) =>
                        setTargetForm({ ...targetForm, month: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2026, i, 1).toLocaleDateString(undefined, { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Target Period
                    </label>
                    <div className="px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>Full Year (Annual)</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Year *
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={targetForm.year}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, year: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Type Switch */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTargetForm({ ...targetForm, targetType: "DEPARTMENT" })}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    targetForm.targetType === "DEPARTMENT"
                      ? "bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  Department Target
                </button>
                <button
                  type="button"
                  onClick={() => setTargetForm({ ...targetForm, targetType: "TEAM" })}
                  className={cn(
                    "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    targetForm.targetType === "TEAM"
                      ? "bg-white dark:bg-zinc-900 text-violet-600 dark:text-violet-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  Team Squad Target
                </button>
              </div>

              {/* Department Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Department *
                </label>
                <select
                  required
                  value={targetForm.departmentId}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, departmentId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Line Selector (Service-wise targets) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Service Line (Service-wise Allocation)
                </label>
                <select
                  value={targetForm.serviceId}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, serviceId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                >
                  <option value="">All Services (General)</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code || "Service"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Squad Selector if Team Target */}
              {targetForm.targetType === "TEAM" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Target Squad / Team *
                  </label>
                  <select
                    required
                    value={targetForm.teamId}
                    onChange={(e) => setTargetForm({ ...targetForm, teamId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  >
                    <option value="">Select Team</option>
                    {allTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.departmentName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Deliverable Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deliver 120 Story Points for Core SaaS Engine"
                  value={targetForm.title}
                  onChange={(e) => setTargetForm({ ...targetForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              {/* Metric & Goal Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Metric Measurement Unit
                  </label>
                  <input
                    type="text"
                    value={targetForm.targetMetric}
                    placeholder="Story Points, Deliverables, etc."
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, targetMetric: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Goal Target Value *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={targetForm.targetValue}
                    onChange={(e) =>
                      setTargetForm({ ...targetForm, targetValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Scope & Milestones (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables, sprint objectives, or quality metrics..."
                  value={targetForm.description}
                  onChange={(e) =>
                    setTargetForm({ ...targetForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  isLoading={createTargetMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-2 text-xs rounded-xl cursor-pointer"
                >
                  Create Target
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress & Notes Modal (For TL / CL / Admin) */}
      {updateModalOpen && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Update Target Achievement
                </h3>
                <p className="text-xs text-zinc-400 max-w-[320px] truncate">
                  {selectedTarget.title} ({selectedTarget.targetValue} {selectedTarget.targetMetric})
                </p>
              </div>
              <button
                onClick={() => setUpdateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProgressMutation.mutate({
                  targetId: selectedTarget.id,
                  data: progressForm,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Achieved Value ({selectedTarget.targetMetric})
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={progressForm.achievedValue}
                    onChange={(e) =>
                      setProgressForm({
                        ...progressForm,
                        achievedValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Status
                  </label>
                  <select
                    value={progressForm.status}
                    onChange={(e) =>
                      setProgressForm({ ...progressForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono"
                  >
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="ACHIEVED">ACHIEVED</option>
                    <option value="AT_RISK">AT_RISK</option>
                    <option value="EXCEEDED">EXCEEDED</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Progress Description / Squad Notes (by TL / CL)
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail how much of the target was fulfilled this month, key sprint completions, blockers resolved..."
                  value={progressForm.notes}
                  onChange={(e) =>
                    setProgressForm({ ...progressForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUpdateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  isLoading={updateProgressMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 text-xs rounded-xl cursor-pointer"
                >
                  Save Progress
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
