'use client';

import React from 'react';
import { IProject } from '../../../types/project';
import { Building2, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasToolbarProps {
  project?: IProject | null;
  projectCode?: string;
  projectTitle?: string;
  hideProjectHeader?: boolean;
  totalStages: number;
  completedStages: number;
  overallProgress: number;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function CanvasToolbar({
  project,
  projectCode,
  projectTitle,
  hideProjectHeader = false,
  totalStages,
  completedStages,
  overallProgress,
  filterStatus,
  onFilterChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: CanvasToolbarProps) {
  return (
    <div className="border-b border-[#b9c0cb]/40 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Project Header Info */}
      {!hideProjectHeader && (project || projectCode || projectTitle) && (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#51a8b1] shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-1.5 py-0.5 rounded">
                {project?.projectCode || projectCode || 'PROJECT'}
              </span>
              {project?.status && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6]">
                  {project.status}
                </span>
              )}
            </div>
            <h2 className="font-heading text-sm font-bold text-[#333333] leading-tight mt-0.5">
              {project?.title || projectTitle || 'Project Roadmap'}
            </h2>
          </div>
        </div>
      )}

      {/* Status Metrics Bar */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1 text-[#4a5462]">
          <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
          <span>Stages: <strong>{completedStages}/{totalStages}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 bg-[#f1f4f6] rounded-full h-2 overflow-hidden border border-[#b9c0cb]/40">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                overallProgress === 100 ? 'bg-[#a8cf45]' : 'bg-[#51a8b1]'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-[#3a7d84]">{overallProgress}%</span>
        </div>
      </div>

      {/* Toolbar Controls: Filter & Zoom */}
      <div className="flex items-center gap-2">
        {/* Status Filter Pills */}
        <div className="flex items-center bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-xl p-0.5 text-[11px]">
          {['ALL', 'IN_PROGRESS', 'COMPLETED', 'PENDING'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange(st)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                filterStatus === st 
                  ? 'bg-[#51a8b1] text-white shadow-2xs' 
                  : 'text-[#4a5462] hover:text-[#3a7d84]'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'IN_PROGRESS' ? 'Active' : st === 'COMPLETED' ? 'Done' : 'Pending'}
            </button>
          ))}
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center gap-0.5 bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-xl p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            className="p-1 text-[#4a5462] hover:text-[#3a7d84] hover:bg-white rounded-lg transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-[#4a5462] px-1 font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            className="p-1 text-[#4a5462] hover:text-[#3a7d84] hover:bg-white rounded-lg transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetZoom}
            className="p-1 text-[#4a5462] hover:text-[#3a7d84] hover:bg-white rounded-lg transition ml-0.5 cursor-pointer"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
