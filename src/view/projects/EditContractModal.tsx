"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { toast } from "sonner";
import { Project } from "../../modules/projects/types/project.types";
import { Briefcase, Mail, Phone, UserCheck, Video, FileText, Activity } from "lucide-react";

interface EditContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSaved: () => void;
}

export const EditContractModal: React.FC<EditContractModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaved,
}) => {
  const [form, setForm] = useState({
    clientName: project.clientName || "",
    clientEmail: project.clientEmail || "",
    clientPhone: project.clientPhone || "",
    salesPersonName: project.salesPersonName || "",
    platformName: project.platformName || "",
    clientHealth: project.clientHealth || "GOOD",
    meetingRecordingUrl: project.meetingRecordingUrl || "",
    conversationDocUrl: project.conversationDocUrl || "",
    serviceType: project.serviceType || "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setForm({
        clientName: project.clientName || "",
        clientEmail: project.clientEmail || "",
        clientPhone: project.clientPhone || "",
        salesPersonName: project.salesPersonName || "",
        platformName: project.platformName || "",
        clientHealth: project.clientHealth || "GOOD",
        meetingRecordingUrl: project.meetingRecordingUrl || "",
        conversationDocUrl: project.conversationDocUrl || "",
        serviceType: project.serviceType || "",
      });
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await projectActions.updateProject(project.id, {
        clientName: form.clientName.trim() || undefined,
        clientEmail: form.clientEmail.trim() || undefined,
        clientPhone: form.clientPhone.trim() || undefined,
        salesPersonName: form.salesPersonName.trim() || undefined,
        platformName: form.platformName.trim() || undefined,
        clientHealth: form.clientHealth as any,
        meetingRecordingUrl: form.meetingRecordingUrl.trim() || undefined,
        conversationDocUrl: form.conversationDocUrl.trim() || undefined,
        serviceType: form.serviceType.trim() || undefined,
      });

      toast.success("Client & Contract details updated successfully!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update project details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client & Contract Hub Details"
      description={`Update client contact profile, commercial channels, and meeting documentation links for ${project.name}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Client Profile Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" /> Client Profile & Commercial Info
          </h4>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Client / Business Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Acme Global Inc."
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> Client Email
              </label>
              <Input
                type="email"
                placeholder="client@company.com"
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-zinc-400" /> Phone / WhatsApp
              </label>
              <Input
                type="text"
                placeholder="+1 555-0199"
                value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" /> Sales Person
              </label>
              <Input
                type="text"
                placeholder="e.g. John Doe / Inbound"
                value={form.salesPersonName}
                onChange={(e) => setForm({ ...form, salesPersonName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Platform / Lead Source
              </label>
              <Input
                type="text"
                placeholder="e.g. Upwork, Direct, Enterprise"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-zinc-400" /> Client Health Status
            </label>
            <select
              value={form.clientHealth}
              onChange={(e) => setForm({ ...form, clientHealth: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none cursor-pointer"
            >
              <option value="GOOD">GOOD (Healthy)</option>
              <option value="ATTENTION">ATTENTION NEEDED</option>
              <option value="AT_RISK">AT RISK</option>
              <option value="CRITICAL">CRITICAL ALERT</option>
            </select>
          </div>
        </div>

        {/* Meeting & Documentation Docs */}
        <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
            <Video className="w-4 h-4" /> Meetings & Client Developer Conversation Docs
          </h4>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-indigo-400" /> Client Meeting Recording URL
            </label>
            <Input
              type="url"
              placeholder="https://drive.google.com/... or Zoom / Loom recording link"
              value={form.meetingRecordingUrl}
              onChange={(e) => setForm({ ...form, meetingRecordingUrl: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-400" /> Client-Developer Conversation Doc / PDF URL
            </label>
            <Input
              type="url"
              placeholder="https://drive.google.com/... or Notion / PDF documentation link"
              value={form.conversationDocUrl}
              onChange={(e) => setForm({ ...form, conversationDocUrl: e.target.value })}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
