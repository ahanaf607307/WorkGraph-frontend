"use client";

import React from "react";
import Link from "next/link";
import { Building2, Crown, Star } from "lucide-react";

interface SquadsOverviewStripProps {
  allTeams: any[];
}

export const SquadsOverviewStrip: React.FC<SquadsOverviewStripProps> = ({ allTeams = [] }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-white uppercase font-mono tracking-wider">
            Departments & Operational Squads ({allTeams.length} units)
          </h2>
        </div>
        <Link href="/departments" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
          Manage squads & hierarchy →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTeams.slice(0, 3).map((team) => (
          <div
            key={team.id}
            className="p-4 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                {team.name}
              </span>
              <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
                {team._count?.members || 0} members
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-2xs">
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <Crown className="w-3 h-3" /> Leader:
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                  {team.leader?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between text-2xs">
                <span className="flex items-center gap-1 text-indigo-500 font-bold">
                  <Star className="w-3 h-3" /> Co-Leader:
                </span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                  {team.coLeader?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {team.operationManagers && team.operationManagers.length > 0 && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-3xs">
                <span className="text-zinc-400 font-mono">Operation Manager:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                  {team.operationManagers.map((om: any) => om.user?.name || om.name).join(", ")}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
