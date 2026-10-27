"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  issueSheetActions,
  ProfileQueryItem,
} from "../../modules/issues/actions/issueSheet.actions";
import {
  stationActions,
  ProfileItem,
} from "../../modules/stations/actions/station.actions";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import {
  HelpCircle,
  Plus,
  FileText,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  MessageSquare,
  Sparkles,
  Send,
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

export const IssueSheetView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const [queries, setQueries] = useState<ProfileQueryItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Raise Query Modal
  const [showModal, setShowModal] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [saving, setSaving] = useState(false);

  // Response / Status Update Modal
  const [selectedQueryForAction, setSelectedQueryForAction] = useState<ProfileQueryItem | null>(null);
  const [responseStatus, setResponseStatus] = useState<"OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED">("RESOLVED");
  const [responseNotes, setResponseNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qList, pList, sList] = await Promise.all([
        issueSheetActions.getQueries({
          serviceId: serviceFilter || undefined,
          status: statusFilter || undefined,
        }),
        stationActions.getProfiles(),
        serviceActions.getServices(),
      ]);
      setQueries(qList);
      setProfiles(pList);
      setServices(sList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load queries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [serviceFilter, statusFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId || !title.trim() || !description.trim()) {
      toast.error("Profile, title, and query description are required");
      return;
    }

    try {
      setSaving(true);
      await issueSheetActions.createQuery({
        profileId,
        title: title.trim(),
        description: description.trim(),
        documentUrl: documentUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        priority,
      });
      toast.success("Query submitted! Service line team alerted.");
      setShowModal(false);
      setTitle("");
      setDescription("");
      setDocumentUrl("");
      setLinkUrl("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit query");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueryForAction) return;

    try {
      setUpdating(true);
      await issueSheetActions.updateStatus(selectedQueryForAction.id, {
        status: responseStatus,
        responseNotes: responseNotes.trim() || undefined,
      });
      toast.success("Query status and response notes updated!");
      setSelectedQueryForAction(null);
      setResponseNotes("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update query status");
    } finally {
      setUpdating(false);
    }
  };

  const filteredQueries = queries.filter(
    (q) =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.author?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Issue & Query Sheet
            </h1>
            <p className="text-xs text-zinc-500">
              Technical client queries raised by Sales members for Service Line specialists to answer and resolve
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
          <span>Raise New Query</span>
        </button>
      </div>

      {/* Controls: Search, Service Filter, Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries, briefs, authors..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Service Lines</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Query Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading issues and queries...
        </div>
      ) : filteredQueries.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Queries Found
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Sales members raise technical client questions here for service specialists.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((item) => {
            const isResolved = item.status === "RESOLVED";
            const isInReview = item.status === "IN_REVIEW";
            const isOpen = item.status === "OPEN";

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-colors space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800">
                      {item.profile?.name} (@{item.profile?.username})
                    </span>

                    {item.service && (
                      <span className="px-2 py-0.5 rounded-md text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                        {item.service.name}
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
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold uppercase tracking-wider border ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : isInReview
                          ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                          : isOpen
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {item.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedQueryForAction(item);
                        setResponseStatus(item.status);
                        setResponseNotes(item.responseNotes || "");
                      }}
                      className="px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-3xs font-bold transition-colors cursor-pointer"
                    >
                      Update / Resolve
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-50 dark:bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 font-sans">
                    {item.description}
                  </p>
                </div>

                {/* Attachments */}
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
                        <span>Client Document</span>
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
                        <span>Reference Link</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Resolution Notes Box */}
                {item.responseNotes && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                    <div className="text-3xs font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Service Specialist Resolution</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.responseNotes}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Avatar name={item.author?.name} size="sm" />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Raised by {item.author?.name}
                    </span>
                    <span className="font-mono text-3xs">
                      (Sales Station Member)
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

      {/* RAISE QUERY MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Raise Technical Query</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Ask service line team for client clarification, scope, or technical estimate
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Operating Profile *
              </label>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (@{p.username}) - {p.service?.name || "Service Line"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Query Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Can we deliver Next.js + PostgreSQL within 2 weeks?"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Detailed Client Scope & Query *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Include client messages, requirements, technologies requested, and budget/timeline constraints..."
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
                Client Chat / Job Link (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://upwork.com/jobs/..."
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
                <span>{saving ? "Submitting..." : "Submit Query"}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* UPDATE STATUS & ANSWER MODAL */}
      <Dialog
        open={!!selectedQueryForAction}
        onOpenChange={(open) => !open && setSelectedQueryForAction(null)}
      >
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-bold">Answer & Update Status</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Provide resolution notes for &quot;{selectedQueryForAction?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStatusSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Query Status *
              </label>
              <select
                value={responseStatus}
                onChange={(e) => setResponseStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="OPEN">Open (Needs Attention)</option>
                <option value="IN_REVIEW">In Review (Evaluating Tech Scope)</option>
                <option value="RESOLVED">Resolved (Answer Provided)</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Service Line Response & Notes
              </label>
              <textarea
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                rows={4}
                placeholder="State the technical feasibility, pricing recommendation, timeline, or answers to the client questions..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQueryForAction(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {updating ? "Saving..." : "Save Response"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
