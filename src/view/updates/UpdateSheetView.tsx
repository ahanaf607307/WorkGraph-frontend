"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  updateSheetActions,
  ProfileUpdateItem,
} from "../../modules/updates/actions/updateSheet.actions";
import {
  stationActions,
  ProfileItem,
} from "../../modules/stations/actions/station.actions";
import {
  Table,
  Plus,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  User,
  Send,
  Sparkles,
} from "lucide-react";
import { Avatar } from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from "sonner";

export const UpdateSheetView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const [updates, setUpdates] = useState<ProfileUpdateItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Post Update Modal
  const [showModal, setShowModal] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uList, pList] = await Promise.all([
        updateSheetActions.getUpdates(selectedProfileFilter || undefined),
        stationActions.getProfiles(),
      ]);
      setUpdates(uList);
      setProfiles(pList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load update sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProfileFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !title.trim() || !message.trim()) {
      toast.error("Profile, title, and update message are required");
      return;
    }

    try {
      setSaving(true);
      await updateSheetActions.createUpdate({
        profileId,
        title: title.trim(),
        message: message.trim(),
        documentUrl: documentUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        priority,
      });
      toast.success("Profile update dispatched! Active sales member notified.");
      setShowModal(false);
      setTitle("");
      setMessage("");
      setDocumentUrl("");
      setLinkUrl("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to post update");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    updateId: string,
    status: "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED"
  ) => {
    try {
      await updateSheetActions.updateStatus(updateId, status);
      toast.success(`Update status set to ${status}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to change status");
    }
  };

  const filteredUpdates = updates.filter(
    (u) =>
      u.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.author?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <Table className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Profile Update Sheet
            </h1>
            <p className="text-xs text-zinc-500">
              Broadcast task directives, client briefs, and document updates to active sales members on profile stations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setProfileId(profiles[0]?.id || "");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Profile Update</span>
        </button>
      </div>

      {/* Controls: Search & Profile Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search updates, messages, authors..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={selectedProfileFilter}
            onChange={(e) => setSelectedProfileFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Profiles</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (@{p.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Updates Stream / Feed */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading profile updates...
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Profile Updates Yet
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Post an update message with documents to immediately notify stationed sales members.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUpdates.map((item) => {
            const isResolved = item.status === "RESOLVED";
            const isInProgress = item.status === "IN_PROGRESS";
            const isAcknowledged = item.status === "ACKNOWLEDGED";

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-colors space-y-4"
              >
                {/* Top Bar: Profile & Priority */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                      {item.profile?.name || "Profile"} (@{item.profile?.username})
                    </span>

                    {item.station && (
                      <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        Station {item.station.stationNumber}
                      </span>
                    )}

                    {item.priority === "URGENT" && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                        Urgent
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-3xs text-zinc-400 font-mono">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>

                    {/* Status Dropdown */}
                    <select
                      value={item.status}
                      onChange={(e) =>
                        handleStatusChange(item.id, e.target.value as any)
                      }
                      className={`px-2.5 py-1 rounded-xl text-3xs font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : isInProgress
                          ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                          : isAcknowledged
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                    {item.message}
                  </p>
                </div>

                {/* Document & Link attachments */}
                {(item.documentUrl || item.linkUrl) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {item.documentUrl && (
                      <a
                        href={item.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Attached Document</span>
                      </a>
                    )}
                    {item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>External Link</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Author Footer */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Avatar name={item.author?.name} size="sm" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Dispatched by {item.author?.name}
                    </span>
                    <span className="font-mono text-3xs">
                      ({item.author?.role || "Team"})
                    </span>
                  </div>

                  <span className="font-mono text-3xs">
                    Updated {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE UPDATE MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Post Profile Update</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Alert active sales member on station with real-time instructions
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Target Profile *
              </label>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (@{p.username}) - {p.platform || "Portal"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Update Subject / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Client Inquiry: AI Automation Workflow"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Update Message & Instructions *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Write specific brief details, requirements, or instructions for the sales representative..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Document URL (Optional)
                </label>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                External Resource / Link URL (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://upwork.com/messages/..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
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
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{saving ? "Posting..." : "Dispatch Update"}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
