'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { projectsApi } from '../../lib/api/projects.api';
import { IProject } from '../../types/project';
import { DashboardStatsGrid, StatusFilter } from './components/DashboardStatsGrid';
import { DashboardFilterBar } from './components/DashboardFilterBar';
import { DashboardRoadmapList } from './components/DashboardRoadmapList';
import { RefreshCw } from 'lucide-react';

export function ExecutiveDashboardWorkspace() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const res = await projectsApi.getProjects();
      const projectList = res.projects || [];
      setProjects(projectList);

      // Default: Expand only active/first project initially
      setExpandedMap((prev) => {
        const next: Record<string, boolean> = {};
        projectList.forEach((p, idx) => {
          if (prev[p._id] !== undefined) {
            next[p._id] = prev[p._id];
          } else {
            next[p._id] = idx === 0 || p.status === 'ACTIVE';
          }
        });
        return next;
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load projects dashboard.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const toggleProject = (projectId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const filteredProjects = useMemo(() =>
    statusFilter === 'ALL' ? projects : projects.filter((p) => p.status === statusFilter),
    [projects, statusFilter]
  );

  const allExpanded = filteredProjects.length > 0 && filteredProjects.every((p) => expandedMap[p._id]);
  const allCollapsed = filteredProjects.length > 0 && filteredProjects.every((p) => !expandedMap[p._id]);

  const expandAll = () =>
    setExpandedMap((prev) => {
      const next = { ...prev };
      filteredProjects.forEach((p) => { next[p._id] = true; });
      return next;
    });

  const collapseAll = () =>
    setExpandedMap((prev) => {
      const next = { ...prev };
      filteredProjects.forEach((p) => { next[p._id] = false; });
      return next;
    });

  const stats = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter((p) => p.status === 'ACTIVE').length,
    onHold:    projects.filter((p) => p.status === 'ON_HOLD').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    archived:  projects.filter((p) => p.status === 'ARCHIVED').length,
  }), [projects]);

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-[#3a7d84]">
            Executive Dashboard
          </h1>
          <p className="text-xs text-[#4a5462] font-medium mt-0.5">
            Real-time project overview — expand any project to view its live execution roadmap &amp; form drawer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchDashboardData(true)}
          className="border border-[#b9c0cb]/60 bg-white px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3a7d84] hover:bg-[#f0f8f9] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#51a8b1] ${loading ? 'animate-spin' : ''}`} />
          Refresh All
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────────── */}
      <DashboardStatsGrid
        stats={stats}
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* ── Filter Bar & Expand / Collapse Controls ────── */}
      <DashboardFilterBar
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        stats={stats}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        isAllExpanded={allExpanded}
        isAllCollapsed={allCollapsed}
        hasProjects={filteredProjects.length > 0}
      />

      {/* ── Projects List with Collapsible Roadmaps ────── */}
      <DashboardRoadmapList
        projects={filteredProjects}
        loading={loading}
        error={error}
        statusFilter={statusFilter}
        expandedMap={expandedMap}
        onToggleProject={toggleProject}
        onRetry={fetchDashboardData}
        onProjectUpdated={fetchDashboardData}
      />
    </div>
  );
}