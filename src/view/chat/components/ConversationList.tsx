"use client";

import React from "react";
import { ConversationItem } from "../../../modules/chat/actions/chat.actions";
import { ConversationListItem, getConversationTitle } from "./ConversationListItem";
import { MessageSquare, UserPlus, Plus, Search } from "lucide-react";

interface ConversationListProps {
  conversations: ConversationItem[];
  activeConversation: ConversationItem | null;
  currentUserId?: string;
  workspaceName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConversation: (c: ConversationItem) => void;
  onOpenDirectModal: () => void;
  onOpenGroupModal: () => void;
  isLoading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  currentUserId,
  workspaceName,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onOpenDirectModal,
  onOpenGroupModal,
  isLoading,
}) => {
  const filteredConversations = conversations.filter((c) => {
    const title = getConversationTitle(c, currentUserId).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || (c.description || "").toLowerCase().includes(query);
  });

  return (
    <div className="w-80 md:w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
      {/* Header & Quick Action Buttons */}
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
              Messages & Channels
            </h2>
            <p className="text-2xs text-zinc-500 font-mono">
              {workspaceName || "Workspace"} • Live Socket.IO
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDirectModal}
              title="New Direct Message"
              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenGroupModal}
              title="Create Group Channel"
              className="p-2 rounded-xl bg-amber-400 text-black hover:bg-amber-500 font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Group</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-transparent focus:border-amber-400 dark:focus:border-amber-400 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading channels...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              No conversations yet
            </div>
            <p className="text-2xs text-zinc-400">
              Start a direct message or create a group channel to begin chatting.
            </p>
            <button
              type="button"
              onClick={onOpenDirectModal}
              className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Start a conversation &rarr;
            </button>
          </div>
        ) : (
          filteredConversations.map((c) => (
            <ConversationListItem
              key={c.id}
              conversation={c}
              isActive={activeConversation?.id === c.id}
              currentUserId={currentUserId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
};
