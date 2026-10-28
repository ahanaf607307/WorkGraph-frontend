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
  Plus,
  Trash2,
  Users,
  Check,
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

  // Dynamic Station creation
  const [creatingStation, setCreatingStation] = useState(false);

  // Join Station Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedStationNumber, setSelectedStationNumber] = useState<number>(1);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
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

  const userRole = (user?.role || "").toUpperCase();
  const orgRole = ((currentOrg as any)?.myRole || (currentOrg as any)?.role || "").toUpperCase();
  const isSalesMember =
    userRole === "SEALS" ||
    userRole === "SALES" ||
    orgRole === "SEALS" ||
    orgRole === "SALES";

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
      setSelectedStationNumber(freeStation ? freeStation.stationNumber : stations[0]?.stationNumber || 1);
    }
    setSelectedProfileIds(eligibleProfiles.length > 0 ? [eligibleProfiles[0].id] : []);
    setProfileSearch("");
    setShowJoinModal(true);
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId);
      } else {
        return [...prev, profileId];
      }
    });
  };

  const handleCreateStation = async () => {
    try {
      setCreatingStation(true);
      const newSt = await stationActions.createStation();
      toast.success(`${newSt.name} created!`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add station");
    } finally {
      setCreatingStation(false);
    }
  };

  const handleDeleteStation = async (stationId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await stationActions.deleteStation(stationId);
      toast.success(`${name} deleted successfully`);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete station");
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSalesMember) {
      toast.error("Only Sales members can join operational stations.");
      return;
    }
    if (selectedProfileIds.length === 0) {
      toast.error("Please select at least one profile to log into the station.");
      return;
    }

    try {
      setJoining(true);
      await stationActions.joinStation({
        stationNumber: selectedStationNumber,
        profileIds: selectedProfileIds,
      });
      toast.success(
        `Successfully joined Station ${selectedStationNumber} with ${selectedProfileIds.length} profile(s)!`
      );
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
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 select-text">
      {/* Sleek, Uncluttered Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/50 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-950 dark:text-white tracking-tight flex items-center gap-2">
              <span>Operational Stations</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
                {stations.length} Desks
              </span>
            </h1>
            {!isSalesMember && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                View Only
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Dynamic station units supporting single or multiple concurrent client profile operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add New Station button */}
          <button
            type="button"
            onClick={handleCreateStation}
            disabled={creatingStation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200/80 dark:border-white/[0.08] transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-violet-500" />
            <span>{creatingStation ? "Adding..." : "Add Station"}</span>
          </button>

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
          ) : isSalesMember ? (
            <button
              type="button"
              onClick={() => handleOpenJoin()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm shadow-violet-600/20 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join Station</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Service Line Notice (Subtle) */}
      {currentOrg?.serviceId && (
        <div className="px-3.5 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-900/30 flex items-center gap-2.5 text-xs text-violet-700 dark:text-violet-300">
          <Layers className="w-4 h-4 shrink-0 text-violet-500" />
          <span>
            Operating under an assigned Service Line restriction. Available client profiles are filtered to your designated specialization.
          </span>
        </div>
      )}

      {/* Stations Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-zinc-400 font-medium">
          Loading operational stations...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((st) => {
            const isOccupied = st.status === "OCCUPIED" && st.currentUser;
            const isMe = st.currentUser?.id === user?.id;

            // Combine activeProfiles or fallback to currentProfile
            const displayedProfiles =
              st.activeProfiles && st.activeProfiles.length > 0
                ? st.activeProfiles
                : st.currentProfile
                ? [st.currentProfile]
                : [];

            return (
              <div
                key={st.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between min-h-[240px] ${
                  isMe
                    ? "bg-violet-50/20 dark:bg-violet-950/15 border-violet-500/60 ring-1 ring-violet-500/20"
                    : isOccupied
                    ? "bg-white dark:bg-[#0f1118] border-zinc-200/70 dark:border-white/[0.08] shadow-xs"
                    : "bg-white/60 dark:bg-[#0f1118]/40 border-dashed border-zinc-300/80 dark:border-white/[0.08] hover:border-violet-500/40"
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
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
                        {st.name || `Station ${st.stationNumber}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
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

                      {!isOccupied && stations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteStation(st.id, st.name || `Station ${st.stationNumber}`)}
                          title="Remove empty station"
                          className="p-1 rounded-md text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

                      {/* Multi-Profile Badges */}
                      {displayedProfiles.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-3xs font-mono font-bold uppercase text-zinc-400 flex items-center justify-between">
                            <span>Active Profiles ({displayedProfiles.length})</span>
                          </div>
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {displayedProfiles.map((prof) => (
                              <div
                                key={prof.id}
                                className="p-2 rounded-xl bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.04] text-xs"
                              >
                                <div className="flex items-center justify-between text-3xs text-zinc-400">
                                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                                    {prof.name}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 text-4xs font-mono font-bold shrink-0">
                                    {prof.platform || "Portal"}
                                  </span>
                                </div>
                                <div className="text-3xs font-mono text-violet-600 dark:text-violet-400 truncate mt-0.5">
                                  @{prof.username}
                                </div>
                              </div>
                            ))}
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
                    isSalesMember ? (
                      <button
                        type="button"
                        onClick={() => handleOpenJoin(st.stationNumber)}
                        className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-2xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Join Desk</span>
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] text-zinc-400 text-3xs font-medium border border-zinc-200/50 dark:border-white/[0.06]">
                        View Only
                      </span>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JOIN STATION MODAL WITH MULTI-PROFILE SELECTION */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent maxWidth="2xl" className="bg-white dark:bg-[#0f1118] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
          <DialogHeader className="p-5 pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <DialogTitle className="text-sm sm:text-base font-bold">Join Sales Station</DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Select a desk unit and one or more operating client profiles to link with your station session
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleJoinSubmit} className="p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Target Station Unit
              </label>
              <select
                value={selectedStationNumber}
                onChange={(e) => setSelectedStationNumber(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
              >
                {stations.map((st) => (
                  <option key={st.id} value={st.stationNumber}>
                    {st.name || `Station ${st.stationNumber}`} ({st.status === "OCCUPIED" ? "Occupied" : "Available"})
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Profile Selection */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Select Client Profiles (Multi-Select Supported)
                </label>
                <span className="text-3xs font-mono font-bold text-violet-600 dark:text-violet-400">
                  {selectedProfileIds.length} profile(s) selected
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  placeholder="Filter client profile by name, username, or platform..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              {searchedProfiles.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-400 border border-zinc-200/60 dark:border-white/[0.06] rounded-xl bg-zinc-50 dark:bg-white/[0.02]">
                  No profiles matching your query.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border border-zinc-100 dark:border-white/[0.06] rounded-xl p-1.5">
                  {searchedProfiles.map((p) => {
                    const isSelected = selectedProfileIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProfileSelection(p.id)}
                        className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                          isSelected
                            ? "bg-violet-600/10 border-violet-500/40 text-zinc-950 dark:text-white"
                            : "border-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.04] text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              isSelected
                                ? "bg-violet-600 border-violet-600 text-white"
                                : "border-zinc-300 dark:border-zinc-700"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">{p.name}</div>
                            <div className="text-3xs font-mono text-zinc-400">
                              @{p.username} • {p.platform || "Portal"}
                              {p.service?.name && ` • ${p.service.name}`}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-3xs font-mono font-semibold px-2 py-0.5 rounded-full bg-violet-600 text-white shrink-0">
                            Selected
                          </span>
                        )}
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
                disabled={joining || selectedProfileIds.length === 0}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {joining ? (
                  "Connecting..."
                ) : (
                  <span>Join with {selectedProfileIds.length} Profile(s)</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
