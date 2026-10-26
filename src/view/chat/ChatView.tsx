"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import {
  chatActions,
  ConversationItem,
  ChatMessageItem,
} from "../../modules/chat/actions/chat.actions";
import { userActions } from "../../modules/users/actions/user.actions";
import { pushActions } from "../../modules/push/actions/push.actions";
import { getSocket } from "../../lib/socket";
import { toast } from "sonner";
import { MessageSquare, Sparkles } from "lucide-react";
import { PushNotificationBanner } from "./components/PushNotificationBanner";
import { ConversationList } from "./components/ConversationList";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "./components/MessageBubble";
import { MessageInput } from "./components/MessageInput";
import { DirectMessageModal } from "./components/DirectMessageModal";
import { CreateGroupModal } from "./components/CreateGroupModal";

export const ChatView: React.FC = () => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushPromptDismissed, setPushPromptDismissed] = useState(false);

  const [showStartDirectModal, setShowStartDirectModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["chat-conversations", orgId],
    queryFn: () => chatActions.getConversations(),
    enabled: !!orgId,
  });

  // Load workspace members
  const { data: orgMembers = [] } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => userActions.getOrganizationMembers(orgId!),
    enabled: !!orgId,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversation) {
      setActiveConversation(conversations[0]);
    }
  }, [conversations, activeConversation]);

  // Load messages for active conversation
  const { data: initialMessages, isLoading: loadingMessages } = useQuery({
    queryKey: ["chat-messages", activeConversation?.id],
    queryFn: () => chatActions.getMessages(activeConversation!.id, 50),
    enabled: !!activeConversation?.id,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [initialMessages]);

  // Check push subscription
  useEffect(() => {
    pushActions.isSubscribed().then(setPushSubscribed);
  }, []);

  // Socket.IO lifecycle
  useEffect(() => {
    const socket = getSocket();

    if (activeConversation) {
      socket.emit("join:conversation", activeConversation.id);
      chatActions.markAsRead(activeConversation.id).catch(() => {});
    }

    const handleNewMessage = (msg: ChatMessageItem) => {
      if (activeConversation && msg.conversationId === activeConversation.id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        chatActions.markAsRead(activeConversation.id).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", orgId] });
    };

    const handleNewConversation = (convo: ConversationItem) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", orgId] });
      toast.info("New conversation added to workspace");
    };

    const handleTyping = ({
      conversationId,
      userId,
      userName,
    }: {
      conversationId: string;
      userId: string;
      userName: string;
    }) => {
      if (activeConversation && conversationId === activeConversation.id && userId !== user?.id) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const copy = { ...prev };
            delete copy[userId];
            return copy;
          });
        }, 3000);
      }
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:new_conversation", handleNewConversation);
    socket.on("chat:typing", handleTyping);

    return () => {
      if (activeConversation) {
        socket.emit("leave:conversation", activeConversation.id);
      }
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:new_conversation", handleNewConversation);
      socket.off("chat:typing", handleTyping);
    };
  }, [activeConversation, orgId, queryClient, user?.id]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      chatActions.sendMessage(conversationId, content),
    onSuccess: (saved) => {
      setMessages((prev) => [...prev, saved]);
      setMessageText("");
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", orgId] });
    },
    onError: (err: any) => {
      toast.error("Failed to send message: " + (err.message || "Error"));
    },
  });

  const startDirectMutation = useMutation({
    mutationFn: (targetUserId: string) => chatActions.getOrCreateDirectConversation(targetUserId),
    onSuccess: (convo) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", orgId] });
      setActiveConversation(convo);
      setShowStartDirectModal(false);
      toast.success("Conversation opened");
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not start direct conversation.");
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; participantUserIds: string[] }) =>
      chatActions.createGroupConversation(data),
    onSuccess: (convo) => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations", orgId] });
      setActiveConversation(convo);
      setShowCreateGroupModal(false);
      toast.success(`Group channel "${convo.name}" created!`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create group channel.");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation) return;
    sendMessageMutation.mutate({
      conversationId: activeConversation.id,
      content: messageText.trim(),
    });
  };

  const handleInputChange = (text: string) => {
    setMessageText(text);
    if (!activeConversation || !user) return;

    if (!typingTimeoutRef.current) {
      getSocket().emit("chat:typing", {
        conversationId: activeConversation.id,
        userId: user.id,
        userName: user.name,
      });
      typingTimeoutRef.current = setTimeout(() => {
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleEnablePush = async () => {
    const success = await pushActions.subscribeToPush();
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

  const availableMembers = orgMembers.filter((m: any) => m.userId !== user?.id);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden select-none">
      {/* Web Push Banner */}
      {!pushSubscribed && !pushPromptDismissed && (
        <PushNotificationBanner
          onEnable={handleEnablePush}
          onTest={handleSendTestPush}
          onDismiss={() => setPushPromptDismissed(true)}
        />
      )}

      {/* Main Chat Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversations Sidebar */}
        <ConversationList
          conversations={conversations}
          activeConversation={activeConversation}
          currentUserId={user?.id}
          workspaceName={currentOrg?.name}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={setActiveConversation}
          onOpenDirectModal={() => setShowStartDirectModal(true)}
          onOpenGroupModal={() => setShowCreateGroupModal(true)}
          isLoading={loadingConversations}
        />

        {/* Right: Active Conversation or Placeholder */}
        {activeConversation ? (
          <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            <ChatHeader conversation={activeConversation} currentUserId={user?.id} />

            {/* Message Thread */}
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
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMine={m.senderId === user?.id}
                  />
                ))
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

            {/* Input Composer */}
            <MessageInput
              messageText={messageText}
              onTextChange={handleInputChange}
              onSend={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-zinc-950 text-center p-8 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-400/20 text-amber-500 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              No Conversation Selected
            </h3>
            <p className="text-xs text-zinc-400 max-w-md">
              Choose an existing team channel or direct message from the sidebar, or start a new conversation.
            </p>
          </div>
        )}
      </div>

      {/* Reusable Modals */}
      <DirectMessageModal
        isOpen={showStartDirectModal}
        onClose={() => setShowStartDirectModal(false)}
        members={availableMembers}
        onStartDirect={(targetId) => startDirectMutation.mutate(targetId)}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        members={availableMembers}
        onCreateGroup={(data) => createGroupMutation.mutate(data)}
        isPending={createGroupMutation.isPending}
      />
    </div>
  );
};
