import { AppLayout } from "../../components/shared/AppLayout";
import { NotificationListView } from "../../view/notifications/NotificationListView";

export default function NotificationsPage() {
  return (
    <AppLayout>
      <NotificationListView />
    </AppLayout>
  );
}
