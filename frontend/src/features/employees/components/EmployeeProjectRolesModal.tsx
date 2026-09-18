'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  FolderKanban, 
  Shield, 
  Search, 
  Check, 
  Sparkles, 
  Info, 
  Crown, 
  UserCheck, 
  Eye, 
  Filter 
} from 'lucide-react';
import { 
  IUser, 
  IEmployeeProjectRole, 
  ProjectDesignation 
} from '../../../types/auth';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface EmployeeProjectRolesModalProps {
  employee: IUser | null;
  isOpen: boolean;
  onClose: () => void;
  onFetchRoles: (employeeId: string) => Promise<any>;
  onUpdateRole: (employeeId: string, projectId: string, designation: ProjectDesignation) => Promise<any>;
}

export function EmployeeProjectRolesModal({
  employee,
  isOpen,
  onClose,
  onFetchRoles,
  onUpdateRole,
}: EmployeeProjectRolesModalProps) {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(isOpen && employee) });

  const [loading, setLoading] = useState<boolean>(true);
  const [projectRoles, setProjectRoles] = useState<IEmployeeProjectRole[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER'>('ALL');
  const [updatingProjectId, setUpdatingProjectId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employee) {
      loadRoles();
    }
  }, [isOpen, employee]);

  const loadRoles = async () => {
    if (!employee) return;
    try {
      setLoading(true);
      setError(null);
      const res = await onFetchRoles(employee._id);
      if (res?.data?.projectRoles) {
        setProjectRoles(res.data.projectRoles);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch project roles.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (projectId: string, newDesignation: ProjectDesignation) => {
    if (!employee) return;
    try {
      setUpdatingProjectId(projectId);
      setError(null);
      await onUpdateRole(employee._id, projectId, newDesignation);
      
      setProjectRoles((prev) =>
        prev.map((item) => {
          if (item.project._id === projectId) {
            return {
              ...item,
              designation: newDesignation,
              isDefault: newDesignation === 'VIEWER',
            };
          }
          return item;
        })
      );

      const readableRole =
        newDesignation === 'PROJECT_MANAGER'
          ? 'Project Manager'
          : newDesignation === 'CONTRIBUTOR'
          ? 'Contributor'
          : 'Viewer (Default)';

      setSuccessToast(`Role successfully updated to ${readableRole}`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to update project role.');
    } finally {
      setUpdatingProjectId(null);
    }
  };

  const filteredRoles = useMemo(() => {
    return projectRoles.filter((item) => {
      if (roleFilter !== 'ALL') {
        if (item.designation !== roleFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const code = (item.project.projectId || '').toLowerCase();
      const title = (item.project.projectName || item.project.title || '').toLowerCase();
      const org = (item.project.organization || '').toLowerCase();
      return code.includes(q) || title.includes(q) || org.includes(q);
    });
  }, [projectRoles, searchQuery, roleFilter]);

  const stats = useMemo(() => {
    const pmCount = projectRoles.filter((r) => r.designation === 'PROJECT_MANAGER').length;
    const contribCount = projectRoles.filter((r) => r.designation === 'CONTRIBUTOR').length;
    const viewerCount = projectRoles.filter((r) => r.designation === 'VIEWER').length;
    return { pmCount, contribCount, viewerCount, total: projectRoles.length };
  }, [projectRoles]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-[#b9c0cb]/40 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f6] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center font-bold text-sm shadow-xs">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#333333] font-heading">
                  Project Roles &amp; Permissions
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                  {employee.employeeCode}
                </span>
              </div>
              <p className="text-[11px] text-[#4a5462] mt-0.5">
                Every employee is granted <span className="font-semibold text-[#3a7d84]">Viewer</span> access to all projects by default.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#4a5462] hover:bg-[#f1f3f6] hover:text-[#333333] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        {/* Stats Pill Strip */}
        <div className="px-6 py-3 bg-[#f8fafb] border-b border-[#f1f3f6] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#4a5462] font-medium">Role Distribution:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold text-[11px]">
              <Crown className="w-3 h-3 text-amber-600" />
              {stats.pmCount} Manager
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/70 font-semibold text-[11px]">
              <UserCheck className="w-3 h-3 text-blue-600" />
              {stats.contribCount} Contributor
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px]">
              <Eye className="w-3 h-3 text-slate-500" />
              {stats.viewerCount} Viewer (Default)
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5462]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] w-48 transition"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-white border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] text-[#333333] font-medium transition"
            >
              <option value="ALL">All Roles</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="CONTRIBUTOR">Contributor</option>
              <option value="VIEWER">Viewer (Default)</option>
            </select>
          </div>
        </div>

        {/* Feedback alerts */}
        {successToast && (
          <div className="mx-6 mt-3 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            {successToast}
          </div>
        )}

        {error && (
          <div className="mx-6 mt-3 p-2.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Projects List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-[#51a8b1] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-[#4a5462] font-medium">Loading project relations...</p>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="py-12 text-center bg-[#f8fafb] rounded-2xl border border-dashed border-[#b9c0cb]/40">
              <FolderKanban className="w-8 h-8 text-[#4a5462]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#333333]">No projects found</p>
              <p className="text-[11px] text-[#4a5462] mt-0.5">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#f1f3f6] border border-[#b9c0cb]/40 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {filteredRoles.map((item) => {
                const isUpdating = updatingProjectId === item.project._id;
                return (
                  <div
                    key={item.project._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8fafb]/60 transition-colors"
                  >
                    {/* Project Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#3a7d84] px-2 py-0.5 rounded bg-[#f0f8f9] border border-[#b6e0e4]">
                          {item.project.projectId || 'NO-ID'}
                        </span>
                        <h3 className="text-xs font-bold text-[#333333] truncate">
                          {item.project.projectName || item.project.title}
                        </h3>
                        {item.project.organization && (
                          <span className="text-[11px] text-[#4a5462] bg-slate-100 px-2 py-0.5 rounded">
                            {item.project.organization}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#4a5462]">
                        <span>Status: <strong className="text-[#333333]">{item.project.status}</strong></span>
                        <span>•</span>
                        <span>
                          Current Relation:{' '}
                          <strong className={
                            item.designation === 'PROJECT_MANAGER'
                              ? 'text-amber-700 font-bold'
                              : item.designation === 'CONTRIBUTOR'
                              ? 'text-blue-700 font-bold'
                              : 'text-slate-600 font-semibold'
                          }>
                            {item.designation === 'PROJECT_MANAGER'
                              ? 'Manager'
                              : item.designation === 'CONTRIBUTOR'
                              ? 'Contributor'
                              : 'Viewer (Default)'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Role Dropdown Selector */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        disabled={isUpdating}
                        value={item.designation || 'VIEWER'}
                        onChange={(e) => handleRoleChange(item.project._id, e.target.value as ProjectDesignation)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#51a8b1] disabled:opacity-50 ${
                          item.designation === 'PROJECT_MANAGER'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                            : item.designation === 'CONTRIBUTOR'
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

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#f1f3f6] flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-xs transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
