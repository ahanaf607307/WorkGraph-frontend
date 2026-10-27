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
  Users,
  Image as ImageIcon,
  FileText,
  UserPlus,
  Trash2,
  Upload,
  Check,
  Search,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ConversationItem;
  currentUserId?: string;
  allOrgMembers: any[];
  onConversationUpdated: (updated: ConversationItem) => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  allOrgMembers,
  onConversationUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"info" | "members" | "media">("info");
  const [name, setName] = useState(conversation.name || "");
  const [description, setDescription] = useState(conversation.description || "");
  const [avatarUrl, setAvatarUrl] = useState(conversation.avatarUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Add member state
  const [searchMember, setSearchMember] = useState("");
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Media & Docs state
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  useEffect(() => {
    setName(conversation.name || "");
    setDescription(conversation.description || "");
    setAvatarUrl(conversation.avatarUrl || "");
  }, [conversation]);

  useEffect(() => {
    if (isOpen && activeTab === "media") {
      setIsLoadingMedia(true);
      chatActions
        .getConversationMedia(conversation.id)
        .then((items) => setMediaList(items || []))
        .catch(() => toast.error("Failed to load group media"))
        .finally(() => setIsLoadingMedia(false));
    }
  }, [isOpen, activeTab, conversation.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await uploadActions.uploadFile(file);
      setAvatarUrl(res.url);
      toast.success("Group picture uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setIsSaving(true);
      const updated = await chatActions.updateConversation(conversation.id, {
        name: name.trim(),
        description: description.trim(),
        avatarUrl,
      });
      onConversationUpdated(updated);
      toast.success("Group settings updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserToAdd) return;
    try {
      setIsAddingMember(true);
      await chatActions.addParticipants(conversation.id, [selectedUserToAdd]);
      toast.success("Member added to group!");
      setSelectedUserToAdd("");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this group?`)) return;
    try {
      await chatActions.removeParticipant(conversation.id, userId);
      toast.success(`${memberName} removed`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member");
    }
  };

  const currentParticipantIds = new Set(
    (conversation.participants || []).map((p) => p.userId)
  );

  const eligibleMembersToAdd = allOrgMembers.filter(
    (m) =>
      !currentParticipantIds.has(m.userId) &&
      (m.user?.name || "").toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
              {avatarUrl ? (
                <img
                  src={uploadActions.getFileUrl(avatarUrl)}
                  alt={name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              ) : (
                <Users className="w-6 h-6" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{conversation.name || "Group Settings"}</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Manage group identity, member permissions, and shared media files
              </DialogDescription>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "info"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Group Info & Photo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeTab === "members"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              Members ({conversation.participants?.length || 0})
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
              Shared Media & Docs
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: GROUP INFO & AVATAR */}
          {activeTab === "info" && (
            <form onSubmit={handleSaveInfo} className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-800/40">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {avatarUrl ? (
                    <img
                      src={uploadActions.getFileUrl(avatarUrl)}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-8 h-8 text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Group Profile Picture
                  </div>
                  <p className="text-2xs text-zinc-500 mb-2">
                    Upload a custom channel icon using Multer file storage
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingAvatar ? "Uploading..." : "Upload Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Group Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineering & Ops Squad"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Channel Topic / Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this squad channel for?"
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBER MANAGEMENT */}
          {activeTab === "members" && (
            <div className="space-y-5">
              {/* Add New Member Section */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-orange-500" />
                  Add Team Member to Group
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedUserToAdd}
                    onChange={(e) => setSelectedUserToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="">Select a member to add...</option>
                    {eligibleMembersToAdd.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name} ({m.user?.email}) - {m.role}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!selectedUserToAdd || isAddingMember}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Current Members List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Current Members ({conversation.participants?.length || 0})
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {(conversation.participants || []).map((p) => {
                    const memberName = p.user?.name || (p as any).name || "Member";
                    const memberEmail = p.user?.email || (p as any).email || "";
                    const isCurrentUser = p.userId === currentUserId;

                    return (
                      <div
                        key={p.id || p.userId}
                        className="p-3 bg-white dark:bg-zinc-950 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={memberName} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>{memberName}</span>
                              {isCurrentUser && (
                                <span className="text-3xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-mono">
                                  You
                                </span>
                              )}
                              {p.isAdmin && (
                                <span className="text-3xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-2xs text-zinc-500">{memberEmail}</div>
                          </div>
                        </div>

                        {!isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(p.userId, memberName)}
                            title="Remove Member"
                            className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHARED MEDIA & DOCUMENTS */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Shared Files & Documents</span>
                <span className="text-2xs text-zinc-400 font-mono">{mediaList.length} total items</span>
              </div>

              {isLoadingMedia ? (
                <div className="p-8 text-center text-xs text-zinc-400">Loading shared media...</div>
              ) : mediaList.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center mx-auto">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No files shared yet
                  </div>
                  <p className="text-2xs text-zinc-400">
                    Images and documents sent in this group channel will be cataloged here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                          <div className="text-3xs text-zinc-400 truncate">
                            By {item.sender?.name || "Member"}
                          </div>
                        </div>

                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1 w-full py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-orange-600 text-2xs font-semibold border border-zinc-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open File</span>
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
