'use client';

import React, { useState } from 'react';
import { IUser } from '../../../types/auth';
import { ProjectStatus } from '../../../types/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: IUser[];
  onSubmit: (projectData: {
    projectCode: string;
    title: string;
    description?: string;
    client?: string;
    projectManager?: string;
    status: ProjectStatus;
  }) => Promise<any>;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  employees,
  onSubmit,
}: CreateProjectModalProps) {
  const [projectCode, setProjectCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState('');
  const [projectManager, setProjectManager] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError(null);
      await onSubmit({
        projectCode,
        title,
        description: description || undefined,
        client: client || undefined,
        projectManager: projectManager || undefined,
        status,
      });
      // Reset form
      setProjectCode('');
      setTitle('');
      setDescription('');
      setClient('');
      setProjectManager('');
      setStatus('ACTIVE');
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-slate-900">Create New Project</h2>
        {formError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Code *</label>
            <input
              type="text"
              required
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              placeholder="e.g. PRJ-2026-002"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project summary..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Client name"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Manager</label>
            <select
              value={projectManager}
              onChange={(e) => setProjectManager(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Select Project Manager (Optional)</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
