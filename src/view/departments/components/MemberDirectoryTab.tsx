"use client";

import React from "react";
import { Avatar } from "../../../components/ui/avatar";
import { Edit, CheckCircle, Clock } from "lucide-react";

interface MemberDirectoryTabProps {
  members: any[];
  isAdminOrOwner: boolean;
  onEditMember: (member: any) => void;
  onQuickApprove?: (member: any) => void;
}

export const MemberDirectoryTab: React.FC<MemberDirectoryTabProps> = ({
  members,
  isAdminOrOwner,
  onEditMember,
  onQuickApprove,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4 select-text">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
            Member Department, Service & Placement Roster
          </h3>
          <p className="text-xs text-zinc-500">
            Authorize new registrations, assign service lines, departments, squads, and capacity.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-mono uppercase text-3xs">
              <th className="py-3 px-3">Member</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Role</th>
              <th className="py-3 px-3">Designation</th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">Service Line</th>
              <th className="py-3 px-3">Squad / Team</th>
              <th className="py-3 px-3">Capacity</th>
              {isAdminOrOwner && <th className="py-3 px-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((m) => {
              const mDept = m.department?.name || "Unassigned";
              const mTeam = m.team?.name || "Unassigned";
              const mService = m.service?.name || "General";
              const mDesig =
                m.designationRel?.name ||
                m.customDesignation ||
                m.designation ||
                "Member";
              const name = m.user?.name || m.name || "Member";
              const email = m.user?.email || m.email || "";
              const isApproved = m.isApproved !== false && m.status !== "PENDING";

              return (
                <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2.5">
                      <Avatar name={name} size="sm" />
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-white">
                          {name}
                        </div>
                        <div className="text-3xs text-zinc-400 font-mono">{email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-3xs font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-3xs font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md font-mono text-3xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {m.role}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {mDesig}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300 font-medium">
                    {mDept}
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md font-mono text-3xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      {mService}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {mTeam !== "Unassigned" ? (
                      <span className="font-semibold text-violet-600 dark:text-violet-400">
                        {mTeam}
                      </span>
                    ) : (
                      <span className="text-zinc-400 italic">No squad</span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                    {m.weeklyCapacityHours || 40}h/wk
                  </td>

                  {isAdminOrOwner && (
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEditMember(m)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white font-semibold text-3xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Configure</span>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
