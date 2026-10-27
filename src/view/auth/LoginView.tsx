"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../../modules/auth/schemas/auth.schema";
import { authActions } from "../../modules/auth/actions/auth.actions";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

export const LoginView: React.FC = () => {
  const router = useRouter();
  const { setUser, refreshOrganizations } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "systemadmin@test.com",
      password: "123456",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await authActions.login(data);
      setUser(res.user);
      await refreshOrganizations();
      toast.success("Welcome back!", {
        description: `Logged in as ${res.user.name}`,
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Authentication failed", {
        description: error.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (email: string, roleName: string) => {
    setValue("email", email, { shouldValidate: true, shouldDirty: true });
    setValue("password", "123456", { shouldValidate: true, shouldDirty: true });
    toast.info(`Filled credentials for ${roleName}`, {
      description: `${email} • Password: 123456`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-zinc-50 dark:bg-black font-sans">
      {/* Left Marketing / Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white p-12 flex-col justify-between relative overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 bg-radial from-amber-500/20 via-transparent to-transparent opacity-60" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-xl shadow-lg shadow-amber-400/20">
              W
            </div>
            <span className="text-xl font-black tracking-tight text-white">Work Graph</span>
          </div>
          <div className="mt-20 max-w-md">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-4">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-400" /> Deterministic SaaS Engine
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Intelligent Project & Team Workload Governance.
            </h1>
            <p className="mt-4 text-zinc-400 text-base leading-relaxed">
              Real-time Kanban boards, deterministic deadline risk algorithms, and capacity management designed for modern engineering teams.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 text-sm text-zinc-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>Real-time Socket.IO 1-to-1 & Group Squad Messaging</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-zinc-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>Browser Web Push notifications for live message & task alerts</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-zinc-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>Dynamic Departments, Squads & Multi-Team Operation Managers</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-zinc-300">
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>Admin-configurable Dynamic Designations (GM, AGM, HTO, PM, OM, TL, CL)</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Sign in to Work Graph
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Select any role below to auto-fill test credentials and sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Workspace <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Quick Demo Credentials for All System Roles */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Test Role Logins (1-Click Fillup)
              </span>
              <span className="text-3xs bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">
                Password: 123456
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* System Owner */}
              <button
                type="button"
                onClick={() => setDemoAccount("system@test.com", "System Owner")}
                className="p-3 text-xs font-medium text-left rounded-xl border border-purple-300/80 dark:border-purple-700/60 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-500 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    👑 System Owner
                  </span>
                  <span className="text-3xs font-mono font-bold bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded">Platform Head</span>
                </div>
                <div className="text-2xs text-zinc-500 dark:text-zinc-400 mt-1">Platform overview & company approvals</div>
                <div className="text-3xs text-purple-600 dark:text-purple-400 font-mono mt-1 font-semibold">system@test.com</div>
              </button>

              {/* System Admin */}
              <button
                type="button"
                onClick={() => setDemoAccount("systemadmin@test.com", "System Admin")}
                className="p-3 text-xs font-medium text-left rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    🏢 System Admin
                  </span>
                  <span className="text-3xs font-mono font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">Company Head</span>
                </div>
                <div className="text-2xs text-zinc-500 dark:text-zinc-400 mt-1">Manages Depts, Designations & Titles</div>
                <div className="text-3xs text-amber-600 dark:text-amber-400 font-mono mt-1 font-semibold">systemadmin@test.com</div>
              </button>

              {/* Admin */}
              <button
                type="button"
                onClick={() => setDemoAccount("admin@test.com", "Admin")}
                className="p-3 text-xs font-medium text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    🛡️ Admin
                  </span>
                  <span className="text-3xs font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.2 rounded">Ops Admin</span>
                </div>
                <div className="text-2xs text-zinc-500 dark:text-zinc-400 mt-1">Squads, Projects, Operations Manager</div>
                <div className="text-3xs text-zinc-400 font-mono mt-1">admin@test.com</div>
              </button>

              {/* Member */}
              <button
                type="button"
                onClick={() => setDemoAccount("user2@test.com", "Member")}
                className="p-3 text-xs font-medium text-left rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shadow-2xs group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    👥 Member
                  </span>
                  <span className="text-3xs font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-1.5 py-0.2 rounded">Team Lead</span>
                </div>
                <div className="text-2xs text-zinc-500 dark:text-zinc-400 mt-1">Team deliverables, squad chat & tasks</div>
                <div className="text-3xs text-zinc-400 font-mono mt-1">user2@test.com</div>
              </button>
            </div>
          </div>

          <div className="text-center text-sm text-zinc-500 space-y-2">
            <div>
              Are you an employee or team member?{" "}
              <Link href="/register/member" className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
                Sign up with Employee ID →
              </Link>
            </div>
            <div>
              Registering a new company?{" "}
              <Link href="/register" className="font-bold text-zinc-900 dark:text-white hover:underline cursor-pointer">
                Create company workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
