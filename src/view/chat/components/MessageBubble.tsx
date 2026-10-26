"use client";

import React from "react";
import { ChatMessageItem } from "../../../modules/chat/actions/chat.actions";
import { Avatar } from "../../../components/ui/avatar";
import { CheckCheck } from "lucide-react";
import { cn } from "../../../lib/utils";

interface MessageBubbleProps {
  message: ChatMessageItem;
  isMine: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message: m, isMine }) => {
  const time = new Date(m.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const senderName = m.sender?.name || "Member";

  return (
    <div
      className={cn(
        "flex items-end space-x-2.5 max-w-[80%]",
        isMine ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
      )}
    >
      {!isMine && <Avatar name={senderName} size="sm" />}

      <div className="space-y-1">
        {!isMine && (
          <div className="text-3xs font-semibold text-zinc-500 pl-1">
            {senderName}
          </div>
        )}

        <div
          className={cn(
            "px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words",
            isMine
              ? "bg-amber-400 text-black font-medium rounded-br-xs"
              : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-zinc-700/80 rounded-bl-xs"
          )}
        >
          {m.content}
        </div>

        <div
          className={cn(
            "text-3xs text-zinc-400 flex items-center gap-1 font-mono",
            isMine ? "justify-end pr-1" : "pl-1"
          )}
        >
          <span>{time}</span>
          {isMine && <CheckCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
        </div>
      </div>
    </div>
  );
};
