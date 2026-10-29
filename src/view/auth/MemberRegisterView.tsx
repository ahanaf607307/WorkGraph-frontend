"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberRegisterSchema, MemberRegisterFormData } from "../../modules/auth/schemas/auth.schema";
import { authActions } from "../../modules/auth/actions/auth.actions";
import { departmentActions } from "../../modules/departments/actions/department.actions";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  MailCheck,
  KeyRound,
  Building,
} from "lucide-react";

export const MemberRegisterView: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MemberRegisterFormData>({
    resolver: zodResolver(memberRegisterSchema),
    defaultValues: {
      departmentName: "Sales",
    },
  });

  const workspaceCode = watch("companyCode");
  const [availableDepartments, setAvailableDepartments] = useState<any[]>([]);
  const [fetchingDepts, setFetchingDepts] = useState(false);

  useEffect(() => {
    if (!workspaceCode || workspaceCode.trim().length < 3) return;
    const timer = setTimeout(async () => {
      try {
        setFetchingDepts(true);
        const list = await departmentActions.getDepartmentsByCode(workspaceCode.trim());
        if (list && list.length > 0) {
          setAvailableDepartments(list);
          setValue("departmentName", list[0].name);
        }
      } catch {
        // Ignore while user is typing
      } finally {
        setFetchingDepts(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [workspaceCode, setValue]);

  const onSubmit = async (data: MemberRegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await authActions.registerMember(data);
      toast.success("Account created! Verification code sent.", {
        description: `Check your email (${data.email}) for the 6-digit confirmation code.`,
      });

      // Pass devCode in query if present for local testing ease
      const devParam = res?.data?.devCode ? `&devCode=${res.data.devCode}` : "";
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}${devParam}`);
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Failed to register member account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-black font-sans">
      {/* Left Marketing Panel (Styled with Vibrant Purple from 3rd Image) */}
      <div className="hidden lg:flex lg:w-5/12 bg-zinc-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 bg-radial from-violet-600/20 via-zinc-950/80 to-zinc-950 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black flex items-center justify-center text-xl shadow-lg shadow-violet-500/30">
              W
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">Work Graph</span>
              <span className="text-3xs font-mono uppercase tracking-widest text-violet-400 font-bold">Team Member Portal</span>
            </div>
          </div>

          <div className="mt-14 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-300 border border-violet-500/30 mb-4">
              <BadgeCheck className="w-4 h-4 text-violet-400" />
              <span>Workspace Member Onboarding</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
              Join Your Workspace with Your Company Invite Code.
            </h1>
            <p className="mt-3.5 text-zinc-400 text-sm leading-relaxed">
              Verify your employee email with 2FA code verification. Your administrator will review and activate your account into your selected squad.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-8">
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 backdrop-blur-sm space-y-3">
            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <div className="p-1 rounded bg-violet-500/20 text-violet-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Unique Workspace Code</strong>
                Enter your company's secure workspace code (e.g. ACM-1001) to link directly to your organization.
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <div className="p-1 rounded bg-violet-500/20 text-violet-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Pre-Assigned Departments</strong>
                Select from Sales (Outreach & Station Profiles), Operation, or Bdt.
              </div>
            </div>

            <div className="flex items-start space-x-3 text-xs text-zinc-300">
              <div className="p-1 rounded bg-violet-500/20 text-violet-400 mt-0.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white block font-semibold">Approval Safeguards</strong>
                New signups are held in a secure pending queue until approved by your Workspace Administrator.
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500 font-mono">
          Work Graph Engine &bull; Enterprise Grade Verification
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6 bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
          <div>
            <div className="mb-3 p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">
                Need to register a new company workspace?
              </span>
              <Link
                href="/register"
                className="font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                Company Signup →
              </Link>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Member Registration
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Sign up with your Employee ID and your Company Invite Code to join your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="name"
                label="Full Name *"
                placeholder="e.g. Elena Rostova"
                error={errors.name?.message}
                {...register("name")}
              />

              <Input
                id="email"
                type="email"
                label="Work Email *"
                placeholder="elena@company.com"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                id="employeeId"
                label="Employee ID *"
                placeholder="e.g. EMP-1049"
                error={errors.employeeId?.message}
                {...register("employeeId")}
              />

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Company Invite Code *
                </label>
                <div className="relative">
                  <input
                    id="companyCode"
                    placeholder="e.g. ACM-1001 or WKG-8492"
                    {...register("companyCode")}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none uppercase font-mono tracking-wide"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5" />
                </div>
                {errors.companyCode?.message && (
                  <p className="text-3xs text-rose-500 mt-1">{errors.companyCode.message}</p>
                )}
              </div>
            </div>

            {/* Department Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                Select Department *
              </label>
              <select
                {...register("departmentName")}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:border-violet-500 focus:outline-none cursor-pointer"
              >
                {availableDepartments && availableDepartments.length > 0 ? (
                  availableDepartments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name} {dept.description ? `(${dept.description})` : ""}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Sales">Sales (Client Outreach, Station Profiles & Pipelines)</option>
                    <option value="Operation">Operation (Systems, Technical Delivery & Operations)</option>
                    <option value="Bdt">Bdt (Business Development & Financial Strategy)</option>
                  </>
                )}
              </select>
              {errors.departmentName?.message && (
                <p className="text-3xs text-rose-500 mt-1">{errors.departmentName.message}</p>
              )}
            </div>

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

            <div className="p-3 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40 flex items-start space-x-2.5 text-2xs text-zinc-600 dark:text-zinc-400">
              <MailCheck className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <span>
                Upon signup, a 6-digit confirmation code will be sent to your email. After verifying, your account will be queued for administrator approval.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white cursor-pointer shadow-md shadow-violet-600/25"
              isLoading={isLoading}
            >
              Sign Up & Request Verification Code <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

