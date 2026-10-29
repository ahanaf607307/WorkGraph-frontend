"use client";

import React, { useState } from "react";
import { AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";
import { Button } from "../../../components/ui/button";
import { PlusCircle, CheckCircle2, Clock, MessageSquare, Send, Shield, Edit3, MessageCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

interface AttendanceDailyTasksCardProps {
  selectedRecord?: AttendanceRecord;
  canEditSelectedDate: boolean;
  isAdmin?: boolean;
  onOpenTaskModal: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: string) => void;
  onSaveTaskUpdateMessage: (taskId: string, updateMessage: string) => void;
  onSaveAdminComment?: (taskId: string, comment: string) => void;
}

export const AttendanceDailyTasksCard: React.FC<AttendanceDailyTasksCardProps> = ({
  selectedRecord,
  canEditSelectedDate,
  isAdmin = false,
  onOpenTaskModal,
  onUpdateTaskStatus,
  onSaveTaskUpdateMessage,
  onSaveAdminComment,
}) => {
  const [editingUpdateMsgTaskId, setEditingUpdateMsgTaskId] = useState<string | null>(null);
  const [updateMsgInput, setUpdateMsgInput] = useState("");

  const [commentingTaskId, setCommentingTaskId] = useState<string | null>(null);
  const [adminCommentInput, setAdminCommentInput] = useState("");

  const handleStartEditUpdateMsg = (taskId: string, currentMsg?: string | null) => {
    setEditingUpdateMsgTaskId(taskId);
    setUpdateMsgInput(currentMsg || "");
  };

  const handleSaveUpdateMsg = (taskId: string) => {
    if (!updateMsgInput.trim()) return;
    onSaveTaskUpdateMessage(taskId, updateMsgInput.trim());
    setEditingUpdateMsgTaskId(null);
    setUpdateMsgInput("");
  };

  const handleSaveAdminComment = (taskId: string) => {
    if (!adminCommentInput.trim() || !onSaveAdminComment) return;
    onSaveAdminComment(taskId, adminCommentInput.trim());
    setCommentingTaskId(null);
    setAdminCommentInput("");
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-white/[0.04]">
        <span className="text-xs font-bold text-zinc-950 dark:text-white">
          Daily Tasks & Work Logs ({selectedRecord?.dailyTasks?.length || 0})
        </span>

        {canEditSelectedDate && (
          <Button
            size="sm"
            onClick={onOpenTaskModal}
            className="text-2xs bg-violet-600 hover:bg-violet-700 text-white font-medium px-3 py-1.5 rounded-xl cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" /> Log Task
          </Button>
        )}
      </div>

      <div className="space-y-2.5 max-h-96 overflow-y-auto">
        {!selectedRecord?.dailyTasks || selectedRecord.dailyTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-zinc-400 border border-dashed border-zinc-200/80 dark:border-white/[0.06] rounded-xl">
            No tasks logged for this date.
          </div>
        ) : (
          selectedRecord.dailyTasks.map((t) => (
            <div
              key={t.id}
              className="p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] space-y-2 hover:border-violet-500/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-white leading-tight">
                    {t.title}
                  </h4>
                  {t.project && (
                    <span className="inline-block mt-1 text-3xs font-mono font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.2 rounded-md">
                      📁 {t.project.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {canEditSelectedDate ? (
                    <select
                      value={t.status}
                      onChange={(e) => onUpdateTaskStatus(t.id, e.target.value)}
                      className={cn(
                        "text-3xs font-mono font-bold rounded-lg px-2 py-1 border border-zinc-200 dark:border-zinc-700 focus:outline-none cursor-pointer",
                        t.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      <option value="TODO">To-Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "text-3xs font-mono font-bold rounded-lg px-2 py-0.5 border border-zinc-200 dark:border-zinc-700",
                        t.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : t.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      {t.status}
                    </span>
                  )}
                </div>
              </div>

              {t.description && (
                <p className="text-3xs text-zinc-500 leading-relaxed">
                  {t.description}
                </p>
              )}

              {/* Member Update Message Section */}
              <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Member Task Update:
                  </span>
                  {canEditSelectedDate && editingUpdateMsgTaskId !== t.id && (
                    <button
                      type="button"
                      onClick={() => handleStartEditUpdateMsg(t.id, t.updateMessage)}
                      className="text-[10px] font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>{t.updateMessage ? "Edit Update" : "+ Add Update Note"}</span>
                    </button>
                  )}
                </div>

                {editingUpdateMsgTaskId === t.id ? (
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      value={updateMsgInput}
                      onChange={(e) => setUpdateMsgInput(e.target.value)}
                      placeholder="Write completion update, summary of work done, or remarks..."
                      rows={2}
                      className="w-full text-xs p-2 rounded-xl border border-orange-200 dark:border-orange-900 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white outline-none"
                    />
                    <div className="flex items-center justify-end space-x-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingUpdateMsgTaskId(null)}
                        className="text-3xs h-6 px-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSaveUpdateMsg(t.id)}
                        className="text-3xs h-6 px-2.5 bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Save Note
                      </Button>
                    </div>
                  </div>
                ) : t.updateMessage ? (
                  <div className="p-2 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/40 text-xs text-zinc-800 dark:text-zinc-200">
                    {t.updateMessage}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-400 italic">No update message recorded yet.</p>
                )}
              </div>

              {/* Admin Comment Underneath Update Message */}
              <div className="space-y-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-amber-500" /> Admin Feedback:
                  </span>
                  {isAdmin && commentingTaskId !== t.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setCommentingTaskId(t.id);
                        setAdminCommentInput(t.adminComment || "");
                      }}
                      className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <MessageCircle className="w-2.5 h-2.5" />
                      <span>{t.adminComment ? "Edit Comment" : "+ Comment as Admin"}</span>
                    </button>
                  )}
                </div>

                {commentingTaskId === t.id ? (
                  <div className="space-y-1.5 pt-1">
                    <textarea
                      value={adminCommentInput}
                      onChange={(e) => setAdminCommentInput(e.target.value)}
                      placeholder="Write administrator feedback, review note, or instructions..."
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
                        onClick={() => handleSaveAdminComment(t.id)}
                        className="text-3xs h-6 px-2.5 bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        Post Feedback
                      </Button>
                    </div>
                  </div>
                ) : t.adminComment ? (
                  <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-zinc-800 dark:text-zinc-200">
                    <div className="text-[9px] text-zinc-400 font-mono flex items-center justify-between mb-0.5">
                      <span>By: {t.adminCommenterName || "Workspace Admin"}</span>
                      {t.adminCommentedAt && (
                        <span>
                          {new Date(t.adminCommentedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div>{t.adminComment}</div>
                  </div>
                ) : null}
              </div>

              {/* Duration and Done status indicator */}
              <div className="flex items-center justify-between text-3xs text-zinc-400 font-mono pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {t.timeSpentMinutes ? `${Math.floor(t.timeSpentMinutes / 60)}h ${t.timeSpentMinutes % 60}m logged` : "No duration"}
                </span>
                {t.status === "COMPLETED" && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-bold">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
