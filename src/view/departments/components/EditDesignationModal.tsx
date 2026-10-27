"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { DepartmentItem } from "../../../modules/departments/actions/department.actions";
import { DesignationItem } from "../../../modules/designations/actions/designation.actions";
import { Award } from "lucide-react";

interface EditDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentItem[];
  designation: DesignationItem | null;
  onSubmit: (
    id: string,
    data: {
      name: string;
      code?: string;
      title?: string;
      departmentId?: string | null;
      description?: string;
      hierarchyLevel: number;
    }
  ) => void;
}

export const EditDesignationModal: React.FC<EditDesignationModalProps> = ({
  isOpen,
  onClose,
  departments,
  designation,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    name: "",
    code: "",
    title: "",
    departmentId: "",
    description: "",
    hierarchyLevel: 5,
  });

  useEffect(() => {
    if (designation) {
      setForm({
        name: designation.name || "",
        code: designation.code || "",
        title: designation.title || "",
        departmentId: designation.departmentId || "",
        description: designation.description || "",
        hierarchyLevel: designation.hierarchyLevel || 5,
      });
    }
  }, [designation]);

  if (!designation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(designation.id, {
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      title: form.title.trim() || undefined,
      departmentId: form.departmentId ? form.departmentId : null,
      description: form.description.trim() || undefined,
      hierarchyLevel: Number(form.hierarchyLevel),
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-amber-500 mb-1">
            <Award className="w-5 h-5" />
            <span className="text-2xs font-bold uppercase tracking-wider font-mono">System Admin Privilege</span>
          </div>
          <DialogTitle>Edit Designation & Title</DialogTitle>
          <DialogDescription>
            Update designation title, department assignment, and hierarchy level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Department Assignment
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">🌐 All Departments (Global / Cross-Department)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    🏢 {dept.name} {dept.code ? `(${dept.code})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Hierarchy Level (1–10)
              </label>
              <select
                value={form.hierarchyLevel}
                onChange={(e) => setForm({ ...form, hierarchyLevel: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value={10}>Level 10</option>
                <option value={9}>Level 9</option>
                <option value={8}>Level 8</option>
                <option value={7}>Level 7</option>
                <option value={6}>Level 6</option>
                <option value={5}>Level 5</option>
                <option value={4}>Level 4</option>
                <option value={3}>Level 3</option>
                <option value={2}>Level 2</option>
                <option value={1}>Level 1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Designation Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Solutions Architect, Product Manager, DevOps Engineer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Official Title / Job Title
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Staff Enterprise Architect"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Designation Code
              </label>
              <input
                type="text"
                placeholder="e.g. SA, PM, SWE"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-mono uppercase text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Description & Scope
            </label>
            <textarea
              rows={2}
              placeholder="Responsibilities, scope, or qualifications..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold"
            >
              Update Designation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
