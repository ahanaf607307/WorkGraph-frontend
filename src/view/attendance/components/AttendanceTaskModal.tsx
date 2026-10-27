"use client";

import React, { useState } from "react";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";

interface AttendanceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr: string;
  projects: any[];
  onSubmit: (data: {
    title: string;
    description?: string;
    projectId?: string;
    status: string;
    timeSpentMinutes: number;
  }) => void;
  isSubmitting: boolean;
}

export const AttendanceTaskModal: React.FC<AttendanceTaskModalProps> = ({
  isOpen,
  onClose,
  selectedDateStr,
  projects,
  onSubmit,
  isSubmitting,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "IN_PROGRESS",
    hoursSpent: "1",
    minutesSpent: "0",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const totalMinutes =
      (parseInt(form.hoursSpent, 10) || 0) * 60 + (parseInt(form.minutesSpent, 10) || 0);

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      projectId: form.projectId || undefined,
      status: form.status,
      timeSpentMinutes: totalMinutes,
    });

    setForm({
      title: "",
      description: "",
      projectId: "",
      status: "IN_PROGRESS",
      hoursSpent: "1",
      minutesSpent: "0",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Daily Execution Task"
      description={`Record deliverables, sprint tickets, or time spent for ${selectedDateStr}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Task Deliverable Title *
          </label>
          <Input
            required
            placeholder="e.g. Implemented OAuth2 social authentication flow"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Linked Project (Optional)
          </label>
          <select
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
          >
            <option value="">No Project (General Internal Task)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
              <option value="TODO">To-Do</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Hours
            </label>
            <Input
              type="number"
              min={0}
              max={24}
              value={form.hoursSpent}
              onChange={(e) => setForm({ ...form, hoursSpent: e.target.value })}
              className="text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Minutes
            </label>
            <Input
              type="number"
              min={0}
              max={59}
              step={5}
              value={form.minutesSpent}
              onChange={(e) => setForm({ ...form, minutesSpent: e.target.value })}
              className="text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Details & Notes (Optional)
          </label>
          <Textarea
            rows={3}
            placeholder="Add context, challenges encountered, or deliverables completed..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="text-xs"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            Log Daily Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
