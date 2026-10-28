import { AppLayout } from "../../components/shared/AppLayout";
import { MeetingView } from "../../view/meeting/MeetingView";

export const metadata = {
  title: "Meeting Hub | Work Graph",
  description: "Schedule, join, and collaborate in organization video meetings & operational syncs.",
};

export default function MeetingPage() {
  return (
    <AppLayout>
      <MeetingView />
    </AppLayout>
  );
}
