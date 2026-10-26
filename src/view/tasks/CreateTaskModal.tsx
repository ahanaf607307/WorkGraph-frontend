"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, TaskFormData } from "../../modules/tasks/schemas/task.schema";
import { taskActions } from "../../modules/tasks/actions/task.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { useAuth } from "../../hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { toast } from "sonner";

export interface CreateTaskModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: string;
  onSuccess?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  projectId,
  isOpen,
  onClose,
  defaultStatus = "TODO",
  onSuccess,
}) => {
  const { currentOrg } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch organization members for assignee dropdown
  const { data: members } = useQuery({
    queryKey: ["org-members", currentOrg?.id],
    queryFn: () => userActions.getOrganizationMembers(currentOrg!.id),
    enabled: !!currentOrg?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: (defaultStatus as any) || "TODO",
      priority: "MEDIUM",
      estimatedHours: 4,
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    try {
      await taskActions.createTask(projectId, {
        ...data,
        assigneeId: data.assigneeId || null,
      });
      toast.success("Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Failed to create task", {
        description: error.message || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a task, estimate effort, set deadlines, and assign a team member."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <Input
          id="title"
          label="Task Title"
          placeholder="e.g. Implement OAuth Flow"
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          id="description"
          label="Description & Acceptance Criteria"
          placeholder="Detailed explanation of requirements..."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select id="status" label="Status" {...register("status")}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </Select>

          <Select id="priority" label="Priority" {...register("priority")}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select id="assigneeId" label="Assignee" {...register("assigneeId")}>
            <option value="">Unassigned</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.name} ({m.weeklyCapacityHours}h/wk)
              </option>
            ))}
          </Select>

          <Input
            id="estimatedHours"
            type="number"
            step="0.5"
            label="Estimated Effort (Hours)"
            error={errors.estimatedHours?.message}
            {...register("estimatedHours", { valueAsNumber: true })}
          />

          <Input
            id="dueDate"
            type="date"
            label="Due Date"
            {...register("dueDate")}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
