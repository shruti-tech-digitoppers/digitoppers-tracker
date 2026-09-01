'use client';

import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderOpen,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-16 px-4 border border-dashed border-[#b9c0cb]/60 rounded-3xl bg-white/60 space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#51a8b1] mx-auto shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-[#333333] font-heading">{title}</p>
        {description && <p className="text-xs text-[#4a5462] mt-0.5 max-w-sm mx-auto">{description}</p>}
      </div>
      {action && (
        <div className="pt-1">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#51a8b1] text-white hover:bg-[#3a7d84] transition shadow-xs cursor-pointer"
          >
            {action.icon && <action.icon className="w-3.5 h-3.5" />}
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
