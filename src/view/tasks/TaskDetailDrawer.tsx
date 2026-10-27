"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { Task, TaskStatus, TaskPriority } from "../../modules/tasks/types/task.types";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import {
  X,
  Clock,
  User as UserIcon,
  Link as LinkIcon,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatRelativeDate } from "../../lib/utils";

export const TaskDetailDrawer: React.FC<{
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}> = ({ taskId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { user, currentOrg } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [newPredecessorId, setNewPredecessorId] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskActions.fetchTaskById(taskId),
    enabled: !!taskId && isOpen,
  });

  const { data: dependencies, refetch: refetchDeps } = useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: () => taskActions.fetchDependencies(taskId),
    enabled: !!taskId && isOpen,
  });

  const { data: projectTasks } = useQuery({
    queryKey: ["tasks", task?.projectId],
    queryFn: () => taskActions.fetchTasks({ projectId: task?.projectId }),
    enabled: !!task?.projectId && isOpen,
  });

  const { data: members } = useQuery({
    queryKey: ["org-members", currentOrg?.id],
    queryFn: () => userActions.getOrganizationMembers(currentOrg!.id),
    enabled: !!currentOrg?.id && isOpen,
  });

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TaskStatus) =>
      taskActions.updateTaskStatus(taskId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task status updated");
    },
    onError: (err: any) => {
      toast.error("Status update blocked", {
        description: err.message || "Failed to update status",
      });
    },
  });

  // Assignee mutation
  const updateAssigneeMutation = useMutation({
    mutationFn: (newAssigneeId: string | null) =>
      taskActions.updateTaskAssignee(taskId, newAssigneeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Assignee updated");
    },
  });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => taskActions.addComment(taskId, content),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Comment added");
    },
  });

  // Add dependency mutation
  const addDepMutation = useMutation({
    mutationFn: (predId: string) => taskActions.addDependency(taskId, predId),
    onSuccess: () => {
      setNewPredecessorId("");
      refetchDeps();
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Prerequisite task linked");
    },
    onError: (err: any) => {
      toast.error("Dependency rejected", {
        description: err.message || "Cycle detected or invalid dependency",
      });
    },
  });

  // Remove dependency mutation
  const removeDepMutation = useMutation({
    mutationFn: (depId: string) => taskActions.removeDependency(depId),
    onSuccess: () => {
      refetchDeps();
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      toast.success("Dependency removed");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase text-zinc-400">
              {task?.project?.name || "TASK"}
            </span>
            <span>•</span>
            <span className="text-xs font-mono text-zinc-500">ID: {taskId.slice(0, 8)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading || !task ? (
          <div className="p-8 text-center text-sm text-zinc-400">Loading task details...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title & Status Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatusMutation.mutate(e.target.value as TaskStatus)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="TODO" className="cursor-pointer">To Do</option>
                    <option value="IN_PROGRESS" className="cursor-pointer">In Progress</option>
                    <option value="IN_REVIEW" className="cursor-pointer">In Review</option>
                    <option value="DONE" className="cursor-pointer">Done</option>
                  </select>

                  <PriorityBadge priority={task.priority} />
                </div>

                <RiskBadge riskLevel={task.riskLevel} />
              </div>

              <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
                {task.title}
              </h2>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>

            {/* Deterministic Risk Engine Assessment */}
            {task.riskReasons && task.riskReasons.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Deterministic Risk Engine Assessment</span>
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc pl-5">
                  {task.riskReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Task Metadata Fields */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-xs">
              <div>
                <span className="text-zinc-400 block mb-1">Assignee</span>
                <select
                  value={task.assigneeId || ""}
                  onChange={(e) => updateAssigneeMutation.mutate(e.target.value || null)}
                  className="w-full px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
                >
                  <option value="" className="cursor-pointer">Unassigned</option>
                  {members?.map((m) => (
                    <option key={m.userId} value={m.userId} className="cursor-pointer">
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1">Estimated Effort</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {task.estimatedHours} hours
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1">Due Date</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                  {formatDate(task.dueDate)}
                </span>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1">Created By</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {task.createdBy?.name || "System"}
                </span>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Discussion & Activity
              </h3>

              <div className="space-y-3">
                {(task.comments || []).length === 0 ? (
                  <div className="text-xs text-zinc-400 italic">No comments yet.</div>
                ) : (
                  task.comments?.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-2xs text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
                          {c.author.name}
                        </span>
                        <span>{formatRelativeDate(c.createdAt)}</span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  placeholder="Add a comment or status note..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentText.trim()) {
                      addCommentMutation.mutate(commentText.trim());
                    }
                  }}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (commentText.trim()) addCommentMutation.mutate(commentText.trim());
                  }}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
