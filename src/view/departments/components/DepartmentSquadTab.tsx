"use client";

import React from "react";
import { DepartmentItem, TeamItem } from "../../../modules/departments/actions/department.actions";
import { Avatar } from "../../../components/ui/avatar";
import {
  Building2,
  Plus,
  Crown,
  Star,
  Lock,
  Edit2,
  Trash2,
  Users,
  Shield,
  Layers,
} from "lucide-react";

interface DepartmentSquadTabProps {
  departments: DepartmentItem[];
  isAdminOrOwner: boolean;
  isSystemAdmin: boolean;
  loading: boolean;
  onOpenCreateDept: () => void;
  onOpenEditDept: (dept: DepartmentItem) => void;
  onDeleteDept: (dept: DepartmentItem) => void;
  onOpenCreateSquad: (deptId: string) => void;
  onOpenAssignOm: (team: TeamItem) => void;
  onRemoveOm: (teamId: string, omUserId: string) => void;
  onOpenAddMember?: (team: TeamItem) => void;
  onRemoveMember?: (teamId: string, userId: string) => void;
}

export const isProtectedDepartment = (dept: DepartmentItem) => {
  if (dept.isDefault) return true;
  const name = dept.name.toLowerCase().trim();
  return (
    name === "bdt" ||
    name === "seals" ||
    name === "sales" ||
    name === "operation" ||
    name === "operations"
  );
};

export const DepartmentSquadTab: React.FC<DepartmentSquadTabProps> = ({
  departments,
  isAdminOrOwner,
  isSystemAdmin,
  loading,
  onOpenCreateDept,
  onOpenEditDept,
  onDeleteDept,
  onOpenCreateSquad,
  onOpenAssignOm,
  onRemoveOm,
  onOpenAddMember,
  onRemoveMember,
}) => {
  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-zinc-400 font-medium">
        Loading departments and squad hierarchy...
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#0f1118] rounded-3xl border border-zinc-200/80 dark:border-white/[0.08] space-y-3.5 shadow-sm">
        <Building2 className="w-12 h-12 text-violet-500 mx-auto" />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          No departments created yet
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
          Create organizational departments (e.g. Sales, Operation, BDT, Marketing, Creative) and
          configure dedicated squads with team leaders, co-leaders, and operation managers.
        </p>
        {isSystemAdmin ? (
          <button
            type="button"
            onClick={onOpenCreateDept}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Create Department
          </button>
        ) : (
          <p className="text-2xs text-zinc-400">
            Department structure is managed by the System Admin (Company Head).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {departments.map((dept) => {
        const protectedDept = isProtectedDepartment(dept);

        return (
          <div
            key={dept.id}
            className="bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all"
          >
            {/* Department Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/[0.06] gap-4">
              <div className="flex items-start sm:items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                  {dept.code || dept.name.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-white">
                      {dept.name}
                    </h2>
                    {dept.code && (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-3xs font-semibold text-zinc-600 dark:text-zinc-300">
                        {dept.code}
                      </span>
                    )}
                    {protectedDept ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        <span>System Department</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        Custom Department
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {dept.description || "Organizational Division & Strategic Unit"}
                  </p>
                </div>
              </div>

              {/* Department Actions & Manager Info */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Department Manager Tag */}
                <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-white/[0.02] px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                  <span className="text-3xs font-bold uppercase text-zinc-400 font-mono">
                    Manager:
                  </span>
                  {dept.manager ? (
                    <div className="flex items-center space-x-1.5">
                      <Avatar name={dept.manager.name} size="sm" className="w-4 h-4 text-4xs" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {dept.manager.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Unassigned</span>
                  )}
                </div>

                {/* Edit & Delete for custom departments only */}
                {isAdminOrOwner && !protectedDept && (
                  <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.02] p-1 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => onOpenEditDept(dept)}
                      title="Edit Department"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-200/60 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteDept(dept)}
                      title="Delete Department"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Add Squad button */}
                {isAdminOrOwner && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateSquad(dept.id)}
                    className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Squad</span>
                  </button>
                )}
              </div>
            </div>

            {/* Teams / Squads inside this Department */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase text-zinc-400 font-mono tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-500" />
                  <span>Squad Units ({dept.teams?.length || 0})</span>
                </h3>
              </div>

              {dept.teams?.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-50/60 dark:bg-white/[0.01] border border-dashed border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-400">
                  No squads created yet under this department. Click "+ Add Squad" to form units.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dept.teams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] hover:border-violet-500/30 transition-all space-y-3.5"
                    >
                      {/* Squad Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <h4 className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                            {team.name}
                          </h4>
                          {(team as any).serviceType && (
                            <span className="px-2 py-0.5 rounded-full text-4xs font-mono font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 shrink-0">
                              ⚡ {(team as any).serviceType}
                            </span>
                          )}
                        </div>
                        <span className="text-3xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.06] shrink-0">
                          {team.members?.length || team._count?.members || 0} members
                        </span>
                      </div>

                      {team.description && (
                        <p className="text-2xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {team.description}
                        </p>
                      )}

                      {/* Leadership: Leader & Co-Leader */}
                      <div className="space-y-1.5 pt-2 border-t border-zinc-200/60 dark:border-white/[0.06] text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-2xs font-semibold text-violet-600 dark:text-violet-400">
                            <Crown className="w-3 h-3" /> Team Leader:
                          </span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate text-xs">
                            {team.leader?.name || "Unassigned"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-2xs font-semibold text-indigo-600 dark:text-indigo-400">
                            <Star className="w-3 h-3" /> Co-Leader:
                          </span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate text-xs">
                            {team.coLeader?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Multi-Team Operation Managers */}
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1">
                            <Shield className="w-2.5 h-2.5 text-violet-500" />
                            Operation Managers:
                          </span>
                          {isAdminOrOwner && (
                            <button
                              type="button"
                              onClick={() => onOpenAssignOm(team)}
                              className="text-3xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
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
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold text-3xs border border-violet-500/20"
                              >
                                <span>{om.user?.name || om.name}</span>
                                {isAdminOrOwner && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveOm(team.id, om.userId)}
                                    className="text-violet-500 hover:text-rose-500 cursor-pointer ml-0.5 text-xs leading-none"
                                    title="Unlink Operation Manager"
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
                      <div className="pt-2 border-t border-zinc-200/60 dark:border-white/[0.06] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-3xs font-mono font-bold uppercase text-zinc-400 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5 text-violet-500" />
                            Squad Members ({team.members?.length || 0}):
                          </span>
                          {isAdminOrOwner && onOpenAddMember && (
                            <button
                              type="button"
                              onClick={() => onOpenAddMember(team)}
                              className="text-3xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer flex items-center gap-0.5"
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
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-3xs border border-zinc-200/70 dark:border-white/[0.08] shadow-2xs"
                              >
                                <Avatar
                                  name={m.user?.name || "Member"}
                                  size="sm"
                                  className="w-3.5 h-3.5 text-4xs"
                                />
                                <span className="font-semibold truncate max-w-[110px]">
                                  {m.user?.name || "Member"}
                                </span>
                                {m.designationRel?.name && (
                                  <span className="text-4xs text-violet-600 dark:text-violet-400 font-mono">
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
                              No members placed in this squad
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
        );
      })}
    </div>
  );
};
