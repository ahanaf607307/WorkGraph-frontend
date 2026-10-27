"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  stationActions,
  StationItem,
  ProfileItem,
} from "../../modules/stations/actions/station.actions";
import {
  Monitor,
  LogIn,
  LogOut,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import { Avatar } from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from "sonner";

export const StationView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const [stations, setStations] = useState<StationItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Join Station Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedStationNumber, setSelectedStationNumber] = useState<number>(1);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profileSearch, setProfileSearch] = useState("");
  const [joining, setJoining] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stList, pList] = await Promise.all([
        stationActions.getStations(),
        stationActions.getProfiles(),
      ]);
      setStations(stList);
      setProfiles(pList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load station directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const myOccupiedStation = stations.find((s) => s.currentUser?.id === user?.id);

  // Filter profiles eligible for this member:
  const eligibleProfiles = profiles.filter((p) => {
    if (currentOrg?.serviceId && p.serviceId) {
      return p.serviceId === currentOrg.serviceId;
    }
    return true;
  });

  const searchedProfiles = eligibleProfiles.filter(
    (p) =>
      p.name.toLowerCase().includes(profileSearch.toLowerCase()) ||
      p.username.toLowerCase().includes(profileSearch.toLowerCase()) ||
      p.platform?.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const handleOpenJoin = (stationNumber?: number) => {
    if (stationNumber) {
      setSelectedStationNumber(stationNumber);
    } else {
      const freeStation = stations.find((s) => s.status !== "OCCUPIED");
      setSelectedStationNumber(freeStation ? freeStation.stationNumber : 1);
    }
    setSelectedProfileId(eligibleProfiles[0]?.id || "");
    setProfileSearch("");
    setShowJoinModal(true);
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) {
      toast.error("Please select a profile to log into the station.");
      return;
    }

    try {
      setJoining(true);
      await stationActions.joinStation({
        stationNumber: selectedStationNumber,
        profileId: selectedProfileId,
      });
      toast.success(`Successfully joined Station ${selectedStationNumber}!`);
      setShowJoinModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to join station");
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (stationId: string, stationNum: number) => {
    try {
      await stationActions.leaveStation(stationId);
      toast.success(`Left Station ${stationNum}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave station");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Sleek, Uncluttered Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <h1 className="text-lg font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
            <span>Sales Operational Stations</span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time desk units for Sales members to join and operate client profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          {myOccupiedStation ? (
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs">
              <span className="font-medium text-violet-600 dark:text-violet-400">
                Desk {myOccupiedStation.stationNumber} Active
              </span>
              <button
                type="button"
                onClick={() =>
                  handleLeave(myOccupiedStation.id, myOccupiedStation.stationNumber)
                }
                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 text-2xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Leave</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenJoin()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join Station</span>
            </button>
          )}
        </div>
      </div>

      {/* Service Line Notice (Subtle, Not Loud) */}
      {currentOrg?.serviceId && (
        <div className="px-3.5 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/30 flex items-center gap-2.5 text-xs text-violet-700 dark:text-violet-300">
          <Layers className="w-4 h-4 shrink-0 text-violet-500" />
          <span>
            Operating under an assigned Service Line restriction. Available client profiles are filtered to your designated specialization.
          </span>
        </div>
      )}

      {/* Stations Grid 1 - 6 */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading operational stations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((st) => {
            const isOccupied = st.status === "OCCUPIED" && st.currentUser;
            const isMe = st.currentUser?.id === user?.id;

            return (
              <div
                key={st.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[220px] ${
                  isMe
                    ? "bg-violet-50/20 dark:bg-violet-950/15 border-violet-500/60 ring-1 ring-violet-500/20"
                    : isOccupied
                    ? "bg-white dark:bg-[#0f1118] border-zinc-200/70 dark:border-white/[0.06] shadow-xs"
                    : "bg-white/60 dark:bg-[#0f1118]/40 border-dashed border-zinc-300/80 dark:border-white/[0.08] hover:border-violet-500/40"
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isOccupied
                            ? "bg-violet-600 text-white"
                            : "bg-zinc-100 dark:bg-white/[0.05] text-zinc-500"
                        }`}
                      >
                        S{st.stationNumber}
                      </div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Station {st.stationNumber}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-3xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                        isOccupied
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-zinc-100 dark:bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOccupied ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                      />
                      <span>{isOccupied ? "Occupied" : "Available"}</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  {isOccupied ? (
                    <div className="pt-3 space-y-3">
                      {/* Occupant Row */}
                      <div className="flex items-center gap-2.5">
                        <Avatar name={st.currentUser?.name} size="sm" />
                        <div className="truncate flex-1">
                          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                            <span>{st.currentUser?.name}</span>
                            {isMe && (
                              <span className="text-3xs font-mono bg-violet-600 text-white px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-3xs text-zinc-400 truncate">
                            {st.currentUser?.email}
                          </div>
                        </div>
                      </div>

                      {/* Profile Tag */}
                      {st.currentProfile && (
                        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.04] text-xs">
                          <div className="flex items-center justify-between text-3xs text-zinc-400">
                            <span>Profile</span>
                            <span>{st.currentProfile.platform || "Portal"}</span>
                          </div>
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                            {st.currentProfile.name}
                          </div>
                          <div className="text-3xs font-mono text-violet-600 dark:text-violet-400">
                            @{st.currentProfile.username}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-1">
                      <Monitor className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mx-auto" />
                      <p className="text-2xs text-zinc-400">Vacant Desk Unit</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-white/[0.04] flex items-center justify-between">
                  {isOccupied && st.joinedAt ? (
                    <div className="flex items-center gap-1 text-zinc-400 text-3xs font-mono">
                      <Clock className="w-3 h-3" />
                      <span>
                        Since{" "}
                        {new Date(st.joinedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-3xs text-zinc-400">Ready</span>
                  )}

                  {isMe ? (
                    <button
                      type="button"
                      onClick={() => handleLeave(st.id, st.stationNumber)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Leave</span>
                    </button>
                  ) : !isOccupied ? (
                    <button
                      type="button"
                      onClick={() => handleOpenJoin(st.stationNumber)}
                      className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Join Desk</span>
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JOIN STATION MODAL WITH PROFILE AUTO-SUGGEST */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="max-w-md bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm font-bold">Join Sales Station</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Select a desk unit and your operating client portal profile
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Station Desk Unit
              </label>
              <select
                value={selectedStationNumber}
                onChange={(e) => setSelectedStationNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.stationNumber}>
                    Station {st.stationNumber} ({st.status === "OCCUPIED" ? "Occupied" : "Available"})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Auto-Suggest Search & Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Select Client Profile</span>
                <span className="text-3xs text-zinc-400 font-mono">
                  {searchedProfiles.length} available
                </span>
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Search profile name or username..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {searchedProfiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl bg-zinc-50 dark:bg-white/[0.02]">
                  No profiles matching your query.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-zinc-100 dark:border-white/[0.04] rounded-xl p-1">
                  {searchedProfiles.map((p) => {
                    const isSelected = selectedProfileId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`p-2 rounded-lg cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-violet-600 text-white"
                            : "hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{p.name}</div>
                          <div
                            className={`text-3xs font-mono truncate ${
                              isSelected ? "text-violet-100" : "text-violet-600 dark:text-violet-400"
                            }`}
                          >
                            @{p.username} • {p.platform || "Portal"}
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={joining || !selectedProfileId}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {joining ? "Joining..." : "Confirm & Join"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
