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
  User,
  ShieldAlert,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Layers,
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
  // If member has assigned serviceId, enforce that profile matches their service line!
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

  const handleLeave = async (stationId: string, stationNumber: number) => {
    if (!confirm(`Are you sure you want to log out and leave Station ${stationNumber}?`)) {
      return;
    }

    try {
      await stationActions.leaveStation(stationId);
      toast.success(`Left Station ${stationNumber}`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to leave station");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-text">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-violet-500/20">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white flex items-center gap-2">
              Sales Operational Stations
            </h1>
            <p className="text-xs text-zinc-500">
              Station desk units for Sales (Seals) department members to log into active client portal profiles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {myOccupiedStation ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs">
              <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                You are on Station {myOccupiedStation.stationNumber}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleLeave(myOccupiedStation.id, myOccupiedStation.stationNumber)
                }
                className="px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-2xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Leave</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenJoin()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Join Station</span>
            </button>
          )}
        </div>
      </div>

      {/* Service Line Notice Banner */}
      {currentOrg?.serviceId && (
        <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/40 flex items-center gap-3 text-xs text-violet-700 dark:text-violet-300">
          <Layers className="w-4 h-4 shrink-0" />
          <span>
            You have an assigned Service Line restriction. You are authorized to join and operate client profiles matching your designated service line.
          </span>
        </div>
      )}

      {/* Stations Grid 1 - 6 */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading operational stations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stations.map((st) => {
            const isOccupied = st.status === "OCCUPIED" && st.currentUser;
            const isMe = st.currentUser?.id === user?.id;

            return (
              <div
                key={st.id}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 shadow-xs ${
                  isMe
                    ? "bg-violet-50/30 dark:bg-violet-950/20 border-violet-500 shadow-violet-500/10"
                    : isOccupied
                    ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                    : "bg-white dark:bg-zinc-900/60 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-violet-500/50"
                }`}
              >
                {/* Station Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                        isOccupied
                          ? "bg-violet-600 text-white shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono"
                      }`}
                    >
                      S{st.stationNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-950 dark:text-white">
                        Station {st.stationNumber}
                      </h3>
                      <span className="text-3xs text-zinc-400 font-mono">
                        Workspace Unit
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold uppercase tracking-wider ${
                      isOccupied
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isOccupied ? "Occupied" : "Available"}
                  </span>
                </div>

                {/* Body Content */}
                {isOccupied ? (
                  <div className="space-y-4">
                    {/* Active Occupant */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/60 space-y-2">
                      <div className="text-3xs text-zinc-400 font-mono uppercase tracking-wider">
                        Active Sales Member
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={st.currentUser?.name} size="sm" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                            <span>{st.currentUser?.name}</span>
                            {isMe && (
                              <span className="text-3xs font-mono bg-violet-500 text-white px-1.5 py-0.2 rounded font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-3xs text-zinc-400 font-mono">
                            {st.currentUser?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Active Profile */}
                    {st.currentProfile && (
                      <div className="p-3.5 rounded-2xl bg-violet-500/5 dark:bg-violet-950/30 border border-violet-500/15 space-y-1">
                        <div className="text-3xs text-violet-500 font-mono uppercase tracking-wider flex items-center justify-between">
                          <span>Operating Profile</span>
                          <span>{st.currentProfile.platform || "Upwork"}</span>
                        </div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {st.currentProfile.name}
                        </div>
                        <div className="text-2xs text-violet-600 dark:text-violet-400 font-mono font-semibold">
                          @{st.currentProfile.username}
                        </div>
                        {st.currentProfile.service && (
                          <div className="text-3xs text-zinc-400 pt-0.5">
                            Line: {st.currentProfile.service.name}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <Monitor className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto" />
                    <p className="text-xs text-zinc-400">Desk unit is vacant and ready</p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs">
                  {isOccupied && st.joinedAt ? (
                    <div className="flex items-center gap-1 text-zinc-400 font-mono text-3xs">
                      <Clock className="w-3 h-3" />
                      <span>Since {new Date(st.joinedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ) : (
                    <span className="text-3xs font-mono text-zinc-400">Open Desk</span>
                  )}

                  {isMe ? (
                    <button
                      type="button"
                      onClick={() => handleLeave(st.id, st.stationNumber)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white dark:text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Leave Station</span>
                    </button>
                  ) : !isOccupied ? (
                    <button
                      type="button"
                      onClick={() => handleOpenJoin(st.stationNumber)}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
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
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Join Sales Station</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Select a station desk and your active portal profile
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleJoinSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Station Desk Unit *
              </label>
              <select
                value={selectedStationNumber}
                onChange={(e) => setSelectedStationNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.stationNumber}>
                    Station {st.stationNumber} ({st.status === "OCCUPIED" ? "Occupied" : "Available"})
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Auto-Suggest Search & Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span>Select Operating Profile *</span>
                <span className="text-3xs font-mono text-zinc-400">
                  {searchedProfiles.length} available
                </span>
              </label>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Auto-suggest profile (e.g. ai_nest)..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {searchedProfiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900">
                  No profiles matching your query or service line restriction.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-zinc-100 dark:border-zinc-800 rounded-xl p-1.5">
                  {searchedProfiles.map((p) => {
                    const isSelected = selectedProfileId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-violet-600 text-white shadow-xs"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{p.name}</div>
                          <div
                            className={`text-3xs font-mono truncate ${
                              isSelected ? "text-violet-100" : "text-violet-600 dark:text-violet-400"
                            }`}
                          >
                            @{p.username} • {p.platform || "Upwork"}
                          </div>
                        </div>

                        {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={joining || !selectedProfileId}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {joining ? "Logging in..." : "Join Station"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
