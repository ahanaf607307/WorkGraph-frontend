import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  companyName: z.string().min(2, "Company / Workspace name must be at least 2 characters"),
  companySize: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  industry: z.enum(["IT", "OTHER"]),
  department: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const memberRegisterSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid work email"),
  employeeId: z.string().min(1, "Employee ID is required (e.g. EMP-101)"),
  companyCode: z.string().min(2, "Company / Workspace invite code is required (e.g. ACM-1001)"),
  departmentName: z.string().min(1, "Please select your department"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


export const verifyEmailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  code: z.string().min(4, "Please enter the 6-digit code"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type MemberRegisterFormData = z.infer<typeof memberRegisterSchema>;
export type VerifyEmailFormData = z.infer<typeof verifyEmailSchema>;
