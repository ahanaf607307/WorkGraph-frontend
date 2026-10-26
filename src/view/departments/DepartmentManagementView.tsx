"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Users,
  Plus,
  Shield,
  Crown,
  Star,
  Layers,
  Settings2,
  Briefcase,
  Edit2,
  Trash2,
  Check,
  ChevronRight,
  FolderTree,
  UserCheck,
  Award,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  departmentActions,
  DepartmentItem,
  TeamItem,
  HierarchyData,
} from "../../modules/departments/actions/department.actions";
import {
  designationActions,
  DesignationItem,
} from "../../modules/designations/actions/designation.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { OrganizationMember } from "../../modules/users/types/user.types";
import { Avatar } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export const DepartmentManagementView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const isAdminOrOwner = currentOrg?.myRole === "OWNER" || currentOrg?.myRole === "ADMIN";

  const [activeTab, setActiveTab] = useState<"departments" | "designations" | "hierarchy" | "members">("departments");
  const [loading, setLoading] = useState(true);

  // Data states
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyData | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "", managerId: "" });

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState("");
  const [teamForm, setTeamForm] = useState({ name: "", description: "", leaderId: "", coLeaderId: "" });

  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [designationForm, setDesignationForm] = useState({
    name: "",
    code: "",
    description: "",
    hierarchyLevel: 5,
  });

  const [showAssignOmModal, setShowAssignOmModal] = useState(false);
  const [targetTeam, setTargetTeam] = useState<TeamItem | null>(null);
  const [selectedOmUserId, setSelectedOmUserId] = useState("");

  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [memberForm, setMemberForm] = useState<{
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    weeklyCapacityHours: number;
  }>({
    role: "MEMBER",
    designationId: "",
    departmentId: "",
    teamId: "",
    weeklyCapacityHours: 40,
  });

  // Load all initial data
  const loadAllData = async () => {
    if (!currentOrg?.id) return;
    try {
      setLoading(true);
      const [deptList, desigList, hier, memberList] = await Promise.all([
        departmentActions.getDepartments(currentOrg.id),
        designationActions.getDesignations(currentOrg.id),
        departmentActions.getHierarchy(currentOrg.id),
        userActions.getOrganizationMembers(currentOrg.id),
      ]);
      setDepartments(deptList);
      setDesignations(desigList);
      setHierarchyData(hier);
      setMembers(memberList);
    } catch (err: any) {
      console.error("Failed to load organization hierarchy:", err);
      toast.error("Failed to load department data: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [currentOrg?.id]);

  // Create Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    try {
      await departmentActions.createDepartment({
        name: deptForm.name.trim(),
        code: deptForm.code.trim() || undefined,
        description: deptForm.description.trim() || undefined,
        managerId: deptForm.managerId || undefined,
      });
      toast.success(`Department "${deptForm.name}" created!`);
      setShowDeptModal(false);
      setDeptForm({ name: "", code: "", description: "", managerId: "" });
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create department");
    }
  };

  // Create Team inside Department
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !targetDeptId) return;

    try {
      await departmentActions.createTeam(targetDeptId, {
        name: teamForm.name.trim(),
        description: teamForm.description.trim() || undefined,
        leaderId: teamForm.leaderId || undefined,
        coLeaderId: teamForm.coLeaderId || undefined,
      });
      toast.success(`Team "${teamForm.name}" created!`);
      setShowTeamModal(false);
      setTeamForm({ name: "", description: "", leaderId: "", coLeaderId: "" });
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create team");
    }
  };

  // Create Dynamic Designation (Admin)
  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designationForm.name.trim()) return;

    try {
      await designationActions.createDesignation({
        name: designationForm.name.trim(),
        code: designationForm.code.trim() || undefined,
        description: designationForm.description.trim() || undefined,
        hierarchyLevel: Number(designationForm.hierarchyLevel),
      });
      toast.success(`Designation "${designationForm.name}" added successfully!`);
      setShowDesignationModal(false);
      setDesignationForm({ name: "", code: "", description: "", hierarchyLevel: 5 });
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create designation");
    }
  };

  // Delete Dynamic Designation
  const handleDeleteDesignation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete designation "${name}"?`)) return;
    try {
      await designationActions.deleteDesignation(id);
      toast.success(`Designation "${name}" removed.`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete designation");
    }
  };

  // Assign Operation Manager to Team (Supports Multi-Team assignment)
  const handleAssignOm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTeam || !selectedOmUserId) return;

    try {
      await departmentActions.assignOperationManager(targetTeam.id, selectedOmUserId);
      toast.success("Operation Manager linked to squad!");
      setShowAssignOmModal(false);
      setSelectedOmUserId("");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign operation manager");
    }
  };

  // Remove Operation Manager from Team
  const handleRemoveOm = async (teamId: string, omUserId: string) => {
    try {
      await departmentActions.removeOperationManager(teamId, omUserId);
      toast.success("Operation manager unlinked from team.");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove operation manager");
    }
  };

  // Open Edit Member Modal
  const openEditMember = (m: OrganizationMember) => {
    setEditingMember(m);
    setMemberForm({
      role: m.role as any,
      designationId: (m as any).designationId || "",
      departmentId: (m as any).departmentId || "",
      teamId: (m as any).teamId || "",
      weeklyCapacityHours: m.weeklyCapacityHours || 40,
    });
    setShowEditMemberModal(true);
  };

  // Save Member Hierarchy changes
  const handleSaveMemberHierarchy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      await departmentActions.updateMemberHierarchy(editingMember.userId, {
        designationId: memberForm.designationId || null,
        departmentId: memberForm.departmentId || null,
        teamId: memberForm.teamId || null,
        weeklyCapacityHours: Number(memberForm.weeklyCapacityHours),
      });

      // Update role if changed
      if (memberForm.role !== editingMember.role) {
        await userActions.updateMember(currentOrg!.id, editingMember.userId, { role: memberForm.role });
      }

      toast.success(`Updated hierarchy & designation for ${editingMember.user.name}`);
      setShowEditMemberModal(false);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update member hierarchy");
    }
  };

  // Filter teams for selected department in member form
  const teamsForMemberDept = departments.find((d) => d.id === memberForm.departmentId)?.teams || [];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-amber-500" />
              Departments & Enterprise Hierarchy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-400 text-black shadow-2xs">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Dynamic departments, squad units, cross-team operational leadership & admin-defined designations.
          </p>
        </div>

        {isAdminOrOwner && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
            <button
              onClick={() => setShowDesignationModal(true)}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>New Designation</span>
            </button>
          </div>
        )}
      </div>

      {/* Enterprise Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Departments</div>
          <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
            {departments.length}
          </div>
          <div className="text-3xs text-zinc-500 mt-0.5">Dynamic organization divisions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Squads & Teams</div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {departments.reduce((acc, d) => acc + (d.teams?.length || 0), 0)}
          </div>
          <div className="text-3xs text-zinc-500 mt-0.5">Units with Leader & Co-Leader</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Total Members</div>
          <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
            {members.length}
          </div>
          <div className="text-3xs text-zinc-500 mt-0.5">Assigned to squads & roles</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="text-2xs font-bold uppercase text-zinc-400 font-mono">Designations</div>
          <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
            {designations.length}
          </div>
          <div className="text-3xs text-zinc-500 mt-0.5">Admin-managed hierarchy levels</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-4">
        {[
          { id: "departments", label: "Departments & Squads", icon: Layers },
          { id: "designations", label: "Dynamic Designations", icon: Award },
          { id: "hierarchy", label: "Company Hierarchy Chart", icon: FolderTree },
          { id: "members", label: "Member Directory & Assignment", icon: Users },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-3 text-xs font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer",
                isActive
                  ? "border-amber-400 text-zinc-950 dark:text-amber-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DEPARTMENTS & TEAMS */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-zinc-400">Loading departments...</div>
          ) : departments.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <Building2 className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                No departments created yet
              </h3>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Create your first department (e.g. Engineering, Product, Operations) and configure squads with leaders and co-leaders.
              </p>
              {isAdminOrOwner && (
                <button
                  onClick={() => setShowDeptModal(true)}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Create Department
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4"
                >
                  {/* Department Title & Header */}
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
                          onClick={() => {
                            setTargetDeptId(dept.id);
                            setShowTeamModal(true);
                          }}
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
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                {team.name}
                              </h4>
                              <span className="text-3xs font-mono font-bold text-zinc-500 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 shadow-2xs">
                                {team._count?.members || 0} members
                              </span>
                            </div>

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
                                    onClick={() => {
                                      setTargetTeam(team);
                                      setShowAssignOmModal(true);
                                    }}
                                    className="text-3xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                  >
                                    + Link OM
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {team.operationManagers && team.operationManagers.length > 0 ? (
                                  team.operationManagers.map((om) => (
                                    <span
                                      key={om.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-semibold text-3xs border border-amber-300 dark:border-amber-700"
                                    >
                                      <span>{om.user.name}</span>
                                      {isAdminOrOwner && (
                                        <button
                                          onClick={() => handleRemoveOm(team.id, om.userId)}
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DYNAMIC DESIGNATIONS (ADMIN CONTROLS) */}
      {activeTab === "designations" && (
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
                onClick={() => setShowDesignationModal(true)}
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
                      onClick={() => handleDeleteDesignation(desig.id, desig.name)}
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
      )}

      {/* TAB 3: COMPANY HIERARCHY CHART */}
      {activeTab === "hierarchy" && (
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
                hierarchyData.executiveLeadership.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-800 border-2 border-amber-400 shadow-md min-w-[240px] text-center space-y-2"
                  >
                    <Avatar name={m.user.name} size="md" className="mx-auto" />
                    <div>
                      <div className="text-sm font-bold">{m.user.name}</div>
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

          {/* Tier 2: Project Management (All Teams Oversight) */}
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
                hierarchyData.projectManagers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 min-w-[220px] text-center space-y-1.5"
                  >
                    <Avatar name={m.user.name} size="sm" className="mx-auto" />
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {m.user.name}
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

          {/* Tier 3: Operation Managers (Multi-Team Assignment) */}
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
                hierarchyData.operationManagers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 min-w-[220px] text-center space-y-1.5 shadow-xs"
                  >
                    <Avatar name={m.user.name} size="sm" className="mx-auto" />
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {m.user.name}
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
      )}

      {/* TAB 4: MEMBER DIRECTORY & ASSIGNMENT */}
      {activeTab === "members" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Member Department & Designation Roster
              </h3>
              <p className="text-xs text-zinc-500">
                Assign and adjust department, squad, designation, and capacity hours.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 font-mono uppercase text-3xs">
                  <th className="py-3 px-3">Member</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Designation</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Squad / Team</th>
                  <th className="py-3 px-3">Capacity</th>
                  {isAdminOrOwner && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {members.map((m) => {
                  const mDept = (m as any).department?.name || "Unassigned";
                  const mTeam = (m as any).team?.name || "Unassigned";
                  const mDesig =
                    m.designationRel?.name ||
                    m.customDesignation ||
                    (m as any).designation ||
                    "Member";

                  return (
                    <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          <Avatar name={m.user.name} size="sm" />
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white">
                              {m.user.name}
                            </div>
                            <div className="text-3xs text-zinc-400 font-mono">{m.user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md font-mono text-3xs font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {m.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-900 dark:text-amber-300 text-3xs font-bold">
                          {mDesig}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{mDept}</td>

                      <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">{mTeam}</td>

                      <td className="py-3 px-3 font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {m.weeklyCapacityHours || 40}h/wk
                      </td>

                      {isAdminOrOwner && (
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => openEditMember(m)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-amber-400 hover:text-black dark:bg-zinc-800 dark:hover:bg-amber-400 dark:hover:text-black transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEPARTMENT */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateDepartment}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                Create Dynamic Department
              </h3>
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Department Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering, Product, Marketing"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. ENG, PROD, MKT"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Department Manager
                </label>
                <select
                  value={deptForm.managerId}
                  onChange={(e) => setDeptForm({ ...deptForm, managerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Select Member as Manager --</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Department scope and objectives..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowDeptModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!deptForm.name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black cursor-pointer shadow-xs"
              >
                Create Department
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE TEAM */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateTeam}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Add Squad / Team
              </h3>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Team Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core API Squad or Cloud Infrastructure"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Team Leader
                </label>
                <select
                  value={teamForm.leaderId}
                  onChange={(e) => setTeamForm({ ...teamForm, leaderId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Select Team Leader --</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Co-Leader
                </label>
                <select
                  value={teamForm.coLeaderId}
                  onChange={(e) => setTeamForm({ ...teamForm, coLeaderId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Select Co-Leader --</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name} ({m.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Team mission & responsibility..."
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!teamForm.name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black cursor-pointer shadow-xs"
              >
                Create Squad
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE DYNAMIC DESIGNATION */}
      {showDesignationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateDesignation}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Add Dynamic Designation
              </h3>
              <button
                type="button"
                onClick={() => setShowDesignationModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Designation Title <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead SRE Architect, Director of Operations"
                  value={designationForm.name}
                  onChange={(e) => setDesignationForm({ ...designationForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Code / Abbreviation
                </label>
                <input
                  type="text"
                  placeholder="e.g. ARCH, DIR_OPS"
                  value={designationForm.code}
                  onChange={(e) => setDesignationForm({ ...designationForm, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Hierarchy Tier Level (1 = Top Executive, 10 = Junior)
                </label>
                <select
                  value={designationForm.hierarchyLevel}
                  onChange={(e) =>
                    setDesignationForm({ ...designationForm, hierarchyLevel: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={1}>Tier 1 - Executive Leadership (GM level)</option>
                  <option value={2}>Tier 2 - Assistant Executive (AGM level)</option>
                  <option value={3}>Tier 3 - Head of Technical Operations (HTO level)</option>
                  <option value={4}>Tier 4 - Project Management (Cross-Team PM)</option>
                  <option value={5}>Tier 5 - Operations Manager (Multi-Team OM)</option>
                  <option value={6}>Tier 6 - Team Leader</option>
                  <option value={7}>Tier 7 - Co-Leader</option>
                  <option value={8}>Tier 8 - Senior Principal Contributor</option>
                  <option value={9}>Tier 9 - Software / QA / Design Engineer</option>
                  <option value={10}>Tier 10 - Team Member / Associate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Role duties and scope of authority..."
                  value={designationForm.description}
                  onChange={(e) =>
                    setDesignationForm({ ...designationForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowDesignationModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!designationForm.name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black cursor-pointer shadow-xs"
              >
                Add Designation
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ASSIGN OPERATION MANAGER TO TEAM */}
      {showAssignOmModal && targetTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAssignOm}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                Link Operation Manager to Squad
              </h3>
              <button
                type="button"
                onClick={() => setShowAssignOmModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Link an Operation Manager to supervise squad <strong>"{targetTeam.name}"</strong>.
              Operation Managers can oversee multiple squads simultaneously.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Select Member as Operation Manager
              </label>
              <select
                required
                value={selectedOmUserId}
                onChange={(e) => setSelectedOmUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">-- Choose Member --</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name} ({m.user.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAssignOmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedOmUserId}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black cursor-pointer shadow-xs"
              >
                Confirm Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: EDIT MEMBER HIERARCHY */}
      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSaveMemberHierarchy}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                Assign Hierarchy for {editingMember.user.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditMemberModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Organization Access Role
                </label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Dynamic Designation
                </label>
                <select
                  value={memberForm.designationId}
                  onChange={(e) => setMemberForm({ ...memberForm, designationId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- Standard Member --</option>
                  {designations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ""} - Tier {d.hierarchyLevel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Department
                </label>
                <select
                  value={memberForm.departmentId}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, departmentId: e.target.value, teamId: "" })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">-- No Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Squad / Team
                </label>
                <select
                  value={memberForm.teamId}
                  onChange={(e) => setMemberForm({ ...memberForm, teamId: e.target.value })}
                  disabled={!memberForm.departmentId}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400 disabled:opacity-40 cursor-pointer"
                >
                  <option value="">-- No Team --</option>
                  {teamsForMemberDept.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Weekly Capacity (Hours)
                </label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={memberForm.weeklyCapacityHours}
                  onChange={(e) =>
                    setMemberForm({ ...memberForm, weeklyCapacityHours: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowEditMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-black cursor-pointer shadow-xs"
              >
                Save Hierarchy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
