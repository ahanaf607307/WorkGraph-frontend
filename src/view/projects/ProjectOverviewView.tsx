"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { Progress } from "../../components/ui/progress";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { KanbanBoardView } from "../tasks/KanbanBoardView";
import { TaskListView } from "../tasks/TaskListView";
import { CreateTaskModal } from "../tasks/CreateTaskModal";
import { formatDate } from "../../lib/utils";
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
} from "lucide-react";

export const ProjectOverviewView: React.FC<{ projectId: string; initialTab?: string }> = ({
  projectId,
  initialTab = "board",
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [createModalOpen, setCreateModalOpen] = useState(false);

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

  if (isLoading || !project) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Loading project details...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Banner Header */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <StatusBadge status={project.status} />
              <span className="text-2xs text-zinc-400 font-mono">
                Initiated by {project.createdBy?.name}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              {project.name}
            </h1>
            <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
              {project.description || "No project description provided."}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Task
            </Button>
          </div>
        </div>

        {/* Project Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div>
            <span className="text-zinc-400 block mb-0.5">Progress</span>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-zinc-950 dark:text-white">
                {project.metrics.progress}%
              </span>
              <Progress value={project.metrics.progress} className="w-20 h-2" />
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
            <span className="text-zinc-400 block mb-0.5">Completed Tasks</span>
            <div className="flex items-center space-x-1.5 font-semibold text-zinc-800 dark:text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                {project.metrics.completedTasks} / {project.metrics.totalTasks}
              </span>
            </div>
          </div>

          <div>
            <span className="text-zinc-400 block mb-0.5">Assigned Members</span>
            <div className="flex -space-x-1.5 overflow-hidden mt-0.5">
              {(project.members || []).slice(0, 5).map((m) => (
                <Avatar key={m.id} name={m.name} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("board")}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "list"
              ? "border-amber-400 text-amber-600 dark:text-amber-400 font-bold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Task List</span>
        </button>

        <button
          onClick={() => setActiveTab("risks")}
          className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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
    </div>
  );
};
