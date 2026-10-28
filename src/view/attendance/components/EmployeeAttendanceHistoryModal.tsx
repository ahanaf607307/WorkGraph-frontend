"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../../components/ui/modal";
import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { attendanceActions, AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";
import { Calendar, Clock, CheckCircle2, XCircle, Briefcase, FileText, ChevronDown, ChevronRight, User, MessageSquare, Shield, MessageCircle } from "lucide-react";
import { formatDate, cn } from "../../../lib/utils";
import { toast } from "sonner";

interface EmployeeAttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  employee: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    avatarUrl?: string | null;
    department?: string | null;
    squad?: string | null;
    role?: string | null;
  } | null;
}

export const EmployeeAttendanceHistoryModal: React.FC<EmployeeAttendanceHistoryModalProps> = ({
  isOpen,
  onClose,
  orgId,
  employee,
}) => {
  const queryClient = useQueryClient();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [adminCommentInput, setAdminCommentInput] = useState("");

  const commentMutation = useMutation({
    mutationFn: ({ taskId, adminComment }: { taskId: string; adminComment: string }) =>
      attendanceActions.updateDailyTask(orgId, taskId, { adminComment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-attendance-history", orgId, employee?.id] });
      toast.success("Admin feedback posted");
      setCommentingTaskId(null);
      setAdminCommentInput("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to post comment"),
  });

  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["member-attendance-history", orgId, employee?.id],
    queryFn: () => attendanceActions.getMemberAttendanceHistory(orgId, employee!.id),
    enabled: !!orgId && !!employee?.id && isOpen,
  });

  const toggleExpand = (date: string) => {
    setExpandedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  if (!employee) return null;

  const totalRecords = records.length;
  const presentCount = records.filter((r) => !!r.checkInTime).length;
  const totalMinutes = records.reduce((acc, r) => acc + (r.workingMinutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={`${employee.name}'s Attendance & Daily Task History`}
      description={`Review date-wise timesheet, check-in/out records, task execution status, update messages, and supervisor comments.`}
    >
      <div className="space-y-5 pt-2 max-h-[80vh] overflow-y-auto pr-1.5">
        {/* Employee Info Card */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <Avatar name={employee.name} size="md" />
            <div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                {employee.name}
                {employee.employeeId && (
                  <span className="text-3xs font-mono font-bold bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.2 rounded text-zinc-800 dark:text-zinc-200">
                    ID: {employee.employeeId}
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-400 font-mono">{employee.email}</div>
              <div className="text-2xs text-zinc-500 mt-0.5 flex items-center gap-2">
                <span>🏢 {employee.department || "General Department"}</span>
                <span>•</span>
                <span>👥 {employee.squad || "No Squad"}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2">
            <div className="text-center px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {presentCount}
              </div>
              <div className="text-3xs font-mono uppercase text-emerald-700 dark:text-emerald-300">
                Present
              </div>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
              <div className="text-xs font-black text-orange-600 dark:text-orange-400 font-mono">
                {totalHours}h
              </div>
              <div className="text-3xs font-mono uppercase text-orange-700 dark:text-orange-300">
                Worked
              </div>
            </div>
          </div>
        </div>

        {/* Date-wise Attendance & Task List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
              Date-wise Logged Days ({totalRecords})
            </h4>
            <span className="text-3xs text-zinc-400 font-mono">
              Click any date to inspect daily tasks
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Loading employee timesheet records...
            </div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              No attendance records logged for this employee yet.
            </div>
          ) : (
            records.map((r) => {
              const isPresent = !!r.checkInTime;
              const isExpanded = expandedDates[r.date] ?? true; // default expanded
              const taskCount = r.dailyTasks?.length || 0;

              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs"
                >
                  {/* Date Header Row */}
                  <div
                    onClick={() => toggleExpand(r.date)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors select-none"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1 rounded-lg text-zinc-400">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-orange-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                          <span>{formatDate(r.date)}</span>
                          <span className="text-3xs font-mono text-zinc-400">({r.date})</span>
                        </div>
                        <div className="flex items-center gap-3 text-3xs font-mono text-zinc-400 mt-0.5">
                          <span>
                            In:{" "}
                            {r.checkInTime
                              ? new Date(r.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "—"}
                          </span>
                          <span>•</span>
                          <span>
                            Out:{" "}
                            {r.checkOutTime
                              ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "—"}
                          </span>
                          <span>•</span>
                          <span className="text-orange-600 dark:text-orange-400 font-bold">
                            {Math.floor(r.workingMinutes / 60)}h {r.workingMinutes % 60}m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300">
                        {taskCount} {taskCount === 1 ? "task" : "tasks"}
                      </span>

                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ✓ Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          ✕ Absent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tasks Section for this Date */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2">
                      {taskCount === 0 ? (
                        <div className="text-center py-3 text-3xs text-zinc-400 italic">
                          No tasks logged on this date.
                        </div>
                      ) : (
                        r.dailyTasks!.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-xs font-bold text-zinc-900 dark:text-white">
                                  {task.title}
                                </h5>
                                {task.project && (
                                  <span className="inline-block mt-0.5 text-3xs font-mono font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded-md">
                                    📁 {task.project.name}
                                  </span>
                                )}
                              </div>

                              <span
                                className={cn(
                                  "text-3xs font-mono font-bold rounded-md px-2 py-0.5 border shrink-0",
                                  task.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                    : task.status === "IN_PROGRESS"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                                )}
                              >
                                {task.status}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-3xs text-zinc-500 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Member Task Update Message */}
                            {task.updateMessage && (
                              <div className="p-2 rounded-lg bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/40 text-xs">
                                <div className="text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-0.5">
                                  <MessageSquare className="w-3 h-3" /> Member Update Message:
                                </div>
                                <p className="text-zinc-800 dark:text-zinc-200">{task.updateMessage}</p>
                              </div>
                            )}

                            {/* Admin Comment Section */}
                            <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-amber-500" /> Admin Feedback:
                                </span>
                                {commentingTaskId !== task.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCommentingTaskId(task.id);
                                      setAdminCommentInput(task.adminComment || "");
                                    }}
                                    className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <MessageCircle className="w-2.5 h-2.5" />
                                    <span>{task.adminComment ? "Edit Feedback" : "+ Give Feedback"}</span>
                                  </button>
                                )}
                              </div>

                              {commentingTaskId === task.id ? (
                                <div className="space-y-1.5 pt-1">
                                  <textarea
                                    value={adminCommentInput}
                                    onChange={(e) => setAdminCommentInput(e.target.value)}
                                    placeholder="Write admin feedback on this employee task..."
                                    rows={2}
                                    className="w-full text-xs p-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                                  />
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setCommentingTaskId(null)}
                                      className="text-3xs h-6 px-2"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => {
                                        if (adminCommentInput.trim()) {
                                          commentMutation.mutate({ taskId: task.id, adminComment: adminCommentInput.trim() });
                                        }
                                      }}
                                      disabled={commentMutation.isPending}
                                      className="text-3xs h-6 px-2.5 bg-amber-500 hover:bg-amber-600 text-white"
                                    >
                                      Post Feedback
                                    </Button>
                                  </div>
                                </div>
                              ) : task.adminComment ? (
                                <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-zinc-800 dark:text-zinc-200">
                                  <div className="text-[9px] text-zinc-400 font-mono flex items-center justify-between mb-0.5">
                                    <span>By: {task.adminCommenterName || "Admin"}</span>
                                    {task.adminCommentedAt && (
                                      <span>
                                        {new Date(task.adminCommentedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    )}
                                  </div>
                                  <div>{task.adminComment}</div>
                                </div>
                              ) : null}
                            </div>

                            <div className="text-3xs text-zinc-400 font-mono flex items-center gap-1 pt-1">
                              <Clock className="w-3 h-3 text-orange-400" />
                              <span>
                                {task.timeSpentMinutes
                                  ? `${Math.floor(task.timeSpentMinutes / 60)}h ${task.timeSpentMinutes % 60}m logged`
                                  : "0h logged"}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
