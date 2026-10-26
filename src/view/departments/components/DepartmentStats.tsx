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
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Departments</div>
        <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
          {departmentsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Dynamic organization divisions</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Squads & Teams</div>
        <div className="text-2xl font-black text-amber-500 mt-1">
          {totalSquadsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Units with Leader & Co-Leader</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Total Members</div>
        <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
          {membersCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Assigned to squads & roles</div>
      </div>

      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Designations</div>
        <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
          {designationsCount}
        </div>
        <div className="text-3xs text-zinc-500 mt-0.5">Admin-managed hierarchy levels</div>
      </div>
    </div>
  );
};
