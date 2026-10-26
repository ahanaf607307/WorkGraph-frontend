"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { Task, TaskStatus } from "../../modules/tasks/types/task.types";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Search, Calendar, CheckSquare, Trash2 } from "lucide-react";
import { formatDate } from "../../lib/utils";

export const TaskListView: React.FC<{ projectId?: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const { currentOrg } = useAuth();
  const orgId = currentOrg?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId, orgId, statusFilter, priorityFilter, search],
    queryFn: () =>
      taskActions.fetchTasks({
        projectId: projectId || undefined,
        organizationId: orgId || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search || undefined,
      }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskActions.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task deleted");
    },
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="" className="cursor-pointer">All Statuses</option>
            <option value="TODO" className="cursor-pointer">To Do</option>
            <option value="IN_PROGRESS" className="cursor-pointer">In Progress</option>
            <option value="IN_REVIEW" className="cursor-pointer">In Review</option>
            <option value="DONE" className="cursor-pointer">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="" className="cursor-pointer">All Priorities</option>
            <option value="LOW" className="cursor-pointer">Low</option>
            <option value="MEDIUM" className="cursor-pointer">Medium</option>
            <option value="HIGH" className="cursor-pointer">High</option>
            <option value="URGENT" className="cursor-pointer">Urgent</option>
          </select>
        </div>

        {projectId && (
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        )}
      </div>

      {/* Task Table */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      ) : (tasks || []).length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title="No tasks found"
          description="There are no tasks matching your current filters."
          actionLabel={projectId ? "Create Task" : undefined}
          onAction={projectId ? () => setCreateModalOpen(true) : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Effort</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {tasks?.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="py-3 px-4 font-semibold text-zinc-950 dark:text-white max-w-xs">
                      <div className="truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {task.title}
                      </div>
                      {task.project && !projectId && (
                        <div className="text-2xs text-zinc-400 font-normal truncate">
                          {task.project.name}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3 px-4">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Avatar name={task.assignee?.name} size="sm" />
                        <span className="truncate max-w-[120px] text-zinc-700 dark:text-zinc-300">
                          {task.assignee?.name || "Unassigned"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                      {task.estimatedHours}h
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono">
                      {formatDate(task.dueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge riskLevel={task.riskLevel} />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          if (confirm(`Delete task "${task.title}"?`)) {
                            deleteTaskMutation.mutate(task.id);
                          }
                        }}
                        className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {projectId && (
        <CreateTaskModal
          projectId={projectId}
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      {/* Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
};
