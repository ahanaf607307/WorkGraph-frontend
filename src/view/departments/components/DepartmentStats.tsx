"use client";

import React from "react";

interface DepartmentStatsProps {
  departmentsCount: number;
  totalSquadsCount: number;
  membersCount: number;
  designationsCount: number;
}

export const DepartmentStats: React.FC<DepartmentStatsProps> = ({
  departmentsCount,
  totalSquadsCount,
  membersCount,
  designationsCount,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="text-2xs font-semibold uppercase text-zinc-400 font-mono">Departments</div>
        <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
          {departmentsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Dynamic organization divisions</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="text-2xs font-semibold uppercase text-zinc-400 font-mono">Squads & Teams</div>
        <div className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1">
          {totalSquadsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Units with Leader & Co-Leader</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="text-2xs font-semibold uppercase text-zinc-400 font-mono">Total Members</div>
        <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
          {membersCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Assigned to squads & roles</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs">
        <div className="text-2xs font-semibold uppercase text-zinc-400 font-mono">Designations</div>
        <div className="text-2xl font-bold text-zinc-950 dark:text-white mt-1">
          {designationsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Admin-managed hierarchy levels</div>
      </div>
    </div>
  );
};
