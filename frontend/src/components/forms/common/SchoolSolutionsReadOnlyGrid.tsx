'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export interface ReadOnlySolutionItem {
  solutionKey: string;
  solutionName: string;
  quantity: number;
  targetClasses?: string[];
  board?: string;
  icon?: string;
}

interface SchoolSolutionsReadOnlyGridProps {
  schoolName: string;
  schoolIndex?: number;
  solutions: ReadOnlySolutionItem[];
  emptyMessage?: string;
}

export function SchoolSolutionsReadOnlyGrid({
  schoolName,
  schoolIndex = 0,
  solutions = [],
  emptyMessage = 'No specific solutions were selected for this school in previous step. All hardware products are available below.',
}: SchoolSolutionsReadOnlyGridProps) {
  return (
    <div className="bg-gradient-to-br from-[#f8fcfd] to-white p-4 rounded-2xl border border-[#b6e0e4] shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#3a7d84] text-white text-xs font-black flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
            Selected Solutions for {schoolName || `Untitled School ${schoolIndex + 1}`}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
            Read Only Reference
          </span>
          <span className="text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-0.5 rounded-lg border border-[#b6e0e4]">
            {solutions.length} Solutions Configured
          </span>
        </div>
      </div>

      {solutions.length === 0 ? (
        <div className="p-3.5 bg-white border border-dashed border-slate-200 rounded-xl text-center">
          <p className="text-xs text-slate-500 font-medium">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-0.5">
          {solutions.map((sol) => (
            <div
              key={sol.solutionKey}
              className="bg-white border border-[#b6e0e4]/80 rounded-xl p-3 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {sol.icon && <span className="text-base">{sol.icon}</span>}
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate font-heading">
                      {sol.solutionName}
                    </h5>
                    <span className="text-[10px] text-[#51a8b1] font-semibold">
                      {sol.solutionKey}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4] shrink-0">
                  {sol.quantity} Unit{sol.quantity > 1 ? 's' : ''}
                </span>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[10px] text-slate-500">
                <span>
                  Board: <strong className="text-slate-700">{sol.board || 'CBSE'}</strong>
                </span>
                {sol.targetClasses && sol.targetClasses.length > 0 && (
                  <span
                    className="text-slate-500 font-medium truncate max-w-[140px]"
                    title={sol.targetClasses.join(', ')}
                  >
                    {sol.targetClasses.length} Classes ({sol.targetClasses.slice(0, 2).join(', ')}
                    {sol.targetClasses.length > 2 ? '...' : ''})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
