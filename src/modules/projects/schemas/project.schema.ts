import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
