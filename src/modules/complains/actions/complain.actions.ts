import { apiClient } from "../../../lib/api-client";

export interface ComplainItem {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  description: string;
  documentUrl?: string | null;
  linkUrl?: string | null;
  status: "SUBMITTED" | "UNDER_INVESTIGATION" | "RESOLVED" | "DISMISSED";
  isAnonymous: boolean;
  adminComment?: string | null;
  resolvedAt?: string | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
    employeeId?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export const complainActions = {
  checkPinStatus: async (): Promise<{ hasPin: boolean }> => {
    return apiClient<{ hasPin: boolean }>("/complains/pin-status");
  },

  verifyOrSetPin: async (pin: string): Promise<{ verified: boolean; message: string }> => {
    return apiClient<{ verified: boolean; message: string }>("/complains/pin-verify", {
      method: "POST",
      body: JSON.stringify({ pin }),
    });
  },

  getComplaints: async (pin: string): Promise<ComplainItem[]> => {
    return apiClient<ComplainItem[]>("/complains", {
      headers: {
        "x-complain-pin": pin,
      },
    });
  },

  createComplaint: async (
    pin: string,
    data: {
      title: string;
      description: string;
      documentUrl?: string;
      linkUrl?: string;
      isAnonymous?: boolean;
    }
  ): Promise<ComplainItem> => {
    return apiClient<ComplainItem>("/complains", {
      method: "POST",
      headers: {
        "x-complain-pin": pin,
      },
      body: JSON.stringify(data),
    });
  },

  updateComplaintStatus: async (
    pin: string,
    complaintId: string,
    data: {
      status: "SUBMITTED" | "UNDER_INVESTIGATION" | "RESOLVED" | "DISMISSED";
      adminComment?: string;
    }
  ): Promise<ComplainItem> => {
    return apiClient<ComplainItem>(`/complains/${complaintId}/status`, {
      method: "PATCH",
      headers: {
        "x-complain-pin": pin,
      },
      body: JSON.stringify(data),
    });
  },
};
