"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { projectActions } from "../../modules/projects/actions/project.actions";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { Progress } from "../../components/ui/progress";
import { Avatar } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/shared/EmptyState";
import { CreateProjectModal } from "./CreateProjectModal";
import { Plus, Search, FolderKanban, Calendar, CheckCircle2 } from "lucide-react";
import { formatDate } from "../../lib/utils";

export const ProjectListView: React.FC = () => {
  const router = useRouter();
  const { currentOrg } = useAuth();
  const orgId = currentOrg?.id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects", orgId, statusFilter, search],
    queryFn: () => projectActions.fetchProjects(orgId, statusFilter || undefined, search || undefined),
    enabled: !!orgId,
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Projects & Workflows
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your organization&apos;s development initiatives, deliverables, and team roadmaps.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-950 dark:text-white outline-none"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="" className="cursor-pointer">All Statuses</option>
            <option value="ACTIVE" className="cursor-pointer">Active</option>
            <option value="PLANNING" className="cursor-pointer">Planning</option>
            <option value="ON_HOLD" className="cursor-pointer">On Hold</option>
            <option value="COMPLETED" className="cursor-pointer">Completed</option>
          </select>
        </div>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (projects || []).length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-6 h-6" />}
          title="No projects found"
          description={
            search || statusFilter
              ? "No projects match your current filters. Try resetting search."
              : "Your organization does not have any active projects yet."
          }
          actionLabel="Create First Project"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <Card
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="flex flex-col justify-between hover:shadow-md hover:border-amber-400/60 dark:hover:border-amber-400/40 transition-all p-5 rounded-2xl group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <StatusBadge status={project.status} />
                    {project.orderId && (
                      <span className="font-mono text-3xs font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">
                        #{project.orderId}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 text-2xs text-zinc-400 font-mono">
                    <Calendar className="w-3 h-3 text-indigo-400" />
                    <span>{formatDate(project.dueDate)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-1 text-3xs">
                  {project.platformName && (
                    <span className="font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.2 rounded">
                      {project.platformName}
                    </span>
                  )}
                  {project.clientName && (
                    <span className="text-zinc-500 font-medium truncate">
                      Client: <strong className="text-zinc-800 dark:text-zinc-200">{project.clientName}</strong>
                    </span>
                  )}
                </div>

                <Link href={`/projects/${project.id}`}>
                  <h3 className="text-base font-semibold text-zinc-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                </Link>

                <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || "No project description provided."}
                </p>

                {(project.team?.name || project.department?.name) && (
                  <div className="mt-2 text-3xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <span>Squad:</span>
                    <span className="font-bold underline">{project.team?.name || project.department?.name}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-2xs text-zinc-500">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {project.metrics.progress}% Complete
                  </span>
                  <span>{project.metrics.completedTasks}/{project.metrics.totalTasks} Tasks</span>
                </div>

                <Progress value={project.metrics.progress} className="h-1.5" />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {(project.members || []).slice(0, 4).map((m) => (
                      <Avatar key={m.id} name={m.name} size="sm" />
                    ))}
                    {(project.members || []).length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-200 text-2xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-zinc-950">
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/projects/${project.id}/board`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        Kanban Board
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
