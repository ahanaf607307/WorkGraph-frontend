"use client";

import React from "react";
import Link from "next/link";
import { ConversationItem } from "../../../modules/chat/actions/chat.actions";
import { uploadActions } from "../../../modules/upload/actions/upload.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Users, LayoutDashboard, ArrowLeft, ShieldAlert } from "lucide-react";
import { getConversationTitle, getConversationSubtitle } from "./ConversationListItem";

interface ChatHeaderProps {
  conversation: ConversationItem;
  currentUserId?: string;
  onOpenGroupDetails?: () => void;
  onOpenDirectDetails?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  currentUserId,
  onOpenGroupDetails,
  onOpenDirectDetails,
}) => {
  const isGroup = conversation.type === "GROUP" || (conversation as any).isGroup;
  const title = getConversationTitle(conversation, currentUserId);
  const subtitle = getConversationSubtitle(conversation, currentUserId);
  const isBlocked = conversation.isBlocked || false;
  const avatarUrl = conversation.avatarUrl ? uploadActions.getFileUrl(conversation.avatarUrl) : null;

  const handleClickHeader = () => {
    if (isGroup) {
      onOpenGroupDetails?.();
    } else {
      onOpenDirectDetails?.();
    }
  };

  return (
    <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
      {/* Clickable Title & Details trigger */}
      <div
        onClick={handleClickHeader}
        title="Click to view details & shared media"
        className="flex items-center space-x-3 cursor-pointer hover:opacity-85 transition-opacity max-w-[65%]"
      >
        {isGroup ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
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

        <div className="truncate">
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2 truncate">
            <span className="truncate">{title}</span>
            {isBlocked && (
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Blocked
              </span>
            )}
            {isGroup ? (
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 shrink-0">
                Squad Channel
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                Direct Contact
              </span>
            )}
          </h3>
          <p className="text-2xs text-zinc-500 font-mono truncate">
            {isGroup
              ? `${conversation.participants?.length || 0} members • Click for info & shared files`
              : `${subtitle} • Click for profile & shared files`}
          </p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center space-x-2">
        {/* Participants Avatar Stack for Groups */}
        {isGroup && (
          <div
            onClick={onOpenGroupDetails}
            className="hidden sm:flex -space-x-1.5 overflow-hidden cursor-pointer"
            title="Manage Group Members"
          >
            {(conversation.participants || []).slice(0, 4).map((p) => {
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
            {(conversation.participants?.length || 0) > 4 && (
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950 text-2xs font-bold text-orange-700 dark:text-orange-300 ring-2 ring-white dark:ring-zinc-900">
                +{(conversation.participants?.length || 0) - 4}
              </span>
            )}
          </div>
        )}

        {/* Back to Dashboard Button */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to</span>
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
