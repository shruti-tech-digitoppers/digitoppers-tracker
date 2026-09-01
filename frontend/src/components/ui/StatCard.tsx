'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  subtext?: string;
  iconBgColor?: string;
  iconColor?: string;
  badge?: {
    text: string;
    cls?: string;
  };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  subtext,
  iconBgColor = 'bg-[#f0f8f9]',
  iconColor = 'text-[#51a8b1]',
  badge,
}: StatCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-[#b9c0cb]/40 shadow-xs hover:shadow-md hover:border-[#51a8b1]/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl ${iconBgColor} flex items-center justify-center ${iconColor} shadow-2xs`}>
          <Icon className="w-4 h-4" />
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls || 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]'}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="font-heading text-2xl font-black text-[#333333] tracking-tight leading-none">
          {value}
        </div>
        <p className="text-xs font-semibold text-[#4a5462] mt-1">{label}</p>
        {subtext && <p className="text-[10px] text-[#b9c0cb] mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
