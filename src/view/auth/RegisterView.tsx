"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "../../modules/auth/schemas/auth.schema";
import { authActions } from "../../modules/auth/actions/auth.actions";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Zap,
  Laptop,
  Briefcase,
  Users2,
  Award
} from "lucide-react";

export const RegisterView: React.FC = () => {
  const router = useRouter();
  const { setUser, refreshOrganizations } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      industry: "IT",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await authActions.register(data);
      if ("role" in res) {
        setUser(res as any);
      }
      await refreshOrganizations();
      toast.success("Workspace created successfully!", {
        description: `Welcome to Work Graph, ${data.name}! You are registered as System Admin for ${data.companyName}.`,
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Failed to create account and workspace.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-black font-sans">
      {/* Left Marketing / Hero Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 bg-radial from-amber-500/15 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-xl shadow-lg shadow-amber-400/20">
              W
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">Work Graph</span>
              <span className="text-3xs font-mono uppercase tracking-widest text-amber-400 font-bold">Multi-Tenant SaaS</span>
            </div>
          </div>

          <div className="mt-14 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 mb-4">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>System Admin Onboarding</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              Launch Your Company Workspace with Dynamic Governance.
            </h1>
            <p className="mt-3.5 text-zinc-400 text-sm leading-relaxed">
              As System Admin, you receive full operational sovereignty: add custom departments, define squad structures, and configure custom designations & titles.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-8">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm space-y-3">
            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Dynamic Departments & Squads</span>
                <span className="text-zinc-400 text-2xs">Create squads, assign team leads, and link multi-squad Operation Managers.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Custom Designations & Official Titles</span>
                <span className="text-zinc-400 text-2xs">System Admins can dynamically craft corporate titles and hierarchy levels.</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Deterministic Workload Governance</span>
                <span className="text-zinc-400 text-2xs">Real-time deadline tracking, team capacity forecasting, and live chat.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-2xs text-zinc-400 font-mono">
          <span>Enterprise SaaS v2.5</span>
          <span className="text-amber-400">● 100% Deterministic Engine</span>
        </div>
      </div>

      {/* Right Registration Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div>
            <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                Are you an employee or admin joining a team?
              </span>
              <Link
                href="/register/member"
                className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                Member Signup →
              </Link>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-2">
              🏢 Registering as System Admin (Company Head)
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Create Enterprise Workspace
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Set up your organization, customize your domain profile, and start collaborating.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="name"
                label="Company Head / Admin Name *"
                placeholder="e.g. John Doe"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="email"
                type="email"
                label="Business Email *"
                placeholder="john@company.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="companyName"
                label="Company / Workspace Name *"
                placeholder="e.g. Acme Technologies Ltd."
                error={errors.companyName?.message}
                {...register("companyName")}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Size
                </label>
                <select
                  {...register("companySize")}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value="">Select team size...</option>
                  <option value="1-10">1 - 10 Employees (Startup)</option>
                  <option value="11-50">11 - 50 Employees (Growing)</option>
                  <option value="51-200">51 - 200 Employees (Mid-size)</option>
                  <option value="201-500">201 - 500 Employees (Enterprise)</option>
                  <option value="500+">500+ Employees (Global Corporation)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="phone"
                label="Business Phone"
                placeholder="+1 (555) 000-0000"
                error={errors.phone?.message}
                {...register("phone")}
              />

              <Input
                id="country"
                label="Country / Region"
                placeholder="e.g. United States"
                error={errors.country?.message}
                {...register("country")}
              />

              <Input
                id="website"
                label="Website URL"
                placeholder="https://company.com"
                error={errors.website?.message}
                {...register("website")}
              />
            </div>

            {/* Tailored Exclusively for IT / Software Companies */}
            <input type="hidden" value="IT" {...register("industry")} />

            <Input
              id="department"
              label="Primary Department (Optional)"
              placeholder="e.g. Engineering, Operations, Product"
              error={errors.department?.message}
              {...register("department")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="password"
                type="password"
                label="Password *"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirm Password *"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4 cursor-pointer"
              isLoading={isLoading}
            >
              Launch Workspace as System Admin <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
