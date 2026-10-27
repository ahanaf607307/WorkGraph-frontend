"use client";

import React from "react";
import { AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";
import { Button } from "../../../components/ui/button";
import { Check, CheckCircle2, Clock, Timer, Lock, AlertCircle } from "lucide-react";
import { formatDate } from "../../../lib/utils";

interface AttendanceShiftDetailsCardProps {
  selectedDateStr: string;
  todayStr: string;
  selectedRecord?: AttendanceRecord;
  todayRecord?: AttendanceRecord;
  isTodayCheckedIn: boolean;
  isTodayCheckedOut: boolean;
  isSystemAdminOrAdmin: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  isCheckingIn: boolean;
  isCheckingOut: boolean;
}

export const AttendanceShiftDetailsCard: React.FC<AttendanceShiftDetailsCardProps> = ({
  selectedDateStr,
  todayStr,
  selectedRecord,
  todayRecord,
  isTodayCheckedIn,
  isTodayCheckedOut,
  isSystemAdminOrAdmin,
  onCheckIn,
  onCheckOut,
  isCheckingIn,
  isCheckingOut,
}) => {
  const isSelectedDatePast = selectedDateStr < todayStr;
  const isSelectedDateFuture = selectedDateStr > todayStr;
  const isSelectedDateToday = selectedDateStr === todayStr;

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="text-3xs font-mono uppercase text-zinc-400 font-bold">
            {isSelectedDateToday
              ? "Today's Live Shift"
              : isSelectedDatePast
              ? "Historical Record (Past Date)"
              : "Upcoming Scheduled Date"}
          </div>
          <h3 className="text-base font-bold text-zinc-950 dark:text-white">
            {formatDate(selectedDateStr)}
          </h3>
        </div>

        {isSelectedDateToday ? (
          isTodayCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Present
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              Check-in Pending
            </span>
          )
        ) : selectedRecord?.checkInTime ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Present
          </span>
        ) : isSelectedDatePast ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
            ✕ Absent
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
            Future
          </span>
        )}
      </div>

      {/* Action Buttons for Today (Check In / Check Out) */}
      {isSelectedDateToday && (
        <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-900 dark:text-white">
              {isTodayCheckedIn
                ? `Checked in at ${new Date(todayRecord!.checkInTime!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Ready to record today's presence?"}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {!isTodayCheckedIn && (
              <Button
                onClick={onCheckIn}
                isLoading={isCheckingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Present (Check In)</span>
              </Button>
            )}

            {isTodayCheckedIn && !isTodayCheckedOut && (
              <Button
                onClick={onCheckOut}
                isLoading={isCheckingOut}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-2.5 rounded-xl shadow-md shadow-orange-500/20 text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Timer className="w-4 h-4" />
                <span>Check Out</span>
              </Button>
            )}

            {isTodayCheckedOut && (
              <div className="w-full py-2 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                ✓ Shift Completed ({Math.floor((todayRecord?.workingMinutes || 0) / 60)}h {(todayRecord?.workingMinutes || 0) % 60}m logged)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Details Metrics */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium">Check-in Time:</span>
          <span className="font-mono font-bold text-zinc-900 dark:text-white">
            {selectedRecord?.checkInTime
              ? new Date(selectedRecord.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium">Check-out Time:</span>
          <span className="font-mono font-bold text-zinc-900 dark:text-white">
            {selectedRecord?.checkOutTime
              ? new Date(selectedRecord.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 font-medium">Daily Working Duration:</span>
          <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
            {selectedRecord?.workingMinutes
              ? `${Math.floor(selectedRecord.workingMinutes / 60)}h ${selectedRecord.workingMinutes % 60}m`
              : "0h 0m"}
          </span>
        </div>
      </div>

      {/* Lock Warning for Previous Dates */}
      {isSelectedDatePast && !isSystemAdminOrAdmin && (
        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-2xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200">
            <Lock className="w-3.5 h-3.5 text-orange-500" />
            Previous Date Locked
          </div>
          <div>
            This date has passed. Check-in, checkout, and daily task modifications are locked. Contact your System Admin for attendance manual overrides.
          </div>
        </div>
      )}

      {/* Future Date Notice */}
      {isSelectedDateFuture && !isSystemAdminOrAdmin && (
        <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-2xs text-zinc-600 dark:text-zinc-400 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Upcoming Date
          </div>
          <div>
            Attendance and tasks cannot be logged in advance. You can only log presence and tasks on the actual date.
          </div>
        </div>
      )}
    </div>
  );
};
