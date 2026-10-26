"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center mx-auto text-xl animate-pulse shadow-md shadow-amber-400/20">
          W
        </div>
        <p className="text-sm text-slate-500 font-medium">Entering WorkGraph...</p>
      </div>
    </div>
  );
}
