'use client';

import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { ProjectCard } from './components/ProjectCard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { FolderKanban, Plus } from 'lucide-react';

export function ProjectsListWorkspace() {
  const { projects, employees, loading, error, createProject, deleteProject } = useProjects();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete project.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">Projects</h1>
          <p className="text-sm text-slate-500">Manage active projects and track organizational workflows &amp; timelines.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 text-sm">
          Loading projects from backend...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl bg-white">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-700 font-semibold">No projects found.</p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-3 text-sm text-blue-600 font-semibold hover:underline cursor-pointer"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
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