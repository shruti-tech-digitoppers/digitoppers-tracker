'use client';

import React from 'react';
import { BarChart3, PlayCircle, Clock, CheckCircle2, Archive } from 'lucide-react';

export type StatusFilter = 'ALL' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

interface DashboardStatsGridProps {
  stats: {
    total: number;
    active: number;
    onHold: number;
    completed: number;
    archived: number;
    assignedToMe?: number;
  };
  currentFilter: StatusFilter;
  onSelectFilter: (filter: StatusFilter) => void;
}

export function DashboardStatsGrid({
  stats,
  currentFilter,
  onSelectFilter,
}: DashboardStatsGridProps) {
  const statCards = [
    { label: 'TOTAL PROJECTS', filter: 'ALL' as StatusFilter, value: stats.total, icon: <BarChart3 className="w-5 h-5" />, bg: 'bg-white', border: 'border-[#b9c0cb]/40', text: 'text-[#333333]', lbl: 'text-[#4a5462]', iconBg: 'bg-[#f0f8f9] text-[#51a8b1]' },
    { label: 'ACTIVE', filter: 'ACTIVE' as StatusFilter, value: stats.active, icon: <PlayCircle className="w-5 h-5" />, bg: 'bg-[#f7fbe9]', border: 'border-[#dfefa6]', text: 'text-[#465b1c]', lbl: 'text-[#58731f]', iconBg: 'bg-[#eff8d0] text-[#759724]' },
    { label: 'ON HOLD', filter: 'ON_HOLD' as StatusFilter, value: stats.onHold, icon: <Clock className="w-5 h-5" />, bg: 'bg-orange-50/70', border: 'border-orange-200 hover:border-orange-400', text: 'text-orange-900', lbl: 'text-orange-700', iconBg: 'bg-orange-100 text-orange-600' },
    { label: 'COMPLETED', filter: 'COMPLETED' as StatusFilter, value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, bg: 'bg-[#f0f8f9]', border: 'border-[#b6e0e4]', text: 'text-[#3a7d84]', lbl: 'text-[#51a8b1]', iconBg: 'bg-[#d9eef0] text-[#3a7d84]' },
    { label: 'ARCHIVED', filter: 'ARCHIVED' as StatusFilter, value: stats.archived, icon: <Archive className="w-5 h-5" />, bg: 'bg-[#f8fafb]', border: 'border-[#b9c0cb]/40', text: 'text-[#4a5462]', lbl: 'text-[#b9c0cb]', iconBg: 'bg-[#f1f3f6] text-[#4a5462]' },
  ];

  return (
    <div className="dense-stats-grid gap-2 sm:gap-2.5 md:gap-3">
      {statCards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => onSelectFilter(card.filter)}
          className={`
            dense-stat-card group flex flex-col justify-between rounded-xl border p-2.5 sm:p-3 shadow-2xs text-left cursor-pointer
            transition-all duration-200 hover:shadow-xs active:scale-[0.99]
            ${card.bg} ${card.border}
            ${currentFilter === card.filter ? 'ring-2 ring-[#51a8b1] ring-offset-1 shadow-xs' : ''}
          `}
        >
          <div className="flex items-center justify-between gap-1">
            <span className={`text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider truncate ${card.lbl}`}>
              {card.label}
            </span>
            <div className={`p-1 sm:p-1.5 rounded-lg shrink-0 ${card.iconBg}`}>
              {React.cloneElement(card.icon as React.ReactElement, { className: 'w-3.5 h-3.5 sm:w-4 sm:h-4' })}
            </div>
          </div>
          <div className="mt-1 sm:mt-1.5 flex items-baseline justify-between">
            <span className={`font-heading text-lg sm:text-xl md:text-2xl font-black ${card.text}`}>
              {card.value}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
