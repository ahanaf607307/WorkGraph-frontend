import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { ChatView } from "../../view/chat/ChatView";

export default function ChatPage() {
  return (
    <AppLayout noPadding hideSidebar>
      <ChatView />
    </AppLayout>
  );
}

