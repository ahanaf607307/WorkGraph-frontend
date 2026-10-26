"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectFormData } from "../../modules/projects/schemas/project.schema";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { useAuth } from "../../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { toast } from "sonner";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentOrg } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: "PLANNING",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    if (!currentOrg) {
      toast.error("Please select a workspace first");
      return;
    }

    setIsLoading(true);
    try {
      const created = await projectActions.createProject(currentOrg.id, data);
      toast.success("Project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset();
      onClose();
      if (onSuccess) onSuccess(created.id);
    } catch (error: any) {
      toast.error("Failed to create project", {
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
      title="Create New Project"
      description="Initiate a new development project or team objective."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
        <Input
          id="name"
          label="Project Title"
          placeholder="e.g. NextGen Web Portal"
          error={errors.name?.message}
          {...register("name")}
        />

        <Textarea
          id="description"
          label="Description & Goals"
          placeholder="Outline the core deliverables, milestones, and scope..."
          error={errors.description?.message}
          {...register("description")}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select id="status" label="Status" {...register("status")}>
            <option value="PLANNING">Planning</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </Select>

          <Input
            id="startDate"
            type="date"
            label="Start Date"
            {...register("startDate")}
          />

          <Input
            id="dueDate"
            type="date"
            label="Target Deadline"
            {...register("dueDate")}
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
