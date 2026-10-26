"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface EditMemberPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  departments: any[];
  designations: any[];
  onSubmit: (data: {
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    weeklyCapacityHours: number;
  }) => void;
}

export const EditMemberPlacementModal: React.FC<EditMemberPlacementModalProps> = ({
  isOpen,
  onClose,
  member,
  departments,
  designations,
  onSubmit,
}) => {
  const [form, setForm] = useState<{
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    weeklyCapacityHours: number;
  }>({
    role: "MEMBER",
    designationId: "",
    departmentId: "",
    teamId: "",
    weeklyCapacityHours: 40,
  });

  useEffect(() => {
    if (member) {
      setForm({
        role: member.role || "MEMBER",
        designationId: member.designationId || "",
        departmentId: member.departmentId || "",
        teamId: member.teamId || "",
        weeklyCapacityHours: member.weeklyCapacityHours || 40,
      });
    }
  }, [member]);

  const teamsForSelectedDept = departments.find((d) => d.id === form.departmentId)?.teams || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Update Member Placement & Role</DialogTitle>
          <DialogDescription>
            Configure department, squad unit, designation, and weekly capacity for {member?.user?.name || member?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Workspace Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Designation
              </label>
              <select
                value={form.designationId}
                onChange={(e) => setForm({ ...form, designationId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">Select Designation...</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (Lvl {d.hierarchyLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Department
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value, teamId: "" })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Squad / Team
              </label>
              <select
                value={form.teamId}
                onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                disabled={!form.departmentId}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {teamsForSelectedDept.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Weekly Capacity (Hours)
            </label>
            <input
              type="number"
              min={1}
              max={168}
              value={form.weeklyCapacityHours}
              onChange={(e) => setForm({ ...form, weeklyCapacityHours: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
