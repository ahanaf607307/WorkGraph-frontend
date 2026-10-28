import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { ActivityLogView } from "../../view/activity/ActivityLogView";

export default function ActivityPage() {
  return (
    <AppLayout>
      <ActivityLogView />
    </AppLayout>
  );
}
