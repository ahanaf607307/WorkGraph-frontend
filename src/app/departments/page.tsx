import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { DepartmentManagementView } from "../../view/departments/DepartmentManagementView";

export default function DepartmentsPage() {
  return (
    <AppLayout>
      <DepartmentManagementView />
    </AppLayout>
  );
}

