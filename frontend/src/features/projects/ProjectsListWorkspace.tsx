'use client';

import React, { useState, useMemo } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from './components/ProjectCard';
import { ProjectsTable } from './components/ProjectsTable';
import { CreateProjectModal } from './components/CreateProjectModal';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Table as TableIcon, 
  LayoutGrid, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';

export function ProjectsListWorkspace() {
  const { projects, employees, loading, error, createProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  // Filter projects based on search query and status filter
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchStatus = statusFilter === 'ALL' 
        ? true 
        : statusFilter === 'ARCHIVED' 
        ? (p.archived || p.status === 'ARCHIVED')
        : p.status === statusFilter;

      if (!matchStatus) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const code = (p.projectCode || '').toLowerCase();
      const title = (p.title || '').toLowerCase();
      const client = (p.client || '').toLowerCase();
      const pmName = (typeof p.projectManager === 'object' && p.projectManager !== null ? (p.projectManager as any).name : '').toLowerCase();

      return code.includes(q) || title.includes(q) || client.includes(q) || pmName.includes(q);
    });
  }, [projects, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'ACTIVE' || (p.status as any) === 'IN_PROGRESS').length,
    onHold: projects.filter((p) => p.status === 'ON_HOLD').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    archived: projects.filter((p) => p.archived || p.status === 'ARCHIVED').length,
  }), [projects]);

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* ── Top Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#3a7d84] font-heading">
              Projects Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] text-xs font-bold border border-[#b6e0e4]">
              {projects.length} Total
            </span>
          </div>
          <p className="text-xs text-[#4a5462] font-medium mt-0.5">
            Overview of all active &amp; completed deployments with multi-branch timeline statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-[#b9c0cb]/40 p-1 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#51a8b1] text-white shadow-2xs'
                  : 'text-[#4a5462] hover:text-[#333333] hover:bg-[#f8fafb]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#51a8b1] text-white shadow-2xs'
                  : 'text-[#4a5462] hover:text-[#333333] hover:bg-[#f8fafb]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-[#51a8b1] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#3a7d84] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* ── Metric Badges Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
            statusFilter === 'ALL'
              ? 'bg-white border-[#51a8b1] ring-2 ring-[#51a8b1]/20 shadow-xs'
              : 'bg-white border-[#b9c0cb]/40 hover:border-[#51a8b1]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#4a5462]">All Projects</span>
            <Layers className="w-4 h-4 text-[#51a8b1]" />
          </div>
          <p className="text-xl font-bold font-heading text-[#333333] mt-1">{stats.total}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
            statusFilter === 'ACTIVE'
              ? 'bg-[#f0f8f9] border-[#51a8b1] ring-2 ring-[#51a8b1]/20 shadow-xs'
              : 'bg-white border-[#b9c0cb]/40 hover:border-[#51a8b1]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3a7d84]">Active / Live</span>
            <span className="w-2 h-2 rounded-full bg-[#51a8b1] animate-pulse" />
          </div>
          <p className="text-xl font-bold font-heading text-[#3a7d84] mt-1">{stats.active}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
            statusFilter === 'COMPLETED'
              ? 'bg-[#f7fbe9] border-[#a8cf45] ring-2 ring-[#a8cf45]/20 shadow-xs'
              : 'bg-white border-[#b9c0cb]/40 hover:border-[#a8cf45]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#465b1c]">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#759724]" />
          </div>
          <p className="text-xl font-bold font-heading text-[#465b1c] mt-1">{stats.completed}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('ON_HOLD')}
          className={`p-3.5 rounded-2xl border transition cursor-pointer select-none ${
            statusFilter === 'ON_HOLD'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-300/20 shadow-xs'
              : 'bg-white border-[#b9c0cb]/40 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">On Hold</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-heading text-amber-800 mt-1">{stats.onHold}</p>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────── */}
      <div className="p-3 bg-white border border-[#b9c0cb]/40 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b9c0cb]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project code, title, client, or PM..."
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafb] border border-[#b9c0cb]/50 rounded-xl text-xs text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {(['ALL', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'] as const).map((st) => {
            const isSelected = statusFilter === st;
            const label = st === 'ALL' ? 'All' : st === 'ARCHIVED' ? 'Inactive / Archived' : st.replace('_', ' ');

            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border ${
                  isSelected
                    ? 'bg-[#51a8b1] text-white border-[#51a8b1] shadow-2xs'
                    : 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40 hover:bg-[#f1f3f6]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs">
          {error}
        </div>
      )}

      {/* ── Content View (Table / Grid) ──────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center items-center py-24 text-[#4a5462] text-xs">
          <div className="animate-spin w-5 h-5 border-2 border-[#51a8b1] border-t-transparent rounded-full mr-2" />
          <span>Loading projects directory...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#b9c0cb]/60 rounded-3xl bg-white space-y-3">
          <FolderKanban className="w-10 h-10 text-[#b9c0cb] mx-auto" />
          <p className="text-sm font-bold text-[#333333] font-heading">
            {searchQuery ? 'No matching projects found' : 'No projects available'}
          </p>
          <p className="text-xs text-[#4a5462]">
            {searchQuery ? 'Try modifying your search keywords or status filter.' : 'Create a new project or seed from the dashboard to get started.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Tabular Table View with 5 Key Columns */
        <ProjectsTable
          projects={filteredProjects}
          onDelete={handleDelete}
        />
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal for Project Creation */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        onSubmit={createProject}
      />
    </div>
  );
}

export default ProjectsListWorkspace;