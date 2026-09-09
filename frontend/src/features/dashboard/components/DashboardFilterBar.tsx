'use client';

import React from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { StatusFilter } from './DashboardStatsGrid';

interface DashboardFilterBarProps {
  statusFilter: StatusFilter;
  onFilterChange: (status: StatusFilter) => void;
  stats: {
    total: number;
    active: number;
    onHold: number;
    completed: number;
    archived: number;
  };
  onExpandAll: () => void;
  onCollapseAll: () => void;
  isAllExpanded: boolean;
  isAllCollapsed: boolean;
  hasProjects: boolean;
}

export function DashboardFilterBar({
  statusFilter,
  onFilterChange,
  stats,
  onExpandAll,
  onCollapseAll,
  isAllExpanded,
  isAllCollapsed,
  hasProjects,
}: DashboardFilterBarProps) {
  const filterList: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: stats.total },
    { key: 'ACTIVE', label: 'Active', count: stats.active },
    { key: 'ON_HOLD', label: 'On Hold', count: stats.onHold },
    { key: 'COMPLETED', label: 'Completed', count: stats.completed },
    { key: 'ARCHIVED', label: 'Archived', count: stats.archived },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#b9c0cb]/40 shadow-xs">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <div className="flex items-center gap-1 text-xs text-[#4a5462] font-semibold mr-1 pl-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#51a8b1]" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        {filterList.map((st) => (
          <button
            key={st.key}
            type="button"
            onClick={() => onFilterChange(st.key)}
            className={`
              px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap
              ${
                statusFilter === st.key
                  ? 'bg-[#51a8b1] text-white shadow-xs'
                  : 'bg-[#f8fafb] text-[#4a5462] hover:bg-[#f0f8f9] hover:text-[#3a7d84]'
              }
            `}
          >
            {st.label} ({st.count})
          </button>
        ))}
      </div>

      {/* Global Expand All / Collapse All */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExpandAll}
          disabled={isAllExpanded || !hasProjects}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#b6e0e4] bg-[#f0f8f9] text-[#3a7d84] hover:bg-[#d9eef0] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
          title="Expand all filtered project roadmaps"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span>Expand All</span>
        </button>

        <button
          type="button"
          onClick={onCollapseAll}
          disabled={isAllCollapsed || !hasProjects}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#b9c0cb]/60 bg-[#f8fafb] text-[#4a5462] hover:bg-[#f1f3f6] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Collapse all project roadmaps"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>Collapse All</span>
        </button>
      </div>
    </div>
  );
}
