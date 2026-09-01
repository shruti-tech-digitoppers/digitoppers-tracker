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
    { label: 'Total Projects', filter: 'ALL'       as StatusFilter, value: stats.total,     icon: <BarChart3 className="w-5 h-5" />,    bg: 'bg-white',          border: 'border-[#b9c0cb]/40', text: 'text-[#333333]', lbl: 'text-[#4a5462]', iconBg: 'bg-[#f0f8f9] text-[#51a8b1]'   },
    { label: 'Active',         filter: 'ACTIVE'    as StatusFilter, value: stats.active,    icon: <PlayCircle className="w-5 h-5" />,   bg: 'bg-[#f7fbe9]',      border: 'border-[#dfefa6]',   text: 'text-[#465b1c]', lbl: 'text-[#58731f]', iconBg:'bg-[#eff8d0] text-[#759724]'},
    { label: 'On Hold',        filter: 'ON_HOLD'   as StatusFilter, value: stats.onHold,    icon: <Clock className="w-5 h-5" />,        bg: 'bg-amber-50/50',    border: 'border-amber-200',   text: 'text-amber-800', lbl: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-700'   },
    { label: 'Completed',      filter: 'COMPLETED' as StatusFilter, value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, bg: 'bg-[#f0f8f9]',      border: 'border-[#b6e0e4]',   text: 'text-[#3a7d84]', lbl: 'text-[#51a8b1]', iconBg: 'bg-[#d9eef0] text-[#3a7d84]'     },
    { label: 'Archived',       filter: 'ARCHIVED'  as StatusFilter, value: stats.archived,  icon: <Archive className="w-5 h-5" />,      bg: 'bg-[#f8fafb]',      border: 'border-[#b9c0cb]/40', text: 'text-[#4a5462]', lbl: 'text-[#b9c0cb]', iconBg: 'bg-[#f1f3f6] text-[#4a5462]'   },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {statCards.map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => onSelectFilter(card.filter)}
          className={`
            group flex flex-col justify-between rounded-2xl border p-4 shadow-xs text-left cursor-pointer
            transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.99]
            ${card.bg} ${card.border}
            ${currentFilter === card.filter ? 'ring-2 ring-[#51a8b1] ring-offset-1' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${card.lbl}`}>
              {card.label}
            </span>
            <div className={`p-1.5 rounded-xl ${card.iconBg}`}>
              {card.icon}
            </div>
          </div>
          <div className="mt-3">
            <span className={`font-heading text-2xl font-black ${card.text}`}>
              {card.value}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
