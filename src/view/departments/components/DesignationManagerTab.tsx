"use client";

import React from "react";
import { DesignationItem } from "../../../modules/designations/actions/designation.actions";
import { Award, Trash2, Pencil } from "lucide-react";

interface DesignationManagerTabProps {
  designations: DesignationItem[];
  isSystemAdmin: boolean;
  onOpenCreateDesignation: () => void;
  onEditDesignation: (desig: DesignationItem) => void;
  onDeleteDesignation: (id: string, name: string) => void;
}

export const DesignationManagerTab: React.FC<DesignationManagerTabProps> = ({
  designations,
  isSystemAdmin,
  onOpenCreateDesignation,
  onEditDesignation,
  onDeleteDesignation,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <span>Dynamic Designation & Title Engine</span>
              <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-400 text-black">
                Workspace Admin Managed
              </span>
            </h4>
            <p className="text-2xs text-amber-800 dark:text-amber-400 mt-0.5">
              The Workspace Admin (Company Head) can dynamically provision department-wise and global designations, job titles, and hierarchy levels.
            </p>
          </div>
        </div>

        {isSystemAdmin ? (
          <button
            type="button"
            onClick={onOpenCreateDesignation}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            + Add Designation
          </button>
        ) : (
          <div className="text-3xs font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl shrink-0">
            🔒 Managed by Workspace Admin
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {designations.map((desig) => (
          <div
            key={desig.id}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
                      {desig.name}
                    </h4>
                    {desig.code && (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-3xs font-bold text-zinc-700 dark:text-zinc-300">
                        {desig.code}
                      </span>
                    )}
                  </div>
                  {desig.title && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      {desig.title}
                    </p>
                  )}
                </div>

                {isSystemAdmin && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditDesignation(desig)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer"
                      title="Edit designation"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {!desig.isSystem && (
                      <button
                        type="button"
                        onClick={() => onDeleteDesignation(desig.id, desig.name)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete designation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-1.5">
                <span className="inline-block text-3xs font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Hierarchy Level {desig.hierarchyLevel}
                </span>
                {desig.department ? (
                  <span className="inline-block text-3xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    🏢 {desig.department.name}
                  </span>
                ) : (
                  <span className="inline-block text-3xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    🌐 Cross-Department
                  </span>
                )}
              </div>

              <p className="text-2xs text-zinc-500 leading-relaxed min-h-[2rem]">
                {desig.description || "Organization assigned designation."}
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-2xs text-zinc-400">
              <span>Assigned Members:</span>
              <span className="font-bold text-zinc-900 dark:text-white font-mono">
                {desig._count?.members || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
