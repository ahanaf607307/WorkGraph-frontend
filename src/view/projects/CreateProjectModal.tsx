"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema, ProjectFormData } from "../../modules/projects/schemas/project.schema";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { departmentActions, DepartmentItem } from "../../modules/departments/actions/department.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { OrganizationMember } from "../../modules/users/types/user.types";
import { useAuth } from "../../hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select } from "../../components/ui/select";
import { toast } from "sonner";
import {
  Briefcase,
  DollarSign,
  UserCheck,
  Calendar,
  Layers,
  FileText,
  Video,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Building,
  Users2,
  Flame,
} from "lucide-react";

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentOrg } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"contract" | "client" | "execution" | "phases" | "media">("contract");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as any,
    defaultValues: {
      status: "PLANNING",
      currency: "USD",
      clientHealth: "GOOD",
      phases: [
        { name: "Phase 1: Architecture & Wireframes", status: "PENDING", budget: 0 },
        { name: "Phase 2: Core MVP Development", status: "PENDING", budget: 0 },
      ],
    },
  });

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: "phases",
  });

  // Load departments and organization members
  useEffect(() => {
    if (currentOrg?.id && isOpen) {
      departmentActions
        .getDepartments(currentOrg.id)
        .then((depts) => {
          setDepartments(depts);
          if (depts.length > 0 && !selectedDeptId) {
            setSelectedDeptId(depts[0].id);
            setValue("departmentId", depts[0].id);
          }
        })
        .catch(() => null);

      userActions
        .getMembers(currentOrg.id)
        .then((members) => {
          setOrgMembers(members || []);
        })
        .catch(() => null);
    }
  }, [currentOrg?.id, isOpen, selectedDeptId, setValue]);

  // Squads belonging to selected department
  const selectedDepartment = departments.find((d) => d.id === selectedDeptId);
  const availableSquads = selectedDepartment?.teams || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("workgraph_token");
    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingDoc(true);
    try {
      const res = await fetch("/api/v1/upload/single", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        setValue("conversationDocUrl", data.data.url);
        toast.success("Document uploaded successfully!", {
          description: file.name,
        });
      } else {
        throw new Error(data.message || "Failed to upload file");
      }
    } catch (err: any) {
      toast.error("File upload failed", { description: err.message });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (!currentOrg) {
      toast.error("Please select a workspace first");
      return;
    }

    setIsLoading(true);
    try {
      const created = await projectActions.createProject(currentOrg.id, data);
      toast.success("Enterprise project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset();
      onClose();
      if (onSuccess) onSuccess(created.id);
    } catch (error: any) {
      toast.error("Failed to create project", {
        description: error.message || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const conversationDoc = watch("conversationDocUrl");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Enterprise Project"
      description="Add comprehensive project details, client metadata, phases, and squad assignment."
      maxWidth="2xl"
    >
      {/* Navigation Steps */}
      <div className="flex items-center space-x-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("contract")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "contract"
              ? "bg-amber-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>1. Contract & Platform</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("client")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "client"
              ? "bg-amber-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>2. Client & Health</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("execution")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "execution"
              ? "bg-amber-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>3. Squad & Dept</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("phases")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "phases"
              ? "bg-amber-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4. Milestones ({phaseFields.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === "media"
              ? "bg-amber-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>5. Recordings & Docs</span>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Tab 1: Contract & Platform Details */}
        {activeTab === "contract" && (
          <div className="space-y-3.5 animate-fadeIn">
            <Input
              id="name"
              label="Project Title *"
              placeholder="e.g. Fintech Mobile App Redesign & API Core"
              error={errors.name?.message}
              {...register("name")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="orderId"
                label="Order ID / Contract Number"
                placeholder="e.g. ORD-94821 or #58210"
                error={errors.orderId?.message}
                {...register("orderId")}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Platform Name
                </label>
                <select
                  {...register("platformName")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Platform...</option>
                  <option value="Upwork">Upwork</option>
                  <option value="Fiverr">Fiverr</option>
                  <option value="Direct Client">Direct Client (Contract)</option>
                  <option value="Freelancer">Freelancer.com</option>
                  <option value="LinkedIn">LinkedIn Lead</option>
                  <option value="Toptal">Toptal</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="profileName"
                label="Profile Name"
                placeholder="e.g. Upwork Agency Main, TechSquad Pro"
                error={errors.profileName?.message}
                {...register("profileName")}
              />

              <Input
                id="salesPersonName"
                label="Sales Representative / Closer"
                placeholder="e.g. Rahim Chowdhury"
                error={errors.salesPersonName?.message}
                {...register("salesPersonName")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="budget"
                type="number"
                label="Project Budget"
                placeholder="5000"
                error={errors.budget?.message}
                {...register("budget")}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Currency
                </label>
                <select
                  {...register("currency")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="BDT">BDT (৳)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Project Status
                </label>
                <select
                  {...register("status")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active (In Production)</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
            </div>

            <Textarea
              id="description"
              label="Scope & Contract Requirements"
              placeholder="Outline project deliverables, milestones, tech requirements, and specifications..."
              error={errors.description?.message}
              {...register("description")}
            />
          </div>
        )}

        {/* Tab 2: Client Details & Health */}
        {activeTab === "client" && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="clientName"
                label="Client Name / Business Name *"
                placeholder="e.g. Apex Global LLC, Sarah Jenkins"
                error={errors.clientName?.message}
                {...register("clientName")}
              />

              <Input
                id="clientEmail"
                type="email"
                label="Client Email"
                placeholder="sarah@apexglobal.com"
                error={errors.clientEmail?.message}
                {...register("clientEmail")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                id="clientPhone"
                label="Client Phone / WhatsApp"
                placeholder="+1 (555) 019-2834"
                error={errors.clientPhone?.message}
                {...register("clientPhone")}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Client Sentiment / Health
                </label>
                <select
                  {...register("clientHealth")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="GOOD">🟢 GOOD — Highly Satisfied & Responsive</option>
                  <option value="ATTENTION">🟡 ATTENTION — Requires Frequent Updates</option>
                  <option value="AT_RISK">🔴 AT RISK — Scope / Delivery Issues</option>
                  <option value="CRITICAL">🚨 CRITICAL — Escalate Immediately</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
              <div className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Client Tracker Integration
              </div>
              <p className="text-3xs text-zinc-500 dark:text-zinc-400">
                Client health status gives team leaders and management instant visibility into client satisfaction, risk indicators, and meeting cadences.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Department & Execution Squad Assignment */}
        {activeTab === "execution" && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Assign Department *
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value);
                    setValue("departmentId", e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code || "DEPT"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Assign Squad / Service Team
                </label>
                <select
                  {...register("teamId")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Team / Squad...</option>
                  {availableSquads.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name} {team.serviceType ? `(${team.serviceType})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Service Type
                </label>
                <select
                  {...register("serviceType")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select Service Focus...</option>
                  <option value="Full Stack Web Application">Full Stack Web Application</option>
                  <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                  <option value="UI/UX & Product Design">UI/UX & Product Design</option>
                  <option value="DevOps & Cloud Infrastructure">DevOps & Cloud Infrastructure</option>
                  <option value="AI / ML & Automation">AI / ML & Automation</option>
                  <option value="API & Microservices">API & Microservices</option>
                  <option value="SEO & Growth Engineering">SEO & Growth Engineering</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="startDate"
                  type="date"
                  label="Start Date"
                  {...register("startDate")}
                />

                <Input
                  id="dueDate"
                  type="date"
                  label="Target Deadline"
                  {...register("dueDate")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Project Leader (Role: Leader)
                </label>
                <select
                  {...register("leaderId")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Default (You / Creator)</option>
                  {orgMembers.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.user?.name || m.user?.email} ({m.designationRel?.name || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Project Co-Leader (Role: Co-Leader)
                </label>
                <select
                  {...register("coLeaderId")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">None / Optional Co-Leader</option>
                  {orgMembers.map((m) => (
                    <option key={m.id} value={m.userId}>
                      {m.user?.name || m.user?.email} ({m.designationRel?.name || m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
              <Users2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Assigning a squad connects its Team Leader, Co-Leader, Operation Manager, and engineers directly to this project&apos;s boards and live risk engine.
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Phases & Milestones Builder */}
        {activeTab === "phases" && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-950 dark:text-white">
                  Milestones & Phase Breakdown
                </h4>
                <p className="text-3xs text-zinc-500">
                  Break delivery into structured phases with deadlines and budgets.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendPhase({
                    name: `Phase ${phaseFields.length + 1}: Deliverable`,
                    status: "PENDING",
                    budget: 0,
                  })
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Phase
              </Button>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {phaseFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-3xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      Phase #{idx + 1}
                    </span>
                    {phaseFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhase(idx)}
                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Phase Name (e.g. Wireframing & Design)"
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none focus:border-amber-400"
                      {...register(`phases.${idx}.name` as const)}
                    />

                    <input
                      type="date"
                      placeholder="Phase Deadline"
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none focus:border-amber-400"
                      {...register(`phases.${idx}.deadline` as const)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Phase Budget ($)"
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none focus:border-amber-400"
                      {...register(`phases.${idx}.budget` as const)}
                    />

                    <select
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none focus:border-amber-400 cursor-pointer"
                      {...register(`phases.${idx}.status` as const)}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Recordings & Documents */}
        {activeTab === "media" && (
          <div className="space-y-3.5 animate-fadeIn">
            <Input
              id="meetingRecordingUrl"
              label="Client Meeting Recording Link (Zoom / Loom / Meet)"
              placeholder="https://loom.com/share/... or https://zoom.us/rec/..."
              error={errors.meetingRecordingUrl?.message}
              {...register("meetingRecordingUrl")}
            />

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Client & Developer Conversation PDF / Documentation
              </label>

              <div className="flex items-center space-x-2">
                <Input
                  id="conversationDocUrl"
                  placeholder="https://... or upload PDF below"
                  error={errors.conversationDocUrl?.message}
                  {...register("conversationDocUrl")}
                  className="flex-1"
                />

                <label className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-400 hover:text-black font-bold text-xs border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer flex items-center gap-1 shrink-0">
                  <UploadCloud className="w-4 h-4" />
                  <span>{isUploadingDoc ? "Uploading..." : "Upload PDF"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploadingDoc}
                  />
                </label>
              </div>

              {conversationDoc && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="truncate">{conversationDoc}</span>
                  </span>
                  <a
                    href={conversationDoc}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline ml-2 shrink-0 cursor-pointer"
                  >
                    Preview
                  </a>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
              <Video className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Meeting recordings and client conversation transcripts are securely anchored to this project so engineers have full context without asking redundant questions.
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-1.5">
            {activeTab !== "contract" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "media") setActiveTab("phases");
                  else if (activeTab === "phases") setActiveTab("execution");
                  else if (activeTab === "execution") setActiveTab("client");
                  else if (activeTab === "client") setActiveTab("contract");
                }}
              >
                ← Back
              </Button>
            )}

            {activeTab !== "media" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeTab === "contract") setActiveTab("client");
                  else if (activeTab === "client") setActiveTab("execution");
                  else if (activeTab === "execution") setActiveTab("phases");
                  else if (activeTab === "phases") setActiveTab("media");
                }}
              >
                Next Section →
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Save & Launch Project
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
