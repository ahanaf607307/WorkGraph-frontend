"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  stationActions,
  ProfileItem,
} from "../../modules/stations/actions/station.actions";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { Project } from "../../modules/projects/types/project.types";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import {
  ShieldCheck,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
  Edit2,
  Trash2,
  Briefcase,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  PermissionButton,
  PermissionModal,
  useFeaturePermission,
} from "../../components/shared/PermissionModal";

export const ProfileView: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentOrg, user } = useAuth();
  const orgId = currentOrg?.id;

  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    (currentOrg?.myRole as string) === "SYSTEM_ADMIN" ||
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "SYSTEM_ADMIN" ||
    (user?.role as string) === "system_owner" ||
    (user?.role as string) === "system_admin";

  const { hasPermission: hasProfilePermission } = useFeaturePermission("profiles");
  const canManageProfiles = isSystemAdmin || hasProfilePermission;

  const [searchTerm, setSearchTerm] = useState("");

  // TanStack Query for dynamic reactive data
  const {
    data: profiles = [],
    isLoading: loadingProfiles,
  } = useQuery({
    queryKey: ["profiles", orgId],
    queryFn: () => stationActions.getProfiles(),
    enabled: !!orgId || isSystemAdmin,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => serviceActions.getServices(),
    enabled: !!orgId || isSystemAdmin,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects", orgId],
    queryFn: () => projectActions.fetchProjects(orgId),
    enabled: !!orgId || isSystemAdmin,
  });

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [serviceId, setServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPlatform, setEditPlatform] = useState("Upwork");
  const [editServiceId, setEditServiceId] = useState("");
  const [updating, setUpdating] = useState(false);

  // Real-time username check state for create
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // Debounced real-time username availability check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setUsernameChecking(true);
        const res = await stationActions.checkUsername(username.trim());
        setUsernameStatus({
          checked: true,
          available: res.available,
          message: res.message,
        });
      } catch (e: any) {
        setUsernameStatus({
          checked: true,
          available: false,
          message: e.message || "Failed to check username",
        });
      } finally {
        setUsernameChecking(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const openCreateModal = () => {
    setName("");
    setUsername("");
    setPlatform("Upwork");
    setServiceId(services[0]?.id || "");
    setUsernameStatus(null);
    setShowModal(true);
  };

  const openEditModal = (p: ProfileItem) => {
    setEditingProfile(p);
    setEditName(p.name);
    setEditUsername(p.username);
    setEditPlatform(p.platform || "Upwork");
    setEditServiceId(p.serviceId || "");
    setShowEditModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      toast.error("Profile name and username are required");
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      toast.error("Please enter a valid, available username before proceeding.");
      return;
    }

    try {
      setSaving(true);
      await stationActions.createProfile({
        name: name.trim(),
        username: username.trim(),
        platform: platform.trim(),
        serviceId: serviceId || undefined,
      });
      toast.success(`Profile "${name}" (@${username}) registered successfully!`);
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to register profile");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    if (!editName.trim() || !editUsername.trim()) {
      toast.error("Profile name and username are required");
      return;
    }

    try {
      setUpdating(true);
      await stationActions.updateProfile(editingProfile.id, {
        name: editName.trim(),
        username: editUsername.trim(),
        platform: editPlatform.trim(),
        serviceId: editServiceId || null,
      });
      toast.success(`Profile "${editName}" updated successfully!`);
      setShowEditModal(false);
      setEditingProfile(null);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProfile = async (p: ProfileItem) => {
    if (!confirm(`Are you sure you want to delete profile "${p.name}" (@${p.username})?`)) return;
    try {
      await stationActions.deleteProfile(p.id);
      toast.success(`Profile "${p.name}" deleted successfully!`);
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete profile");
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Sleek Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>Profiles & Client Portals</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Registered agency and client profiles with real-time station binding
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <PermissionButton onClick={() => setShowPermissionModal(true)} />
          {canManageProfiles && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 transition-all cursor-pointer w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search profiles, usernames, platforms..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#141722] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Profiles Grid */}
      {loadingProfiles ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading platform profiles...
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white dark:bg-[#0f1118] rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            No profiles registered yet
          </h3>
          <p className="text-2xs text-zinc-400 max-w-sm mx-auto">
            Register client platform profiles so Sales department members can operate stations.
          </p>
          {canManageProfiles && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Profile</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((p) => {
            const activeStation = p.activeStations?.[0];
            return (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs hover:border-violet-500/30 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-medium bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400">
                      {p.platform || "Platform"}
                    </span>

                    <div className="flex items-center gap-2">
                      {activeStation ? (
                        <span className="px-2 py-0.5 rounded-full text-3xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Desk {activeStation.stationNumber}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-3xs text-zinc-400 bg-zinc-100 dark:bg-white/[0.03]">
                          Available
                        </span>
                      )}

                      {canManageProfiles && (
                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-zinc-200 dark:border-white/[0.08]">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit Profile"
                            className="p-1 rounded-md text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProfile(p)}
                            title="Delete Profile"
                            className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-mono mt-0.5">
                      <span>@{p.username}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>

                  {p.service && (
                    <div className="text-2xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
                      <span>Service:</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 font-medium">
                        {p.service.name}
                      </span>
                    </div>
                  )}

                  {/* Associated Running Projects for this Profile */}
                  {(() => {
                    const matchingProjects = projects.filter((pr) => {
                      if (!pr.profileName) return false;
                      const pName = p.name.toLowerCase().trim();
                      const pUser = p.username.toLowerCase().trim();
                      const prProf = pr.profileName.toLowerCase().trim();
                      return (
                        prProf === pName ||
                        prProf === pUser ||
                        prProf.includes(pUser) ||
                        pUser.includes(prProf)
                      );
                    });

                    return (
                      <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.04] space-y-1.5">
                        <div className="flex items-center justify-between text-3xs font-semibold uppercase tracking-wider text-zinc-400">
                          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold">
                            <Briefcase className="w-3 h-3" />
                            Running Projects ({matchingProjects.length})
                          </span>
                        </div>

                        {matchingProjects.length === 0 ? (
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic py-0.5">
                            No active projects under this profile
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {matchingProjects.map((proj) => {
                              const isDone = (proj.status as string) === "COMPLETED" || (proj.status as string) === "DONE";
                              const isInProgress = (proj.status as string) === "ACTIVE" || (proj.status as string) === "IN_PROGRESS";
                              return (
                                <div
                                  key={proj.id}
                                  className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-[11px]">
                                      {proj.name}
                                    </div>
                                    {proj.clientName && (
                                      <div className="text-[10px] text-zinc-400 truncate">
                                        Client: {proj.clientName}
                                      </div>
                                    )}
                                  </div>
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider",
                                      isInProgress &&
                                        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                                      isDone &&
                                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
                                      !isInProgress &&
                                        !isDone &&
                                        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                    )}
                                  >
                                    {proj.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-2.5 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between text-3xs text-zinc-400">
                  {activeStation?.currentUser ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-violet-500" />
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {activeStation.currentUser.name}
                      </span>
                    </div>
                  ) : (
                    <span className="italic">No active occupant</span>
                  )}

                  <span className="font-mono">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROFILE MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm font-bold">Add Platform Profile</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Register portal account with real-time uniqueness validation
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Profile Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Nest Main Account"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Profile Username *
                </label>
                {usernameChecking && (
                  <span className="text-3xs text-violet-500 font-mono flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </span>
                )}
                {!usernameChecking && usernameStatus && (
                  <span
                    className={`text-3xs font-mono font-semibold flex items-center gap-1 ${
                      usernameStatus.available ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {usernameStatus.available ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Already in use
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="e.g. ai_nest"
                required
                className={`w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none font-mono ${
                  usernameStatus
                    ? usernameStatus.available
                      ? "border-emerald-500/80 focus:border-emerald-500"
                      : "border-rose-500/80 focus:border-rose-500"
                    : "border-zinc-200 dark:border-white/[0.08] focus:border-violet-500"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="Upwork">Upwork</option>
                  <option value="Fiverr">Fiverr</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Direct Client">Direct Client</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Service Line
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">No restriction</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (usernameStatus !== null && !usernameStatus.available)}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {saving ? "Registering..." : "Register Profile"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm font-bold">Edit Platform Profile</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Update portal name, username, service binding or platform
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Profile Display Name *
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. AI Nest Main Account"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Profile Username *
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value.toLowerCase().trim())}
                placeholder="e.g. ai_nest"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Platform
                </label>
                <select
                  value={editPlatform}
                  onChange={(e) => setEditPlatform(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="Upwork">Upwork</option>
                  <option value="Fiverr">Fiverr</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Direct Client">Direct Client</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Service Line
                </label>
                <select
                  value={editServiceId}
                  onChange={(e) => setEditServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">No restriction</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProfile(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        featureKey="profiles"
        title="Profile Registration Permissions"
        description="Authorize selected admins to register agency profiles and client accounts."
      />
    </div>
  );
};
