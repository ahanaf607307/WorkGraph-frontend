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
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const RegisterView: React.FC = () => {
  const router = useRouter();
  const { setUser, refreshOrganizations } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await authActions.register(data);
      if ("role" in res) {
        setUser(res as any);
      }
      await refreshOrganizations();
      toast.success("Workspace created!", {
        description: "Welcome to WorkGraph SaaS.",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "Failed to create account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black flex items-center justify-center text-xl mx-auto shadow-md shadow-amber-400/20 mb-3">
            W
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create your WorkGraph Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Get started with real-time project governance and team workload tracking.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            id="email"
            type="email"
            label="Work Email"
            placeholder="john@company.com"
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

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" variant="primary" size="lg" className="w-full mt-4" isLoading={isLoading}>
            Create Account & Workspace <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        <div className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
