'use client';

import React from 'react';

export interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

interface FilterPillsProps {
  options: FilterOption[];
  selected: string;
  onChange: (key: string) => void;
  className?: string;
}

export function FilterPills({
  options,
  selected,
  onChange,
  className = '',
}: FilterPillsProps) {
  return (
    <div className={`flex items-center bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-xl p-0.5 text-xs ${className}`}>
      {options.map((opt) => {
        const isSelected = selected === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? 'bg-[#51a8b1] text-white shadow-2xs'
                : 'text-[#4a5462] hover:text-[#3a7d84]'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-[#f1f4f6] text-[#4a5462]'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
