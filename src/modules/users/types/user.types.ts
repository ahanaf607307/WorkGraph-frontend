import { User, Organization } from "../../auth/types/auth.types";

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  weeklyCapacityHours: number;
  user: User;
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
