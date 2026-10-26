"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

interface AssignOperationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  members: any[];
  onSubmit: (teamId: string, omUserId: string) => void;
}

export const AssignOperationManagerModal: React.FC<AssignOperationManagerModalProps> = ({
  isOpen,
  onClose,
  team,
  members,
  onSubmit,
}) => {
  const [selectedOmUserId, setSelectedOmUserId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOmUserId || !team) return;
    onSubmit(team.id, selectedOmUserId);
    setSelectedOmUserId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Link Multi-Team Operation Manager</DialogTitle>
          <DialogDescription>
            Assign an Operation Manager to supervise "{team?.name}". An Operation Manager can supervise multiple squads concurrently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Operation Manager *
            </label>
            <select
              value={selectedOmUserId}
              onChange={(e) => setSelectedOmUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="">Select Member...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name || m.name} ({m.designationRel?.name || m.designation || m.role})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!selectedOmUserId}>
              Assign to Squad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
