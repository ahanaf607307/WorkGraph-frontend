import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { IssueSheetView } from "../../view/issues/IssueSheetView";

export default function IssuesPage() {
  return (
    <AppLayout>
      <IssueSheetView />
    </AppLayout>
  );
}
