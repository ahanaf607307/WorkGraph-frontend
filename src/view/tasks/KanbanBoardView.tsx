"use client";

import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { Task, TaskStatus } from "../../modules/tasks/types/task.types";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { RiskBadge } from "../../components/shared/RiskBadge";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { CreateTaskModal } from "./CreateTaskModal";
import { TaskDetailDrawer } from "./TaskDetailDrawer";
import { getSocket } from "../../lib/socket";
import { toast } from "sonner";
import { Plus, Clock, AlertCircle, GripVertical, Filter } from "lucide-react";
import { formatDate } from "../../lib/utils";

const COLUMNS: Array<{ id: TaskStatus; title: string; color: string; border: string }> = [
  { id: "TODO", title: "To Do", color: "bg-zinc-50/60 dark:bg-[#0f1118]/60", border: "border-zinc-200/70 dark:border-white/[0.06]" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50/30 dark:bg-blue-950/10", border: "border-blue-200/50 dark:border-blue-900/30" },
  { id: "IN_REVIEW", title: "In Review", color: "bg-violet-50/30 dark:bg-violet-950/10", border: "border-violet-200/50 dark:border-violet-900/30" },
  { id: "DONE", title: "Done", color: "bg-emerald-50/30 dark:bg-emerald-950/10", border: "border-emerald-200/50 dark:border-emerald-900/30" },
];

export const KanbanBoardView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [targetColumn, setTargetColumn] = useState<TaskStatus>("TODO");

  // Filters
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  const { data: initialTasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => taskActions.fetchTasks({ projectId }),
  });

  useEffect(() => {
    if (initialTasks) {
      setTasks(initialTasks);
    }
  }, [initialTasks]);

  // Socket.IO real-time synchronization
  useEffect(() => {
    const socket = getSocket();
    socket.emit("join:project", projectId);

    const handleTaskUpdated = (updated: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
    };

    const handleStatusChanged = ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    };

    const handleTaskCreated = (newTask: Task) => {
      setTasks((prev) => [newTask, ...prev]);
    };

    const handleTaskDeleted = ({ taskId }: { taskId: string }) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    socket.on("task:updated", handleTaskUpdated);
    socket.on("task:status-changed", handleStatusChanged);
    socket.on("task:created", handleTaskCreated);
    socket.on("task:deleted", handleTaskDeleted);

    return () => {
      socket.emit("leave:project", projectId);
      socket.off("task:updated", handleTaskUpdated);
      socket.off("task:status-changed", handleStatusChanged);
      socket.off("task:created", handleTaskCreated);
      socket.off("task:deleted", handleTaskDeleted);
    };
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const statusMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) =>
      taskActions.updateTaskStatus(taskId, newStatus),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Task moved to ${updated.status.replace("_", " ")}`);
    },
    onError: (error: any, variables, context: any) => {
      // Revert optimistic update
      if (context?.previousTasks) {
        setTasks(context.previousTasks);
      }
      toast.error("Status update blocked", {
        description: error.message || "Failed to update task status.",
      });
    },
    onMutate: async ({ taskId, newStatus }) => {
      const previousTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      return { previousTasks };
    },
  });

  const handleDragStart = (event: any) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as TaskStatus;

    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    statusMutation.mutate({ taskId, newStatus: targetStatus });
  };

  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (searchFilter && !t.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Board Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0f1118] p-2.5 rounded-xl border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search board tasks..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-transparent focus:border-violet-500/30 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-950 dark:text-white outline-none w-full sm:w-56 transition-all"
          />

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer focus:border-violet-500/40"
          >
            <option value="" className="cursor-pointer">All Priorities</option>
            <option value="LOW" className="cursor-pointer">Low</option>
            <option value="MEDIUM" className="cursor-pointer">Medium</option>
            <option value="HIGH" className="cursor-pointer">High</option>
            <option value="URGENT" className="cursor-pointer">Urgent</option>
          </select>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setTargetColumn("TODO");
            setCreateModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>

      {/* Dnd Board Columns */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <DroppableColumn
                key={col.id}
                id={col.id}
                title={col.title}
                count={columnTasks.length}
                colorClass={col.color}
                borderClass={col.border}
                onAddTask={() => {
                  setTargetColumn(col.id);
                  setCreateModalOpen(true);
                }}
              >
                {columnTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTaskId(task.id)}
                  />
                ))}
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 shadow-2xl rotate-2 opacity-95">
              <TaskCardContent task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultStatus={targetColumn}
      />

      {/* Task Details Drawer */}
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

const DroppableColumn: React.FC<{
  id: TaskStatus;
  title: string;
  count: number;
  colorClass: string;
  borderClass: string;
  onAddTask: () => void;
  children: React.ReactNode;
}> = ({ id, title, count, colorClass, borderClass, onAddTask, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border ${borderClass} ${colorClass} p-3 flex flex-col min-h-[500px] transition-colors ${
        isOver ? "ring-2 ring-amber-400 bg-amber-50/20 dark:bg-amber-950/20" : ""
      }`}
    >
      <div className="flex items-center justify-between pb-3 px-1">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">{title}</span>
          <span className="px-1.5 py-0.2 rounded-full text-2xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500">
            {count}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-white/60 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5 flex-1">{children}</div>
    </div>
  );
};

const DraggableTaskCard: React.FC<{
  task: Task;
  onClick: () => void;
}> = ({ task, onClick }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.3 : 1 }}
      className="group relative cursor-pointer"
    >
      <div
        onClick={onClick}
        className="rounded-xl border border-zinc-200/70 dark:border-white/[0.06] bg-white dark:bg-[#0f1118] p-3.5 shadow-xs hover:shadow-md hover:border-violet-500/40 dark:hover:border-violet-500/30 transition-all select-none cursor-pointer"
      >
        <TaskCardContent task={task} dragHandleProps={{ ...attributes, ...listeners }} />
      </div>
    </div>
  );
};

const TaskCardContent: React.FC<{
  task: Task;
  dragHandleProps?: any;
}> = ({ task, dragHandleProps }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center space-x-1">
          {task.riskLevel && task.riskLevel !== "LOW" && (
            <RiskBadge riskLevel={task.riskLevel} />
          )}
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="p-1 text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h4 className="text-xs font-semibold text-zinc-950 dark:text-white line-clamp-2 leading-snug">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-2xs text-zinc-500 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Task Bottom Details */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-2xs text-zinc-400">
        <div className="flex items-center space-x-1.5">
          <Avatar name={task.assignee?.name} size="sm" />
          <span className="truncate max-w-[90px]">{task.assignee?.name || "Unassigned"}</span>
        </div>

        <div className="flex items-center space-x-2 font-mono">
          {task.estimatedHours > 0 && <span>{task.estimatedHours}h</span>}
          {task.dueDate && (
            <span className="flex items-center text-zinc-500">
              <Clock className="w-3 h-3 mr-0.5" />
              {formatDate(task.dueDate, "MMM d")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
