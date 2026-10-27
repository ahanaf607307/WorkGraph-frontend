"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  Shield,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from "sonner";

export const ServiceLineView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await serviceActions.getServices();
      setServices(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

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
      loadServices();
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
      loadServices();
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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Service Lines & Offerings
            </h1>
            <p className="text-xs text-zinc-500">
              Configure specialized business offerings (AI Services, Fullstack Development, Cloud DevOps)
            </p>
          </div>
        </div>

        {isSystemAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>New Service Line</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search service lines..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading service lines...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Service Lines Configured
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Create service lines to link sales profiles and target allocations accurately.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                      {service.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                        {service.name}
                      </h3>
                      {service.code && (
                        <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {service.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed min-h-[36px]">
                  {service.description || "Enterprise client delivery service line."}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs">
                <div className="text-zinc-400 font-mono">
                  <span>Linked Profiles: </span>
                  <strong className="text-zinc-700 dark:text-zinc-300">
                    {service._count?.profiles ?? 0}
                  </strong>
                </div>

                {isSystemAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(service)}
                      className="p-1.5 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 text-zinc-400 hover:text-violet-600 transition-colors cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id, service.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
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
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  {editingService ? "Edit Service Line" : "Create Service Line"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Define business service capabilities for profile binding and targets
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Service Line Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI & Machine Learning Services"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Code / Tag (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. AI-ML"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the deliverables and tools included in this service..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {saving ? "Saving..." : editingService ? "Update Service" : "Create Service"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
