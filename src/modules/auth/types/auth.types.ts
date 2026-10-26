export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdById: string;
  myRole?: string;
  weeklyCapacityHours?: number;
  memberCount?: number;
  projectCount?: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  organization?: Organization;
}
