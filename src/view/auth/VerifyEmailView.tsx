"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, VerifyEmailFormData } from "../../modules/auth/schemas/auth.schema";
import { authActions } from "../../modules/auth/actions/auth.actions";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import {
  MailCheck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  RotateCw,
} from "lucide-react";

export const VerifyEmailView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get("email") || "";
  const devCodeParam = searchParams?.get("devCode") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: emailParam,
      code: devCodeParam || "",
    },
  });

  const enteredCode = watch("code");

  useEffect(() => {
    if (emailParam) {
      setValue("email", emailParam);
    }
    if (devCodeParam) {
      setValue("code", devCodeParam);
    }
  }, [emailParam, devCodeParam, setValue]);

  const onSubmit = async (data: VerifyEmailFormData) => {
    setIsLoading(true);
    try {
      await authActions.verifyEmail({
        email: data.email,
        code: data.code,
      });

      toast.success("Email verified successfully!", {
        description: "Your account is active. You may now sign in with your credentials.",
      });

      router.push(`/login?verified=true&email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast.error("Verification failed", {
        description: error.message || "Invalid or expired verification code.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!emailParam) {
      toast.error("Please enter your email to resend code");
      return;
    }
    setIsResending(true);
    try {
      await authActions.registerMember({
        email: emailParam,
        name: "Member",
        password: "temp",
        employeeId: "temp",
      }).catch(() => null);

      toast.info("A fresh verification code has been dispatched to your email.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans p-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 sm:p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-6 text-center">
        {/* Verification Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-500 border border-amber-400/30 flex items-center justify-center shadow-lg shadow-amber-400/10">
          <MailCheck className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Verify Your Email
          </h1>
          <p className="mt-1.5 text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            We sent a 6-digit confirmation code to{" "}
            <span className="font-semibold text-zinc-900 dark:text-white">
              {emailParam || "your email address"}
            </span>
            . Enter the code below to activate your account.
          </p>
        </div>

        {/* Local Testing Quick-Fill helper if devCode was passed */}
        {devCodeParam && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-left">
            <div>
              <span className="text-3xs font-mono font-bold text-amber-600 dark:text-amber-400 uppercase block">
                Local Testing Detected
              </span>
              <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                Code: {devCodeParam}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setValue("code", devCodeParam)}
              className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-amber-400 text-black hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Autofill
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Input
            id="email"
            type="email"
            label="Account Email"
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              6-Digit Verification Code
            </label>
            <div className="relative">
              <input
                id="code"
                type="text"
                maxLength={8}
                placeholder="123456"
                className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-950 dark:text-white font-bold focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                {...register("code")}
              />
              <KeyRound className="w-5 h-5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.code && (
              <p className="text-2xs text-rose-500 mt-1">{errors.code.message}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 cursor-pointer"
            isLoading={isLoading}
          >
            Verify & Activate Account <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <Link
            href="/login"
            className="font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Sign In
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
};
