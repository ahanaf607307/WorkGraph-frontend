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
  services?: any[];
  isSystemAdmin: boolean;
  onSubmit: (data: {
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    serviceId?: string;
    isApproved?: boolean;
    weeklyCapacityHours: number;
  }) => void;
}

export const EditMemberPlacementModal: React.FC<EditMemberPlacementModalProps> = ({
  isOpen,
  onClose,
  member,
  departments,
  designations,
  services = [],
  isSystemAdmin,
  onSubmit,
}) => {
  const [form, setForm] = useState<{
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    serviceId: string;
    isApproved: boolean;
    weeklyCapacityHours: number;
  }>({
    role: "MEMBER",
    designationId: "",
    departmentId: "",
    teamId: "",
    serviceId: "",
    isApproved: true,
    weeklyCapacityHours: 40,
  });

  useEffect(() => {
    if (member) {
      setForm({
        role: member.role || "MEMBER",
        designationId: member.designationId || "",
        departmentId: member.departmentId || "",
        teamId: member.teamId || "",
        serviceId: member.serviceId || "",
        isApproved: member.isApproved !== false,
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
            Configure department, squad unit, service line, and role for {member?.user?.name || member?.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Approval Status Toggle */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                Workspace Approval Status
              </span>
              <span className="text-3xs text-zinc-400">
                Approved members can log in and view allocated workspace resources.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isApproved}
                onChange={(e) => setForm({ ...form, isApproved: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-zinc-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                <span>Workspace Role</span>
                {member?.role === "OWNER" ? (
                  <span className="text-3xs text-violet-600 dark:text-violet-400 font-mono font-bold">
                    Protected Role
                  </span>
                ) : !isSystemAdmin ? (
                  <span className="text-3xs text-zinc-400 font-mono">
                    System Admin only
                  </span>
                ) : null}
              </label>

              {member?.role === "OWNER" ? (
                <div className="w-full px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-300 dark:border-violet-800 text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center justify-between">
                  <span>🏢 System Admin</span>
                  <span className="text-3xs font-mono font-normal text-violet-600 dark:text-violet-400">Cannot be modified</span>
                </div>
              ) : (
                <select
                  disabled={!isSystemAdmin}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Designation
              </label>
              <select
                value={form.designationId}
                onChange={(e) => setForm({ ...form, designationId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none disabled:opacity-50 cursor-pointer"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Service Line (Specialization)
              </label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                <option value="">No restriction (All lines)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
