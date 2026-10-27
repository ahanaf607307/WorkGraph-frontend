import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { ComplainView } from "../../view/complains/ComplainView";

export default function ComplainsPage() {
  return (
    <AppLayout>
      <ComplainView />
    </AppLayout>
  );
}
