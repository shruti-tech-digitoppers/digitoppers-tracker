'use client';

import React from 'react';
import { IProject } from '../../../types/project';
import { IUser } from '../../../types/auth';
import { ProjectRoadmapCard } from '../ProjectRoadmapCard';
import { Boxes, Search, X } from 'lucide-react';
import { StatusFilter } from './DashboardStatsGrid';
import { useSearch } from '../../../context/SearchContext';

interface DashboardRoadmapListProps {
  projects: IProject[];
  loading: boolean;
  error: string | null;
  statusFilter: StatusFilter;
  expandedMap: Record<string, boolean>;
  onToggleProject: (id: string) => void;
  onRetry: () => void;
  onProjectUpdated: () => void;
  currentUser?: IUser | null;
  compactTimeline?: boolean;
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
  currentUser = null,
  compactTimeline = false,
}: DashboardRoadmapListProps) {
  const { searchQuery, clearSearch } = useSearch();

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
      <div className="p-12 text-center bg-white border border-[#b9c0cb]/40 rounded-2xl space-y-3 shadow-xs font-sans">
        {searchQuery ? (
          <>
            <div className="w-12 h-12 rounded-2xl bg-[#f0f8f9] border border-[#b6e0e4] mx-auto flex items-center justify-center text-[#51a8b1]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-sm font-bold text-[#1e293b]">
              No projects found for &quot;{searchQuery}&quot;
            </h3>
            <p className="text-xs text-[#556987] max-w-sm mx-auto">
              We couldn&apos;t find any projects matching your search term. Try searching by project code, school name, or project manager.
            </p>
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] hover:bg-[#51a8b1] hover:text-white px-3.5 py-2 rounded-xl border border-[#b6e0e4] transition cursor-pointer shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search</span>
            </button>
          </>
        ) : (
          <>
            <Boxes className="w-10 h-10 text-[#b9c0cb] mx-auto" />
            <h3 className="font-heading text-sm font-bold text-[#333333]">No projects found</h3>
            <p className="text-xs text-[#4a5462]">
              {statusFilter !== 'ALL'
                ? `No projects currently match the "${statusFilter}" status filter.`
                : 'No projects exist in the system yet.'}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <ProjectRoadmapCard
          key={project._id}
          project={project}
          currentUser={currentUser}
          isExpanded={Boolean(expandedMap[project._id])}
          onToggle={() => onToggleProject(project._id)}
          onProjectUpdated={onProjectUpdated}
          compactTimeline={compactTimeline}
        />
      ))}
    </div>
  );
}
