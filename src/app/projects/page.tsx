import { AppLayout } from "../../components/shared/AppLayout";
import { ProjectListView } from "../../view/projects/ProjectListView";

export default function ProjectsPage() {
  return (
    <AppLayout>
      <ProjectListView />
    </AppLayout>
  );
}
