'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  UserPlus, 
  FolderKanban, 
  Crown, 
  UserCheck, 
  Eye, 
  EyeOff, 
  Search, 
  ShieldCheck, 
  Shield, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { ICreateEmployeePayload, GlobalRole, ProjectDesignation } from '../../../types/auth';
import { projectsApi } from '../../../lib/api/projects.api';
import { IProject } from '../../../types/project';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ICreateEmployeePayload) => Promise<any>;
}

export function CreateEmployeeModal({ isOpen, onClose, onSubmit }: CreateEmployeeModalProps) {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: isOpen });
  const [formData, setFormData] = useState<ICreateEmployeePayload>({
    name: '',
    email: '',
    password: '',
    employeeCode: '',
    globalRole: 'EMPLOYEE',
    isActive: true,
  });

  const [projects, setProjects] = useState<IProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [projectRoles, setProjectRoles] = useState<Record<string, ProjectDesignation>>({});
  const [projectSearch, setProjectSearch] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await projectsApi.getProjects();
      setProjects(res.projects || []);
    } catch {
      // Ignore
    } finally {
      setLoadingProjects(false);
    }
  };

  if (!isOpen) return null;

  const handleRoleToggle = (projectId: string, role: ProjectDesignation) => {
    setProjectRoles((prev) => {
      if (role === 'VIEWER') {
        const copy = { ...prev };
        delete copy[projectId];
        return copy;
      }
      return { ...prev, [projectId]: role };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.employeeCode.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const assignedRoles = Object.entries(projectRoles).map(([projectId, designation]) => ({
        projectId,
        designation,
      }));

      await onSubmit({
        ...formData,
        projectRoles: assignedRoles,
      });

      setFormData({
        name: '',
        email: '',
        password: '',
        employeeCode: '',
        globalRole: 'EMPLOYEE',
        isActive: true,
      });
      setProjectRoles({});
      onClose();
    } catch (err: any) {
      const errorMsg = 
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        err.message || 
        'Failed to create employee.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase();
    const code = (p.projectId || '').toLowerCase();
    const title = (p.projectName || p.title || '').toLowerCase();
    const org = (p.organization || '').toLowerCase();
    return code.includes(q) || title.includes(q) || org.includes(q);
  });

  const assignedCount = Object.keys(projectRoles).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/45 backdrop-blur-xs">
      <div ref={modalRef} className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-[#b9c0cb]/40 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Modal Header ─────────────────────────────────────────── */}
        <div className="px-8 py-5 border-b border-[#f1f3f6] flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#f8fafb] via-white to-[#f8fafb]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center font-bold shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#333333] font-heading leading-tight">
                Add New Employee
              </h2>
              <p className="text-xs text-[#4a5462] mt-0.5">
                Set credentials, organization role, and per-project designations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-[#4a5462] hover:bg-[#f1f3f6] hover:text-[#333333] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Modal Form Body ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="p-3.5 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          {/* 2-Column Spacious Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* ── Left Column: Identity & Credentials (5 cols) ─────── */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-[#f1f3f6]">
                <ShieldCheck className="w-4 h-4 text-[#51a8b1]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84]">
                  Employee Details
                </h3>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white transition"
                />
              </div>

              {/* Employee Code */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. DT-104"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white uppercase font-mono transition"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@digitoppers.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white transition"
                />
              </div>

              {/* Initial Password with Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter secure password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5462] hover:text-[#333333] transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Global Role Selector Cards */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Global System Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, globalRole: 'EMPLOYEE' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.globalRole === 'EMPLOYEE'
                        ? 'bg-[#f0f8f9] border-[#51a8b1] text-[#3a7d84] shadow-xs'
                        : 'bg-[#f8fafb] border-[#b9c0cb]/40 text-[#4a5462] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Shield className="w-4 h-4" />
                      {formData.globalRole === 'EMPLOYEE' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <p className="font-bold text-xs">Employee</p>
                    <p className="text-[10px] opacity-75">Standard Member</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, globalRole: 'ADMIN' })}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formData.globalRole === 'ADMIN'
                        ? 'bg-purple-50 border-purple-400 text-purple-800 shadow-xs'
                        : 'bg-[#f8fafb] border-[#b9c0cb]/40 text-[#4a5462] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      {formData.globalRole === 'ADMIN' && <Check className="w-3.5 h-3.5 text-purple-700" />}
                    </div>
                    <p className="font-bold text-xs">Admin</p>
                    <p className="text-[10px] opacity-75">Full System Access</p>
                  </button>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                  Account Status
                </label>
                <select
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white transition"
                >
                  <option value="true">Active Account</option>
                  <option value="false">Inactive Account</option>
                </select>
              </div>

              {/* Permission Checkpoints */}
              <div className="pt-2 border-t border-[#f1f3f6] space-y-2">
                <label className="block text-xs font-semibold text-[#333333]">
                  Permission Checkpoints
                </label>
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8fafb] border border-[#b9c0cb]/50 hover:bg-white transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.canRequestNewProject || formData.permissions?.canRequestNewProject)}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setFormData({
                        ...formData,
                        canRequestNewProject: val,
                        permissions: { ...formData.permissions, canRequestNewProject: val },
                      });
                    }}
                    className="mt-0.5 rounded text-[#51a8b1] focus:ring-[#51a8b1] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#333333] leading-tight">
                      Allow New Project Requests
                    </p>
                    <p className="text-[11px] text-[#4a5462] leading-tight mt-0.5">
                      Grants permission to submit and request new projects.
                    </p>
                  </div>
                </label>
              </div>
            </div>


            {/* ── Right Column: Project Roles Assignment (7 cols) ───── */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#f1f3f6]">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-[#51a8b1]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84]">
                      Project Role Assignments
                    </h3>
                    <p className="text-[10px] text-[#4a5462]">
                      By default, employee is a <span className="font-semibold text-[#3a7d84]">Viewer</span> in all projects
                    </p>
                  </div>
                </div>
                {assignedCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                    {assignedCount} Assigned
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                    All Default Viewer
                  </span>
                )}
              </div>

              {/* Project Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5462]" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search existing projects by ID, name, or organization..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white transition"
                />
              </div>

              {/* Projects List Container */}
              {loadingProjects ? (
                <div className="py-12 text-center">
                  <div className="w-7 h-7 border-2 border-[#51a8b1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#4a5462]">Loading projects directory...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center bg-[#f8fafb] rounded-2xl border border-dashed border-[#b9c0cb]/60 text-xs text-[#4a5462]">
                  No projects match your search keywords.
                </div>
              ) : (
                <div className="divide-y divide-[#f1f3f6] border border-[#b9c0cb]/40 rounded-2xl overflow-hidden max-h-56 overflow-y-auto bg-white shadow-2xs">
                  {filteredProjects.map((proj) => {
                    const currentRole = projectRoles[proj._id];
                    return (
                      <div
                        key={proj._id}
                        className="p-3.5 flex items-center justify-between gap-4 hover:bg-[#f8fafb]/60 transition-colors"
                      >
                        {/* Project Details */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2 py-0.5 rounded">
                              {proj.projectId || 'PRJ'}
                            </span>
                            <span className="text-xs font-bold text-[#333333] truncate">
                              {proj.projectName || proj.title}
                            </span>
                          </div>
                          {proj.organization && (
                            <p className="text-[11px] text-[#4a5462] mt-0.5">
                              Organization: <span className="font-medium text-[#333333]">{proj.organization}</span>
                            </p>
                          )}
                        </div>

                        {/* Interactive Role Dropdown */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <select
                            value={currentRole || 'VIEWER'}
                            onChange={(e) => handleRoleToggle(proj._id, e.target.value as ProjectDesignation)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#51a8b1] ${
                              currentRole === 'PROJECT_MANAGER'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                : currentRole === 'CONTRIBUTOR'
                                ? 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4] font-bold'
                                : 'bg-[#f8fafb] text-[#333333] border-[#b9c0cb]/60 font-medium'
                            }`}
                          >
                            <option value="VIEWER">Viewer (Default)</option>
                            <option value="PROJECT_MANAGER">Project Manager</option>
                            <option value="CONTRIBUTOR">Contributor</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── Modal Footer ─────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#f1f3f6]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Creating Employee...' : 'Create Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
