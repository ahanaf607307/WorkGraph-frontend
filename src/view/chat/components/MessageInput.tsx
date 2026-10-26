"use client";

import React from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  messageText: string;
  onTextChange: (text: string) => void;
  onSend: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  messageText,
  onTextChange,
  onSend,
  disabled = false,
}) => {
  return (
    <form
      onSubmit={onSend}
      className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center space-x-3 shrink-0"
    >
      <input
        type="text"
        placeholder="Type your message... (Press Enter to send)"
        value={messageText}
        onChange={(e) => onTextChange(e.target.value)}
        className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-amber-400 dark:focus:border-amber-400 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all"
      />

      <button
        type="submit"
        disabled={disabled || !messageText.trim()}
        className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
      >
        <span>Send</span>
        <Send className="w-3.5 h-3.5" />
      </button>
    </form>
  );
};
