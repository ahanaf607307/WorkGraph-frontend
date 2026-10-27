"use client";

import React from "react";
import { AttendanceRecord } from "../../../modules/attendance/actions/attendance.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Users, Search, CheckCircle2, Clock } from "lucide-react";
import { DepartmentItem } from "../../../modules/departments/actions/department.actions";

interface AdminTimesheetTableProps {
  adminRecords: AttendanceRecord[];
  loadingAdminOverview: boolean;
  adminDateFilter: string;
  setAdminDateFilter: (val: string) => void;
  adminEmployeeSearch: string;
  setAdminEmployeeSearch: (val: string) => void;
  adminDeptFilter: string;
  setAdminDeptFilter: (val: string) => void;
  departments: DepartmentItem[];
  onOpenAdjustModal: (record: AttendanceRecord) => void;
  onSelectEmployee: (employee: {
    id: string;
    name: string;
    email: string;
    employeeId?: string | null;
    avatarUrl?: string | null;
    department?: string | null;
    squad?: string | null;
    role?: string | null;
  }) => void;
}

export const AdminTimesheetTable: React.FC<AdminTimesheetTableProps> = ({
  adminRecords,
  loadingAdminOverview,
  adminDateFilter,
  setAdminDateFilter,
  adminEmployeeSearch,
  setAdminEmployeeSearch,
  adminDeptFilter,
  setAdminDeptFilter,
  departments,
  onOpenAdjustModal,
  onSelectEmployee,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Company Timesheet & Employee Oversight
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Click on any employee row to inspect their date-wise attendance & task history.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center space-x-1.5 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <input
              type="date"
              value={adminDateFilter}
              onChange={(e) => setAdminDateFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Search Employee */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Employee ID or Name..."
              value={adminEmployeeSearch}
              onChange={(e) => setAdminEmployeeSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={adminDeptFilter}
            onChange={(e) => setAdminDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono uppercase text-3xs">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Employee ID</th>
              <th className="py-3 px-4">Department & Squad</th>
              <th className="py-3 px-4">Check-In</th>
              <th className="py-3 px-4">Check-Out</th>
              <th className="py-3 px-4">Work Time</th>
              <th className="py-3 px-4">Tasks</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Admin Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
            {loadingAdminOverview ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-400">
                  Loading company timesheets...
                </td>
              </tr>
            ) : adminRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-zinc-400">
                  No attendance records found for this date.
                </td>
              </tr>
            ) : (
              adminRecords.map((r) => {
                const u = r.user || {
                  id: r.userId,
                  name: "Employee",
                  email: "",
                  employeeId: "N/A",
                  avatarUrl: undefined,
                  role: "MEMBER",
                  organizationMemberships: [],
                };
                const membership = u.organizationMemberships?.[0];
                const deptName = membership?.department?.name || "General";
                const teamName = membership?.team?.name || "No Squad";
                const isPresent = !!r.checkInTime;

                return (
                  <tr
                    key={r.id}
                    onClick={() =>
                      onSelectEmployee({
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        employeeId: u.employeeId,
                        avatarUrl: u.avatarUrl,
                        department: deptName,
                        squad: teamName,
                        role: membership?.role || u.role,
                      })
                    }
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                    title="Click to view full attendance & daily task history"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2.5">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <div className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 group-hover:text-orange-500 transition-colors">
                            <span>{u.name}</span>
                            <span className="text-3xs font-mono text-zinc-400 font-normal">
                              ({membership?.role || u.role || "MEMBER"})
                            </span>
                          </div>
                          <div className="text-3xs text-zinc-400 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-zinc-500">
                      {u.employeeId || "N/A"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-zinc-800 dark:text-zinc-200 font-medium">{deptName}</div>
                      <div className="text-3xs text-zinc-400 font-mono">{teamName}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {r.checkInTime
                        ? new Date(r.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {r.checkOutTime
                        ? new Date(r.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {r.workingMinutes ? `${Math.floor(r.workingMinutes / 60)}h ${r.workingMinutes % 60}m` : "—"}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-3xs font-bold text-zinc-600 dark:text-zinc-300">
                        {r.dailyTasks?.length || 0} tasks
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                          ✕ ABSENT
                        </span>
                      )}
                    </td>

                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent modal trigger
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenAdjustModal(r)}
                        className="text-3xs px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Adjust Override
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
