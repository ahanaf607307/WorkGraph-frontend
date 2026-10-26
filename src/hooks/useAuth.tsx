"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Organization } from "../modules/auth/types/auth.types";
import { APP_CONFIG } from "../config";
import { userActions } from "../modules/users/actions/user.actions";
import { authActions } from "../modules/auth/actions/auth.actions";
import { getSocket, connectSocketWithToken, disconnectSocket } from "../lib/socket";

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  currentOrg: Organization | null;
  isLoading: boolean;
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshOrganizations = async () => {
    try {
      const orgs = await userActions.getUserOrganizations();
      setOrganizations(orgs);

      const savedOrgId = localStorage.getItem(APP_CONFIG.currentOrgKey);
      const matched = orgs.find((o) => o.id === savedOrgId);

      if (matched) {
        setCurrentOrgState(matched);
      } else if (orgs.length > 0) {
        setCurrentOrgState(orgs[0]);
        localStorage.setItem(APP_CONFIG.currentOrgKey, orgs[0].id);
      }
    } catch (err) {
      console.warn("Failed to load organizations:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(APP_CONFIG.tokenKey);
      const cachedUser = localStorage.getItem(APP_CONFIG.userKey);

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          connectSocketWithToken(token);
          await refreshOrganizations();
        } catch (e) {
          console.error("Auth init error:", e);
        }
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem(APP_CONFIG.currentOrgKey, org.id);

    // Join new organization room in socket
    const socket = getSocket();
    if (currentOrg) {
      socket.emit("leave:org", currentOrg.id);
    }
    socket.emit("join:org", org.id);
  };

  const logout = async () => {
    await authActions.logout();
    setUser(null);
    setOrganizations([]);
    setCurrentOrgState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        currentOrg,
        isLoading,
        setCurrentOrg,
        refreshOrganizations,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
