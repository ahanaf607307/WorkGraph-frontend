"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { Progress } from "../../components/ui/progress";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { KanbanBoardView } from "../tasks/KanbanBoardView";
import { TaskListView } from "../tasks/TaskListView";
import { CreateTaskModal } from "../tasks/CreateTaskModal";
import { EditContractModal } from "./EditContractModal";
import { formatDate } from "../../lib/utils";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  ListTodo,
  Layers,
  Flame,
  Plus,
  Briefcase,
  DollarSign,
  UserCheck,
  Video,
  FileText,
  ExternalLink,
  Shield,
  Building,
  Users2,
  Trash2,
  Phone,
  Mail,
  Activity,
  Milestone,
  Edit3,
  Search,
} from "lucide-react";

export const ProjectOverviewView: React.FC<{ projectId: string; initialTab?: string }> = ({
  projectId,
  initialTab = "board",
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [showProjectGuide, setShowProjectGuide] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editContractModalOpen, setEditContractModalOpen] = useState(false);
  const [addPhaseModalOpen, setAddPhaseModalOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDeadline, setNewPhaseDeadline] = useState("");
  const [newPhaseBudget, setNewPhaseBudget] = useState<number | "">("");

  // Squad Members Modal State
  const { user, currentOrg } = useAuth();
  const [squadMembersModalOpen, setSquadMembersModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedAddUserId, setSelectedAddUserId] = useState("");
  const [selectedAddRole, setSelectedAddRole] = useState<"LEADER" | "CO_LEADER" | "MEMBER">("MEMBER");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectActions.fetchProjectById(projectId),
    enabled: !!projectId,
  });

  const { data: riskReport } = useQuery({
    queryKey: ["project-risks", projectId],
    queryFn: () => projectActions.fetchProjectRisks(projectId),
    enabled: !!projectId,
  });

  const { data: orgMembers = [] } = useQuery({
    queryKey: ["org-members", currentOrg?.id],
    queryFn: () => (currentOrg?.id ? userActions.getMembers(currentOrg.id) : Promise.resolve([])),
    enabled: !!currentOrg?.id && squadMembersModalOpen,
  });

  const isSystemAdminOrAdmin =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    user?.role === "WORKSPACE_ADMIN" ||
    (user?.role as string) === "workspace_admin" ||
    user?.role === "SYSTEM_ADMIN" ||
    (user?.role as string) === "system_admin" ||
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "WORKSPACE_ADMIN" ||
    (currentOrg?.myRole as string) === "workspace_admin" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    currentOrg?.myRole === "ADMIN";

  const isLeaderOrCoLeader =
    user?.role === "TEAM_LEADER" ||
    user?.role === "CO_LEADER" ||
    currentOrg?.myRole === "TEAM_LEADER" ||
    currentOrg?.myRole === "CO_LEADER" ||
    (project?.team as any)?.leader?.id === user?.id ||
    (project?.team as any)?.coLeader?.id === user?.id ||
    (project?.members as any[])?.some(
      (m: any) => (m.userId === user?.id || m.user?.id === user?.id) && (m.role === "LEADER" || m.role === "CO_LEADER")
    );

  const canManageMembers = isSystemAdminOrAdmin || isLeaderOrCoLeader;

  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string; role: "LEADER" | "CO_LEADER" | "MEMBER" }) =>
      projectActions.addProjectMember(projectId, data),
    onSuccess: () => {
      toast.success("Project member assigned successfully");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedAddUserId("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add member"),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "LEADER" | "CO_LEADER" | "MEMBER" }) =>
      projectActions.updateProjectMemberRole(projectId, memberId, role),
    onSuccess: () => {
      toast.success("Member role updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update role"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => projectActions.removeProjectMember(projectId, memberId),
    onSuccess: () => {
      toast.success("Member removed from project");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to remove member"),
  });

  // Extract all unique squad and project members with their employeeId and designation
  const allSquadMembers = React.useMemo(() => {
    if (!project) return [];
    const memberMap = new Map<string, any>();

    // 1. Team Leader
    const leader = project.team?.leader as any;
    if (leader) {
      memberMap.set(leader.id, {
        id: leader.id,
        name: leader.name,
        email: leader.email,
        avatarUrl: leader.avatarUrl,
        employeeId: leader.employeeId || "EMP-" + leader.id.slice(0, 6).toUpperCase(),
        role: "Team Leader",
        rawRole: "LEADER",
        badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800",
        isDirectMember: false,
      });
    }

    // 2. Team Co-Leader
    const coLeader = project.team?.coLeader as any;
    if (coLeader) {
      memberMap.set(coLeader.id, {
        id: coLeader.id,
        name: coLeader.name,
        email: coLeader.email,
        avatarUrl: coLeader.avatarUrl,
        employeeId: coLeader.employeeId || "EMP-" + coLeader.id.slice(0, 6).toUpperCase(),
        role: "Co-Leader",
        rawRole: "CO_LEADER",
        badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
        isDirectMember: false,
      });
    }

    // 3. Team Members
    if (project.team?.members && Array.isArray(project.team.members)) {
      for (const m of project.team.members) {
        const u = (m as any).user || m;
        if (u?.id && !memberMap.has(u.id)) {
          memberMap.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
            employeeId: (u as any).employeeId || "EMP-" + u.id.slice(0, 6).toUpperCase(),
            role: (m as any).designationRel?.name || (u as any).role || "Squad Member",
            rawRole: "MEMBER",
            badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800",
            isDirectMember: false,
          });
        }
      }
    }

    // 4. Project Members
    if (project.members && Array.isArray(project.members)) {
      for (const m of project.members) {
        const u = (m as any).user || m;
        if (u?.id) {
          const rawRole = (m as any).role || (u as any).role || "MEMBER";
          let displayRole = "Project Member";
          let badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
          if (rawRole === "LEADER") {
            displayRole = "Project Leader";
            badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800";
          } else if (rawRole === "CO_LEADER") {
            displayRole = "Project Co-Leader";
            badgeColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
          }

          // If member is already in map from team, elevate role if direct project leader/co-leader
          if (memberMap.has(u.id)) {
            const existing = memberMap.get(u.id);
            if (rawRole === "LEADER" || rawRole === "CO_LEADER") {
              existing.role = displayRole;
              existing.rawRole = rawRole;
              existing.badgeColor = badgeColor;
            }
            if ((m as any).id) {
              existing.isDirectMember = true;
              existing.projectMemberId = (m as any).id;
            }
          } else {
            memberMap.set(u.id, {
              id: u.id,
              projectMemberId: (m as any).id,
              name: u.name,
              email: u.email,
              avatarUrl: u.avatarUrl,
              employeeId: (u as any).employeeId || "EMP-" + u.id.slice(0, 6).toUpperCase(),
              role: displayRole,
              rawRole: rawRole,
              badgeColor: badgeColor,
              isDirectMember: Boolean((m as any).id),
            });
          }
        }
      }
    }

    return Array.from(memberMap.values());
  }, [project]);

  const filteredSquadMembers = allSquadMembers.filter((m) =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.employeeId?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Health mutation
  const updateHealthMutation = useMutation({
    mutationFn: (newHealth: string) =>
      projectActions.updateProject(projectId, { clientHealth: newHealth as any }),
    onSuccess: () => {
      toast.success("Client health status updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update health"),
  });

  // Add Phase mutation
  const addPhaseMutation = useMutation({
    mutationFn: (data: any) => projectActions.addPhase(projectId, data),
    onSuccess: () => {
      toast.success("Milestone phase added");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setAddPhaseModalOpen(false);
      setNewPhaseName("");
      setNewPhaseDeadline("");
      setNewPhaseBudget("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to add phase"),
  });

  // Toggle Phase status mutation
  const updatePhaseStatusMutation = useMutation({
    mutationFn: ({ phaseId, status }: { phaseId: string; status: string }) =>
      projectActions.updatePhase(projectId, phaseId, { status }),
    onSuccess: () => {
      toast.success("Phase status updated");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update phase"),
  });

  if (isLoading || !project) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Loading project details...
      </div>
    );
  }

  const clientHealth = project.clientHealth || "GOOD";
  const phases = project.phases || [];
  const completedPhases = phases.filter((ph) => ph.status === "COMPLETED").length;
  const phaseProgress = phases.length > 0 ? Math.round((completedPhases / phases.length) * 100) : 0;

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "GOOD":
        return { label: "GOOD (Healthy)", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800" };
      case "ATTENTION":
        return { label: "ATTENTION NEEDED", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800" };
      case "AT_RISK":
        return { label: "AT RISK", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-800" };
      case "CRITICAL":
        return { label: "CRITICAL ALERT", color: "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-300 border-red-500 animate-pulse" };
      default:
        return { label: health, color: "bg-zinc-100 text-zinc-800" };
    }
  };

  const currentHealthBadge = getHealthBadge(clientHealth);

  return (
    <div className="space-y-6">
      {/* Enterprise Project Banner Header */}
      <div className="bg-white dark:bg-[#0f1118] rounded-2xl p-6 border border-zinc-200/70 dark:border-white/[0.06] shadow-xs space-y-4">
        {/* Top meta tags: Order ID, Platform, Profile, Health */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-100 dark:border-white/[0.04] pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.orderId && (
              <span className="font-mono font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 px-2.5 py-0.5 rounded-full text-2xs shadow-xs">
                #{project.orderId}
              </span>
            )}
            {project.platformName && (
              <span className="font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-0.5 rounded-full text-2xs border border-zinc-200 dark:border-zinc-700">
                🌐 {project.platformName}
              </span>
            )}
            {project.profileName && (
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-3xs">
                Profile: <strong className="text-zinc-900 dark:text-white">{project.profileName}</strong>
              </span>
            )}
            {project.budget && (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md text-2xs border border-emerald-200 dark:border-emerald-800">
                💰 {project.budget.toLocaleString()} {project.currency || "USD"}
              </span>
            )}
          </div>

          {/* Client Health status dropdown */}
          <div className="flex items-center space-x-2">
            <span className="text-3xs text-zinc-400 font-bold uppercase tracking-wider">Client Health:</span>
            <select
              value={clientHealth}
              onChange={(e) => updateHealthMutation.mutate(e.target.value)}
              className={`text-2xs font-bold px-2 py-0.5 rounded-full border cursor-pointer ${currentHealthBadge.color}`}
            >
              <option value="GOOD">🟢 GOOD (Healthy)</option>
              <option value="ATTENTION">🟡 ATTENTION</option>
              <option value="AT_RISK">🔴 AT RISK</option>
              <option value="CRITICAL">🚨 CRITICAL</option>
            </select>
          </div>
        </div>

        {/* Project Title, Description & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <StatusBadge status={project.status} />
              <span className="text-2xs text-zinc-400 font-mono">
                Managed by {project.createdBy?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {project.name}
            </h1>
            <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
              {project.description || "No project description provided."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {project.meetingRecordingUrl && (
              <a
                href={project.meetingRecordingUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs hover:bg-indigo-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Meeting Recording</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            {project.conversationDocUrl && (
              <a
                href={project.conversationDocUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Client Conversation PDF</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowProjectGuide(!showProjectGuide)}
              className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>{showProjectGuide ? "Hide Guide" : "💡 Project Guide"}</span>
            </button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Project Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-zinc-100 dark:border-white/[0.04] text-xs">
          <div>
            <span className="text-zinc-400 block mb-0.5">Task Progress</span>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-zinc-950 dark:text-white">
                {project.metrics.progress}%
              </span>
              <Progress value={project.metrics.progress} className="w-16 h-2" />
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Delivery Phases</span>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-zinc-950 dark:text-white">
                {completedPhases}/{phases.length}
              </span>
              <Progress value={phaseProgress} className="w-16 h-2" />
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Target Deadline</span>
            <div className="flex items-center space-x-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <Calendar className="w-4 h-4 text-violet-500" />
              <span>{formatDate(project.dueDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Assigned Squad</span>
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {project.team?.name || project.department?.name || "Cross-Department"}
            </div>
          </div>

          <div
            onClick={() => setSquadMembersModalOpen(true)}
            className="cursor-pointer group p-2 -m-2 rounded-xl hover:bg-violet-500/10 transition-all border border-transparent hover:border-violet-500/20"
            title="Click to view squad members with Name and ID"
          >
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 block mb-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-400 font-semibold transition-colors">
                Squad Members ({allSquadMembers.length})
              </span>
              <span className="text-3xs text-violet-600 dark:text-violet-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View &rarr;
              </span>
            </div>
            <div className="flex -space-x-1.5 overflow-hidden mt-0.5">
              {(allSquadMembers.length > 0 ? allSquadMembers : project.members || []).slice(0, 5).map((m: any) => (
                <Avatar key={m.id} name={m.name} size="sm" />
              ))}
              {allSquadMembers.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-violet-600 text-white text-3xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0f1118]">
                  +{allSquadMembers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Project Lifecycle Guide */}
      {showProjectGuide && (
        <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-800/40 space-y-3 text-xs text-zinc-700 dark:text-zinc-300 transition-all">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-violet-900 dark:text-violet-200 text-sm flex items-center gap-2">
              <span>Project Delivery Lifecycle & Tab Navigation</span>
            </h3>
            <span className="text-3xs font-mono font-semibold text-violet-600 dark:text-violet-400">
              Click any step to jump
            </span>
          </div>
          <p className="leading-relaxed">
            Manage your project deliverables, squads, and milestones efficiently by following these steps:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div
              onClick={() => setActiveTab("client")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                activeTab === "client"
                  ? "bg-violet-600/10 border-violet-500 shadow-xs"
                  : "bg-white dark:bg-[#0f1118] border-violet-200/60 dark:border-white/[0.06] hover:border-violet-500/50"
              }`}
            >
              <span className="text-3xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                Step 1: Setup
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                Client & Contract Hub
              </span>
              <span className="text-3xs text-zinc-500 dark:text-zinc-400 block leading-normal">
                Review client info, requirements PDF, and meeting recordings.
              </span>
            </div>

            <div
              onClick={() => setActiveTab("phases")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                activeTab === "phases"
                  ? "bg-violet-600/10 border-violet-500 shadow-xs"
                  : "bg-white dark:bg-[#0f1118] border-violet-200/60 dark:border-white/[0.06] hover:border-violet-500/50"
              }`}
            >
              <span className="text-3xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                Step 2: Milestones
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                Phases & Delivery
              </span>
              <span className="text-3xs text-zinc-500 dark:text-zinc-400 block leading-normal">
                Divide project into milestones with dates and budgets.
              </span>
            </div>

            <div
              onClick={() => setCreateModalOpen(true)}
              className="p-3 rounded-xl bg-white dark:bg-[#0f1118] border border-violet-200/60 dark:border-white/[0.06] hover:border-violet-500/50 transition-all cursor-pointer space-y-1"
            >
              <span className="text-3xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                Step 3: Assign
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                + Create Tasks
              </span>
              <span className="text-3xs text-zinc-500 dark:text-zinc-400 block leading-normal">
                Assign tasks to squad members with hour estimates and priorities.
              </span>
            </div>

            <div
              onClick={() => setActiveTab("board")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                activeTab === "board"
                  ? "bg-violet-600/10 border-violet-500 shadow-xs"
                  : "bg-white dark:bg-[#0f1118] border-violet-200/60 dark:border-white/[0.06] hover:border-violet-500/50"
              }`}
            >
              <span className="text-3xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                Step 4: Execute
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                Kanban & Task List
              </span>
              <span className="text-3xs text-zinc-500 dark:text-zinc-400 block leading-normal">
                Drag tasks between TODO, In Progress, Review, and Done.
              </span>
            </div>

            <div
              onClick={() => setActiveTab("risks")}
              className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                activeTab === "risks"
                  ? "bg-violet-600/10 border-violet-500 shadow-xs"
                  : "bg-white dark:bg-[#0f1118] border-violet-200/60 dark:border-white/[0.06] hover:border-violet-500/50"
              }`}
            >
              <span className="text-3xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block">
                Step 5: Govern
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 block text-xs">
                Risk Engine & Health
              </span>
              <span className="text-3xs text-zinc-500 dark:text-zinc-400 block leading-normal">
                Detect delivery delays, bottlenecks, and client relationship health.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] w-fit shadow-xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "board"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kanban Board</span>
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "list"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Task List</span>
        </button>

        <button
          onClick={() => setActiveTab("phases")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "phases"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Milestone className="w-4 h-4" />
          <span>Milestones & Phases ({phases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("client")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "client"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Client & Contract Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "risks"
              ? "bg-violet-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Deadline Risk Engine</span>
          {riskReport && riskReport.summary.highRiskCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-3xs font-mono font-semibold ${
                activeTab === "risks"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
              }`}
            >
              {riskReport.summary.highRiskCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "board" && <KanbanBoardView projectId={projectId} />}
      {activeTab === "list" && <TaskListView projectId={projectId} />}

      {/* Tab: Milestones & Delivery Phases */}
      {activeTab === "phases" && (
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                  Project Delivery Phases & Milestones
                </h3>
                <p className="text-xs text-zinc-500">
                  Track phased development deliverables, milestone completion, and budget allocations.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddPhaseModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Add Phase
              </Button>
            </div>

            {phases.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <Milestone className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No phases added yet</h4>
                <p className="text-xs text-zinc-500 mb-3">Add milestones to track project phases progressively.</p>
                <Button size="sm" variant="outline" onClick={() => setAddPhaseModalOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add First Phase
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {phases.map((ph, index) => {
                  const isCompleted = ph.status === "COMPLETED";
                  const isInProgress = ph.status === "IN_PROGRESS";

                  return (
                    <div
                      key={ph.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted
                          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                          : isInProgress
                          ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            updatePhaseStatusMutation.mutate({
                              phaseId: ph.id,
                              status: isCompleted ? "IN_PROGRESS" : "COMPLETED",
                            })
                          }
                          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-xs"
                              : "border-2 border-zinc-300 dark:border-zinc-700 hover:border-amber-400"
                          }`}
                          title={isCompleted ? "Mark Incomplete" : "Mark Completed"}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-bold text-sm text-zinc-950 dark:text-white">
                              {ph.name}
                            </span>
                            {ph.orderId && (
                              <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Order: #{ph.orderId}
                              </span>
                            )}
                            <span
                              className={`text-3xs font-mono font-bold px-2 py-0.2 rounded-full uppercase ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                  : isInProgress
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {ph.status}
                            </span>
                          </div>
                          {ph.description && (
                            <p className="text-xs text-zinc-500">{ph.description}</p>
                          )}

                          {/* Assignee & Dates & Links */}
                          <div className="flex items-center gap-3 text-3xs text-zinc-500 dark:text-zinc-400 flex-wrap pt-1">
                            {ph.assignedTo && (
                              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-medium text-zinc-700 dark:text-zinc-300">
                                <Avatar name={ph.assignedTo.name} size="sm" />
                                <span>{ph.assignedTo.name}</span>
                              </div>
                            )}

                            {(ph.startDate || ph.deadline || ph.endDate) && (
                              <div className="flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-zinc-400" />
                                <span>
                                  {ph.startDate ? formatDate(ph.startDate) : "TBD"} &rarr;{" "}
                                  {ph.endDate || ph.deadline ? formatDate(ph.endDate || ph.deadline!) : "TBD"}
                                </span>
                              </div>
                            )}

                            {ph.quotationUrl && (
                              <a
                                href={ph.quotationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Quote</span>
                              </a>
                            )}

                            {ph.orderDocumentsUrl && (
                              <a
                                href={ph.orderDocumentsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Docs</span>
                              </a>
                            )}

                            {ph.recordingUrl && (
                              <a
                                href={ph.recordingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                              >
                                <Video className="w-3 h-3" />
                                <span>Recording</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs shrink-0">
                        {ph.deadline && (
                          <div className="text-right">
                            <span className="text-3xs text-zinc-400 uppercase block">Deadline</span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                              {formatDate(ph.deadline)}
                            </span>
                          </div>
                        )}

                        {ph.budget !== null && ph.budget !== undefined && (
                          <div className="text-right">
                            <span className="text-3xs text-zinc-400 uppercase block">Phase Budget</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              ${ph.budget.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <select
                          value={ph.status}
                          onChange={(e) =>
                            updatePhaseStatusMutation.mutate({
                              phaseId: ph.id,
                              status: e.target.value,
                            })
                          }
                          className="px-2.5 py-1 text-2xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold cursor-pointer outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Client & Contract Hub */}
      {activeTab === "client" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Client Profile, Contracts & Documentation Hub
              </h3>
              <p className="text-xs text-zinc-400">
                Manage and update client contact details, commercial sales channels, and meeting recordings.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setEditContractModalOpen(true)}
              className="flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Details Card */}
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" /> Client Profile
                </h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xs font-bold px-2.5 py-0.5 rounded-full border ${currentHealthBadge.color}`}>
                    {currentHealthBadge.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditContractModalOpen(true)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Edit Client Info"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-zinc-400 block mb-0.5">Client / Business Name</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {project.clientName || "Not specified"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-400 block mb-0.5">Client Email</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{project.clientEmail || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 block mb-0.5">Phone / WhatsApp</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{project.clientPhone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-400 block mb-0.5">Sales Person</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {project.salesPersonName || "Direct / Company"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 block mb-0.5">Platform</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {project.platformName || "Direct"}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Execution Squad & Dept Card */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" /> Squad & Department
              </h3>
              {project.serviceType && (
                <span className="text-2xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                  {project.serviceType}
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-zinc-400 block mb-0.5">Department</span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {project.department?.name || "General Engineering"}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-400 block mb-0.5">Execution Squad</span>
                  <span className="font-bold text-sm text-zinc-900 dark:text-white">
                    {project.team?.name || "Assigned Team"}
                  </span>
                </div>
              </div>

              {project.team?.leader && (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Team Leader</span>
                  <div className="flex items-center space-x-2">
                    <Avatar name={project.team.leader.name} size="sm" />
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {project.team.leader.name}
                    </span>
                  </div>
                </div>
              )}

              {project.team?.coLeader && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Co-Leader</span>
                  <div className="flex items-center space-x-2">
                    <Avatar name={project.team.coLeader.name} size="sm" />
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {project.team.coLeader.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recordings & Conversation Docs Hub */}
          <Card className="p-6 md:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-500" /> Meetings & Client Developer Conversation Docs
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditContractModalOpen(true)}
                className="flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Attach / Edit Links</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-500" /> Client Meeting Recording
                  </span>
                  {project.meetingRecordingUrl && (
                    <span className="text-3xs font-mono text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold">
                      Available
                    </span>
                  )}
                </div>

                {project.meetingRecordingUrl ? (
                  <div className="space-y-2">
                    <p className="text-2xs text-zinc-500 truncate font-mono">
                      {project.meetingRecordingUrl}
                    </p>
                    <a
                      href={project.meetingRecordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white font-bold text-xs hover:bg-indigo-600 transition-colors cursor-pointer"
                    >
                      <span>Watch Recording</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No meeting recording link attached to this project.</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-500" /> Client-Developer Conversation PDF
                  </span>
                  {project.conversationDocUrl && (
                    <span className="text-3xs font-mono text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded font-bold">
                      Available
                    </span>
                  )}
                </div>

                {project.conversationDocUrl ? (
                  <div className="space-y-2">
                    <p className="text-2xs text-zinc-500 truncate font-mono">
                      {project.conversationDocUrl}
                    </p>
                    <a
                      href={project.conversationDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors cursor-pointer"
                    >
                      <span>View / Download PDF</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">No conversation PDF documentation attached.</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}

      {/* Tab: Deadline Risk Engine */}
      {activeTab === "risks" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-base font-bold text-zinc-950 dark:text-white mb-1">
              Deterministic Deadline Risk Analysis
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              All evaluations are calculated using deterministic rules based on task due date, remaining estimated effort, calendar buffer, and prerequisite task completion.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/60 text-center">
                <div className="text-2xs text-zinc-400 font-semibold uppercase">Total Evaluated</div>
                <div className="text-xl font-bold text-zinc-950 dark:text-white mt-1">
                  {riskReport?.summary.totalTasks || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center">
                <div className="text-2xs text-rose-600 font-semibold uppercase">Overdue</div>
                <div className="text-xl font-bold text-rose-600 mt-1">
                  {riskReport?.summary.overdueCount || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-center">
                <div className="text-2xs text-orange-600 font-semibold uppercase">High Risk</div>
                <div className="text-xl font-bold text-orange-600 mt-1">
                  {riskReport?.summary.highRiskCount || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-center">
                <div className="text-2xs text-emerald-600 font-semibold uppercase">On Track / Low Risk</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {riskReport?.summary.lowRiskCount || 0}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(riskReport?.risks || []).map((item) => (
                <div
                  key={item.taskId}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-zinc-950 dark:text-white">
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <ul className="text-xs text-zinc-500 space-y-0.5 list-disc pl-5">
                      {item.riskReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right text-xs">
                      <div className="text-zinc-400">Assigned to: {item.assignee?.name || "Unassigned"}</div>
                      <div className="font-mono text-zinc-600 dark:text-zinc-300">
                        {formatDate(item.dueDate)}
                      </div>
                    </div>
                    <RiskBadge riskLevel={item.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      {/* Add Phase Modal */}
      <Modal
        isOpen={addPhaseModalOpen}
        onClose={() => setAddPhaseModalOpen(false)}
        title="Add Delivery Phase"
        description="Define a new project deliverable, timeline, and budget allocation."
        maxWidth="md"
      >
        <div className="space-y-4 mt-2">
          <Input
            id="phaseName"
            label="Phase Name *"
            placeholder="e.g. Phase 3: QA & Production Deployment"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="phaseDeadline"
              type="date"
              label="Phase Deadline"
              value={newPhaseDeadline}
              onChange={(e) => setNewPhaseDeadline(e.target.value)}
            />

            <Input
              id="phaseBudget"
              type="number"
              label="Phase Budget ($)"
              placeholder="1500"
              value={newPhaseBudget}
              onChange={(e) => setNewPhaseBudget(e.target.value ? Number(e.target.value) : "")}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button variant="outline" size="sm" onClick={() => setAddPhaseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newPhaseName.trim() || addPhaseMutation.isPending}
              onClick={() =>
                addPhaseMutation.mutate({
                  name: newPhaseName.trim(),
                  deadline: newPhaseDeadline || null,
                  budget: newPhaseBudget || null,
                  status: "PENDING",
                })
              }
            >
              Add Phase
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Contract & Client Info Modal */}
      <EditContractModal
        isOpen={editContractModalOpen}
        onClose={() => setEditContractModalOpen(false)}
        project={project}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["project", projectId] })}
      />

      {/* Squad Members Inspection Modal (Name & ID) */}
      <Modal
        isOpen={squadMembersModalOpen}
        onClose={() => setSquadMembersModalOpen(false)}
        title={`Squad Members (${allSquadMembers.length})`}
        description={`Assigned personnel and operational members for "${project.name}"`}
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, role, or email..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Add Member Bar (Leaders & Admins only) */}
          {canManageMembers && (
            <div className="p-3.5 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40 space-y-2.5">
              <div className="text-xs font-bold text-violet-900 dark:text-violet-300 flex items-center justify-between">
                <span>Assign Project Personnel & Leadership</span>
                <span className="text-3xs font-medium text-violet-600 dark:text-violet-400">
                  Roles: Leader, Co-Leader, Member
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <select
                  value={selectedAddUserId}
                  onChange={(e) => setSelectedAddUserId(e.target.value)}
                  className="w-full sm:flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">Select team member to assign...</option>
                  {orgMembers
                    .filter((om) => !allSquadMembers.some((sm) => sm.id === om.userId))
                    .map((om) => (
                      <option key={om.id} value={om.userId}>
                        {om.user?.name || om.user?.email} ({om.designationRel?.name || om.role})
                      </option>
                    ))}
                </select>

                <select
                  value={selectedAddRole}
                  onChange={(e) => setSelectedAddRole(e.target.value as any)}
                  className="w-full sm:w-44 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="LEADER">👑 Project Leader</option>
                  <option value="CO_LEADER">⭐ Project Co-Leader</option>
                  <option value="MEMBER">👤 Project Member</option>
                </select>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={!selectedAddUserId || addMemberMutation.isPending}
                  onClick={() =>
                    addMemberMutation.mutate({
                      userId: selectedAddUserId,
                      role: selectedAddRole,
                    })
                  }
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Assign
                </Button>
              </div>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredSquadMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-white/[0.02] rounded-2xl">
                No squad members found matching your search.
              </div>
            ) : (
              filteredSquadMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/[0.06] hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={member.name} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                          {member.name}
                        </span>
                        {/* Employee ID Badge */}
                        <span className="px-2 py-0.5 rounded-md font-mono text-3xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          ID: {member.employeeId}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate block">
                        {member.email}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge or Role Selector */}
                  <div className="flex items-center gap-2">
                    {member.isDirectMember && canManageMembers ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={member.rawRole || "MEMBER"}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              memberId: member.projectMemberId,
                              role: e.target.value as any,
                            })
                          }
                          className="px-2 py-1 rounded-lg text-3xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 cursor-pointer"
                        >
                          <option value="LEADER">👑 Project Leader</option>
                          <option value="CO_LEADER">⭐ Project Co-Leader</option>
                          <option value="MEMBER">👤 Project Member</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMemberMutation.mutate(member.projectMemberId)}
                          title="Remove from project"
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-lg text-3xs font-semibold whitespace-nowrap border ${member.badgeColor}`}
                      >
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
            <span>Assigned Squad: <strong className="text-zinc-800 dark:text-zinc-200">{project.team?.name || project.department?.name || "Cross-Department"}</strong></span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSquadMembersModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
