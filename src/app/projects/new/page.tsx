"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../../../components/shared/AppLayout";
import { ProjectListView } from "../../../view/projects/ProjectListView";
import { CreateProjectModal } from "../../../view/projects/CreateProjectModal";

export default function NewProjectPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AppLayout>
      <ProjectListView />
      <CreateProjectModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.push("/projects");
        }}
        onSuccess={(id) => {
          router.push(`/projects/${id}`);
        }}
      />
    </AppLayout>
  );
}
