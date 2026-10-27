"use client";

import React, { useState, useRef } from "react";
import { Send, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadActions, UploadedFileResponse } from "../../../modules/upload/actions/upload.actions";
import { toast } from "sonner";

interface MessageInputProps {
  messageText: string;
  onTextChange: (text: string) => void;
  onSend: (e: React.FormEvent, attachments?: any[]) => void;
  disabled?: boolean;
  blockedNotice?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  messageText,
  onTextChange,
  onSend,
  disabled = false,
  blockedNotice,
}) => {
  const [attachment, setAttachment] = useState<UploadedFileResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (blockedNotice) {
    return (
      <div className="p-4 border-t border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 text-center">
        <div className="text-xs font-bold text-rose-600 dark:text-rose-400">
          {blockedNotice}
        </div>
        <p className="text-2xs text-rose-500/80 mt-0.5">
          Messaging is disabled for this conversation.
        </p>
      </div>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadActions.uploadFile(file);
      setAttachment(res);
      toast.success(`Attached "${file.name}"`);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachment) return;

    const attachmentsPayload = attachment
      ? [
          {
            name: attachment.originalName,
            url: attachment.url,
            type: attachment.mimeType,
            size: attachment.size,
          },
        ]
      : undefined;

    onSend(e, attachmentsPayload);
    setAttachment(null);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="p-3 md:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col space-y-2 shrink-0"
    >
      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 text-xs w-fit max-w-full">
          <div className="flex items-center space-x-2 truncate pr-2">
            {attachment.mimeType.startsWith("image/") ? (
              <ImageIcon className="w-4 h-4 text-orange-500 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-orange-500 shrink-0" />
            )}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {attachment.originalName}
            </span>
            <span className="text-2xs text-zinc-500 font-mono">
              ({(attachment.size / 1024).toFixed(1)} KB)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded-md hover:bg-orange-200/50 dark:hover:bg-orange-900/50 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-center space-x-2">
        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          title="Upload image or document"
          className="p-2.5 rounded-xl bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        <input
          type="text"
          placeholder="Type your message... (Press Enter to send)"
          value={messageText}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-transparent focus:border-orange-500 dark:focus:border-orange-500 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all placeholder:text-zinc-400"
        />

        <button
          type="submit"
          disabled={disabled || (!messageText.trim() && !attachment)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
        >
          <span className="hidden sm:inline">Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </form>
  );
};
