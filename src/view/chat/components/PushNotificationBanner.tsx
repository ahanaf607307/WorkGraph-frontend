"use client";

import React from "react";
import { Bell, X } from "lucide-react";

interface PushNotificationBannerProps {
  onEnable: () => void;
  onTest: () => void;
  onDismiss: () => void;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  onEnable,
  onTest,
  onDismiss,
}) => {
  return (
    <div className="bg-amber-400 text-black px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs shrink-0">
      <div className="flex items-center space-x-2 truncate">
        <Bell className="w-4 h-4 shrink-0" />
        <span className="truncate">
          Enable Web Push notifications to receive live instant messages and task alerts directly on desktop.
        </span>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
        <button
          type="button"
          onClick={onEnable}
          className="px-3 py-1 bg-black text-amber-400 hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
        >
          Enable Now
        </button>
        <button
          type="button"
          onClick={onTest}
          className="px-2.5 py-1 bg-amber-500/40 text-black hover:bg-amber-500/60 rounded-lg text-xs font-medium cursor-pointer"
        >
          Test
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 hover:bg-amber-500/40 rounded-md cursor-pointer text-black"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
