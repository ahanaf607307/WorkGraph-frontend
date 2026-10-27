"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectActions } from "../../modules/projects/actions/project.actions";
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
} from "lucide-react";

export const ProjectOverviewView: React.FC<{ projectId: string; initialTab?: string }> = ({
  projectId,
  initialTab = "board",
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editContractModalOpen, setEditContractModalOpen] = useState(false);
  const [addPhaseModalOpen, setAddPhaseModalOpen] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseDeadline, setNewPhaseDeadline] = useState("");
  const [newPhaseBudget, setNewPhaseBudget] = useState<number | "">("");

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
      <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        {/* Top meta tags: Order ID, Platform, Profile, Health */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-100 dark:border-zinc-850 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {project.orderId && (
              <span className="font-mono font-bold bg-amber-400 text-black px-2.5 py-0.5 rounded-full text-2xs shadow-xs">
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

            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Project Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
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
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{formatDate(project.dueDate)}</span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Assigned Squad</span>
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              {project.team?.name || project.department?.name || "Cross-Department"}
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Squad Members</span>
            <div className="flex -space-x-1.5 overflow-hidden mt-0.5">
              {(project.members || []).slice(0, 5).map((m) => (
                <Avatar key={m.id} name={m.name} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "board"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kanban Board</span>
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "list"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Task List</span>
        </button>

        <button
          onClick={() => setActiveTab("phases")}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "phases"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Milestone className="w-4 h-4" />
          <span>Milestones & Phases ({phases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("client")}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "client"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Client & Contract Hub</span>
        </button>

        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center space-x-2 px-4 py-3 font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "risks"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Flame className="w-4 h-4 text-rose-500" />
          <span>Deadline Risk Engine</span>
          {riskReport && riskReport.summary.highRiskCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-rose-100 text-rose-700 font-bold">
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

                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-zinc-950 dark:text-white">
                              {ph.name}
                            </span>
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
    </div>
  );
};
