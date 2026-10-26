"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Avatar } from "../../../components/ui/avatar";
import { Search, Check, X } from "lucide-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onCreateGroup: (data: { name: string; description?: string; participantUserIds: string[] }) => void;
  isPending: boolean;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  members,
  onCreateGroup,
  isPending,
}) => {
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  const filteredMembers = members.filter((m) => {
    const name = m.user?.name || (m as any).name || "";
    const email = m.user?.email || (m as any).email || "";
    return (
      name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      email.toLowerCase().includes(memberSearch.toLowerCase())
    );
  });

  const toggleMember = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim()) return;
    onCreateGroup({
      name: groupName.trim(),
      description: groupDesc.trim() || undefined,
      participantUserIds: selectedUserIds,
    });
    setGroupName("");
    setGroupDesc("");
    setSelectedUserIds([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="lg">
        <DialogHeader>
          <DialogTitle>Create Squad or Group Channel</DialogTitle>
          <DialogDescription>
            Create a dedicated channel for team communication and invite members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Channel Name *
            </label>
            <input
              type="text"
              placeholder="e.g. backend-squad, marketing-sync"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Channel Purpose / Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="Brief description of the squad or project"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Selected Member Chips */}
          {selectedUserIds.length > 0 && (
            <div>
              <div className="text-2xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 font-mono">
                Selected Participants ({selectedUserIds.length})
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                {selectedUserIds.map((uid) => {
                  const m = members.find((x) => (x.userId || x.user?.id || x.id) === uid);
                  const name = m?.user?.name || m?.name || "Member";
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-400 text-black font-semibold shadow-2xs"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => toggleMember(uid)}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member Search & Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Add Members by Name or Email
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400">
                  No members found.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const uid = m.userId || m.user?.id || m.id;
                  const isSelected = selectedUserIds.includes(uid);
                  const name = m.user?.name || (m as any).name || "Member";
                  const email = m.user?.email || (m as any).email || "";

                  return (
                    <button
                      key={uid}
                      type="button"
                      onClick={() => toggleMember(uid)}
                      className={`w-full p-2 flex items-center justify-between rounded-lg transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Avatar name={name} size="sm" />
                        <div>
                          <div className="text-xs font-bold text-zinc-900 dark:text-white">
                            {name}
                          </div>
                          <div className="text-3xs text-zinc-400 font-mono">{email}</div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? "bg-amber-400 border-amber-400 text-black font-bold"
                            : "border-zinc-300 dark:border-zinc-700"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!groupName.trim() || isPending}
            onClick={handleCreate}
          >
            Create Group Channel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
