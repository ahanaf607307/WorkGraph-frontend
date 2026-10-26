"use client";

import React from "react";
import { Avatar } from "../../../components/ui/avatar";

interface CompanyHierarchyTabProps {
  hierarchyData: any;
}

export const CompanyHierarchyTab: React.FC<CompanyHierarchyTabProps> = ({ hierarchyData }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-8">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-black text-zinc-950 dark:text-white">
          Executive & Cross-Squad Organizational Tree
        </h2>
        <p className="text-xs text-zinc-500">
          Clear corporate governance with project & operational oversight across all teams.
        </p>
      </div>

      {/* Tier 1: Executive Board */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-amber-400" />
          <span className="text-2xs font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
            Tier 1 • Executive Leadership (GM, AGM, HTO)
          </span>
          <span className="h-px w-12 bg-amber-400" />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {hierarchyData?.executiveLeadership && hierarchyData.executiveLeadership.length > 0 ? (
            hierarchyData.executiveLeadership.map((m: any) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-800 border-2 border-amber-400 shadow-md min-w-[240px] text-center space-y-2"
              >
                <Avatar name={m.user?.name || m.name} size="md" className="mx-auto" />
                <div>
                  <div className="text-sm font-bold">{m.user?.name || m.name}</div>
                  <div className="text-2xs text-amber-400 font-mono font-bold">
                    {m.designationRel?.name || m.customDesignation || m.designation}
                  </div>
                </div>
                {m.designation === "HEAD_OF_TECHNICAL_OPERATIONS" && (
                  <span className="inline-block text-3xs font-mono bg-amber-400 text-black px-2 py-0.5 rounded-full font-bold">
                    ★ Organization-Wide Technical Oversight
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400 italic">No executive leaders assigned.</div>
          )}
        </div>
      </div>

      {/* Tier 2: Project Management */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-2xs font-mono font-bold uppercase text-zinc-500">
            Tier 2 • Project Managers (Cross-Squad Roadmaps & Delivery)
          </span>
          <span className="h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {hierarchyData?.projectManagers && hierarchyData.projectManagers.length > 0 ? (
            hierarchyData.projectManagers.map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 min-w-[220px] text-center space-y-1.5"
              >
                <Avatar name={m.user?.name || m.name} size="sm" className="mx-auto" />
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {m.user?.name || m.name}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-3xs font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold">
                  Project Manager • All Teams
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400 italic">No Project Managers assigned.</div>
          )}
        </div>
      </div>

      {/* Tier 3: Operation Managers */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <span className="h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
          <span className="text-2xs font-mono font-bold uppercase text-zinc-500">
            Tier 3 • Operation Managers (Multi-Squad Capacity Management)
          </span>
          <span className="h-px w-12 bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {hierarchyData?.operationManagers && hierarchyData.operationManagers.length > 0 ? (
            hierarchyData.operationManagers.map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-w-[220px] text-center space-y-1.5 shadow-xs"
              >
                <Avatar name={m.user?.name || m.name} size="sm" className="mx-auto" />
                <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                  {m.user?.name || m.name}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-3xs font-mono bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700">
                  Operation Manager
                </span>
              </div>
            ))
          ) : (
            <div className="text-xs text-zinc-400 italic">No Operation Managers assigned.</div>
          )}
        </div>
      </div>
    </div>
  );
};
