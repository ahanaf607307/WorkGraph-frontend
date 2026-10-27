"use client";

import React from "react";
import { ConversationItem } from "../../../modules/chat/actions/chat.actions";
import { uploadActions } from "../../../modules/upload/actions/upload.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Users, Lock } from "lucide-react";
import { cn } from "../../../lib/utils";

export const getConversationTitle = (c: ConversationItem, currentUserId?: string): string => {
  if (c.type === "GROUP" || (c as any).isGroup) {
    return c.name || "Group Channel";
  }
  const other = c.participants?.find((p) => p.userId !== currentUserId) || c.participants?.[0];
  return other?.user?.name || (other as any)?.name || "Direct Message";
};

export const getConversationSubtitle = (c: ConversationItem, currentUserId?: string): string => {
  if (c.type === "GROUP" || (c as any).isGroup) {
    return `${c.participants?.length || 0} members`;
  }
  const other = c.participants?.find((p) => p.userId !== currentUserId) || c.participants?.[0];
  return other?.user?.email || (other as any)?.email || "";
};

interface ConversationListItemProps {
  conversation: ConversationItem;
  isActive: boolean;
  currentUserId?: string;
  onSelect: (c: ConversationItem) => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation: c,
  isActive,
  currentUserId,
  onSelect,
}) => {
  const title = getConversationTitle(c, currentUserId);
  const subtitle = getConversationSubtitle(c, currentUserId);
  const isGroup = c.type === "GROUP" || (c as any).isGroup;
  const isBlocked = c.isBlocked || false;
  const avatarUrl = c.avatarUrl ? uploadActions.getFileUrl(c.avatarUrl) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(c)}
      className={cn(
        "w-full p-3.5 flex items-center space-x-3 text-left transition-colors cursor-pointer",
        isActive
          ? "bg-orange-50 dark:bg-orange-950/20 border-r-4 border-orange-500"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
      )}
    >
      <div className="relative shrink-0">
        {isGroup ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
          )
        ) : (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            />
          ) : (
            <Avatar name={title} size="md" />
          )
        )}

        {!isGroup && !isBlocked && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        )}

        {isBlocked && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-3xs ring-2 ring-white dark:ring-zinc-900">
            <Lock className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
            {title}
          </span>
          {c.lastMessageAt && (
            <span className="text-3xs text-zinc-400 shrink-0 ml-1 font-mono">
              {new Date(c.lastMessageAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-2xs text-zinc-500 dark:text-zinc-400 truncate">
            {isBlocked ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Conversation Blocked</span>
            ) : c.lastMessage ? (
              <>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {c.lastMessage.sender?.name ? c.lastMessage.sender.name.split(" ")[0] : "Member"}:
                </span>{" "}
                {c.lastMessage.content || "Sent an attachment"}
              </>
            ) : (
              subtitle
            )}
          </p>

          {(c.unreadCount || 0) > 0 && (
            <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-orange-500 text-white font-extrabold text-3xs shrink-0 shadow-2xs">
              {c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
