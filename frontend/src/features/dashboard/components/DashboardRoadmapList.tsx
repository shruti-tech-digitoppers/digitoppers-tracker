'use client';

import React from 'react';
import { IProject } from '../../../types/project';
import { ProjectRoadmapCard } from '../ProjectRoadmapCard';
import { Boxes } from 'lucide-react';
import { StatusFilter } from './DashboardStatsGrid';

interface DashboardRoadmapListProps {
  projects: IProject[];
  loading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  expandedMap: Record<string, boolean>;
  onToggleProject: (id: string) => void;
  onRetry: () => void;
  onProjectUpdated: () => void;
}

export function DashboardRoadmapList({
  projects,
  loading,
  error,
  statusFilter,
  expandedMap,
  onToggleProject,
  onRetry,
  onProjectUpdated,
}: DashboardRoadmapListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-white border border-[#b9c0cb]/30 p-6 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 space-y-2">
        <p className="text-sm font-semibold">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="text-xs bg-rose-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-rose-700 transition cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-[#b9c0cb]/40 rounded-2xl space-y-3 shadow-xs">
        <Boxes className="w-10 h-10 text-[#b9c0cb] mx-auto" />
        <h3 className="font-heading text-sm font-bold text-[#333333]">No projects found</h3>
        <p className="text-xs text-[#4a5462]">
          {statusFilter !== 'ALL'
            ? `No projects currently match the "${statusFilter}" status filter.`
            : 'No projects exist in the system yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectRoadmapCard
          key={project._id}
          project={project}
          isExpanded={Boolean(expandedMap[project._id])}
          onToggle={() => onToggleProject(project._id)}
          onProjectUpdated={onProjectUpdated}
        />
      ))}
    </div>
  );
}
