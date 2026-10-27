"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { UserPlus } from "lucide-react";

interface AddSquadMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any;
  members: any[];
  onSubmit: (teamId: string, userId: string) => void;
}

export const AddSquadMemberModal: React.FC<AddSquadMemberModalProps> = ({
  isOpen,
  onClose,
  team,
  members,
  onSubmit,
}) => {
  const [selectedUserId, setSelectedUserId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !team) return;
    onSubmit(team.id, selectedUserId);
    setSelectedUserId("");
    onClose();
  };

  // Filter out members who are already in this team
  const currentMemberUserIds = new Set(
    (team?.members || []).map((m: any) => m.userId || m.user?.id)
  );
  if (team?.leaderId) currentMemberUserIds.add(team.leaderId);
  if (team?.coLeaderId) currentMemberUserIds.add(team.coLeaderId);

  // A member already in a team cannot be added to another team!
  const availableMembers = members.filter((m) => {
    // If user is already assigned to ANY team, exclude from assignment
    if (m.teamId) return false;
    return !currentMemberUserIds.has(m.userId);
  });

  const alreadyAssignedCount = members.filter((m) => !!m.teamId).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            <span>Add Member to Squad</span>
          </DialogTitle>
          <DialogDescription>
            Assign an unassigned workspace member to the squad "{team?.name}". (Members can only belong to one squad at a time).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Select Workspace Member *
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="">Select an unassigned member...</option>
              {availableMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user?.name || m.name} ({m.designationRel?.name || m.designation || m.role}) — {m.user?.email || m.email}
                </option>
              ))}
            </select>
            {availableMembers.length === 0 && (
              <p className="text-2xs text-amber-600 mt-1">
                No unassigned members available. All existing members ({alreadyAssignedCount}) are already assigned to squads.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!selectedUserId}
              className="bg-amber-400 hover:bg-amber-500 text-black font-bold"
            >
              Add to Squad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
