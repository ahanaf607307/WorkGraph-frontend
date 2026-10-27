"use client";

import React, { useEffect, useState } from "react";
import { Clock, Timer } from "lucide-react";

export const AttendanceHeaderBanner: React.FC = () => {
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-black to-zinc-950 border border-zinc-800 text-white shadow-xl">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
          <Clock className="w-3.5 h-3.5" />
          Live Enterprise Timesheet
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Daily Attendance & Work Log Tracker
        </h1>
        <p className="text-xs text-zinc-400">
          Log daily check-in/checkout, review date-wise presence, and record project execution tasks.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-800/80 px-5 py-3 rounded-2xl border border-zinc-700/80 shrink-0">
        <div className="text-right">
          <div className="text-2xs font-mono uppercase text-orange-400 font-bold">Current Local Time</div>
          <div className="text-xl font-black font-mono tracking-tight text-white">
            {currentTimeStr || "--:--:--"}
          </div>
          <div className="text-3xs text-zinc-400 font-mono">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
          <Timer className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
