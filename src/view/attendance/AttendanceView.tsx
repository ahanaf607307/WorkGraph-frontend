"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { attendanceActions, AttendanceRecord } from "../../modules/attendance/actions/attendance.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Users } from "lucide-react";
import { cn } from "../../lib/utils";

// Subcomponents
import { AttendanceHeaderBanner } from "./components/AttendanceHeaderBanner";
import { AttendanceCalendarCard } from "./components/AttendanceCalendarCard";
import { AttendanceShiftDetailsCard } from "./components/AttendanceShiftDetailsCard";
import { AttendanceDailyTasksCard } from "./components/AttendanceDailyTasksCard";
import { AttendanceTaskModal } from "./components/AttendanceTaskModal";
import { AdminTimesheetTable } from "./components/AdminTimesheetTable";
import { AdminAdjustModal } from "./components/AdminAdjustModal";
import { EmployeeAttendanceHistoryModal } from "./components/EmployeeAttendanceHistoryModal";

export const AttendanceView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const isSystemAdminOrAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const [activeTab, setActiveTab] = useState<"my" | "overview">("my");

  // Current calendar navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth() + 1; // 1-12

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Fetch my attendance for selected month
  const { data: myRecords = [] } = useQuery({
    queryKey: ["my-attendance", orgId, selectedMonth, selectedYear],
    queryFn: () => attendanceActions.getMyAttendance(orgId!, selectedMonth, selectedYear),
    enabled: !!orgId,
  });

  // Fetch projects for task assignment
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", orgId],
    queryFn: () => projectActions.fetchProjects(orgId),
    enabled: !!orgId,
  });

  // Fetch departments for admin filter
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => departmentActions.getDepartments(orgId),
    enabled: !!orgId && isSystemAdminOrAdmin,
  });

  // Admin overview state
  const [adminDateFilter, setAdminDateFilter] = useState(todayStr);
  const [adminEmployeeSearch, setAdminEmployeeSearch] = useState("");
  const [adminDeptFilter, setAdminDeptFilter] = useState("");

  // Fetch admin attendance overview
  const { data: adminRecords = [], isLoading: loadingAdminOverview } = useQuery({
    queryKey: [
      "admin-attendance",
      orgId,
      adminDateFilter,
      adminEmployeeSearch,
      adminDeptFilter,
    ],
    queryFn: () =>
      attendanceActions.getOrganizationAttendance(
        orgId!,
        adminDateFilter,
        adminEmployeeSearch,
        adminDeptFilter || undefined
      ),
    enabled: !!orgId && isSystemAdminOrAdmin && activeTab === "overview",
  });

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [adjustingRecord, setAdjustingRecord] = useState<AttendanceRecord | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<any | null>(null);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: () => attendanceActions.checkIn(orgId!),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance", orgId] });
      queryClient.invalidateQueries({ queryKey: ["admin-attendance", orgId] });
      toast.success("Checked in successfully!", {
        description: `Marked present for today at ${new Date(
          record.checkInTime!
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to check in");
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceActions.checkOut(orgId!),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance", orgId] });
      queryClient.invalidateQueries({ queryKey: ["admin-attendance", orgId] });
      const hrs = Math.floor(record.workingMinutes / 60);
      const mins = record.workingMinutes % 60;
      toast.success("Checked out successfully!", {
        description: `Total work logged today: ${hrs}h ${mins}m. Have a great evening!`,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to check out");
    },
  });

  // Add task mutation
  const addTaskMutation = useMutation({
    mutationFn: (data: any) =>
      attendanceActions.addDailyTask(orgId!, {
        ...data,
        date: selectedDateStr,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance", orgId] });
      queryClient.invalidateQueries({ queryKey: ["admin-attendance", orgId] });
      setIsTaskModalOpen(false);
      toast.success("Daily task recorded!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log task");
    },
  });

  // Update task status, updateMessage, or adminComment mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      status,
      updateMessage,
      adminComment,
    }: {
      taskId: string;
      status?: string;
      updateMessage?: string;
      adminComment?: string;
    }) =>
      attendanceActions.updateDailyTask(orgId!, taskId, {
        status,
        updateMessage,
        adminComment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance", orgId] });
      queryClient.invalidateQueries({ queryKey: ["admin-attendance", orgId] });
      toast.success("Task updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update task");
    },
  });

  // Admin override mutation
  const adminOverrideMutation = useMutation({
    mutationFn: (data: any) => attendanceActions.adminManualOverride(orgId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-attendance", orgId] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance", orgId] });
      setAdjustingRecord(null);
      toast.success("Timesheet adjusted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update attendance");
    },
  });

  // Records lookup
  const selectedRecord = myRecords.find((r) => r.date === selectedDateStr);
  const todayRecord = myRecords.find((r) => r.date === todayStr);
  const isTodayCheckedIn = !!todayRecord?.checkInTime;
  const isTodayCheckedOut = !!todayRecord?.checkOutTime;

  const isSelectedDateToday = selectedDateStr === todayStr;
  const canEditSelectedDate = isSelectedDateToday || isSystemAdminOrAdmin;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <AttendanceHeaderBanner />

      {/* Tabs: Personal vs Admin Oversight */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("my")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === "my"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            )}
          >
            <CalendarIcon className="w-4 h-4" /> My Attendance & Task Log
          </button>

          {isSystemAdminOrAdmin && (
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeTab === "overview"
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <Users className="w-4 h-4" /> Company Attendance & Timesheet Hub
            </button>
          )}
        </div>
      </div>

      {activeTab === "my" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Calendar */}
          <div className="lg:col-span-2 space-y-6">
            <AttendanceCalendarCard
              currentDate={currentDate}
              selectedDateStr={selectedDateStr}
              todayStr={todayStr}
              records={myRecords}
              onSelectDate={(date) => setSelectedDateStr(date)}
              onPrevMonth={() => setCurrentDate(new Date(selectedYear, selectedMonth - 2, 1))}
              onNextMonth={() => setCurrentDate(new Date(selectedYear, selectedMonth, 1))}
            />
          </div>

          {/* Right Col: Details on Top, Tasks Underneath */}
          <div className="space-y-6">
            <AttendanceShiftDetailsCard
              selectedDateStr={selectedDateStr}
              todayStr={todayStr}
              selectedRecord={selectedRecord}
              todayRecord={todayRecord}
              isTodayCheckedIn={isTodayCheckedIn}
              isTodayCheckedOut={isTodayCheckedOut}
              isSystemAdminOrAdmin={isSystemAdminOrAdmin}
              onCheckIn={() => checkInMutation.mutate()}
              onCheckOut={() => checkOutMutation.mutate()}
              isCheckingIn={checkInMutation.isPending}
              isCheckingOut={checkOutMutation.isPending}
            />

            <AttendanceDailyTasksCard
              selectedRecord={selectedRecord}
              canEditSelectedDate={canEditSelectedDate}
              isAdmin={isSystemAdminOrAdmin}
              onOpenTaskModal={() => setIsTaskModalOpen(true)}
              onUpdateTaskStatus={(taskId, newStatus) =>
                updateTaskMutation.mutate({ taskId, status: newStatus })
              }
              onSaveTaskUpdateMessage={(taskId, updateMessage) =>
                updateTaskMutation.mutate({ taskId, updateMessage })
              }
              onSaveAdminComment={(taskId, adminComment) =>
                updateTaskMutation.mutate({ taskId, adminComment })
              }
            />
          </div>
        </div>
      ) : (
        /* Company Attendance & Timesheet Oversight */
        <AdminTimesheetTable
          adminRecords={adminRecords}
          loadingAdminOverview={loadingAdminOverview}
          adminDateFilter={adminDateFilter}
          setAdminDateFilter={setAdminDateFilter}
          adminEmployeeSearch={adminEmployeeSearch}
          setAdminEmployeeSearch={setAdminEmployeeSearch}
          adminDeptFilter={adminDeptFilter}
          setAdminDeptFilter={setAdminDeptFilter}
          departments={departments}
          onOpenAdjustModal={(rec) => setAdjustingRecord(rec)}
          onSelectEmployee={(emp) => setHistoryEmployee(emp)}
        />
      )}

      {/* Task Creation Modal */}
      <AttendanceTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        selectedDateStr={selectedDateStr}
        projects={projects}
        onSubmit={(data) => addTaskMutation.mutate(data)}
        isSubmitting={addTaskMutation.isPending}
      />

      {/* Admin Override Modal */}
      <AdminAdjustModal
        isOpen={!!adjustingRecord}
        onClose={() => setAdjustingRecord(null)}
        record={adjustingRecord}
        onSubmit={(data) => adminOverrideMutation.mutate(data)}
        isSubmitting={adminOverrideMutation.isPending}
      />

      {/* Employee Full Attendance & Daily Tasks History Modal (Screenshot 3) */}
      <EmployeeAttendanceHistoryModal
        isOpen={!!historyEmployee}
        onClose={() => setHistoryEmployee(null)}
        orgId={orgId!}
        employee={historyEmployee}
      />
    </div>
  );
};
