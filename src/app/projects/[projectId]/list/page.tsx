"use client";

import { useParams } from "next/navigation";
import { AppLayout } from "../../../../components/shared/AppLayout";
import { ProjectOverviewView } from "../../../../view/projects/ProjectOverviewView";

export default function ProjectListPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  if (!projectId) return null;

  return (
    <AppLayout>
      <ProjectOverviewView projectId={projectId} initialTab="list" />
    </AppLayout>
  );
}
