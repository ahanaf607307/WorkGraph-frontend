import { apiClient } from "../../../lib/api-client";
import { LoginResponse, RegisterResponse, User } from "../types/auth.types";
import { LoginFormData, RegisterFormData } from "../schemas/auth.schema";
import { APP_CONFIG } from "../../../config";
import { connectSocketWithToken, disconnectSocket } from "../../../lib/socket";

export const authActions = {
  login: async (data: LoginFormData): Promise<LoginResponse> => {
    const result = await apiClient<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (result.accessToken) {
      localStorage.setItem(APP_CONFIG.tokenKey, result.accessToken);
      localStorage.setItem(APP_CONFIG.userKey, JSON.stringify(result.user));
      connectSocketWithToken(result.accessToken);
    }

    return result;
  },

  register: async (data: RegisterFormData): Promise<RegisterResponse> => {
    const { confirmPassword, ...payload } = data;
    const result = await apiClient<RegisterResponse>("/user/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Auto login immediately after registration
    try {
      const loginRes = await authActions.login({
        email: data.email,
        password: data.password,
      });
      return {
        ...result,
        ...loginRes.user,
      };
    } catch {
      return result;
    }
  },

  logout: async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(APP_CONFIG.tokenKey);
      localStorage.removeItem(APP_CONFIG.userKey);
      localStorage.removeItem(APP_CONFIG.currentOrgKey);
      disconnectSocket();
      window.location.href = "/login";
    }
  },

  getProfile: async (): Promise<User> => {
    return apiClient<User>("/user/profile/me");
  },

  registerMember: async (data: any): Promise<any> => {
    const { confirmPassword, ...payload } = data;
    return apiClient<any>("/user/register-member", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  verifyEmail: async (data: { email: string; code: string }): Promise<any> => {
    return apiClient<any>("/user/verify-email", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPublicWorkspaces: async (): Promise<any[]> => {
    return apiClient<any[]>("/user/workspaces");
  },
};
