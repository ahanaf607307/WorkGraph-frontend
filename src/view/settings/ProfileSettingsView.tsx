"use client";

import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { formatDate } from "../../lib/utils";

export const ProfileSettingsView: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          User Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account profile and session credentials.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your personal profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar name={user?.name} size="xl" />
            <div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</div>
              <div className="text-sm text-slate-500">{user?.email}</div>
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="default">{user?.role}</Badge>
                {user?.isVerified && <Badge variant="success">Verified</Badge>}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">User ID</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account Created</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Session State</div>
              <div className="text-xs text-slate-400">Signed in via secure JWT token</div>
            </div>
            <Button variant="danger" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
