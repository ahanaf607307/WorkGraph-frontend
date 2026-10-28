"use client";

import React, { useEffect, useState } from "react";
import { Clock, Timer } from "lucide-react";
import { PermissionButton } from "../../../components/shared/PermissionModal";

interface AttendanceHeaderBannerProps {
  onOpenPermissions?: () => void;
}

export const AttendanceHeaderBanner: React.FC<AttendanceHeaderBannerProps> = ({
  onOpenPermissions,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
      <div>
        <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
          <span>Daily Attendance & Work Log Tracker</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Daily check-in/checkout, calendar attendance presence, and task logs
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {onOpenPermissions && (
          <PermissionButton onClick={onOpenPermissions} />
        )}
        <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/[0.06] shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-zinc-900 dark:text-white">
              {currentTimeStr || "--:--:--"}
            </div>
            <div className="text-3xs text-zinc-400 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Timer className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
