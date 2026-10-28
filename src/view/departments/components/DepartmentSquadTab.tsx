"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DepartmentItem, TeamItem } from "../../../modules/departments/actions/department.actions";
import { Avatar } from "../../../components/ui/avatar";
import { Modal } from "../../../components/ui/modal";
import { Button } from "../../../components/ui/button";
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
  ArrowRight,
  Eye,
  ExternalLink,
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
  const router = useRouter();
  const [selectedDeptForDetails, setSelectedDeptForDetails] = useState<DepartmentItem | null>(null);

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
        <h3 className="text-base font-bold text-zinc-950 dark:text-white">
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

  const navigateToTeamDetails = (teamId: string) => {
    router.push(`/team?teamId=${teamId}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const protectedDept = isProtectedDepartment(dept);
          const teams = dept.teams || [];

          return (
            <div
              key={dept.id}
              className="bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-violet-500/40 transition-all"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                      {dept.code || dept.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-950 dark:text-white truncate">
                          {dept.name}
                        </h2>
                        {protectedDept && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-4xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                            <Lock className="w-2.5 h-2.5" />
                            <span>System</span>
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                        {dept.description || "Organizational Division"}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  {isAdminOrOwner && !protectedDept && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenEditDept(dept)}
                        title="Edit Department"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDept(dept)}
                        title="Delete Department"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Manager & Add Squad Row */}
                <div className="flex items-center justify-between text-2xs pt-1 border-t border-zinc-100 dark:border-white/[0.04]">
                  <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    <span className="font-bold uppercase text-3xs font-mono text-zinc-400">Manager:</span>
                    {dept.manager ? (
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {dept.manager.name}
                      </span>
                    ) : (
                      <span className="italic text-zinc-400">Unassigned</span>
                    )}
                  </div>

                  {isAdminOrOwner && (
                    <button
                      type="button"
                      onClick={() => onOpenCreateSquad(dept.id)}
                      className="text-3xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Squad
                    </button>
                  )}
                </div>
              </div>

              {/* Squads Summary & Pills */}
              <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.04] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Squads ({teams.length})
                    </span>
                  </div>

                  {/* Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDeptForDetails(dept)}
                    className="text-3xs font-semibold py-1 px-2.5 h-7 rounded-xl flex items-center gap-1 border-zinc-200 dark:border-white/[0.08] hover:border-violet-500 hover:text-violet-600 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Details</span>
                  </Button>
                </div>

                {/* Squad Pills */}
                {teams.length === 0 ? (
                  <p className="text-3xs text-zinc-400 italic">
                    No squads currently assigned under this department.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => navigateToTeamDetails(team.id)}
                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 border border-zinc-200/80 dark:border-white/[0.06] text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer shadow-2xs"
                        title={`Click to view ${team.name} details in Team Hub`}
                      >
                        <Layers className="w-3 h-3 text-violet-500 group-hover:text-white transition-colors" />
                        <span>{team.name}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-white transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Squads Details Modal */}
      {selectedDeptForDetails && (
        <Modal
          isOpen={!!selectedDeptForDetails}
          onClose={() => setSelectedDeptForDetails(null)}
          title={`${selectedDeptForDetails.name} — Squad Directory`}
          description={`All squad units and teams functioning under ${selectedDeptForDetails.name} department (${selectedDeptForDetails.teams?.length || 0} squads)`}
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2 text-xs">
            {(!selectedDeptForDetails.teams || selectedDeptForDetails.teams.length === 0) ? (
              <div className="p-8 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-white/[0.02] rounded-2xl">
                No squads have been formed in {selectedDeptForDetails.name} department yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {selectedDeptForDetails.teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-violet-500/40 transition-all"
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                          {team.name}
                        </h4>
                        <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 shrink-0">
                          {team.members?.length || team._count?.members || 0} members
                        </span>
                      </div>

                      {team.description && (
                        <p className="text-2xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {team.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-3xs text-zinc-600 dark:text-zinc-400 pt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <Crown className="w-3 h-3 text-violet-500" />
                          Leader: <strong className="text-zinc-900 dark:text-white font-medium">{team.leader?.name || "Unassigned"}</strong>
                        </span>

                        {team.coLeader && (
                          <span className="flex items-center gap-1 font-semibold">
                            <Star className="w-3 h-3 text-indigo-500" />
                            Co-Leader: <strong className="text-zinc-900 dark:text-white font-medium">{team.coLeader.name}</strong>
                          </span>
                        )}

                        {team.operationManagers && team.operationManagers.length > 0 && (
                          <span className="flex items-center gap-1 font-semibold">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            OM: <strong className="text-zinc-900 dark:text-white font-medium">{team.operationManagers.map((om: any) => om.user?.name || om.name).join(", ")}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedDeptForDetails(null);
                        navigateToTeamDetails(team.id);
                      }}
                      className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View Team</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
