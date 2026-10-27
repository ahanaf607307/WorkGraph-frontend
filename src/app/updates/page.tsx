import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { UpdateSheetView } from "../../view/updates/UpdateSheetView";

export default function UpdatesPage() {
  return (
    <AppLayout>
      <UpdateSheetView />
    </AppLayout>
  );
}
