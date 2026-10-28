import { z } from "zod";

export const projectPhaseSchema = z.object({
  name: z.string().min(1, "Phase name is required"),
  description: z.string().optional(),
  deadline: z.string().optional().nullable(),
  budget: z.coerce.number().optional().nullable(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  orderId: z.string().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().optional(),
  clientPhone: z.string().optional(),
  salesPersonName: z.string().optional(),
  profileName: z.string().optional(),
  platformName: z.string().optional(),
  budget: z.coerce.number().optional().nullable(),
  currency: z.string().optional(),
  serviceType: z.string().optional(),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  clientHealth: z.enum(["GOOD", "ATTENTION", "AT_RISK", "CRITICAL"]).optional(),
  meetingRecordingUrl: z.string().optional(),
  conversationDocUrl: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  leaderId: z.string().optional(),
  coLeaderId: z.string().optional(),
  phases: z.array(projectPhaseSchema).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
export type ProjectPhaseFormData = z.infer<typeof projectPhaseSchema>;

