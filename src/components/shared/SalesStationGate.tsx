"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { stationActions } from "../../modules/stations/actions/station.actions";
import { Monitor, ArrowRight, Loader2, ShieldAlert } from "lucide-react";

interface SalesStationGateProps {
  children: React.ReactNode;
}

export const SalesStationGate: React.FC<SalesStationGateProps> = ({ children }) => {
  const { user, currentOrg } = useAuth();
  const orgId = currentOrg?.id;

  const isPrivileged =
    user?.role === "SYSTEM_OWNER" ||
    user?.role === "system_owner" ||
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN";

  const deptName = (currentOrg as any)?.department?.name?.toLowerCase() || "";
  const deptCode = (currentOrg as any)?.department?.code?.toUpperCase() || "";
  const isSalesMember =
    !isPrivileged &&
    (deptName.includes("sale") || deptName.includes("seal") || deptCode === "SALES");

  const { data: myStation, isLoading } = useQuery({
    queryKey: ["my-active-station", orgId],
    queryFn: () => stationActions.getMyActiveStation(),
    enabled: !!orgId && isSalesMember,
    staleTime: 1000 * 30, // 30s
  });

  if (isSalesMember) {
    if (isLoading) {
      return (
        <div className="p-16 text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500 mx-auto" />
          <p className="text-xs text-zinc-400">Verifying station assignment...</p>
        </div>
      );
    }

    if (!myStation) {
      return (
        <div className="p-6 md:p-12 max-w-xl mx-auto my-12">
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#11131c] border border-amber-300/40 dark:border-amber-500/20 p-8 md:p-10 text-center shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
              <Monitor className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                Action Required
              </span>
              <h2 className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
                Join Your Station First
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                As a Sales Team Member, you must join an active desk station before you can access or interact with operational sheets, updates, or queue tasks.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Link
                href="/stations"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/20 cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Go to Stations & Join</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};
