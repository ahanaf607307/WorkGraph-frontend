"use client";

import React from "react";
import { ConversationItem } from "../../../modules/chat/actions/chat.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Users } from "lucide-react";
import { getConversationTitle, getConversationSubtitle } from "./ConversationListItem";

interface ChatHeaderProps {
  conversation: ConversationItem;
  currentUserId?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ conversation, currentUserId }) => {
  const isGroup = conversation.type === "GROUP" || (conversation as any).isGroup;
  const title = getConversationTitle(conversation, currentUserId);
  const subtitle = getConversationSubtitle(conversation, currentUserId);

  return (
    <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
      <div className="flex items-center space-x-3">
        {isGroup ? (
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        ) : (
          <Avatar name={title} size="md" />
        )}

        <div>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
            {title}
            {isGroup ? (
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Squad Channel
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                Direct
              </span>
            )}
          </h3>
          <p className="text-2xs text-zinc-500 font-mono">
            {isGroup
              ? `${conversation.participants?.length || 0} team members participating`
              : subtitle}
          </p>
        </div>
      </div>

      {/* Header Right Actions / Participants Stack */}
      <div className="flex items-center space-x-2">
        {isGroup && (
          <div className="hidden sm:flex -space-x-1.5 overflow-hidden">
            {(conversation.participants || []).slice(0, 5).map((p) => {
              const name = p.user?.name || (p as any).name || "Member";
              return (
                <div
                  key={p.id || p.userId}
                  title={name}
                  className="inline-block ring-2 ring-white dark:ring-zinc-900 rounded-full"
                >
                  <Avatar name={name} size="sm" />
                </div>
              );
            })}
            {(conversation.participants?.length || 0) > 5 && (
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-2xs font-bold text-zinc-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
                +{(conversation.participants?.length || 0) - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
