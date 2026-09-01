'use client';

import React from 'react';
import Link from 'next/link';
import { IProject } from '../../../types/project';
import { 
  Building2, 
  Calendar, 
  ArrowUpRight, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Layers, 
  UserCircle2 
} from 'lucide-react';

interface ProjectsTableProps {
  projects: IProject[];
  onDelete?: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

export function ProjectsTable({
  projects,
  onDelete,
  isAdmin = false
}: ProjectsTableProps) {
  const getStatusBadge = (status: string, archived?: boolean) => {
    if (archived || status === 'ARCHIVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          Inactive / Archived
        </span>
      );
    }

    switch (status) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#51a8b1] animate-pulse" />
            Active / Live
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6]">
            <CheckCircle2 className="w-3 h-3 text-[#759724]" />
            Completed
          </span>
        );
      case 'ON_HOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            On Hold
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            {status || 'Pending'}
          </span>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-[#b9c0cb]/40 rounded-2xl shadow-xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header (5 Key Columns + Actions) */}
          <thead>
            <tr className="bg-[#f8fafb] border-b border-[#b9c0cb]/40 text-[#3a7d84] text-xs font-bold font-heading uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">
                1. Project Code &amp; Title
              </th>
              <th scope="col" className="py-3.5 px-4">
                2. Client / Organization
              </th>
              <th scope="col" className="py-3.5 px-4">
                3. Project Manager / Lead
              </th>
              <th scope="col" className="py-3.5 px-4">
                4. Status &amp; State
              </th>
              <th scope="col" className="py-3.5 px-4">
                5. Created Date
              </th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body (Rows & Columns) */}
          <tbody className="divide-y divide-[#f1f3f6] text-xs text-[#333333]">
            {projects.map((project, idx) => {
              const pmObj = typeof project.projectManager === 'object' && project.projectManager !== null
                ? project.projectManager as any
                : null;
              const pmName = pmObj?.name || (typeof project.projectManager === 'string' ? project.projectManager : 'Unassigned PM');
              const pmEmail = pmObj?.email || '';

              return (
                <tr 
                  key={project._id || `proj-${idx}`} 
                  className="hover:bg-[#f0f8f9]/30 transition-colors group"
                >
                  {/* Column 1: Project Code & Title */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5 group-hover:bg-[#51a8b1] group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 max-w-xs sm:max-w-sm md:max-w-md">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#2f4154] text-white font-mono text-[10.5px] font-bold shadow-2xs">
                            {project.projectCode}
                          </span>
                        </div>
                        <Link 
                          href={`/tracker?projectId=${project._id}`}
                          className="font-heading font-bold text-xs sm:text-[13px] text-[#333333] hover:text-[#51a8b1] transition-colors line-clamp-1 block"
                        >
                          {project.title}
                        </Link>
                        {project.description && (
                          <p className="text-[11px] text-[#4a5462] line-clamp-1 mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Client / Organization */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#f8fafb] text-[#4a5462] border border-[#b9c0cb]/40 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 max-w-[200px]">
                        <p className="font-bold text-[#333333] truncate">
                          {project.client || 'Direct Client'}
                        </p>
                        <p className="text-[10px] text-[#4a5462] truncate">
                          Affiliated Institutional Node
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Column 3: Project Manager / Lead */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center font-bold text-[11px] shrink-0">
                        {pmName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 max-w-[180px]">
                        <p className="font-bold text-[#333333] truncate">
                          {pmName}
                        </p>
                        {pmEmail && (
                          <p className="text-[10px] text-[#4a5462] truncate">
                            {pmEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Column 4: Status (Active / Inactive / Completed) */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusBadge(project.status, project.archived)}
                  </td>

                  {/* Column 5: Created Date */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-[#4a5462]">
                      <Calendar className="w-3.5 h-3.5 text-[#b9c0cb]" />
                      <span className="font-medium text-[11.5px]">
                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </td>

                  {/* Column 6: Actions */}
                  <td className="py-4 px-4 pr-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/tracker?projectId=${project._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#51a8b1] text-white hover:bg-[#3a7d84] active:scale-95 transition-all shadow-2xs"
                      >
                        <span>Open Tracker</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      {isAdmin && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(project._id)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[#b9c0cb] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
