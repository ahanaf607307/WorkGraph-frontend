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
import { toast } from "sonner";
import { Building2, Plus, Award, Layers, Users, FolderTree } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { DepartmentStats } from "./components/DepartmentStats";
import { DepartmentSquadTab } from "./components/DepartmentSquadTab";
import { DesignationManagerTab } from "./components/DesignationManagerTab";
import { CompanyHierarchyTab } from "./components/CompanyHierarchyTab";
import { MemberDirectoryTab } from "./components/MemberDirectoryTab";
import { CreateDepartmentModal } from "./components/CreateDepartmentModal";
import { CreateSquadModal } from "./components/CreateSquadModal";
import { AssignOperationManagerModal } from "./components/AssignOperationManagerModal";
import { CreateDesignationModal } from "./components/CreateDesignationModal";
import { EditMemberPlacementModal } from "./components/EditMemberPlacementModal";

export const DepartmentManagementView: React.FC = () => {
  const { currentOrg } = useAuth();
  const orgRole = currentOrg?.myRole;
  const isAdminOrOwner = orgRole === "OWNER" || orgRole === "ADMIN";

  const [activeTab, setActiveTab] = useState<string>("departments");
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState("");
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showAssignOmModal, setShowAssignOmModal] = useState(false);
  const [targetTeam, setTargetTeam] = useState<TeamItem | null>(null);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);

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
      toast.error("Failed to load department data: " + (err.message || "Error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
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

  // Create Dynamic Designation
  const handleCreateDesignation = async (data: { name: string; code?: string; description?: string; hierarchyLevel: number }) => {
    if (!currentOrg?.id) return;
    try {
      await designationActions.createDesignation(data);
      toast.success(`Designation "${data.name}" created!`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create designation");
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
    weeklyCapacityHours: number;
  }) => {
    if (!editingMember || !currentOrg?.id) return;
    try {
      await userActions.updateMember(currentOrg.id, editingMember.userId, {
        role: form.role,
        designationId: form.designationId || null,
        departmentId: form.departmentId || null,
        teamId: form.teamId || null,
        weeklyCapacityHours: form.weeklyCapacityHours,
      });

      toast.success(`Updated hierarchy & designation for ${editingMember.user.name}`);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update member hierarchy");
    }
  };

  const targetDept = departments.find((d) => d.id === targetDeptId);

  return (
    <div className="w-full space-y-6 select-none">
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
              type="button"
              onClick={() => setShowDeptModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
            <button
              type="button"
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
          <TabsTrigger value="designations">
            <Award className="w-4 h-4" />
            <span>Dynamic Designations</span>
          </TabsTrigger>
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
            loading={loading}
            onOpenCreateDept={() => setShowDeptModal(true)}
            onOpenCreateSquad={(deptId) => {
              setTargetDeptId(deptId);
              setShowTeamModal(true);
            }}
            onOpenAssignOm={(team) => {
              setTargetTeam(team);
              setShowAssignOmModal(true);
            }}
            onRemoveOm={handleRemoveOm}
          />
        </TabsContent>

        <TabsContent value="designations">
          <DesignationManagerTab
            designations={designations}
            isAdminOrOwner={isAdminOrOwner}
            onOpenCreateDesignation={() => setShowDesignationModal(true)}
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

      <CreateDesignationModal
        isOpen={showDesignationModal}
        onClose={() => setShowDesignationModal(false)}
        onSubmit={handleCreateDesignation}
      />

      <EditMemberPlacementModal
        isOpen={showEditMemberModal}
        onClose={() => setShowEditMemberModal(false)}
        member={editingMember}
        departments={departments}
        designations={designations}
        onSubmit={handleSaveMemberPlacement}
      />
    </div>
  );
};
