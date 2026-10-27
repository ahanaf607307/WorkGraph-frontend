"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  complainActions,
  ComplainItem,
} from "../../modules/complains/actions/complain.actions";
import {
  AlertCircle,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  FileText,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  Eye,
  EyeOff,
  UserX,
  MessageSquare,
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

export const ComplainView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  // PIN state
  const [pinChecked, setPinChecked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Complaints state
  const [complaints, setComplaints] = useState<ComplainItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Create Complaint Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admin Resolution Modal
  const [selectedComplaint, setSelectedComplaint] = useState<ComplainItem | null>(null);
  const [newStatus, setNewStatus] = useState<"SUBMITTED" | "UNDER_INVESTIGATION" | "RESOLVED" | "DISMISSED">("RESOLVED");
  const [adminComment, setAdminComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Check PIN status on load
  useEffect(() => {
    const checkPin = async () => {
      try {
        const res = await complainActions.checkPinStatus();
        setHasPin(res.hasPin);
      } catch (err: any) {
        console.error("Failed to check PIN status", err);
      } finally {
        setPinChecked(true);
      }
    };
    checkPin();
  }, []);

  const loadComplaints = async (pin: string) => {
    try {
      setLoading(true);
      const data = await complainActions.getComplaints(pin);
      setComplaints(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load complaints");
      setUnlockedPin(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!pinInput.trim() || pinInput.trim().length < 4) {
      setPinError("PIN must be at least 4 digits");
      return;
    }

    if (!hasPin && pinInput !== pinConfirm) {
      setPinError("PIN confirmation does not match");
      return;
    }

    try {
      setVerifyingPin(true);
      await complainActions.verifyOrSetPin(pinInput.trim());
      setUnlockedPin(pinInput.trim());
      setHasPin(true);
      toast.success("Security PIN verified! Vault unlocked.");
      loadComplaints(pinInput.trim());
    } catch (err: any) {
      setPinError(err.message || "Invalid Security PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin) return;

    if (!title.trim() || !description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setSubmitting(true);
      await complainActions.createComplaint(unlockedPin, {
        title: title.trim(),
        description: description.trim(),
        documentUrl: documentUrl.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        isAnonymous,
      });
      toast.success("Complaint submitted securely to System Administration!");
      setShowCreateModal(false);
      setTitle("");
      setDescription("");
      setDocumentUrl("");
      setLinkUrl("");
      setIsAnonymous(false);
      loadComplaints(unlockedPin);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdminUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockedPin || !selectedComplaint) return;

    try {
      setUpdatingStatus(true);
      await complainActions.updateComplaintStatus(unlockedPin, selectedComplaint.id, {
        status: newStatus,
        adminComment: adminComment.trim() || undefined,
      });
      toast.success("Complaint status and administrative comment saved!");
      setSelectedComplaint(null);
      setAdminComment("");
      loadComplaints(unlockedPin);
    } catch (err: any) {
      toast.error(err.message || "Failed to update complaint");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLockVault = () => {
    setUnlockedPin(null);
    setPinInput("");
    setPinConfirm("");
    setComplaints([]);
    toast.info("Complaints vault locked.");
  };

  // Locked State Screen
  if (!unlockedPin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 select-text">
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-3xs font-mono font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              PIN-Protected Vault
            </span>
            <h2 className="text-xl font-black text-zinc-950 dark:text-white">
              {hasPin ? "Enter Security PIN" : "Create Security PIN"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {hasPin
                ? "Access to complaints, status reports, and investigation comments is strictly confidential. Enter your 4-digit PIN."
                : "Configure your confidential 4-digit Security PIN to access and track complaints."}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {hasPin ? "4-Digit PIN *" : "Create 4-Digit PIN *"}
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-violet-500"
              />
            </div>

            {!hasPin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Confirm 4-Digit PIN *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-center tracking-widest text-lg font-mono focus:outline-none focus:border-violet-500"
                />
              </div>
            )}

            {pinError && (
              <p className="text-xs text-red-500 font-semibold text-center">{pinError}</p>
            )}

            <button
              type="submit"
              disabled={verifyingPin}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>{verifyingPin ? "Verifying..." : hasPin ? "Unlock Vault" : "Set PIN & Unlock"}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Unlocked State Screen
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Confidential Complaints Vault
            </h1>
            <p className="text-xs text-zinc-500">
              {isSystemAdmin
                ? "Administrative review vault for workplace grievances, harassment, and ethical reports"
                : "Secure, PIN-protected grievance portal. Only you and System Admin can view your reports."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleLockVault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Decryption & loading complaints...
        </div>
      ) : complaints.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Active Complaints
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            All submitted grievances are encrypted and visible only through verified PIN authentication.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => {
            const isResolved = item.status === "RESOLVED";
            const isInvestigation = item.status === "UNDER_INVESTIGATION";
            const isSubmitted = item.status === "SUBMITTED";

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-colors space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
                        isResolved
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : isInvestigation
                          ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                          : isSubmitted
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>

                    {item.isAnonymous && (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 flex items-center gap-1">
                        <UserX className="w-3 h-3" />
                        Anonymous Submission
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-3xs text-zinc-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {isSystemAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComplaint(item);
                          setNewStatus(item.status);
                          setAdminComment(item.adminComment || "");
                        }}
                        className="px-2.5 py-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-3xs font-bold transition-colors cursor-pointer"
                      >
                        Review / Comment
                      </button>
                    )}
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
                        <span>Supporting Evidence / Document</span>
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
                        <span>External Reference</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Admin Comment Section */}
                {item.adminComment && (
                  <div className="p-4 rounded-2xl bg-violet-500/5 dark:bg-violet-950/30 border border-violet-500/20 space-y-1.5">
                    <div className="text-3xs font-mono font-bold uppercase text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>System Administrator Investigation & Comment</span>
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.adminComment}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    {item.isAnonymous ? (
                      <span className="font-semibold text-zinc-500 italic">
                        Submitted Anonymously
                      </span>
                    ) : (
                      <>
                        <Avatar name={item.author?.name} size="sm" />
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {item.author?.name}
                        </span>
                        <span className="font-mono text-3xs">({item.author?.email})</span>
                      </>
                    )}
                  </div>

                  <span className="font-mono text-3xs">
                    Last updated {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBMIT COMPLAINT MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Submit Confidential Grievance</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Direct encrypted report to the System Administrator
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Grievance Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Workspace harassment or process bottleneck issue"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Detailed Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detail what occurred, dates, parties involved, and specific context..."
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Supporting Evidence / Document URL (Optional)
              </label>
              <input
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Reference Link (Optional)
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded accent-violet-600"
              />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                Submit Anonymously (Hide my name and identity)
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Submitting..." : "Submit Grievance"}</span>
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ADMIN STATUS & COMMENT MODAL */}
      <Dialog
        open={!!selectedComplaint}
        onOpenChange={(open) => !open && setSelectedComplaint(null)}
      >
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-base font-bold">Review & Comment on Complaint</DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Provide resolution status and administrative comment for &quot;{selectedComplaint?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminUpdateSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Investigation Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                <option value="SUBMITTED">Submitted (Pending Review)</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Administrator Comment & Action Taken
              </label>
              <textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                rows={4}
                placeholder="Describe actions taken, policy review, resolution summary, or guidance..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updatingStatus}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {updatingStatus ? "Saving..." : "Save Resolution"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
