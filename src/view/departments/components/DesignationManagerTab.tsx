"use client";

import React from "react";
import { DesignationItem } from "../../../modules/designations/actions/designation.actions";
import { Award, Trash2 } from "lucide-react";

interface DesignationManagerTabProps {
  designations: DesignationItem[];
  isAdminOrOwner: boolean;
  onOpenCreateDesignation: () => void;
  onDeleteDesignation: (id: string, name: string) => void;
}

export const DesignationManagerTab: React.FC<DesignationManagerTabProps> = ({
  designations,
  isAdminOrOwner,
  onOpenCreateDesignation,
  onDeleteDesignation,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Award className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
              Dynamic Designation Engine
            </h4>
            <p className="text-2xs text-amber-800 dark:text-amber-400">
              Admins can dynamically create custom designations with custom hierarchy tiers. Standard enterprise designations (GM, AGM, HTO, PM, OM, TL) are automatically supported.
            </p>
          </div>
        </div>

        {isAdminOrOwner && (
          <button
            type="button"
            onClick={onOpenCreateDesignation}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
          >
            + Add Designation
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {designations.map((desig) => (
          <div
            key={desig.id}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white">
                    {desig.name}
                  </h4>
                  {desig.code && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-3xs font-bold text-zinc-700 dark:text-zinc-300">
                      {desig.code}
                    </span>
                  )}
                </div>
                <span className="inline-block mt-1 text-3xs font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Hierarchy Level {desig.hierarchyLevel}
                </span>
              </div>

              {!desig.isSystem && isAdminOrOwner && (
                <button
                  type="button"
                  onClick={() => onDeleteDesignation(desig.id, desig.name)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="text-2xs text-zinc-500 leading-relaxed min-h-[2.5rem]">
              {desig.description || "Organization assigned designation."}
            </p>

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
