"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { DepartmentItem } from "../../../modules/departments/actions/department.actions";

interface EditDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: DepartmentItem | null;
  members: any[];
  onSubmit: (
    departmentId: string,
    data: { name: string; code?: string; description?: string; managerId?: string | null }
  ) => void;
}

export const EditDepartmentModal: React.FC<EditDepartmentModalProps> = ({
  isOpen,
  onClose,
  department,
  members,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
  });

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name || "",
        code: department.code || "",
        description: department.description || "",
        managerId: department.managerId || "",
      });
    }
  }, [department]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !form.name.trim()) return;

    onSubmit(department.id, {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      managerId: form.managerId || null,
    });
    onClose();
  };

  if (!department) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Edit Department
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Update division name, unique code, manager, and description.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Design & Creative"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-xs text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.08] focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Department Code
              </label>
              <input
                type="text"
                placeholder="e.g. DES"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-xs text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.08] focus:border-violet-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Department Manager
              </label>
              <select
                value={form.managerId}
                onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-xs text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.08] focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              placeholder="Role, scope, and objectives of this department..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] text-xs text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/[0.08] focus:border-violet-500 focus:outline-none leading-relaxed"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
