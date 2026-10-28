"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  systemOwnerActions,
  SystemPlatformOverview,
} from "../../modules/system-owner/actions/system-owner.actions";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Mail,
  Phone,
  Globe,
  PlusCircle,
  Calendar,
  Check,
  Ban,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  Edit2,
  Copy,
} from "lucide-react";
import { cn, formatDate } from "../../lib/utils";

export const WorkspaceRegistryView: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedCompanyDetails, setSelectedCompanyDetails] = useState<any | null>(null);

  // Form state for provisioning new System Admin & Company
  const [provisionForm, setProvisionForm] = useState({
    companyName: "",
    adminName: "",
    adminEmail: "",
    password: "123456",
    industry: "Information Technology",
    companySize: "11-50 employees",
    phone: "",
    website: "",
    country: "Bangladesh",
  });

  // Query platform overview data
  const { data, isLoading, refetch } = useQuery<SystemPlatformOverview>({
    queryKey: ["system-platform-overview"],
    queryFn: () => systemOwnerActions.getPlatformOverview(),
  });

  // Edit Workspace & System Admin state
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    industry: "",
    companySize: "",
    phone: "",
    website: "",
    country: "",
    workspaceCode: "",
    adminName: "",
    adminEmail: "",
  });

  const updateRegistryMutation = useMutation({
    mutationFn: ({ orgId, payload }: { orgId: string; payload: typeof editForm }) =>
      systemOwnerActions.updateWorkspaceRegistryInfo(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-platform-overview"] });
      setEditingCompany(null);
      setSelectedCompanyDetails(null);
      toast.success("Workspace and System Admin details updated successfully!");
    },
    onError: (err: any) => {
      toast.error("Failed to update registry info: " + (err.message || "Unknown error"));
    },
  });

  const openEditModal = (org: any) => {
    setEditingCompany(org);
    setEditForm({
      name: org.name || "",
      slug: org.slug || "",
      industry: org.industry || "Information Technology",
      companySize: org.companySize || "11-50 employees",
      phone: org.phone || "",
      website: org.website || "",
      country: org.country || "Bangladesh",
      workspaceCode: org.workspaceCode || "",
      adminName: org.createdBy?.name || "",
      adminEmail: org.createdBy?.email || "",
    });
  };

  // Mutation to update company approval status (Approve, Reject, or Activate)
  const updateStatusMutation = useMutation({
    mutationFn: ({ orgId, status }: { orgId: string; status: "APPROVED" | "REJECTED" | "SUSPENDED" }) =>
      systemOwnerActions.updateCompanyStatus(orgId, status),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ["system-platform-overview"] });
      if (selectedCompanyDetails?.id === updated.id) {
        setSelectedCompanyDetails((prev: any) => ({ ...prev, status: variables.status }));
      }
      if (variables.status === "APPROVED") {
        toast.success(`Company "${updated.name}" approved and activated!`, {
          description: "An official approval email has been dispatched to the Workspace Admin.",
        });
      } else {
        toast.info(`Company status updated to ${variables.status}`);
      }
    },
    onError: (err: any) => {
      toast.error("Failed to update status: " + (err.message || "Unknown error"));
    },
  });

  // Mutation to provision a new System Admin
  const provisionMutation = useMutation({
    mutationFn: (payload: typeof provisionForm) => systemOwnerActions.provisionSystemAdmin(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["system-platform-overview"] });
      setIsProvisionModalOpen(false);
      setProvisionForm({
        companyName: "",
        adminName: "",
        adminEmail: "",
        password: "123456",
        industry: "Information Technology",
        companySize: "11-50 employees",
        phone: "",
        website: "",
        country: "Bangladesh",
      });
      toast.success("System Admin & Workspace provisioned!", {
        description: `Credentials sent to ${res.adminUser?.email} via email.`,
      });
    },
    onError: (err: any) => {
      toast.error("Provisioning failed: " + (err.message || "Unknown error"));
    },
  });

  const metrics = data?.metrics || {
    totalOrganizations: 0,
    pendingApprovals: 0,
    approvedOrganizations: 0,
    totalUsers: 0,
  };

  const organizations = data?.organizations || [];

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.createdBy?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.createdBy?.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") return org.status === "PENDING";
    if (statusFilter === "APPROVED") return org.status === "APPROVED";
    if (statusFilter === "REJECTED") return org.status === "REJECTED" || org.status === "SUSPENDED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-black border border-zinc-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-2xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Building2 className="w-3.5 h-3.5" />
            SaaS Tenant Governance
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Company Workspace Registry & Approval Queue
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Audit, verify, approve, activate, or suspend tenant enterprise workspaces across the platform.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            onClick={() => {
              const url = `${window.location.origin}/register`;
              navigator.clipboard.writeText(url);
              toast.success("Workspace Registration link copied to clipboard!", {
                description: url,
              });
            }}
            variant="outline"
            className="border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4 text-amber-400" />
            <span>Copy Registration Link</span>
          </Button>

          <Button
            onClick={() => setIsProvisionModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold shadow-md shadow-amber-400/20 text-xs px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Provision Workspace Admin
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-2xs font-mono uppercase text-zinc-400 font-bold">Total Workspaces</div>
          <div className="text-2xl font-black text-zinc-950 dark:text-white mt-1">
            {metrics.totalOrganizations}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-2xs font-mono uppercase text-amber-500 font-bold">Pending Approvals</div>
          <div className="text-2xl font-black text-amber-500 mt-1">
            {metrics.pendingApprovals}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-2xs font-mono uppercase text-emerald-500 font-bold">Active / Approved</div>
          <div className="text-2xl font-black text-emerald-500 mt-1">
            {metrics.approvedOrganizations}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-2xs font-mono uppercase text-blue-500 font-bold">Platform Users</div>
          <div className="text-2xl font-black text-blue-500 mt-1">
            {metrics.totalUsers}
          </div>
        </div>
      </div>

      {/* Registry Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative min-w-[260px] flex-1 md:flex-none">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search company or admin email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-900 dark:text-white"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    statusFilter === st
                      ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {st === "REJECTED" ? "SUSPENDED" : st}
                  {st === "PENDING" && metrics.pendingApprovals > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-3xs bg-amber-500 text-white font-mono">
                      {metrics.pendingApprovals}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-mono uppercase text-3xs">
                <th className="py-3 px-4">Company Workspace</th>
                <th className="py-3 px-4">System Admin (Head)</th>
                <th className="py-3 px-4">Contact & Website</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Approval Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No company workspaces match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const isPending = org.status === "PENDING";
                  const isApproved = org.status === "APPROVED";
                  const isRejected = org.status === "REJECTED" || org.status === "SUSPENDED";

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Company Name & Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                              <span>{org.name}</span>
                              <span className="text-3xs font-mono font-normal text-zinc-400">
                                ({org.slug})
                              </span>
                            </div>
                            <div className="text-2xs text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>{org.industry || "General"}</span>
                              <span>•</span>
                              <span>{org.companySize || "N/A size"}</span>
                              {org.country && (
                                <>
                                  <span>•</span>
                                  <span>{org.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* System Admin */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {org.createdBy?.name || "Unassigned"}
                            <span className="text-3xs font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded">
                              SYS ADMIN
                            </span>
                          </div>
                          <div className="text-2xs text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            {org.createdBy?.email}
                          </div>
                        </div>
                      </td>

                      {/* Contact & Website */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-2xs text-zinc-500 dark:text-zinc-400">
                          {org.phone ? (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-400" /> {org.phone}
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic">No phone</span>
                          )}
                          {org.website && (
                            <a
                              href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="max-w-[140px] truncate">{org.website}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-zinc-500 font-mono text-2xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {formatDate(org.createdAt)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            <XCircle className="w-3 h-3 text-rose-600" /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ orgId: org.id, status: "APPROVED" })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-2xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                title="Approve workspace and dispatch credentials email"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve & Mail
                              </button>

                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ orgId: org.id, status: "REJECTED" })
                                }
                                disabled={updateStatusMutation.isPending}
                                className="p-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Reject registration"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* RE-ACTIVATE OPTION FOR SUSPENDED / REJECTED COMPANIES (Screenshot 1 Fix) */}
                          {isRejected && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ orgId: org.id, status: "APPROVED" })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-2xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                              title="Re-activate suspended workspace"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Activate
                            </button>
                          )}

                          {isApproved && (
                            <button
                              onClick={() =>
                                updateStatusMutation.mutate({ orgId: org.id, status: "REJECTED" })
                              }
                              disabled={updateStatusMutation.isPending}
                              className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-rose-600 hover:border-rose-300 text-3xs font-semibold transition-colors cursor-pointer"
                              title="Suspend this company workspace"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(org)}
                            className="p-1.5 rounded-lg border border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                            title="Edit Workspace & Admin Info"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setSelectedCompanyDetails(org)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="View Full Registration Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Company Details Modal / Drawer */}
      {selectedCompanyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {selectedCompanyDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                    {selectedCompanyDetails.name}
                  </h3>
                  <div className="text-3xs font-mono text-zinc-400">
                    Slug: {selectedCompanyDetails.slug}
                  </div>
                </div>
              </div>

              {selectedCompanyDetails.status === "APPROVED" ? (
                <span className="px-2.5 py-1 rounded-full text-3xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Active
                </span>
              ) : selectedCompanyDetails.status === "PENDING" ? (
                <span className="px-2.5 py-1 rounded-full text-3xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Pending
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-3xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                  Suspended
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  🏢 Tenant Company Metadata
                </div>
                <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
                  <div>
                    <span className="text-zinc-400 block text-3xs">Industry:</span>
                    <span className="font-semibold">{selectedCompanyDetails.industry || "IT"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-3xs">Company Size:</span>
                    <span className="font-semibold">{selectedCompanyDetails.companySize || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-3xs">Country:</span>
                    <span className="font-semibold">{selectedCompanyDetails.country || "Bangladesh"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-3xs">Registered Date:</span>
                    <span className="font-semibold font-mono text-3xs">{formatDate(selectedCompanyDetails.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                <div className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  👤 System Administrator Contact
                </div>
                <div className="space-y-1.5 text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Admin Name:</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {selectedCompanyDetails.createdBy?.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Admin Email:</span>
                    <span className="font-mono">{selectedCompanyDetails.createdBy?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Phone:</span>
                    <span className="font-mono">{selectedCompanyDetails.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Website:</span>
                    <span>{selectedCompanyDetails.website || "Not provided"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                {(selectedCompanyDetails.status === "REJECTED" || selectedCompanyDetails.status === "SUSPENDED") && (
                  <Button
                    size="sm"
                    onClick={() => {
                      updateStatusMutation.mutate({ orgId: selectedCompanyDetails.id, status: "APPROVED" });
                    }}
                    isLoading={updateStatusMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Activate Workspace
                  </Button>
                )}

                {selectedCompanyDetails.status === "APPROVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({ orgId: selectedCompanyDetails.id, status: "REJECTED" });
                    }}
                    isLoading={updateStatusMutation.isPending}
                    className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" /> Suspend Workspace
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
                  onClick={() => openEditModal(selectedCompanyDetails)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Info
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanyDetails(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workspace & System Admin Modal */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-violet-500" />
                  Edit Workspace & Workspace Admin Info
                </h3>
                <p className="text-2xs text-zinc-400">
                  Update corporate parameters, workspace code, and administrative credentials for &quot;{editingCompany.name}&quot;
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateRegistryMutation.mutate({
                  orgId: editingCompany.id,
                  payload: editForm,
                });
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Company Name *
                  </label>
                  <Input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Slug *
                  </label>
                  <Input
                    required
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Workspace Invite Code
                  </label>
                  <Input
                    value={editForm.workspaceCode}
                    onChange={(e) => setEditForm({ ...editForm, workspaceCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. ACM-1001"
                    className="text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Industry
                  </label>
                  <Input
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Admin Name
                  </label>
                  <Input
                    value={editForm.adminName}
                    onChange={(e) => setEditForm({ ...editForm, adminName: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Admin Email
                  </label>
                  <Input
                    type="email"
                    value={editForm.adminEmail}
                    onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone
                  </label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Website
                  </label>
                  <Input
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCompany(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={updateRegistryMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  Save Workspace Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  Provision Workspace Admin & Workspace
                </h3>
                <p className="text-2xs text-zinc-400">
                  Creates an enterprise workspace and automatically emails login credentials to the admin.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                provisionMutation.mutate(provisionForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Apex Global Solutions"
                  value={provisionForm.companyName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, companyName: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Admin Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. John Miller"
                    value={provisionForm.adminName}
                    onChange={(e) => setProvisionForm({ ...provisionForm, adminName: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    System Admin Email *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="admin@company.com"
                    value={provisionForm.adminEmail}
                    onChange={(e) => setProvisionForm({ ...provisionForm, adminEmail: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Industry
                  </label>
                  <Input
                    placeholder="e.g. Fintech, Healthcare"
                    value={provisionForm.industry}
                    onChange={(e) => setProvisionForm({ ...provisionForm, industry: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Temporary Password
                  </label>
                  <Input
                    value={provisionForm.password}
                    onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProvisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={provisionMutation.isPending}
                  className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold"
                >
                  Provision & Dispatch Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
