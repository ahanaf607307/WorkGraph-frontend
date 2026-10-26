"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Avatar } from "../../../components/ui/avatar";
import { Search } from "lucide-react";

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: any[];
  onStartDirect: (targetUserId: string) => void;
}

export const DirectMessageModal: React.FC<DirectMessageModalProps> = ({
  isOpen,
  onClose,
  members,
  onStartDirect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter((m) => {
    const name = m.user?.name || (m as any).name || "";
    const email = m.user?.email || (m as any).email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Start Direct Message</DialogTitle>
          <DialogDescription>
            Select a team member to start a 1-to-1 conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white border border-transparent focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                No matching workspace members found.
              </div>
            ) : (
              filteredMembers.map((m) => {
                const name = m.user?.name || (m as any).name || "Member";
                const email = m.user?.email || (m as any).email || "";
                return (
                  <button
                    key={m.userId || m.id}
                    type="button"
                    onClick={() => {
                      onStartDirect(m.userId || m.user?.id || m.id);
                      onClose();
                    }}
                    className="w-full p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar name={name} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-zinc-950 dark:text-white">
                          {name}
                        </div>
                        <div className="text-3xs text-zinc-400 font-mono">{email}</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Message &rarr;
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
