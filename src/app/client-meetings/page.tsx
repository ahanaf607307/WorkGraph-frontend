import { AppLayout } from "../../components/shared/AppLayout";
import { ClientMeetingView } from "../../view/client-meetings/ClientMeetingView";

export const metadata = {
  title: "Client Meetings | Work Graph",
  description: "Schedule, join, and collaborate on client calls and syncs.",
};

export default function ClientMeetingsPage() {
  return (
    <AppLayout>
      <ClientMeetingView />
    </AppLayout>
  );
}
