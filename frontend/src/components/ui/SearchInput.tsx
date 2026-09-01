'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}: SearchInputProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-[#b9c0cb] absolute left-3 pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-7 py-2 text-xs bg-white border border-[#b9c0cb]/50 rounded-xl text-[#333333] placeholder-[#4a5462]/70 focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] transition-all w-full"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 p-0.5 text-[#b9c0cb] hover:text-[#4a5462] rounded-full"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
