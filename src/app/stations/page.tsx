import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { StationView } from "../../view/stations/StationView";

export default function StationsPage() {
  return (
    <AppLayout>
      <StationView />
    </AppLayout>
  );
}
