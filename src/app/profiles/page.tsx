import React from "react";
import { AppLayout } from "../../components/shared/AppLayout";
import { ProfileView } from "../../view/profiles/ProfileView";

export default function ProfilesPage() {
  return (
    <AppLayout>
      <ProfileView />
    </AppLayout>
  );
}
