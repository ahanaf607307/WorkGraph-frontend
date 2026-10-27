import { AppLayout } from "../../components/shared/AppLayout";
import { WorkspaceRegistryView } from "../../view/system-owner/WorkspaceRegistryView";

export default function WorkspacesPage() {
  return (
    <AppLayout>
      <WorkspaceRegistryView />
    </AppLayout>
  );
}
