import { Suspense } from "react";
import { VerifyEmailView } from "../../view/auth/VerifyEmailView";

export const metadata = {
  title: "Verify Email | Work Graph",
  description: "Confirm your corporate account using the 6-digit verification code sent to your email.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500 text-sm">Loading verification...</div>}>
      <VerifyEmailView />
    </Suspense>
  );
}
