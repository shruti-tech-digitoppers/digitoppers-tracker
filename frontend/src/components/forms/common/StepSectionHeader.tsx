import React from 'react';

interface StepSectionHeaderProps {
  stepNumber: number | string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  badgeColorClass?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function StepSectionHeader({
  stepNumber,
  title,
  subtitle,
  badgeText,
  badgeColorClass = 'text-[#3a7d84] bg-[#f0f8f9] border-[#b6e0e4]',
  icon,
  rightAction,
  className = '',
}: StepSectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 flex-wrap ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
          {icon || stepNumber}
        </span>
        <div className="min-w-0">
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-slate-500 font-normal truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badgeText && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${badgeColorClass}`}
          >
            {badgeText}
          </span>
        )}
        {rightAction}
      </div>
    </div>
  );
}
