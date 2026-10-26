import { User, Organization } from "../../auth/types/auth.types";

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  designation?: string;
  customDesignation?: string | null;
  designationId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  weeklyCapacityHours: number;
  user: User;
  department?: { id: string; name: string; code?: string | null } | null;
  team?: { id: string; name: string } | null;
  designationRel?: { id: string; name: string; code?: string | null; hierarchyLevel?: number } | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: any;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string | null;
  resourceId?: string | null;
  isRead: boolean;
  createdAt: string;
}
