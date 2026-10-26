"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Users,
  Search,
  Plus,
  Send,
  UserPlus,
  Bell,
  Check,
  CheckCheck,
  Smile,
  Info,
  Shield,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { getSocket } from "../../lib/socket";
import { chatActions, ConversationItem, ChatMessageItem } from "../../modules/chat/actions/chat.actions";
import { pushActions } from "../../modules/push/actions/push.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { OrganizationMember } from "../../modules/users/types/user.types";
import { Avatar } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export const ChatView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  // Organization members for search and group creation
  const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showStartDirectModal, setShowStartDirectModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Push notifications state
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPromptDismissed, setPushPromptDismissed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations and org members
  useEffect(() => {
    if (!currentOrg?.id) return;

    const loadData = async () => {
      try {
        setLoadingConversations(true);
        const [convList, members] = await Promise.all([
          chatActions.getConversations(),
          userActions.getOrganizationMembers(currentOrg.id),
        ]);
        setConversations(convList);
        setOrgMembers(members);

        if (convList.length > 0 && !activeConversation) {
          setActiveConversation(convList[0]);
        }
      } catch (err: any) {
        console.error("Failed to load chat data:", err);
      } finally {
        setLoadingConversations(false);
      }
    };

    loadData();
  }, [currentOrg?.id]);

  // Handle active conversation selection and socket room joining
  useEffect(() => {
    if (!activeConversation) return;

    const socket = getSocket();
    socket.emit("join:conversation", activeConversation.id);

    const loadMsgs = async () => {
      try {
        setLoadingMessages(true);
        const msgs = await chatActions.getMessages(activeConversation.id);
        setMessages(msgs);
        await chatActions.markAsRead(activeConversation.id);

        // Update local unread counter
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMsgs();

    return () => {
      socket.emit("leave:conversation", activeConversation.id);
    };
  }, [activeConversation?.id]);

  // Socket listener for real-time messages & typing
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: ChatMessageItem) => {
      if (activeConversation && msg.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, msg]);
        chatActions.markAsRead(activeConversation.id);
      }

      // Update conversations list with latest message and unread count
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === msg.conversationId) {
            const isCurrent = activeConversation?.id === c.id;
            return {
              ...c,
              lastMessageAt: msg.createdAt,
              lastMessage: msg,
              unreadCount: isCurrent ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
      });
    };

    const handleTyping = (data: { conversationId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (!activeConversation || data.conversationId !== activeConversation.id || data.userId === user?.id) {
        return;
      }

      setTypingUsers((prev) => {
        const next = { ...prev };
        if (data.isTyping) {
          next[data.userId] = data.userName;
        } else {
          delete next[data.userId];
        }
        return next;
      });
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:typing", handleTyping);
    };
  }, [activeConversation, user?.id]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;

    const content = messageText.trim();
    setMessageText("");

    // Clear typing state
    const socket = getSocket();
    socket.emit("chat:typing", {
      conversationId: activeConversation.id,
      isTyping: false,
    });

    try {
      const newMsg = await chatActions.sendMessage(activeConversation.id, content);
      setMessages((prev) => [...prev, newMsg]);

      // Update preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessageAt: newMsg.createdAt, lastMessage: newMsg }
            : c
        )
      );
    } catch (err: any) {
      toast.error("Failed to send message: " + (err.message || "Unknown error"));
    }
  };

  // Typing event handler with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!activeConversation) return;

    const socket = getSocket();
    socket.emit("chat:typing", {
      conversationId: activeConversation.id,
      isTyping: true,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("chat:typing", {
        conversationId: activeConversation.id,
        isTyping: false,
      });
    }, 2000);
  };

  // Start direct conversation with member
  const handleStartDirect = async (targetUserId: string) => {
    try {
      setShowStartDirectModal(false);
      const conv = await chatActions.getOrCreateDirectConversation(targetUserId);
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      setActiveConversation(conv);
    } catch (err: any) {
      toast.error("Could not open chat: " + (err.message || "Error"));
    }
  };

  // Create group conversation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) {
      toast.warning("Please provide a group name and add at least one member.");
      return;
    }

    try {
      const conv = await chatActions.createGroupConversation({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        participantUserIds: selectedUserIds,
      });

      setConversations((prev) => [conv, ...prev]);
      setActiveConversation(conv);
      setShowCreateGroupModal(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedUserIds([]);
      toast.success(`Group "${conv.name}" created successfully!`);
    } catch (err: any) {
      toast.error("Failed to create group: " + (err.message || "Error"));
    }
  };

  // WebPush subscription
  const handleEnablePush = async () => {
    const success = await pushActions.registerAndSubscribe();
    if (success) {
      setPushSubscribed(true);
      toast.success("Desktop Web Push Notifications Enabled!");
    } else {
      toast.error("Could not enable push notifications. Check browser permissions.");
    }
  };

  const handleSendTestPush = async () => {
    try {
      await pushActions.sendTestPush("Work Graph Live Alert", "Real-time enterprise notification delivered successfully!");
      toast.success("Push notification dispatched!");
    } catch (err: any) {
      toast.error("Failed to send test push: " + (err.message || "Error"));
    }
  };

  // Helpers
  const getConversationTitle = (c: ConversationItem) => {
    if (c.type === "GROUP") return c.name || "Group Channel";
    const other = c.participants.find((p) => p.userId !== user?.id);
    return other?.user.name || "Direct Message";
  };

  const getConversationSubtitle = (c: ConversationItem) => {
    if (c.type === "GROUP") {
      return `${c.participants.length} members`;
    }
    const other = c.participants.find((p) => p.userId !== user?.id);
    return other?.user.email || "";
  };

  const filteredConversations = conversations.filter((c) => {
    const title = getConversationTitle(c).toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || c.description?.toLowerCase().includes(query);
  });

  const availableMembers = orgMembers.filter((m) => m.userId !== user?.id);
  const filteredAvailableMembers = availableMembers.filter(
    (m) =>
      m.user.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.user.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Top Banner for Web Push */}
      {!pushSubscribed && !pushPromptDismissed && (
        <div className="bg-amber-400 text-black px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-xs shrink-0">
          <div className="flex items-center space-x-2 truncate">
            <Bell className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Enable Web Push notifications to receive live instant messages and task alerts directly on desktop.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleEnablePush}
              className="px-3 py-1 bg-black text-amber-400 hover:bg-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              Enable Now
            </button>
            <button
              onClick={handleSendTestPush}
              className="px-2.5 py-1 bg-amber-500/40 text-black hover:bg-amber-500/60 rounded-lg text-xs font-medium cursor-pointer"
            >
              Test
            </button>
            <button
              onClick={() => setPushPromptDismissed(true)}
              className="p-1 hover:bg-amber-500/40 rounded-md cursor-pointer text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div className="w-80 md:w-96 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
          {/* Header & Quick Action Buttons */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
                  Messages & Channels
                </h2>
                <p className="text-2xs text-zinc-500 font-mono">
                  {currentOrg?.name || "Workspace"} • Live Socket.IO
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowStartDirectModal(true)}
                  title="New Direct Message"
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  title="Create Group Channel"
                  className="p-2 rounded-xl bg-amber-400 text-black hover:bg-amber-500 font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-xs font-bold hidden sm:inline">Group</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-transparent focus:border-amber-400 dark:focus:border-amber-400 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-zinc-400">Loading channels...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center mx-auto">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No conversations yet
                </div>
                <p className="text-2xs text-zinc-400">
                  Start a direct message or create a group channel to begin chatting.
                </p>
                <button
                  onClick={() => setShowStartDirectModal(true)}
                  className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Start a conversation &rarr;
                </button>
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = activeConversation?.id === c.id;
                const title = getConversationTitle(c);
                const subtitle = getConversationSubtitle(c);

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveConversation(c)}
                    className={cn(
                      "w-full p-3.5 flex items-center space-x-3 text-left transition-colors cursor-pointer",
                      isActive
                        ? "bg-amber-400/10 dark:bg-amber-400/15 border-r-4 border-amber-400"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    )}
                  >
                    <div className="relative shrink-0">
                      {c.type === "GROUP" ? (
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-800 text-amber-400 flex items-center justify-center font-bold text-sm shadow-2xs">
                          <Users className="w-5 h-5" />
                        </div>
                      ) : (
                        <Avatar name={title} size="md" />
                      )}
                      {c.type === "DIRECT" && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                          {title}
                        </span>
                        {c.lastMessageAt && (
                          <span className="text-3xs text-zinc-400 shrink-0 ml-1">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-2xs text-zinc-500 dark:text-zinc-400 truncate">
                          {c.lastMessage ? (
                            <>
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {c.lastMessage.sender.name.split(" ")[0]}:
                              </span>{" "}
                              {c.lastMessage.content}
                            </>
                          ) : (
                            subtitle
                          )}
                        </p>

                        {(c.unreadCount || 0) > 0 && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold text-3xs shrink-0 shadow-2xs">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Thread */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            {/* Conversation Header */}
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
              <div className="flex items-center space-x-3">
                {activeConversation.type === "GROUP" ? (
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-bold shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <Avatar name={getConversationTitle(activeConversation)} size="md" />
                )}

                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                    {getConversationTitle(activeConversation)}
                    {activeConversation.type === "GROUP" ? (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Squad Channel
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        Direct
                      </span>
                    )}
                  </h3>
                  <p className="text-2xs text-zinc-500 font-mono">
                    {activeConversation.type === "GROUP"
                      ? `${activeConversation.participants.length} team members participating`
                      : getConversationSubtitle(activeConversation)}
                  </p>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center space-x-2">
                {activeConversation.type === "GROUP" && (
                  <div className="hidden sm:flex -space-x-1.5 overflow-hidden">
                    {activeConversation.participants.slice(0, 5).map((p) => (
                      <div
                        key={p.id}
                        title={p.user.name}
                        className="inline-block ring-2 ring-white dark:ring-zinc-900 rounded-full"
                      >
                        <Avatar name={p.user.name} size="sm" />
                      </div>
                    ))}
                    {activeConversation.participants.length > 5 && (
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-2xs font-bold text-zinc-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
                        +{activeConversation.participants.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Message Thread Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-zinc-50/60 dark:bg-zinc-950/60">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs text-zinc-400">
                  Loading message history...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    No messages in this channel yet
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Be the first to say hello, assign quick updates, or brainstorm with the team!
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  const time = new Date(m.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex items-end space-x-2.5 max-w-[80%]",
                        isMine ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto"
                      )}
                    >
                      {!isMine && <Avatar name={m.sender.name} size="sm" />}

                      <div className="space-y-1">
                        {!isMine && (
                          <div className="text-3xs font-semibold text-zinc-500 pl-1">
                            {m.sender.name}
                          </div>
                        )}

                        <div
                          className={cn(
                            "px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words",
                            isMine
                              ? "bg-amber-400 text-black font-medium rounded-br-xs"
                              : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200/80 dark:border-zinc-700/80 rounded-bl-xs"
                          )}
                        >
                          {m.content}
                        </div>

                        <div
                          className={cn(
                            "text-3xs text-zinc-400 flex items-center gap-1 font-mono",
                            isMine ? "justify-end pr-1" : "pl-1"
                          )}
                        >
                          <span>{time}</span>
                          {isMine && <CheckCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicators */}
              {Object.keys(typingUsers).length > 0 && (
                <div className="flex items-center space-x-2 text-2xs text-zinc-500 italic pl-2 animate-pulse">
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>
                    {Object.values(typingUsers).join(", ")} {Object.keys(typingUsers).length > 1 ? "are" : "is"} typing...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center space-x-3 shrink-0"
            >
              <input
                type="text"
                placeholder="Type your message... (Press Enter to send)"
                value={messageText}
                onChange={handleInputChange}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-amber-400 dark:focus:border-amber-400 text-xs text-zinc-900 dark:text-white focus:outline-none transition-all"
              />

              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-black font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950">
            <div className="w-16 h-16 rounded-3xl bg-amber-400 text-black flex items-center justify-center shadow-lg mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              No conversation selected
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1 mb-4">
              Choose a channel from the left panel or start a new direct conversation with any team member.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowStartDirectModal(true)}
                className="px-4 py-2 bg-zinc-950 text-white dark:bg-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Start Direct Message
              </button>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="px-4 py-2 bg-amber-400 text-black rounded-xl text-xs font-bold hover:bg-amber-500 transition-colors cursor-pointer shadow-xs"
              >
                Create Group Channel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Start Direct Message Modal */}
      {showStartDirectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-500" />
                Start Direct Message
              </h3>
              <button
                onClick={() => setShowStartDirectModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search member by name or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredAvailableMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400">
                  No matching members found in this workspace.
                </div>
              ) : (
                filteredAvailableMembers.map((m) => (
                  <button
                    key={m.userId}
                    onClick={() => handleStartDirect(m.userId)}
                    className="w-full p-2.5 flex items-center space-x-3 hover:bg-amber-400/10 dark:hover:bg-amber-400/20 rounded-xl transition-colors text-left cursor-pointer"
                  >
                    <Avatar name={m.user.name} size="md" />
                    <div className="flex-1 truncate">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {m.user.name}
                      </div>
                      <div className="text-3xs text-zinc-400 truncate">{m.user.email}</div>
                    </div>
                    <span className="text-3xs font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {m.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Group Channel Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateGroup}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Create Group Channel
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Channel Name <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Core Backend Squad or SRE War Room"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Purpose, agenda, or squad deliverables..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Add Members by Name Search */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Add Members by Name Search ({selectedUserIds.length} selected)
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search member name..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Member selection chips / list */}
                <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 space-y-1 bg-zinc-50 dark:bg-zinc-950/40">
                  {filteredAvailableMembers.length === 0 ? (
                    <div className="p-2 text-center text-3xs text-zinc-400">
                      No members matching "{memberSearchQuery}"
                    </div>
                  ) : (
                    filteredAvailableMembers.map((m) => {
                      const isSelected = selectedUserIds.includes(m.userId);
                      return (
                        <div
                          key={m.userId}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== m.userId));
                            } else {
                              setSelectedUserIds([...selectedUserIds, m.userId]);
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs select-none",
                            isSelected
                              ? "bg-amber-400 text-black font-bold shadow-2xs"
                              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                          )}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Avatar name={m.user.name} size="sm" />
                            <div className="truncate">
                              <span className="truncate">{m.user.name}</span>
                              <span className="text-3xs opacity-80 block font-mono">
                                {m.user.email}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 ml-2">
                            {isSelected ? (
                              <Check className="w-4 h-4 text-black" />
                            ) : (
                              <span className="text-2xs font-semibold opacity-60">+ Add</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!groupName.trim() || selectedUserIds.length === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 disabled:opacity-50 text-black cursor-pointer shadow-xs"
              >
                Create Channel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
