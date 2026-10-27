"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import {
  ConversationItem,
  chatActions,
} from "../../../modules/chat/actions/chat.actions";
import { uploadActions } from "../../../modules/upload/actions/upload.actions";
import { Avatar } from "../../../components/ui/avatar";
import {
  User,
  ShieldAlert,
  ShieldCheck,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Mail,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

interface DirectUserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationItem;
  currentUserId?: string;
  onBlockToggled: () => void;
}

export const DirectUserDetailsModal: React.FC<DirectUserDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  onBlockToggled,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "media">("profile");
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  // Find opponent participant
  const opponent = conversation.participants.find((p) => p.userId !== currentUserId);
  const opponentUser = opponent?.user;
  const opponentName = opponentUser?.name || "Direct Contact";
  const opponentEmail = opponentUser?.email || "";
  const opponentAvatar = opponentUser?.avatarUrl || null;

  const isBlocked = conversation.isBlocked || false;
  const blockedByMe = conversation.blockedById === currentUserId;

  useEffect(() => {
    if (isOpen && activeTab === "media") {
      setIsLoadingMedia(true);
      chatActions
        .getConversationMedia(conversation.id)
        .then((items) => setMediaList(items || []))
        .catch(() => toast.error("Failed to load conversation media"))
        .finally(() => setIsLoadingMedia(false));
    }
  }, [isOpen, activeTab, conversation.id]);

  const handleToggleBlock = async () => {
    try {
      setIsBlocking(true);
      if (isBlocked) {
        if (!blockedByMe) {
          toast.error("Only the user who initiated the block can unblock this conversation.");
          return;
        }
        await chatActions.unblockConversation(conversation.id);
        toast.success(`Unblocked ${opponentName}. You can now exchange messages.`);
      } else {
        if (!confirm(`Are you sure you want to block ${opponentName}? You will not be able to message each other.`)) {
          return;
        }
        await chatActions.blockConversation(conversation.id);
        toast.warning(`Blocked ${opponentName}. Messaging disabled.`);
      }
      onBlockToggled();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update block state");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold overflow-hidden shadow-xs">
              {opponentAvatar ? (
                <img
                  src={uploadActions.getFileUrl(opponentAvatar)}
                  alt={opponentName}
                  className="w-14 h-14 rounded-2xl object-cover"
                />
              ) : (
                <Avatar name={opponentName} size="lg" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>{opponentName}</span>
                {isBlocked && (
                  <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    Blocked
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                <span>{opponentEmail || "Workspace Member"}</span>
              </DialogDescription>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "profile"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Profile & Security
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("media")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "media"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Shared Media & Files
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[55vh] overflow-y-auto">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Workspace Role</span>
                  <span className="font-mono font-bold uppercase text-orange-600 dark:text-orange-400">
                    {opponent?.role || "MEMBER"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Contact Email</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {opponentEmail || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Messaging Status</span>
                  <span className="font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Available on Work Graph
                  </span>
                </div>
              </div>

              {/* Block System Section */}
              <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Block Conversation Management</span>
                </div>
                <p className="text-2xs text-rose-600/90 dark:text-rose-300">
                  {isBlocked
                    ? blockedByMe
                      ? "You have currently blocked this user. Unblock to resume messaging and file sharing."
                      : "You have been blocked by this user. Messaging is suspended."
                    : "Blocking will immediately disable messaging in this conversation. The user will see that they have been blocked."}
                </p>

                {(!isBlocked || blockedByMe) && (
                  <button
                    type="button"
                    onClick={handleToggleBlock}
                    disabled={isBlocking}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                      isBlocked
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    {isBlocked ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{isBlocking ? "Unblocking..." : "Unblock User"}</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>{isBlocking ? "Blocking..." : "Block User"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Shared Media in this Conversation</span>
                <span className="text-2xs text-zinc-400 font-mono">{mediaList.length} total</span>
              </div>

              {isLoadingMedia ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading media...</div>
              ) : mediaList.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No files exchanged yet
                  </div>
                  <p className="text-2xs text-zinc-400">
                    Images and attachments shared between you and {opponentName} will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {mediaList.map((item, idx) => {
                    const isImg =
                      (item.type && item.type.startsWith("image/")) ||
                      /\.(png|jpe?g|webp|gif|svg)$/i.test(item.name || item.url || "");
                    const fileUrl = uploadActions.getFileUrl(item.url);

                    return (
                      <div
                        key={item.id || idx}
                        className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 flex flex-col justify-between hover:shadow-md transition-all"
                      >
                        {isImg ? (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-black/10 dark:bg-black/40 mb-2 flex items-center justify-center">
                            <img
                              src={fileUrl}
                              alt={item.name || "Media"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500 mb-2 flex flex-col items-center justify-center">
                            <FileText className="w-8 h-8" />
                            <span className="text-3xs uppercase font-mono font-bold mt-1">Doc</span>
                          </div>
                        )}

                        <div className="truncate">
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate" title={item.name}>
                            {item.name || "Attachment"}
                          </div>
                          <div className="text-3xs text-zinc-400">
                            By {item.sender?.name || "User"}
                          </div>
                        </div>

                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1 w-full py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 text-2xs font-semibold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View File</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
