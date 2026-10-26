"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Skeleton } from "../ui/skeleton";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-black p-6">
        <div className="space-y-4 w-full max-w-md text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black font-extrabold flex items-center justify-center mx-auto text-xl shadow-lg shadow-amber-400/20 animate-pulse">
            W
          </div>
          <p className="text-sm text-zinc-500 font-medium">Loading Work Graph workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-black font-sans transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-50/70 dark:bg-black transition-colors">
          <div className="w-full space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
