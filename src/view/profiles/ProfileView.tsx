"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  stationActions,
  ProfileItem,
} from "../../modules/stations/actions/station.actions";
import {
  serviceActions,
  ServiceItem,
} from "../../modules/services/actions/service.actions";
import {
  Monitor,
  Plus,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { toast } from "sonner";

export const ProfileView: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const isSystemAdmin =
    currentOrg?.myRole === "OWNER" ||
    currentOrg?.myRole === "ADMIN" ||
    user?.role === "SYSTEM_OWNER";

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [platform, setPlatform] = useState("Upwork");
  const [serviceId, setServiceId] = useState("");
  const [saving, setSaving] = useState(false);

  // Real-time username check state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, sList] = await Promise.all([
        stationActions.getProfiles(),
        serviceActions.getServices(),
      ]);
      setProfiles(pList);
      setServices(sList);
    } catch (err: any) {
      toast.error(err.message || "Failed to load profile directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced real-time username availability check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setUsernameChecking(true);
        const res = await stationActions.checkUsername(username.trim());
        setUsernameStatus({
          checked: true,
          available: res.available,
          message: res.message,
        });
      } catch (e: any) {
        setUsernameStatus({
          checked: true,
          available: false,
          message: e.message || "Failed to check username",
        });
      } finally {
        setUsernameChecking(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const openCreateModal = () => {
    setName("");
    setUsername("");
    setPlatform("Upwork");
    setServiceId(services[0]?.id || "");
    setUsernameStatus(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) {
      toast.error("Profile name and username are required");
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      toast.error("Please enter a valid, available username before proceeding.");
      return;
    }

    try {
      setSaving(true);
      await stationActions.createProfile({
        name: name.trim(),
        username: username.trim(),
        platform: platform.trim(),
        serviceId: serviceId || undefined,
      });
      toast.success(`Profile "${name}" (@${username}) registered successfully!`);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register profile");
    } finally {
      setSaving(false);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.platform?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Profiles & Client Portals
            </h1>
            <p className="text-xs text-zinc-500">
              Company sales & client profiles across Upwork, Fiverr, and platforms with real-time station binding
            </p>
          </div>
        </div>

        {isSystemAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-600/20 transition-all cursor-pointer w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>Add Profile</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search profiles, usernames, platforms..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Profiles Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-zinc-400 font-mono">
          Loading platform profiles...
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-12 text-center space-y-3 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-3xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            No Profiles Registered
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Add client platform profiles so Sales (Seals) department members can log into stations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((p) => {
            const activeStation = p.activeStations?.[0];
            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-violet-500/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-3xs font-mono font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      {p.platform || "Platform"}
                    </span>

                    {activeStation ? (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Station {activeStation.stationNumber} Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-3xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                        Available
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-zinc-950 dark:text-white">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 font-mono font-semibold mt-0.5">
                      <span>@{p.username}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>

                  {p.service && (
                    <div className="text-2xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                        Service Line:
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-medium">
                        {p.service.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-2xs text-zinc-400">
                  {activeStation?.currentUser ? (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                        Occupant: {activeStation.currentUser.name}
                      </span>
                    </div>
                  ) : (
                    <span className="italic">No active occupant</span>
                  )}

                  <span className="font-mono text-3xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE PROFILE MODAL */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Add Platform Profile</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Register verified portal username with real-time validation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Profile Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AI Nest Main Account"
                required
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Profile Username *
                </label>
                {usernameChecking && (
                  <span className="text-3xs text-violet-500 font-mono flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </span>
                )}
                {!usernameChecking && usernameStatus && (
                  <span
                    className={`text-3xs font-mono font-bold flex items-center gap-1 ${
                      usernameStatus.available ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {usernameStatus.available ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Available
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        Already in use
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                placeholder="e.g. ai_nest"
                required
                className={`w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border text-xs focus:outline-none font-mono ${
                  usernameStatus
                    ? usernameStatus.available
                      ? "border-emerald-500 focus:border-emerald-500"
                      : "border-red-500 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-800 focus:border-violet-500"
                }`}
              />
              <p className="text-3xs text-zinc-400">
                Must be unique per workspace. Verified live before usage.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="Upwork">Upwork</option>
                  <option value="Fiverr">Fiverr</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Direct Client">Direct Client</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Service Line
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value="">No restriction</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (usernameStatus !== null && !usernameStatus.available)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {saving ? "Registering..." : "Register Profile"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
