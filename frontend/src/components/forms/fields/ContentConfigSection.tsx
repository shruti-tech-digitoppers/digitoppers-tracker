'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Layers, 
  Languages as LanguagesIcon, 
  GraduationCap, 
  Check, 
  Copy, 
  Sparkles, 
  Tag, 
  ArrowRight,
  RotateCcw,
  CheckCheck,
  LayoutGrid,
  Zap,
  SlidersHorizontal,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  School,
  ListFilter
} from 'lucide-react';

interface ContentConfigSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

// 1. Content Category Options with labels
export const CONTENT_OPTIONS: { id: string; label: string; color: string }[] = [
  { id: 'General Core Curriculum', label: 'General Core Curriculum', color: 'bg-[#eef7f8] border-[#b6e0e4] text-[#1c4d52]' },
  { id: 'Mathematics', label: 'Mathematics', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { id: 'Science', label: 'Science', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { id: 'English', label: 'English', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'Social Science', label: 'Social Science', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'Computer Science / Coding', label: 'Computer Science / Coding', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
  { id: 'Physics', label: 'Physics', color: 'bg-sky-50 border-sky-200 text-sky-800' },
  { id: 'Chemistry', label: 'Chemistry', color: 'bg-orange-50 border-orange-200 text-orange-800' },
  { id: 'Biology', label: 'Biology', color: 'bg-green-50 border-green-200 text-green-800' },
  { id: 'Hindi Language & Lit', label: 'Hindi Language & Lit', color: 'bg-rose-50 border-rose-200 text-rose-800' },
  { id: 'Commerce & Accounts', label: 'Commerce & Accounts', color: 'bg-yellow-50 border-yellow-200 text-yellow-800' },
  { id: 'Robotics & AI Lab', label: 'Robotics & AI Lab', color: 'bg-violet-50 border-violet-200 text-violet-800' },
  { id: 'Foundational FLN', label: 'Foundational FLN', color: 'bg-teal-50 border-teal-200 text-teal-800' },
];

// 2. Educational Board Options
export const BOARD_OPTIONS = [
  { id: 'CBSE', label: 'CBSE', desc: 'Central Board of Secondary Education' },
  { id: 'ICSE', label: 'ICSE / ISC', desc: 'Council for the Indian School Certificate Examinations' },
  { id: 'State Board', label: 'State Board', desc: 'State Government Curricula' },
  { id: 'Cambridge', label: 'Cambridge / IGCSE', desc: 'International General Certificate' },
  { id: 'IB', label: 'IB (Baccalaureate)', desc: 'International Baccalaureate' }
];

// 3. Mediums available per Board
export const BOARD_MEDIUM_MAP: Record<string, string[]> = {
  'CBSE': ['English', 'Hindi', 'Hinglish', 'Urdu', 'Sanskrit'],
  'ICSE': ['English', 'Hindi', 'Bengali'],
  'State Board': ['Marathi', 'Hindi', 'English', 'Gujarati', 'Tamil', 'Telugu', 'Bengali', 'Urdu', 'Kannada', 'Punjabi'],
  'Cambridge': ['English', 'Hinglish', 'Other Regional'],
  'IB': ['English', 'Hinglish', 'Other Regional']
};

export const ALL_MEDIUMS = [
  'English',
  'Hindi',
  'Hinglish',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Tamil',
  'Telugu',
  'Urdu',
  'Sanskrit',
  'Kannada',
  'Punjabi'
];

// 4. Granular Class Matrix Segments
export const CLASS_SEGMENTS = [
  {
    id: 'primary',
    name: 'Primary (KG - 5)',
    classes: ['KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
  },
  {
    id: 'middle',
    name: 'Middle School (6 - 8)',
    classes: ['Class 6', 'Class 7', 'Class 8']
  },
  {
    id: 'secondary',
    name: 'Secondary (9 - 10)',
    classes: ['Class 9', 'Class 10']
  },
  {
    id: 'senior_sci',
    name: 'Senior Sec — Science (11 & 12)',
    classes: ['Class 11 PCM', 'Class 11 PCB', 'Class 12 PCM', 'Class 12 PCB']
  },
  {
    id: 'senior_comm',
    name: 'Senior Sec — Commerce (11 & 12)',
    classes: ['Class 11 Commerce', 'Class 12 Commerce']
  }
];

export const ALL_AVAILABLE_CLASSES = CLASS_SEGMENTS.flatMap((s) => s.classes);

const DEFAULT_STANDARD_CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'
];

function normalizeArray(val: any, defaultVal: string[] = []): string[] {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  if (typeof val === 'string' && val.trim().length > 0) {
    if (val.includes(',')) {
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [val.trim()];
  }
  return defaultVal;
}

// ============================================================================
// Multi-Select Dropdown Component for Mediums
// ============================================================================
interface MediumMultiSelectDropdownProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  boardName: string;
}

function MediumMultiSelectDropdown({
  options,
  selected,
  onChange,
  disabled = false,
  boardName,
}: MediumMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    if (disabled) return;
    if (selected.includes(opt)) {
      if (selected.length === 1) {
        // keep at least one medium selected
        return;
      }
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange(options);
  };

  const handleClear = () => {
    if (disabled) return;
    if (options.length > 0) {
      onChange([options[0]]); // keep first medium
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full min-h-[46px] px-3.5 py-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/20 shadow-sm'
            : 'border-[#b9c0cb]/60 hover:border-[#51a8b1]/60 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <LanguagesIcon className="w-4 h-4 text-[#51a8b1] shrink-0" />
          {selected.length === 0 ? (
            <span className="text-xs text-[#8c96a5]">Select Mediums...</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-[#1c4d52]">
                {selected.length} Medium{selected.length > 1 ? 's' : ''} Selected:
              </span>
              {selected.map((med) => (
                <span
                  key={med}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#eef7f8] text-[#1c4d52] border border-[#b6e0e4] text-xs font-bold"
                >
                  <span>{med}</span>
                  {selected.length > 1 && !disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(med);
                      }}
                      className="text-[#51a8b1] hover:text-rose-500 transition-colors p-0.5"
                    >
                      <X className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#8c96a5]">
          <span className="text-[11px] font-bold bg-[#f1f4f6] text-[#4a5462] px-2 py-0.5 rounded-md">
            {selected.length} / {options.length}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#51a8b1]' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#b6e0e4] shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2.5 bg-[#f8fafb] border-b border-[#b9c0cb]/40 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8c96a5] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Filter mediums for ${boardName}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#b9c0cb]/60 text-xs font-medium text-[#333333] placeholder-[#8c96a5] focus:outline-none focus:border-[#51a8b1] focus:ring-1 focus:ring-[#51a8b1] bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c96a5] hover:text-[#333333]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-[11px] px-1 font-bold">
              <span className="text-[#8c96a5]">Available for {boardName}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#51a8b1] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[#8c96a5] hover:text-rose-500 cursor-pointer"
                >
                  Reset Single
                </button>
              </div>
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-2 divide-y divide-gray-50 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8c96a5]">
                No mediums matching "{search}"
              </div>
            ) : (
              filteredOptions.map((med) => {
                const isSelected = selected.includes(med);
                return (
                  <div
                    key={med}
                    onClick={() => toggleOption(med)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-xs font-bold ${
                      isSelected
                        ? 'bg-[#eef7f8] text-[#1c4d52]'
                        : 'text-[#4a5462] hover:bg-[#f8fafb]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#51a8b1] border-[#3a7d84] text-white'
                            : 'border-[#b9c0cb] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>{med} Medium</span>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-extrabold text-[#51a8b1] bg-white px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Multi-Select Dropdown Component for Classes (Per Medium)
// ============================================================================
interface ClassMultiSelectDropdownProps {
  mediumName: string;
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
  disabled?: boolean;
}

function ClassMultiSelectDropdown({
  mediumName,
  selectedClasses,
  onChange,
  disabled = false,
}: ClassMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleClass = (cls: string) => {
    if (disabled) return;
    if (selectedClasses.includes(cls)) {
      onChange(selectedClasses.filter((c) => c !== cls));
    } else {
      onChange([...selectedClasses, cls]);
    }
  };

  const setPresetClasses = (classesList: string[]) => {
    if (disabled) return;
    onChange(Array.from(new Set(classesList)));
  };

  const filteredSegments = useMemo(() => {
    if (!search.trim()) return CLASS_SEGMENTS;
    const s = search.toLowerCase();
    return CLASS_SEGMENTS.map((seg) => ({
      ...seg,
      classes: seg.classes.filter((c) => c.toLowerCase().includes(s))
    })).filter((seg) => seg.classes.length > 0);
  }, [search]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/20 shadow-sm'
            : 'border-[#b9c0cb]/60 hover:border-[#51a8b1]/60 shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <GraduationCap className="w-4 h-4 text-[#51a8b1] shrink-0" />
          {selectedClasses.length === 0 ? (
            <span className="text-xs text-rose-500 font-semibold italic">
              ⚠️ No classes selected for {mediumName} — click dropdown to choose
            </span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-[#1c4d52]">
                {selectedClasses.length} Classes Assigned:
              </span>
              <div className="flex items-center gap-1 flex-wrap max-h-16 overflow-y-auto">
                {selectedClasses.slice(0, 7).map((cls) => (
                  <span
                    key={cls}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#eef7f8] text-[#1c4d52] border border-[#b6e0e4] text-[11px] font-bold"
                  >
                    <span>{cls}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleClass(cls);
                        }}
                        className="text-[#51a8b1] hover:text-rose-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5 stroke-[2.5]" />
                      </button>
                    )}
                  </span>
                ))}
                {selectedClasses.length > 7 && (
                  <span className="text-[10px] font-extrabold text-[#51a8b1] bg-white px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                    +{selectedClasses.length - 7} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#8c96a5]">
          <span className="text-[11px] font-bold bg-[#51a8b1] text-white px-2.5 py-0.5 rounded-lg shadow-2xs">
            {selectedClasses.length} / {ALL_AVAILABLE_CLASSES.length}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#51a8b1]' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Popup Content */}
      {isOpen && (
        <div className="absolute z-40 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#b6e0e4] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[420px] flex flex-col">
          {/* Header Controls: Search & Smart Presets */}
          <div className="p-3 bg-[#f8fafb] border-b border-[#b9c0cb]/40 space-y-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8c96a5] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search classes for ${mediumName} (e.g. Class 10, PCM, KG)...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#b9c0cb]/60 text-xs font-medium text-[#333333] placeholder-[#8c96a5] focus:outline-none focus:border-[#51a8b1] focus:ring-1 focus:ring-[#51a8b1] bg-white"
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c96a5] hover:text-[#333333]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Fill Preset Buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10.5px] font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading mr-1">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => setPresetClasses(CLASS_SEGMENTS[0].classes)}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#b6e0e4] text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer"
              >
                KG-5
              </button>
              <button
                type="button"
                onClick={() => setPresetClasses(CLASS_SEGMENTS[1].classes)}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#b6e0e4] text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer"
              >
                6-8
              </button>
              <button
                type="button"
                onClick={() => setPresetClasses(CLASS_SEGMENTS[2].classes)}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#b6e0e4] text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer"
              >
                9-10
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresetClasses([
                    ...CLASS_SEGMENTS[0].classes,
                    ...CLASS_SEGMENTS[1].classes,
                    ...CLASS_SEGMENTS[2].classes,
                  ])
                }
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#b6e0e4] text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer"
              >
                KG-10 (All)
              </button>
              <button
                type="button"
                onClick={() =>
                  setPresetClasses([
                    ...CLASS_SEGMENTS[3].classes,
                    ...CLASS_SEGMENTS[4].classes,
                  ])
                }
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-white border border-[#b6e0e4] text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer"
              >
                11 & 12
              </button>
              <button
                type="button"
                onClick={() => setPresetClasses(ALL_AVAILABLE_CLASSES)}
                className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-[#51a8b1] text-white hover:bg-[#3a7d84] transition cursor-pointer shadow-2xs"
              >
                Select All
              </button>
              {selectedClasses.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Segmented Checklist */}
          <div className="overflow-y-auto p-3 space-y-3.5 flex-1">
            {filteredSegments.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8c96a5]">
                No classes matching "{search}"
              </div>
            ) : (
              filteredSegments.map((segment) => {
                const allSelected = segment.classes.every((c) =>
                  selectedClasses.includes(c)
                );

                return (
                  <div key={segment.id} className="space-y-1.5">
                    {/* Segment Header */}
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-[#3a7d84] uppercase tracking-wider bg-[#f8fafb] px-2.5 py-1 rounded-lg border border-[#b9c0cb]/30">
                      <span className="font-heading">{segment.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (allSelected) {
                            onChange(
                              selectedClasses.filter(
                                (c) => !segment.classes.includes(c)
                              )
                            );
                          } else {
                            onChange(
                              Array.from(
                                new Set([...selectedClasses, ...segment.classes])
                              )
                            );
                          }
                        }}
                        className="text-[10px] lowercase font-bold text-[#51a8b1] hover:underline cursor-pointer"
                      >
                        {allSelected ? 'unselect group' : 'select group'}
                      </button>
                    </div>

                    {/* Class Buttons Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                      {segment.classes.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => toggleClass(cls)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between gap-1.5 cursor-pointer text-left ${
                              isChecked
                                ? 'bg-[#eef7f8] text-[#1c4d52] border-[#51a8b1] shadow-2xs ring-1 ring-[#51a8b1]/30 font-extrabold'
                                : 'bg-white text-[#4a5462] border-[#b9c0cb]/40 hover:bg-[#f8fafb]'
                            }`}
                          >
                            <span className="truncate">{cls}</span>
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                isChecked
                                  ? 'bg-[#51a8b1] border-[#3a7d84] text-white'
                                  : 'border-[#b9c0cb] bg-white'
                              }`}
                            >
                              {isChecked && (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Done Button */}
          <div className="p-2.5 bg-[#f8fafb] border-t border-[#b9c0cb]/40 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-[#333333]">
              {selectedClasses.length} classes active for {mediumName}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1 rounded-xl bg-[#51a8b1] text-white text-xs font-bold hover:bg-[#3a7d84] transition shadow-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Content Configuration Section Component
// ============================================================================
export function ContentConfigSection({
  value,
  onChange,
  disabled = false,
}: ContentConfigSectionProps) {
  // Extract initial Content Domains (multi-select)
  const initialContent = useMemo(() => {
    if (Array.isArray(value?.contents) && value.contents.length > 0) return value.contents;
    if (Array.isArray(value?.categories) && value.categories.length > 0) return value.categories;
    const single = value?.content || value?.category || 'General Core Curriculum';
    return [single];
  }, [value]);

  // Extract initial Board
  const initialBoard = useMemo(() => {
    return value?.board || 'CBSE';
  }, [value]);

  // Extract initial Mediums
  const initialMediums = useMemo(() => {
    if (Array.isArray(value?.mediums) && value.mediums.length > 0) return value.mediums;
    if (Array.isArray(value?.languages) && value.languages.length > 0) return value.languages;
    if (typeof value?.medium === 'string' && value.medium.trim()) return [value.medium.trim()];
    if (typeof value?.language === 'string' && value.language.trim()) {
      if (value.language.includes(',')) {
        return value.language.split(',').map((s: string) => s.trim()).filter(Boolean);
      }
      return [value.language.trim()];
    }
    if (Array.isArray(value?.mediumConfigs) && value.mediumConfigs.length > 0) {
      return value.mediumConfigs.map((m: any) => m.medium).filter(Boolean);
    }
    return ['English'];
  }, [value]);

  // Extract initial Medium-to-Classes map
  const initialMediumClasses = useMemo(() => {
    const map: Record<string, string[]> = {};
    const defaultClasses = [...DEFAULT_STANDARD_CLASSES];

    if (value?.mediumClasses && typeof value.mediumClasses === 'object') {
      Object.entries(value.mediumClasses).forEach(([med, clsList]) => {
        map[med] = normalizeArray(clsList, defaultClasses);
      });
    } else if (Array.isArray(value?.mediumConfigs) && value.mediumConfigs.length > 0) {
      value.mediumConfigs.forEach((mc: any) => {
        if (mc.medium) {
          map[mc.medium] = normalizeArray(mc.classes, defaultClasses);
        }
      });
    } else if (Array.isArray(value?.configurations) && value.configurations.length > 0) {
      value.configurations.forEach((c: any) => {
        const med = c.medium || c.language || 'English';
        map[med] = normalizeArray(c.classes, defaultClasses);
      });
    } else if (Array.isArray(value?.sets) && value.sets.length > 0) {
      value.sets.forEach((s: any) => {
        const med = s.language || s.languages?.[0] || 'English';
        map[med] = normalizeArray(s.classes, defaultClasses);
      });
    } else {
      const fallbackClasses = normalizeArray(value?.classes, defaultClasses);
      initialMediums.forEach((m: string) => {
        map[m] = [...fallbackClasses];
      });
    }

    initialMediums.forEach((m: string) => {
      if (!map[m] || map[m].length === 0) {
        map[m] = [...defaultClasses];
      }
    });

    return map;
  }, [value, initialMediums]);

  const [contents, setContents] = useState<string[]>(initialContent);
  const [board, setBoard] = useState<string>(initialBoard);
  const [selectedMediums, setSelectedMediums] = useState<string[]>(initialMediums);
  const [mediumClasses, setMediumClasses] = useState<Record<string, string[]>>(initialMediumClasses);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  useEffect(() => {
    setContents(initialContent);
    setBoard(initialBoard);
    setSelectedMediums(initialMediums);
    setMediumClasses(initialMediumClasses);
  }, [initialContent, initialBoard, initialMediums, initialMediumClasses]);

  const availableMediums = useMemo(() => {
    return BOARD_MEDIUM_MAP[board] || ALL_MEDIUMS;
  }, [board]);

  const emitChanges = (
    newContents: string[],
    newBoard: string,
    newMediums: string[],
    newMediumClasses: Record<string, string[]>
  ) => {
    const mediumConfigs = newMediums.map((m) => ({
      medium: m,
      classes: newMediumClasses[m] || []
    }));

    const configurations = newMediums.map((m, idx) => ({
      id: `cfg_${idx + 1}`,
      contents: newContents,
      content: newContents[0] || '',
      board: newBoard,
      medium: m,
      classes: newMediumClasses[m] || []
    }));

    const sets = newMediums.map((m, idx) => ({
      id: `set_${idx + 1}`,
      categories: newContents,
      category: newContents[0] || '',
      board: newBoard,
      languages: [m],
      language: m,
      classes: newMediumClasses[m] || []
    }));

    const allUnionClasses = Array.from(
      new Set(newMediums.flatMap((m) => newMediumClasses[m] || []))
    );

    const payload = {
      ...(typeof value === 'object' && value !== null ? value : {}),
      contents: newContents,
      content: newContents[0] || '',
      categories: newContents,
      category: newContents[0] || '',
      board: newBoard,
      mediums: newMediums,
      languages: newMediums,
      language: newMediums.join(', '),
      mediumClasses: newMediumClasses,
      mediumConfigs,
      configurations,
      sets,
      classes: allUnionClasses
    };

    onChange(payload);
  };

  const handleContentToggle = (id: string) => {
    const next = contents.includes(id)
      ? contents.filter((c) => c !== id)
      : [...contents, id];
    // Keep at least one selected
    const nextFinal = next.length === 0 ? [id] : next;
    setContents(nextFinal);
    emitChanges(nextFinal, board, selectedMediums, mediumClasses);
  };

  const handleBoardChange = (newB: string) => {
    setBoard(newB);
    const validBoardMediums = BOARD_MEDIUM_MAP[newB] || ALL_MEDIUMS;
    const keptMediums = selectedMediums.filter((m) => validBoardMediums.includes(m));
    const nextMediums = keptMediums.length > 0 ? keptMediums : [validBoardMediums[0] || 'English'];

    const nextMap: Record<string, string[]> = { ...mediumClasses };
    nextMediums.forEach((m) => {
      if (!nextMap[m] || nextMap[m].length === 0) {
        nextMap[m] = [...DEFAULT_STANDARD_CLASSES];
      }
    });

    setSelectedMediums(nextMediums);
    setMediumClasses(nextMap);
    emitChanges(contents, newB, nextMediums, nextMap);
  };

  const handleMediumsChange = (nextMediums: string[]) => {
    if (disabled) return;
    const nextMap = { ...mediumClasses };

    nextMediums.forEach((m) => {
      if (!nextMap[m] || nextMap[m].length === 0) {
        const firstExistingMedium = selectedMediums[0];
        const seedClasses = (firstExistingMedium && mediumClasses[firstExistingMedium]) || DEFAULT_STANDARD_CLASSES;
        nextMap[m] = [...seedClasses];
      }
    });

    // Remove deleted mediums from map
    Object.keys(nextMap).forEach((m) => {
      if (!nextMediums.includes(m)) {
        delete nextMap[m];
      }
    });

    setSelectedMediums(nextMediums);
    setMediumClasses(nextMap);
    emitChanges(contents, board, nextMediums, nextMap);
  };

  const handleClassesChangeForMedium = (med: string, newClasses: string[]) => {
    if (disabled) return;
    const nextMap = { ...mediumClasses, [med]: newClasses };
    setMediumClasses(nextMap);
    emitChanges(contents, board, selectedMediums, nextMap);
  };

  const copyClassesToAll = (sourceMed: string) => {
    if (disabled) return;
    const sourceList = mediumClasses[sourceMed] || [];
    const nextMap: Record<string, string[]> = {};
    selectedMediums.forEach((m) => {
      nextMap[m] = [...sourceList];
    });
    setMediumClasses(nextMap);
    emitChanges(contents, board, selectedMediums, nextMap);
    setCopiedNotification(`Applied ${sourceList.length} classes from ${sourceMed} Medium to all mediums!`);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  const totalUniqueClasses = Array.from(
    new Set(selectedMediums.flatMap((m) => mediumClasses[m] || []))
  ).length;

  return (
    <div className="w-full font-sans space-y-4">
      {/* MAIN CONTAINER */}
      <div className="bg-white rounded-3xl border border-[#b9c0cb]/40 shadow-sm overflow-hidden transition-all">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] p-4 sm:p-5 border-b border-[#b6e0e4]/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#51a8b1] text-white flex items-center justify-center shrink-0 shadow-xs">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-[#1c4d52] font-heading">
                    Content Configuration
                  </h3>
                  <span className="text-[10.5px] font-bold bg-[#eef7f8] text-[#51a8b1] px-2.5 py-0.5 rounded-full border border-[#b6e0e4]">
                    Label Multi-Select
                  </span>
                </div>
                <p className="text-xs text-[#8c96a5] mt-0.5">
                  Content Labels Multi-Select ➔ Board Dropdown ➔ Medium(s) Multi-Select ➔ Per-Medium Class Multi-Select
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#b6e0e4] text-xs font-semibold text-[#1c4d52] shadow-2xs flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#51a8b1]" />
                <span className="font-bold">{contents.length} Topic{contents.length > 1 ? 's' : ''}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#b6e0e4] text-xs font-semibold text-[#1c4d52] shadow-2xs flex items-center gap-1.5">
                <span className="text-[#8c96a5]">Board:</span>
                <span className="font-bold text-[#333333]">{board}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#b6e0e4] text-xs font-semibold text-[#51a8b1] shadow-2xs flex items-center gap-1.5">
                <LanguagesIcon className="w-3.5 h-3.5" />
                <span className="font-bold">{selectedMediums.length} Mediums</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#51a8b1] text-white text-xs font-bold shadow-xs flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{totalUniqueClasses} Classes Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKSPACE BODY */}
        <div className="p-4 sm:p-6 space-y-6">

          {/* ========================================================================= */}
          {/* STEP 1: CONTENT CATEGORY (LABEL MULTI-SELECT) */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center text-[10px] font-black">
                  1
                </span>
                <Tag className="w-3.5 h-3.5 text-[#51a8b1]" />
                Select Category
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#1c4d52] bg-[#eef7f8] px-2.5 py-0.5 rounded-lg border border-[#b6e0e4]">
                  {contents.length} Selected
                </span>
                {contents.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={() => { setContents(['General Core Curriculum']); emitChanges(['General Core Curriculum'], board, selectedMediums, mediumClasses); }}
                    className="text-[11px] font-bold text-[#8c96a5] hover:text-rose-500 px-2 py-0.5 rounded-lg border border-[#b9c0cb]/40 hover:border-rose-300 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Selected labels preview strip */}
            {contents.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {contents.map((cId) => {
                  const opt = CONTENT_OPTIONS.find((o) => o.id === cId);
                  return (
                    <span
                      key={cId}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-2xs ${opt?.color || 'bg-[#eef7f8] border-[#b6e0e4] text-[#1c4d52]'}`}
                    >
                      <span>{opt?.label || cId}</span>
                      {contents.length > 1 && !disabled && (
                        <button
                          type="button"
                          onClick={() => handleContentToggle(cId)}
                          className="opacity-60 hover:opacity-100 hover:text-rose-600 transition ml-0.5"
                        >
                          <X className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Label chips grid */}
            <div className="p-3 rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/40">
              <p className="text-[10.5px] font-extrabold text-[#8c96a5] uppercase tracking-wider mb-2.5">
                Select category
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_OPTIONS.map((opt) => {
                  const isSelected = contents.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleContentToggle(opt.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-bold transition-all cursor-pointer shadow-2xs ${
                        isSelected
                          ? `${opt.color} ring-2 ring-offset-1 ring-[#51a8b1]/40 scale-[1.03]`
                          : 'bg-white border-[#b9c0cb]/60 text-[#4a5462] hover:border-[#51a8b1]/60 hover:bg-[#f0f8f9]'
                      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <span className="w-3.5 h-3.5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* STEP 2: EDUCATIONAL BOARD (SINGLE-SELECT DROPDOWN) */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                Select Educational Board
              </label>
              <span className="text-[11px] font-bold text-[#333333] bg-[#f8fafb] px-2.5 py-0.5 rounded-lg border border-[#b9c0cb]/40">
                Selected: {board}
              </span>
            </div>

            <div className="relative">
              <select
                disabled={disabled}
                value={board}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full h-11 border border-[#b9c0cb]/60 rounded-2xl px-3.5 text-xs bg-white text-[#1c4d52] font-extrabold focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] cursor-pointer shadow-2xs transition-all"
              >
                {BOARD_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} — {b.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* STEP 3: MEDIUM SELECTION (MULTI-SELECT DROPDOWN FILTERED FOR BOARD) */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <LanguagesIcon className="w-3.5 h-3.5 text-[#51a8b1]" />
                Select Medium(s) of Instruction (Filtered for {board})
              </label>
              <span className="text-[11px] font-bold text-[#51a8b1] bg-[#eef7f8] px-2.5 py-0.5 rounded-lg border border-[#b6e0e4]">
                {selectedMediums.length} Mediums Active
              </span>
            </div>

            <MediumMultiSelectDropdown
              boardName={board}
              options={availableMediums}
              selected={selectedMediums}
              onChange={handleMediumsChange}
              disabled={disabled}
            />
          </div>

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* STEP 4: PER-MEDIUM CLASS DROPDOWNS */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <label className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center text-[10px] font-black">
                  4
                </span>
                <GraduationCap className="w-3.5 h-3.5 text-[#51a8b1]" />
                Configure Classes via Dropdown (Independently for Each Medium)
              </label>

              {selectedMediums.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-[#8c96a5] font-semibold">Quick Copy:</span>
                  {selectedMediums.map((med) => (
                    <button
                      key={med}
                      type="button"
                      disabled={disabled}
                      onClick={() => copyClassesToAll(med)}
                      className="flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-1 rounded-lg bg-[#eef7f8] text-[#3a7d84] border border-[#b6e0e4] hover:bg-[#51a8b1] hover:text-white transition cursor-pointer shadow-2xs"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy "{med}" to All</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {copiedNotification && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{copiedNotification}</span>
              </div>
            )}

            {/* Render a dedicated Class Dropdown section for EACH chosen medium */}
            <div className="space-y-3.5">
              {selectedMediums.map((med, index) => {
                const classList = mediumClasses[med] || [];

                return (
                  <div
                    key={med}
                    className="p-4 rounded-3xl bg-gradient-to-br from-[#fbfdfd] to-white border-2 border-[#51a8b1]/30 shadow-xs space-y-3"
                  >
                    {/* Medium Card Header */}
                    <div className="flex items-center justify-between border-b border-[#f1f3f6] pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#51a8b1] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-extrabold text-[#1c4d52] font-heading">
                              {med} Medium Classes
                            </h4>
                            <span className="text-[10px] font-extrabold bg-[#eef7f8] text-[#51a8b1] px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                              {classList.length} Classes
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8c96a5]">
                            Select classes specifically for the <strong className="text-[#333333]">{med}</strong> curriculum track
                          </p>
                        </div>
                      </div>

                      {/* Tag preview */}
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-[10.5px] font-semibold text-[#8c96a5]">
                          {classList.length > 0
                            ? `${classList.length} of ${ALL_AVAILABLE_CLASSES.length} active`
                            : 'No classes active'}
                        </span>
                      </div>
                    </div>

                    {/* Class Multi-Select Dropdown for this Medium */}
                    <div className="space-y-2">
                      <ClassMultiSelectDropdown
                        mediumName={med}
                        selectedClasses={classList}
                        onChange={(newClasses) => handleClassesChangeForMedium(med, newClasses)}
                        disabled={disabled}
                      />

                      {/* Removable Tag Pills Cloud below dropdown */}
                      {classList.length > 0 && (
                        <div className="p-2.5 rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/30 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10.5px] font-bold text-[#8c96a5] mr-1">
                            Selected Tags:
                          </span>
                          {classList.map((cls) => (
                            <span
                              key={cls}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#b6e0e4] text-[11px] font-bold text-[#1c4d52] shadow-2xs hover:border-rose-300 transition"
                            >
                              <span>{cls}</span>
                              {!disabled && (
                                <button
                                  type="button"
                                  title={`Remove ${cls}`}
                                  onClick={() =>
                                    handleClassesChangeForMedium(
                                      med,
                                      classList.filter((c) => c !== cls)
                                    )
                                  }
                                  className="text-[#8c96a5] hover:text-rose-600 transition-colors"
                                >
                                  <X className="w-3 h-3 stroke-[2.5]" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* FINAL SUMMARY MATRIX: LIVE DECK OVERVIEW */}
          {/* ========================================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#51a8b1]" />
                Live Configuration Summary
              </h4>
              <span className="text-[11px] text-[#8c96a5]">
                {selectedMediums.length} Medium Stream{selectedMediums.length > 1 ? 's' : ''} Configured
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#b9c0cb]/40 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f8fafb] border-b border-[#b9c0cb]/40 text-[11px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                    <th className="py-2.5 px-4 min-w-[180px]">Content Domain(s)</th>
                    <th className="py-2.5 px-4 min-w-[100px]">Board</th>
                    <th className="py-2.5 px-4 min-w-[120px]">Medium</th>
                    <th className="py-2.5 px-4 min-w-[240px]">Configured Classes</th>
                    <th className="py-2.5 px-4 text-right min-w-[80px]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f6] bg-white">
                  {selectedMediums.map((med) => {
                    const classesList = mediumClasses[med] || [];

                    return (
                      <tr key={med} className="hover:bg-[#fbfdfd] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#1c4d52]">
                          <div className="flex flex-wrap gap-1">
                            {contents.map((cId) => {
                              const opt = CONTENT_OPTIONS.find((o) => o.id === cId);
                              return (
                                <span key={cId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-bold shadow-2xs ${opt?.color || 'bg-[#eef7f8] border-[#b6e0e4] text-[#1c4d52]'}`}>
                                  <span>{opt?.label || cId}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-[#333333]">
                          {board}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-[#51a8b1]">
                          {med} Medium
                        </td>
                        <td className="py-3 px-4">
                          {classesList.length > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {classesList.map((c) => (
                                <span
                                  key={c}
                                  className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white border border-[#b9c0cb]/60 text-[#333333] shadow-2xs"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-rose-500 italic text-[11px] font-semibold">
                              ⚠️ No classes selected for this medium
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-[#51a8b1]">
                          {classesList.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
