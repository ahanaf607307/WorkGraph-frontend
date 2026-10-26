"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface CreateDesignationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; code?: string; description?: string; hierarchyLevel: number }) => void;
}

export const CreateDesignationModal: React.FC<CreateDesignationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    hierarchyLevel: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      description: form.description.trim() || undefined,
      hierarchyLevel: Number(form.hierarchyLevel),
    });
    setForm({ name: "", code: "", description: "", hierarchyLevel: 5 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Create Dynamic Designation</DialogTitle>
          <DialogDescription>
            Define a custom enterprise title and place it within the corporate hierarchy (Level 1–10).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Designation Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Principal Architect, Chief Growth Officer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Designation Code
              </label>
              <input
                type="text"
                placeholder="e.g. CGO, ARCH"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none font-mono"
              />
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
                <option value={10}>Level 10 - Executive / GM</option>
                <option value={9}>Level 9 - Senior Director / AGM</option>
                <option value={8}>Level 8 - Head of Operations / HTO</option>
                <option value={7}>Level 7 - Project Manager (All Squads)</option>
                <option value={6}>Level 6 - Operation Manager (Multi-Squad)</option>
                <option value={5}>Level 5 - Team Leader</option>
                <option value={4}>Level 4 - Co-Leader / Lead Engineer</option>
                <option value={3}>Level 3 - Senior Contributor</option>
                <option value={2}>Level 2 - Mid Contributor</option>
                <option value={1}>Level 1 - Junior / Associate</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Description & Authority
            </label>
            <textarea
              placeholder="Outline responsibilities and governance authority"
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
              Create Designation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
