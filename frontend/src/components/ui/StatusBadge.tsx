'use client';

import React from 'react';
import { TimelineNodeStatus } from '../../types/timeline';

export type BadgeStatusType = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED' | 'PENDING' | 'IN_PROGRESS' | 'CANCELLED' | string;

interface StatusBadgeProps {
  status: BadgeStatusType;
  size?: 'sm' | 'md';
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  ACTIVE:      { label: 'Active',      cls: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]', dot: 'bg-[#a8cf45]' },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]', dot: 'bg-[#51a8b1]' },
  COMPLETED:   { label: 'Completed',   cls: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]', dot: 'bg-[#a8cf45]' },
  ON_HOLD:     { label: 'On Hold',     cls: 'bg-amber-50 text-amber-800 border-amber-200',   dot: 'bg-amber-500' },
  PENDING:     { label: 'Pending',     cls: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40', dot: 'bg-[#b9c0cb]' },
  CANCELLED:   { label: 'Cancelled',   cls: 'bg-rose-50 text-rose-800 border-rose-200',     dot: 'bg-rose-500' },
  ARCHIVED:    { label: 'Archived',    cls: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40', dot: 'bg-[#b9c0cb]' },
};

export function StatusBadge({ status, size = 'sm', className = '' }: StatusBadgeProps) {
  const normalized = (status || 'PENDING').toUpperCase();
  const config = STATUS_MAP[normalized] || {
    label: status,
    cls: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40',
    dot: 'bg-[#b9c0cb]',
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-2.5 py-0.5' 
    : 'text-xs px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${sizeClasses} ${config.cls} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
