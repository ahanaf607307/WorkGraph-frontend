"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onSubmit: (data: { name: string; code?: string; description?: string; managerId?: string }) => void;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  members,
  onSubmit,
}) => {
  const [form, setForm] = useState({ name: "", code: "", description: "", managerId: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      managerId: form.managerId || undefined,
    });
    setForm({ name: "", code: "", description: "", managerId: "" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>
            Create an organizational division (e.g. Engineering, Sales, Operations).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Product Engineering"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Department Code
              </label>
              <input
                type="text"
                placeholder="e.g. ENG"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Department Manager
              </label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">Select Manager...</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Role and deliverables for this department"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none resize-none h-20"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!form.name.trim()}>
              Create Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
