"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  departmentActions,
  DepartmentItem,
  TeamItem,
} from "../../modules/departments/actions/department.actions";
import {
  designationActions,
  DesignationItem,
} from "../../modules/designations/actions/designation.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { OrganizationMember } from "../../modules/users/types/user.types";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import { toast } from "sonner";
import { Building2, Plus, Award, Layers, Users, FolderTree } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { DepartmentStats } from "./components/DepartmentStats";
import { DepartmentSquadTab } from "./components/DepartmentSquadTab";
import { DesignationManagerTab } from "./components/DesignationManagerTab";
import { CompanyHierarchyTab } from "./components/CompanyHierarchyTab";
import { MemberDirectoryTab } from "./components/MemberDirectoryTab";
import { CreateDepartmentModal } from "./components/CreateDepartmentModal";
import { EditDepartmentModal } from "./components/EditDepartmentModal";
import { isProtectedDepartment } from "./components/DepartmentSquadTab";
import { CreateSquadModal } from "./components/CreateSquadModal";
import { AssignOperationManagerModal } from "./components/AssignOperationManagerModal";
import { CreateDesignationModal } from "./components/CreateDesignationModal";
import { EditDesignationModal } from "./components/EditDesignationModal";
import { EditMemberPlacementModal } from "./components/EditMemberPlacementModal";
import { AddSquadMemberModal } from "./components/AddSquadMemberModal";

export const DepartmentManagementView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const isSystemOwner = user?.role === "SYSTEM_OWNER";
  const isCompanyHead = currentOrg?.myRole === "OWNER";
  const isSystemAdmin = isCompanyHead || isSystemOwner;
  const isAdmin = currentOrg?.myRole === "ADMIN";
  const isAdminOrOwner = isSystemAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState<string>("departments");
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showEditDeptModal, setShowEditDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState("");
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showEditDesignationModal, setShowEditDesignationModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationItem | null>(null);
  const [showAssignOmModal, setShowAssignOmModal] = useState(false);
  const [targetTeam, setTargetTeam] = useState<TeamItem | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [targetTeamForMember, setTargetTeamForMember] = useState<TeamItem | null>(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);

  // Load all data with smooth background auto-fetch (No screen black/white flicker)
  const loadAllData = async (isInitial = false) => {
    if (!currentOrg?.id) return;
    try {
      if (isInitial) setLoading(true);
      const [deptList, desigList, hier, memberList, servList] = await Promise.all([
        departmentActions.getDepartments(currentOrg.id),
        designationActions.getDesignations(currentOrg.id),
        departmentActions.getHierarchy(currentOrg.id),
        userActions.getOrganizationMembers(currentOrg.id),
        serviceActions.getServices().catch(() => []),
      ]);
      setDepartments(deptList);
      setDesignations(desigList);
      setHierarchyData(hier);
      setMembers(memberList);
      setServices(servList);
    } catch (err: any) {
      toast.error("Failed to load department data: " + (err.message || "Error"));
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData(true);
  }, [currentOrg?.id]);

  // Create Department
  const handleCreateDepartment = async (data: { name: string; code?: string; description?: string; managerId?: string }) => {
    try {
      await departmentActions.createDepartment(data);
      toast.success(`Department "${data.name}" created!`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create department");
    }
  };

  // Edit / Update Department
  const handleOpenEditDept = (dept: DepartmentItem) => {
    if (isProtectedDepartment(dept)) {
      toast.error("Protected system departments (Sales/Seals, Operation, BDT) cannot be modified.");
      return;
    }
    setEditingDept(dept);
    setShowEditDeptModal(true);
  };

  const handleUpdateDepartment = async (
    deptId: string,
    data: { name: string; code?: string; description?: string; managerId?: string | null }
  ) => {
    try {
      await departmentActions.updateDepartment(deptId, data);
      toast.success(`Department updated successfully!`);
      setShowEditDeptModal(false);
      setEditingDept(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update department");
    }
  };

  // Delete Department
  const handleDeleteDepartment = async (dept: DepartmentItem) => {
    if (isProtectedDepartment(dept)) {
      toast.error("Protected system departments (Sales/Seals, Operation, BDT) cannot be deleted.");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete department "${dept.name}"? All squads under this department will also be removed.`
      )
    ) {
      return;
    }
    try {
      await departmentActions.deleteDepartment(dept.id);
      toast.success(`Department "${dept.name}" deleted successfully`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete department");
    }
  };

  // Create Team inside Department
  const handleCreateTeam = async (data: { name: string; description?: string; leaderId?: string; coLeaderId?: string }) => {
    if (!targetDeptId) return;
    try {
      await departmentActions.createTeam(targetDeptId, data);
      toast.success(`Squad "${data.name}" created!`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create squad");
    }
  };

  // Assign Operation Manager to Team
  const handleAssignOm = async (teamId: string, omUserId: string) => {
    try {
      await departmentActions.assignOperationManager(teamId, omUserId);
      toast.success("Operation Manager linked to squad!");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to link Operation Manager");
    }
  };

  // Remove Operation Manager from Team
  const handleRemoveOm = async (teamId: string, omUserId: string) => {
    try {
      await departmentActions.removeOperationManager(teamId, omUserId);
      toast.success("Operation Manager removed from squad");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove Operation Manager");
    }
  };

  // Add Member to Squad
  const handleAddMemberToSquad = async (teamId: string, userId: string) => {
    try {
      await departmentActions.addMemberToTeam(teamId, userId);
      toast.success("Member assigned to squad successfully!");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member to squad");
    }
  };

  // Remove Member from Squad
  const handleRemoveMemberFromSquad = async (teamId: string, userId: string) => {
    if (!confirm("Are you sure you want to remove this member from the squad?")) return;
    try {
      await departmentActions.removeMemberFromTeam(teamId, userId);
      toast.success("Member removed from squad");
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member from squad");
    }
  };

  // Create Dynamic Designation
  const handleCreateDesignation = async (data: {
    name: string;
    code?: string;
    title?: string;
    departmentId?: string | null;
    description?: string;
    hierarchyLevel: number;
  }) => {
    if (!currentOrg?.id) return;
    try {
      await designationActions.createDesignation(data);
      toast.success(`Designation "${data.name}" created!`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create designation");
    }
  };

  // Update Dynamic Designation
  const handleUpdateDesignation = async (
    id: string,
    data: {
      name: string;
      code?: string;
      title?: string;
      departmentId?: string | null;
      description?: string;
      hierarchyLevel: number;
    }
  ) => {
    try {
      await designationActions.updateDesignation(id, data);
      toast.success(`Designation "${data.name}" updated!`);
      setShowEditDesignationModal(false);
      setEditingDesignation(null);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update designation");
    }
  };

  // Delete Designation
  const handleDeleteDesignation = async (id: string, name: string) => {
    if (!confirm(`Delete designation "${name}"? Members assigned will default to Member.`)) return;
    try {
      await designationActions.deleteDesignation(id);
      toast.success(`Designation "${name}" deleted`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete designation");
    }
  };

  // Save Member Placement
  const handleSaveMemberPlacement = async (form: {
    role: "OWNER" | "ADMIN" | "MEMBER";
    designationId: string;
    departmentId: string;
    teamId: string;
    serviceId?: string;
    isApproved?: boolean;
    weeklyCapacityHours: number;
  }) => {
    if (!editingMember || !currentOrg?.id) return;
    try {
      await userActions.updateMember(currentOrg.id, editingMember.userId, {
        role: form.role,
        designationId: form.designationId || null,
        departmentId: form.departmentId || null,
        teamId: form.teamId || null,
        serviceId: form.serviceId || null,
        isApproved: form.isApproved,
        weeklyCapacityHours: form.weeklyCapacityHours,
      });

      toast.success(`Updated hierarchy & service for ${editingMember.user.name}`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update member hierarchy");
    }
  };

  const targetDept = departments.find((d) => d.id === targetDeptId);

  return (
    <div className="w-full space-y-6 select-text">
      {/* Top Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-violet-600" />
              Department & Team
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage departments, squads, team members, operational leadership & role hierarchy.
          </p>
        </div>

        {isSystemAdmin ? (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDesignationModal(true)}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white border border-zinc-200/70 dark:border-zinc-700 font-medium text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
            >
              <Award className="w-4 h-4 text-violet-500" />
              <span>New Designation</span>
            </button>
          </div>
        ) : isAdmin ? (
          <div className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-3xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
            <span>🛡️</span>
            <span>Admin Workspace (Departments & Designations managed by System Admin)</span>
          </div>
        ) : null}
      </div>

      {/* Enterprise Stats Cards */}
      <DepartmentStats
        departmentsCount={departments.length}
        totalSquadsCount={departments.reduce((acc, d) => acc + (d.teams?.length || 0), 0)}
        membersCount={members.length}
        designationsCount={designations.length}
      />

      {/* Navigation Tabs with Shadcn UI */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="departments">
            <Layers className="w-4 h-4" />
            <span>Departments & Squads</span>
          </TabsTrigger>
          {isAdminOrOwner && (
            <TabsTrigger value="designations">
              <Award className="w-4 h-4" />
              <span>Dynamic Designations</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="hierarchy">
            <FolderTree className="w-4 h-4" />
            <span>Company Hierarchy Chart</span>
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="w-4 h-4" />
            <span>Member Directory & Assignment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentSquadTab
            departments={departments}
            isAdminOrOwner={isAdminOrOwner}
            isSystemAdmin={isSystemAdmin}
            loading={loading}
            onOpenCreateDept={() => setShowDeptModal(true)}
            onOpenEditDept={handleOpenEditDept}
            onDeleteDept={handleDeleteDepartment}
            onOpenCreateSquad={(deptId) => {
              setTargetDeptId(deptId);
              setShowTeamModal(true);
            }}
            onOpenAssignOm={(team) => {
              setTargetTeam(team);
              setShowAssignOmModal(true);
            }}
            onRemoveOm={handleRemoveOm}
            onOpenAddMember={(team) => {
              setTargetTeamForMember(team);
              setShowAddMemberModal(true);
            }}
            onRemoveMember={handleRemoveMemberFromSquad}
          />
        </TabsContent>

        <TabsContent value="designations">
          <DesignationManagerTab
            designations={designations}
            isSystemAdmin={isSystemAdmin}
            onOpenCreateDesignation={() => setShowDesignationModal(true)}
            onEditDesignation={(desig) => {
              setEditingDesignation(desig);
              setShowEditDesignationModal(true);
            }}
            onDeleteDesignation={handleDeleteDesignation}
          />
        </TabsContent>

        <TabsContent value="hierarchy">
          <CompanyHierarchyTab hierarchyData={hierarchyData} />
        </TabsContent>

        <TabsContent value="members">
          <MemberDirectoryTab
            members={members}
            isAdminOrOwner={isAdminOrOwner}
            onEditMember={(m) => {
              setEditingMember(m);
              setShowEditMemberModal(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Reusable Modals */}
      <CreateDepartmentModal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        members={members}
        onSubmit={handleCreateDepartment}
      />

      <EditDepartmentModal
        isOpen={showEditDeptModal}
        onClose={() => {
          setShowEditDeptModal(false);
          setEditingDept(null);
        }}
        department={editingDept}
        members={members}
        onSubmit={handleUpdateDepartment}
      />

      <EditDesignationModal
        isOpen={showEditDesignationModal}
        onClose={() => {
          setShowEditDesignationModal(false);
          setEditingDesignation(null);
        }}
        departments={departments}
        designation={editingDesignation}
        onSubmit={handleUpdateDesignation}
      />

      <CreateSquadModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        departmentName={targetDept?.name}
        members={members}
        onSubmit={handleCreateTeam}
      />

      <AssignOperationManagerModal
        isOpen={showAssignOmModal}
        onClose={() => setShowAssignOmModal(false)}
        team={targetTeam}
        members={members}
        onSubmit={handleAssignOm}
      />

      <AddSquadMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        team={targetTeamForMember}
        members={members}
        onSubmit={handleAddMemberToSquad}
      />

      <CreateDesignationModal
        isOpen={showDesignationModal}
        onClose={() => setShowDesignationModal(false)}
        departments={departments}
        onSubmit={handleCreateDesignation}
      />

      <EditMemberPlacementModal
        isOpen={showEditMemberModal}
        onClose={() => setShowEditMemberModal(false)}
        member={editingMember}
        departments={departments}
        designations={designations}
        services={services}
        isSystemAdmin={isSystemAdmin}
        onSubmit={handleSaveMemberPlacement}
      />
    </div>
  );
};
