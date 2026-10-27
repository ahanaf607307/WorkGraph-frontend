"use client";

import React from "react";
import { ChatMessageItem } from "../../../modules/chat/actions/chat.actions";
import { uploadActions } from "../../../modules/upload/actions/upload.actions";
import { Avatar } from "../../../components/ui/avatar";
import { CheckCheck, FileText, Download, ExternalLink, Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface MessageBubbleProps {
  message: ChatMessageItem;
  isMine: boolean;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message: m, isMine, onDelete }) => {
  const time = new Date(m.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const senderName = m.sender?.name || "Member";
  const attachments = Array.isArray(m.attachments) ? m.attachments : [];

  // 2 days (48 hours) limit
  const messageAgeMs = Date.now() - new Date(m.createdAt).getTime();
  const isWithinTwoDays = messageAgeMs <= 2 * 24 * 60 * 60 * 1000;
  const canRemove = isMine && isWithinTwoDays && !!onDelete;

  return (
    <div
      className={cn(
        "group flex items-end space-x-2.5 max-w-[85%] md:max-w-[75%]",
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
            "p-3 rounded-2xl text-xs leading-relaxed shadow-xs break-words space-y-2",
            isMine
              ? "bg-orange-500 text-white font-medium rounded-br-xs"
              : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-bl-xs"
          )}
        >
          {/* Attachments rendering */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((att: any, idx: number) => {
                const isImg =
                  (att.type && att.type.startsWith("image/")) ||
                  /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name || att.url || "");
                const fileUrl = uploadActions.getFileUrl(att.url);

                if (isImg) {
                  return (
                    <div key={idx} className="rounded-xl overflow-hidden max-w-sm">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={fileUrl}
                          alt={att.name || "Attachment"}
                          className="max-h-60 w-auto rounded-xl object-cover hover:opacity-95 transition-opacity cursor-pointer"
                        />
                      </a>
                    </div>
                  );
                }

                return (
                  <a
                    key={idx}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center space-x-2 p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                      isMine
                        ? "bg-orange-600/80 hover:bg-orange-600 text-white"
                        : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200"
                    )}
                  >
                    <FileText className="w-4 h-4 shrink-0 text-orange-200" />
                    <span className="truncate flex-1">{att.name || "File Attachment"}</span>
                    <Download className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  </a>
                );
              })}
            </div>
          )}

          {m.content && <p>{m.content}</p>}
        </div>

        <div
          className={cn(
            "text-3xs text-zinc-400 flex items-center gap-1.5 font-mono",
            isMine ? "justify-end pr-1" : "pl-1"
          )}
        >
          {canRemove && (
            <button
              type="button"
              onClick={() => onDelete?.(m.id)}
              title="Remove message (within 2 days)"
              className="opacity-70 group-hover:opacity-100 hover:opacity-100 text-rose-500 hover:text-rose-600 transition-all flex items-center gap-0.5 text-3xs font-sans font-medium cursor-pointer px-1 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-2.5 h-2.5" />
              <span>Remove</span>
            </button>
          )}
          <span>{time}</span>
          {isMine && <CheckCheck className="w-3 h-3 text-orange-500" />}
        </div>
      </div>
    </div>
  );
};
