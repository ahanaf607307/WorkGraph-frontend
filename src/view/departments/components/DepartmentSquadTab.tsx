"use client";

import React from "react";
import { DepartmentItem, TeamItem } from "../../../modules/departments/actions/department.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Building2, Plus, Crown, Star } from "lucide-react";

interface DepartmentSquadTabProps {
  departments: DepartmentItem[];
  isAdminOrOwner: boolean;
  isSystemAdmin: boolean;
  loading: boolean;
  onOpenCreateDept: () => void;
  onOpenCreateSquad: (deptId: string) => void;
  onOpenAssignOm: (team: TeamItem) => void;
  onRemoveOm: (teamId: string, omUserId: string) => void;
  onOpenAddMember?: (team: TeamItem) => void;
  onRemoveMember?: (teamId: string, userId: string) => void;
}

export const DepartmentSquadTab: React.FC<DepartmentSquadTabProps> = ({
  departments,
  isAdminOrOwner,
  isSystemAdmin,
  loading,
  onOpenCreateDept,
  onOpenCreateSquad,
  onOpenAssignOm,
  onRemoveOm,
  onOpenAddMember,
  onRemoveMember,
}) => {
  if (loading) {
    return <div className="p-12 text-center text-xs text-zinc-400">Loading departments...</div>;
  }

  if (departments.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
        <Building2 className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          No departments created yet
        </h3>
        <p className="text-xs text-zinc-500 max-w-md mx-auto">
          Create your first department (e.g. Engineering, Product, Operations) and configure squads with leaders and co-leaders.
        </p>
        {isSystemAdmin ? (
          <button
            type="button"
            onClick={onOpenCreateDept}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            Create Department
          </button>
        ) : (
          <p className="text-2xs text-zinc-400">Department structure is managed by the System Admin (Company Head).</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {departments.map((dept) => (
        <div
          key={dept.id}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4"
        >
          {/* Department Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center font-black text-sm">
                {dept.code || dept.name.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-zinc-950 dark:text-white">
                    {dept.name}
                  </h2>
                  {dept.code && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-3xs font-bold text-zinc-600 dark:text-zinc-300">
                      {dept.code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  {dept.description || "Enterprise Department Unit"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Department Manager Tag */}
              <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                <span className="text-3xs font-bold uppercase text-zinc-400 font-mono">
                  Manager:
                </span>
                {dept.manager ? (
                  <div className="flex items-center space-x-1.5">
                    <Avatar name={dept.manager.name} size="sm" />
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {dept.manager.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 italic">Unassigned</span>
                )}
              </div>

              {isAdminOrOwner && (
                <button
                  type="button"
                  onClick={() => onOpenCreateSquad(dept.id)}
                  className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Squad</span>
                </button>
              )}
            </div>
          </div>

          {/* Teams inside this Department */}
          <div>
            <h3 className="text-xs font-bold uppercase text-zinc-400 font-mono mb-3">
              Squads ({dept.teams?.length || 0})
            </h3>

            {dept.teams?.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                No squads yet. Click "+ Add Squad" to create units under this department.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dept.teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                        {team.name}
                      </h4>
                      <span className="text-3xs font-mono font-bold text-zinc-500 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 shadow-2xs">
                        {team._count?.members || 0} members
                      </span>
                    </div>

                    {(team as any).serviceType && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                        ⚡ {(team as any).serviceType}
                      </div>
                    )}

                    {team.description && (
                      <p className="text-2xs text-zinc-500 line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    {/* Leadership: Leader & Co-Leader */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-2xs font-bold text-amber-600 dark:text-amber-400">
                          <Crown className="w-3 h-3" /> Team Leader:
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {team.leader?.name || "Unassigned"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-2xs font-bold text-indigo-600 dark:text-indigo-400">
                          <Star className="w-3 h-3" /> Co-Leader:
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {team.coLeader?.name || "Unassigned"}
                        </span>
                      </div>
                    </div>

                    {/* Multi-Team Operation Managers */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-mono font-bold uppercase text-zinc-400">
                          Operation Managers:
                        </span>
                        {isAdminOrOwner && (
                          <button
                            type="button"
                            onClick={() => onOpenAssignOm(team)}
                            className="text-3xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            + Link OM
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {team.operationManagers && team.operationManagers.length > 0 ? (
                          team.operationManagers.map((om: any) => (
                            <span
                              key={om.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-semibold text-3xs border border-amber-300 dark:border-amber-700"
                            >
                              <span>{om.user?.name || om.name}</span>
                              {isAdminOrOwner && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveOm(team.id, om.userId)}
                                  className="text-amber-800 dark:text-amber-300 hover:text-rose-500 cursor-pointer ml-0.5"
                                >
                                  &times;
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-3xs text-zinc-400 italic">
                            No Operation Manager linked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Squad Members Section with Add Member Option */}
                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-mono font-bold uppercase text-zinc-400">
                          Squad Members ({team.members?.length || 0}):
                        </span>
                        {isAdminOrOwner && onOpenAddMember && (
                          <button
                            type="button"
                            onClick={() => onOpenAddMember(team)}
                            className="text-3xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add Member
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {team.members && team.members.length > 0 ? (
                          team.members.map((m: any) => (
                            <span
                              key={m.id || m.userId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-3xs border border-zinc-200 dark:border-zinc-700 shadow-2xs"
                            >
                              <Avatar name={m.user?.name || "Member"} size="sm" className="w-3.5 h-3.5 text-4xs" />
                              <span className="font-semibold truncate max-w-[110px]">{m.user?.name || "Member"}</span>
                              {m.designationRel?.name && (
                                <span className="text-4xs text-amber-600 dark:text-amber-400 font-mono">
                                  ({m.designationRel.name})
                                </span>
                              )}
                              {isAdminOrOwner && onRemoveMember && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveMember(team.id, m.userId)}
                                  title="Remove member from squad"
                                  className="text-zinc-400 hover:text-rose-500 cursor-pointer ml-0.5 text-xs font-bold leading-none"
                                >
                                  &times;
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-3xs text-zinc-400 italic">
                            No team members assigned yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
