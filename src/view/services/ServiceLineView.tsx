"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import { useAuth } from "../../hooks/useAuth";
import {
  Sparkles,
  Plus,
  Search,
  ExternalLink,
  Layers,
  Edit2,
  Trash2,
  Shield,
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

export const ServiceLineView: React.FC = () => {
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

  const { hasPermission: hasServicePermission } = useFeaturePermission("services");
  const canManageServices = isSystemAdmin || hasServicePermission;

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // TanStack Query for dynamic reactive data
  const {
    data: services = [],
    isLoading: loading,
  } = useQuery({
    queryKey: ["services", orgId],
    queryFn: () => serviceActions.getServices(),
    enabled: !!orgId || isSystemAdmin,
  });

  const openCreateModal = () => {
    setEditingService(null);
    setName("");
    setCode("");
    setDescription("");
    setShowModal(true);
  };

  const openEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setName(service.name);
    setCode(service.code || "");
    setDescription(service.description || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingService) {
        await serviceActions.updateService(editingService.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        });
        toast.success(`Service line "${name}" updated!`);
      } else {
        await serviceActions.createService({
          name: name.trim(),
          code: code.trim() || undefined,
          description: description.trim() || undefined,
        });
        toast.success(`Service line "${name}" created!`);
      }
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    if (!confirm(`Delete service line "${serviceName}"? Associated profiles may be unlinked.`)) {
      return;
    }
    try {
      await serviceActions.deleteService(id);
      toast.success(`Service line "${serviceName}" deleted`);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service line");
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Sleek Open Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>Service Lines & Offerings</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Specialized business offerings and service delivery lines for profile binding and targets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <PermissionButton onClick={() => setShowPermissionModal(true)} />
          {canManageServices && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 transition-all cursor-pointer w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Service Line</span>
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
            placeholder="Search service lines..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#141722] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading service lines...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center space-y-2 bg-white dark:bg-[#0f1118] rounded-2xl border border-zinc-200/70 dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            No service lines configured
          </h3>
          <p className="text-2xs text-zinc-400 max-w-sm mx-auto">
            Define your agency service offerings so departments and client profiles can be mapped accurately.
          </p>
          {canManageServices && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Service Line</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0f1118] border border-zinc-200/70 dark:border-white/[0.06] shadow-xs hover:border-violet-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                    {service.code ? service.code.slice(0, 3) : service.name.slice(0, 2).toUpperCase()}
                  </div>
                  {service.code && (
                    <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-medium bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400">
                      {service.code}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                    {service.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {service.description || "No description provided for this service line."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between">
                <span className="text-3xs text-zinc-400 font-mono">
                  {new Date(service.createdAt).toLocaleDateString()}
                </span>

                {canManageServices && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="p-1 rounded-md hover:bg-violet-50 dark:hover:bg-violet-950/40 text-zinc-400 hover:text-violet-600 transition-colors cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id, service.name)}
                      className="p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm font-bold">
              {editingService ? "Edit Service Line" : "Create Service Line"}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Define service line capabilities for client profile binding
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Service Line Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI & Machine Learning Services"
                required
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Code / Tag (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AI-ML"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of deliverables and tools in this service..."
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-[#141722] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 font-sans"
              />
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
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {saving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        featureKey="services"
        title="Service Line Permissions"
        description="Authorize selected admins to create and manage service offerings."
      />
    </div>
  );
};
