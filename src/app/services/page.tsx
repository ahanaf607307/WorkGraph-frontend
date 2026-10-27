import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { ServiceLineView } from "../../view/services/ServiceLineView";

export default function ServicesPage() {
  return (
    <AppLayout>
      <ServiceLineView />
    </AppLayout>
  );
}
