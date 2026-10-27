"use client";

import React from "react";
import { AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";

interface AttendanceCalendarCardProps {
  currentDate: Date;
  selectedDateStr: string;
  todayStr: string;
  records: AttendanceRecord[];
  onSelectDate: (dateStr: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export const AttendanceCalendarCard: React.FC<AttendanceCalendarCardProps> = ({
  currentDate,
  selectedDateStr,
  todayStr,
  records,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}) => {
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday

  // Map records by date YYYY-MM-DD
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach((r) => {
    recordMap.set(r.date, r);
  });

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-3">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-orange-500" />
          <h2 className="text-base font-bold text-zinc-950 dark:text-white">
            {currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </h2>
        </div>

        {/* Status Legend & Navigation Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
              ✓ Present
            </span>
            <span className="inline-flex items-center gap-1 text-rose-500 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-medium">
              ✕ Absent
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-semibold">
              ⏳ Pending
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-zinc-600 dark:text-zinc-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center font-mono text-3xs text-zinc-400 font-bold uppercase pb-1">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[72px] rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isSelected = selectedDateStr === dateStr;
          const isToday = todayStr === dateStr;
          const isPast = dateStr < todayStr;
          const record = recordMap.get(dateStr);
          const isPresent = !!record?.checkInTime;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "relative min-h-[72px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group",
                isSelected
                  ? "border-violet-600 bg-violet-50/70 dark:bg-violet-950/40 shadow-sm ring-1 ring-violet-500/30"
                  : isToday
                  ? "border-violet-400/80 bg-violet-50/40 dark:bg-violet-950/20"
                  : "border-zinc-200/80 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              )}

            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-mono font-bold",
                    isToday
                      ? "text-violet-600 dark:text-violet-400 font-black"
                      : "text-zinc-700 dark:text-zinc-300"
                  )}
                >
                  {dayNum}
                </span>

                {isToday && (
                  <span className="px-1.5 py-0.2 rounded-md bg-violet-600 text-white text-3xs font-mono font-bold tracking-tight">
                    Today
                  </span>
                )}
              </div>

              {/* Status Pill Badge (Ultra-clean, minimal & sleek) */}
              <div className="mt-auto pt-1">
                {isPresent ? (
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-none">
                    <span className="text-[8px]">✓</span>
                    <span>Present</span>
                  </div>
                ) : isPast ? (
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8.5px] font-mono font-medium bg-rose-500/10 text-rose-500/90 dark:text-rose-400/90 border border-rose-500/20 leading-none">
                    <span className="text-[7.5px]">✕</span>
                    <span>Absent</span>
                  </div>
                ) : isToday ? (
                  <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-none">
                    <span className="text-[8px]">⏳</span>
                    <span>Pending</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

