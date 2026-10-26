"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userActions } from "../../modules/users/actions/user.actions";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { toast } from "sonner";
import { Bell, Check, Clock } from "lucide-react";
import { formatRelativeDate } from "../../lib/utils";

export const NotificationListView: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => userActions.getNotifications(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => userActions.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const markSingleMutation = useMutation({
    mutationFn: (id: string) => userActions.markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = (notifications || []).filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Notification History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time alerts, task assignments, deadline warnings, and workspace activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <Check className="w-4 h-4 mr-1.5" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (notifications || []).length === 0 ? (
            <EmptyState
              icon={<Bell className="w-6 h-6" />}
              title="No notifications"
              description="You're all caught up! When you are assigned tasks or updates occur, alerts appear here."
            />
          ) : (
            notifications?.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markSingleMutation.mutate(n.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  n.isRead
                    ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                    : "border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-zinc-950 dark:text-white"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">{n.title}</span>
                    {!n.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{n.message}</p>
                  <div className="flex items-center text-2xs text-zinc-400 font-mono pt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatRelativeDate(n.createdAt)}
                  </div>
                </div>

                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      markSingleMutation.mutate(n.id);
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold"
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
