"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName?: string;
  members: any[];
  onSubmit: (data: { name: string; description?: string; leaderId?: string; coLeaderId?: string; serviceType?: string }) => void;
}

export const CreateSquadModal: React.FC<CreateSquadModalProps> = ({
  isOpen,
  onClose,
  departmentName,
  members,
  onSubmit,
}) => {
  const [form, setForm] = useState({ name: "", description: "", leaderId: "", coLeaderId: "", serviceType: "Full Stack Web Development" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      leaderId: form.leaderId || undefined,
      coLeaderId: form.coLeaderId || undefined,
      serviceType: form.serviceType || undefined,
    });
    setForm({ name: "", description: "", leaderId: "", coLeaderId: "", serviceType: "Full Stack Web Development" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Add Squad to Department</DialogTitle>
          <DialogDescription>
            Create an operational squad under {departmentName || "Department"} with designated Leader and Co-Leader.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Squad / Team Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Core API Squad, Frontend Experience"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                Team Leader (Crown)
              </label>
              <select
                value={form.leaderId}
                onChange={(e) => setForm({ ...form, leaderId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">Select Leader...</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                Co-Leader (Star)
              </label>
              <select
                value={form.coLeaderId}
                onChange={(e) => setForm({ ...form, coLeaderId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="">Select Co-Leader...</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user?.name || m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Service Delivery Focus *
            </label>
            <select
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer mb-3"
            >
              <option value="Full Stack Web Development">Full Stack Web Development</option>
              <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
              <option value="UI/UX & Product Design">UI/UX & Product Design</option>
              <option value="DevOps & Cloud Engineering">DevOps & Cloud Engineering</option>
              <option value="AI / Machine Learning & Data">AI / Machine Learning & Data</option>
              <option value="Quality Assurance & Testing">Quality Assurance & Testing</option>
              <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
              <option value="Enterprise Architecture">Enterprise Architecture</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Squad Purpose / Deliverables (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Microservices, Payment Gateways"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!form.name.trim()}>
              Create Squad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
