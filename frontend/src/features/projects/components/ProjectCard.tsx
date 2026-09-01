'use client';

import React from 'react';
import Link from 'next/link';
import { IProject } from '../../../types/project';
import { Compass } from 'lucide-react';

interface ProjectCardProps {
  project: IProject;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <div className="border border-slate-200/90 rounded-2xl p-5 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-2.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-slate-900 text-white">
            {project.projectCode}
          </span>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              project.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : project.status === 'COMPLETED'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {project.status}
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 leading-snug">{project.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-2">{project.description || 'No description provided.'}</p>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Client: <strong className="text-slate-700">{project.client || 'N/A'}</strong></span>
          <button
            type="button"
            onClick={() => onDelete(project._id)}
            className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
            title="Delete project"
          >
            Delete
          </button>
        </div>

        {/* Direct execution roadmap action */}
        <Link
          href={`/tracker?projectId=${project._id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 text-xs font-bold transition border border-blue-200/80 shadow-2xs"
        >
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          Open Execution Roadmap
        </Link>
      </div>
    </div>
  );
}
