"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../../../components/ui/dialog";
import { Avatar } from "../../../components/ui/avatar";
import { chatActions } from "../../../modules/chat/actions/chat.actions";
import { Search, Shield, Building2 } from "lucide-react";

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

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["chat-user-search", searchQuery],
    queryFn: () => chatActions.searchUsers(searchQuery),
    enabled: isOpen,
  });

  // Use searchResults from backend, or fallback to passed members
  const candidateList = searchResults.length > 0 ? searchResults : members;

  const filteredMembers = candidateList.filter((m: any) => {
    const name = m.name || m.user?.name || "";
    const email = m.email || m.user?.email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent maxWidth="md">
        <DialogHeader>
          <DialogTitle>Start Direct 1-to-1 Conversation</DialogTitle>
          <DialogDescription>
            Search by name, role, or email to start a private conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user, admin, or platform owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-[#141722] text-xs text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] focus:border-violet-500 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                Searching available contacts...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">
                No matching members or administrators found.
              </div>
            ) : (
              filteredMembers.map((m: any) => {
                const name = m.name || m.user?.name || "Member";
                const email = m.email || m.user?.email || "";
                const targetId = m.userId || m.user?.id || m.id;
                const isSystemOwner = m.role === "SYSTEM_OWNER";
                const isSystemAdmin =
                  m.role === "SYSTEM_ADMIN" ||
                  m.role === "WORKSPACE_ADMIN" ||
                  m.role === "OWNER";

                return (
                  <button
                    key={targetId}
                    type="button"
                    onClick={() => {
                      onStartDirect(targetId);
                      onClose();
                    }}
                    className="w-full p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar name={name} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                          <span>{name}</span>
                          {isSystemOwner && (
                            <span className="text-3xs font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" />
                              SUPER OWNER
                            </span>
                          )}
                          {isSystemAdmin && !isSystemOwner && (
                            <span className="text-3xs font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              SYS ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-3xs text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{email}</span>
                          {m.companyName && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 dark:text-orange-400">{m.companyName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Chat &rarr;
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
