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

export interface ContentOptionItem {
  id: string;
  label: string;
  color: string;
  isCurriculum: boolean;
  section: 'academic' | 'non-academic';
  icon: string;
}

// 1. Content Category Options: Academic Curriculum (Syllabus Content only) vs Co-Curricular
export const CONTENT_OPTIONS: ContentOptionItem[] = [
  // Academic Curriculum (Board × Medium × Grade)
  { id: 'Syllabus Content', label: 'Syllabus Content', color: 'bg-cyan-50 border-cyan-200 text-cyan-800', isCurriculum: true, section: 'academic', icon: '📖' },
  // Co-Curricular items (Medium Only - No Board / No Grade)
  { id: 'Toon Masti', label: 'Toon Masti', color: 'bg-pink-50 border-pink-200 text-pink-800', isCurriculum: false, section: 'non-academic', icon: '🎭' },
  { id: 'Simulations', label: 'Simulations', color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800', isCurriculum: false, section: 'non-academic', icon: '🔬' },
  { id: 'Moral Stories', label: 'Moral Stories', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', isCurriculum: false, section: 'non-academic', icon: '🌟' },
  { id: 'ePustakalaya', label: 'ePustakalaya', color: 'bg-amber-50 border-amber-200 text-amber-800', isCurriculum: false, section: 'non-academic', icon: '📚' },
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

import {
  MASTER_GRADES,
  ALL_GRADE_NAMES,
  PRIMARY_GRADE_NAMES,
  MIDDLE_GRADE_NAMES,
  SECONDARY_GRADE_NAMES,
  SR_SECONDARY_GRADE_NAMES,
  isGradeSelected,
} from '@/types/grade';

// 4. Granular Class Matrix Segments directly derived from MongoDB Grade model
export const CLASS_SEGMENTS = [
  {
    id: 'primary',
    name: 'Primary (1 - 5)',
    classes: PRIMARY_GRADE_NAMES
  },
  {
    id: 'middle',
    name: 'Middle School (6 - 8)',
    classes: MIDDLE_GRADE_NAMES
  },
  {
    id: 'secondary',
    name: 'Secondary (9 - 10)',
    classes: SECONDARY_GRADE_NAMES
  },
  {
    id: 'senior_sec',
    name: 'Senior Secondary (11 & 12 Streams)',
    classes: SR_SECONDARY_GRADE_NAMES
  }
];

export const ALL_AVAILABLE_CLASSES = ALL_GRADE_NAMES;

const DEFAULT_STANDARD_CLASSES = [
  ...PRIMARY_GRADE_NAMES,
  ...MIDDLE_GRADE_NAMES,
  ...SECONDARY_GRADE_NAMES
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
    const isSel = isGradeSelected(selectedClasses, cls);
    if (isSel) {
      onChange(selectedClasses.filter((c) => !isGradeSelected([c], cls)));
    } else {
      onChange([...selectedClasses, cls]);
    }
  };

  const setPresetClasses = (classesList: string[]) => {
    if (disabled) return;
    onChange(Array.from(new Set(classesList)));
  };

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return ALL_AVAILABLE_CLASSES;
    const s = search.toLowerCase();
    return ALL_AVAILABLE_CLASSES.filter((cls) => {
      const displayLabel = !isNaN(Number(cls)) ? `Class ${cls}` : cls;
      return (
        displayLabel.toLowerCase().includes(s) ||
        cls.toLowerCase().includes(s)
      );
    });
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
                {selectedClasses.slice(0, 8).map((cls) => {
                  const displayLabel = !isNaN(Number(cls)) ? `Class ${cls}` : cls;
                  return (
                    <span
                      key={cls}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#eef7f8] text-[#1c4d52] border border-[#b6e0e4] text-[11px] font-bold"
                    >
                      <span>{displayLabel}</span>
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
                  );
                })}
                {selectedClasses.length > 8 && (
                  <span className="text-[10px] font-extrabold text-[#51a8b1] bg-white px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                    +{selectedClasses.length - 8} more
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
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#b6e0e4] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[320px] flex flex-col">
          {/* Header Controls: Search & Simple Quick Actions */}
          <div className="p-2.5 bg-[#f8fafb] border-b border-[#b9c0cb]/40 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8c96a5] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Filter classes for ${mediumName} (e.g. Class 10, 11 Science)...`}
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

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between text-[11px] px-1 font-bold">
              <span className="text-[#8c96a5]">
                All Classes ({filteredClasses.length} of {ALL_AVAILABLE_CLASSES.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(ALL_AVAILABLE_CLASSES)}
                  className="text-[#51a8b1] hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-[#8c96a5] hover:text-rose-500 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable List of All Classes with Visible Thin Scrollbar */}
          <div
            className="overflow-y-auto p-2.5 flex-1 max-h-[175px] pr-2 overscroll-contain select-none"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#51a8b1 #f0f8f9'
            }}
          >
            {filteredClasses.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8c96a5]">
                No classes matching "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                {filteredClasses.map((cls) => {
                  const isChecked = isGradeSelected(selectedClasses, cls);
                  const displayLabel = !isNaN(Number(cls)) ? `Class ${cls}` : cls;
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
                      <span className="truncate">{displayLabel}</span>
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
            )}
          </div>

          {/* Footer Done Button */}
          <div className="p-2 bg-[#f8fafb] border-t border-[#b9c0cb]/40 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-[#333333]">
              {selectedClasses.length} of {ALL_AVAILABLE_CLASSES.length} active
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
    const single = value?.content || value?.category || 'Syllabus Content';
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

  // Separate selected categories into Curriculum (Academic) vs Co-Curricular (Medium only)
  const curriculumCategories = useMemo(() => {
    return contents.filter((c) => {
      const opt = CONTENT_OPTIONS.find((o) => o.id === c);
      return opt ? opt.isCurriculum : true;
    });
  }, [contents]);

  const coCurricularCategories = useMemo(() => {
    return contents.filter((c) => {
      const opt = CONTENT_OPTIONS.find((o) => o.id === c);
      return opt ? !opt.isCurriculum : false;
    });
  }, [contents]);

  // Non-Curriculum Mediums & Resource Links state
  const [coCurricularMediums, setNonCurriculumMediums] = useState<Record<string, string[]>>(() => {
    if (value?.coCurricularMediums && typeof value.coCurricularMediums === 'object') {
      return value.coCurricularMediums;
    }
    return {
      'Toon Masti': ['Hindi', 'English'],
      'Simulations': ['Hindi', 'English'],
      'Moral Stories': ['Hindi', 'English'],
      'ePustakalaya': ['Hindi', 'English'],
    };
  });

  const [coCurricularDetails, setNonCurriculumDetails] = useState<Record<string, Record<string, { sheetUrl?: string; driveLink?: string; totalItems?: number }>>>(() => {
    return value?.coCurricularDetails || value?.coCurricularDetails || {};
  });


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
    newMediumClasses: Record<string, string[]>,
    newCoCurrMediums?: Record<string, string[]>,
    newCoCurrDetails?: Record<string, Record<string, any>>
  ) => {
    const curMed = newCoCurrMediums || coCurricularMediums;
    const curDet = newCoCurrDetails || coCurricularDetails;

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

    // Build structured ContentRequirement schema payload
    const structuredCategories = newContents.map((catName) => {
      const opt = CONTENT_OPTIONS.find((o) => o.id === catName);
      const isCurric = opt ? opt.isCurriculum : true;

      if (isCurric) {
        return {
          name: catName,
          isCurriculum: true,
          section: 'academic',
          curriculumReq: newMediums.map((med) => ({
            board: newBoard,
            medium: med,
            grade: newMediumClasses[med]?.join(', ') || 'Class 1 to 10',
          })),
        };
      } else {
        const catMediums = curMed[catName] || ['Hindi', 'English'];
        return {
          name: catName,
          isCurriculum: false,
          section: 'non-academic',
          coCurricularReq: catMediums.map((med) => ({
            medium: med,
            sheetUrl: curDet[catName]?.[med]?.sheetUrl || '',
            driveLink: curDet[catName]?.[med]?.driveLink || '',
            totalItemsCount: curDet[catName]?.[med]?.totalItems || 0,
          })),
          nonCurriculumReq: catMediums.map((med) => ({
            medium: med,
            sheetUrl: curDet[catName]?.[med]?.sheetUrl || '',
            driveLink: curDet[catName]?.[med]?.driveLink || '',
            totalItemsCount: curDet[catName]?.[med]?.totalItems || 0,
          })),
        };
      }
    });

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
      classes: allUnionClasses,
      coCurricularMediums: curMed,
      coCurricularDetails: curDet,
      contentReq: {
        categories: structuredCategories,
      },
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
                    onClick={() => { setContents(['Syllabus Content']); emitChanges(['Syllabus Content'], board, selectedMediums, mediumClasses); }}
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

            {/* Label chips grid categorized by Curriculum vs Co-Curricular */}
            <div className="space-y-3">
              {/* 1. Academic Curriculum Categories */}
              <div className="p-3.5 rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold text-[#3a7d84] uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <BookOpen className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Academic Curriculum Categories (Requires Board × Medium × Grade)
                  </span>
                  <span className="text-[10px] text-[#51a8b1] font-bold bg-[#eef7f8] px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                    {curriculumCategories.length} Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_OPTIONS.filter((o) => o.isCurriculum).map((opt) => {
                    const isSelected = contents.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleContentToggle(opt.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-bold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? `${opt.color} ring-2 ring-offset-1 ring-[#51a8b1]/40 scale-[1.02]`
                            : 'bg-white border-[#b9c0cb]/60 text-[#4a5462] hover:border-[#51a8b1]/60 hover:bg-[#f0f8f9]'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>{opt.icon}</span>
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

              {/* 2. Co-Curricular Categories */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50/40 via-amber-50/30 to-purple-50/40 border border-pink-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold text-pink-900 uppercase tracking-wider flex items-center gap-1.5 font-heading">
                    <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                    Co-Curricular Categories (Medium Only — No Board / No Grade)
                  </span>
                  <span className="text-[10px] text-pink-700 font-bold bg-pink-100 px-2 py-0.5 rounded-md border border-pink-200">
                    {coCurricularCategories.length} Active
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_OPTIONS.filter((o) => !o.isCurriculum).map((opt) => {
                    const isSelected = contents.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleContentToggle(opt.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11.5px] font-bold transition-all cursor-pointer shadow-2xs ${
                          isSelected
                            ? `${opt.color} ring-2 ring-offset-1 ring-pink-400 scale-[1.02]`
                            : 'bg-white border-pink-200 text-[#4a5462] hover:border-pink-400 hover:bg-pink-50/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-pink-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* CURRICULUM SECTION (BOARD x MEDIUM x GRADE) */}
          {/* ========================================================================= */}
          {curriculumCategories.length > 0 ? (
            <div className="space-y-6">
              {/* STEP 2: EDUCATIONAL BOARD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#51a8b1] text-white flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Select Educational Board (For Curriculum)
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

              {/* STEP 3: MEDIUM SELECTION */}
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

              {/* STEP 4: PER-MEDIUM CLASS DROPDOWNS */}
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
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/40 text-center">
              <p className="text-xs font-bold text-[#8c96a5]">
                ℹ️ No Curriculum categories selected. Board & Grade mappings are bypassed.
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CO-CURRICULAR SECTION (MEDIUM ONLY — NO BOARD, NO GRADE) */}
          {/* ========================================================================= */}
          {coCurricularCategories.length > 0 && (
            <>
              <div className="h-px bg-[#f1f3f6]" />

              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#fdfbf7] via-white to-[#fffaf5] border-2 border-amber-300/70 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-amber-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-sm font-black shadow-xs">
                      🎭
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-950 font-heading">
                        Co-Curricular Requirement (Medium-Only Stream)
                      </h4>
                      <p className="text-[11px] text-amber-700/80">
                        Content is mapped purely by <strong>Medium (Language)</strong> — Board & Grade dependencies are bypassed.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-300">
                    {coCurricularCategories.length} Category Stream{coCurricularCategories.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-4">
                  {coCurricularCategories.map((catName) => {
                    const activeMedList = coCurricularMediums[catName] || ['Hindi', 'English'];
                    return (
                      <div key={catName} className="p-4 rounded-2xl bg-white border border-amber-200 space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#1c4d52] flex items-center gap-1.5">
                            <span>{CONTENT_OPTIONS.find((o) => o.id === catName)?.icon || '📌'}</span>
                            <span>{catName}</span>
                          </span>
                          <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {activeMedList.length} Mediums Selected
                          </span>
                        </div>

                        {/* Medium Chips for this Co-Curricular Item */}
                        <div className="space-y-1.5">
                          <span className="text-[10.5px] font-bold text-[#8c96a5]">
                            Select Active Mediums for {catName}:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_MEDIUMS.slice(0, 6).map((med) => {
                              const isSelected = activeMedList.includes(med);
                              return (
                                <button
                                  key={med}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() => {
                                    const next = isSelected
                                      ? activeMedList.length > 1 ? activeMedList.filter((m) => m !== med) : activeMedList
                                      : [...activeMedList, med];
                                    const nextMap = { ...coCurricularMediums, [catName]: next };
                                    setNonCurriculumMediums(nextMap);
                                    emitChanges(contents, board, selectedMediums, mediumClasses, nextMap, coCurricularDetails);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-100 border-amber-400 text-amber-900 font-extrabold'
                                      : 'bg-white border-[#b9c0cb]/40 text-[#4a5462] hover:bg-amber-50/50'
                                  }`}
                                >
                                  {med} {isSelected && '✓'}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Per Medium Resource Links / Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {activeMedList.map((med) => {
                            const currentDetail = coCurricularDetails[catName]?.[med] || {};
                            return (
                              <div key={med} className="p-3 rounded-xl bg-[#fdfbf7] border border-amber-200/80 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                                  <span className="flex items-center gap-1 font-extrabold">
                                    <LanguagesIcon className="w-3.5 h-3.5 text-amber-600" />
                                    {med} Medium
                                  </span>
                                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">Ready</span>
                                </div>

                                <div className="space-y-1.5">
                                  <input
                                    type="url"
                                    placeholder={`Google Drive / Resource Folder (${med})`}
                                    value={currentDetail.driveLink || ''}
                                    disabled={disabled}
                                    onChange={(e) => {
                                      const nextDet = {
                                        ...coCurricularDetails,
                                        [catName]: {
                                          ...(coCurricularDetails[catName] || {}),
                                          [med]: {
                                            ...currentDetail,
                                            driveLink: e.target.value,
                                          },
                                        },
                                      };
                                      setNonCurriculumDetails(nextDet);
                                      emitChanges(contents, board, selectedMediums, mediumClasses, coCurricularMediums, nextDet);
                                    }}
                                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  />
                                  <input
                                    type="url"
                                    placeholder={`Master Sheet URL (${med})`}
                                    value={currentDetail.sheetUrl || ''}
                                    disabled={disabled}
                                    onChange={(e) => {
                                      const nextDet = {
                                        ...coCurricularDetails,
                                        [catName]: {
                                          ...(coCurricularDetails[catName] || {}),
                                          [med]: {
                                            ...currentDetail,
                                            sheetUrl: e.target.value,
                                          },
                                        },
                                      };
                                      setNonCurriculumDetails(nextDet);
                                      emitChanges(contents, board, selectedMediums, mediumClasses, coCurricularMediums, nextDet);
                                    }}
                                    className="w-full h-8 px-2.5 text-xs rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-[#f1f3f6]" />

          {/* ========================================================================= */}
          {/* FINAL SUMMARY MATRIX: LIVE DECK OVERVIEW */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#51a8b1]" />
                Live Configuration Summary
              </h4>
              <div className="flex items-center gap-2">
                {curriculumCategories.length > 0 && (
                  <span className="text-[11px] text-[#51a8b1] font-bold bg-[#eef7f8] px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                    {selectedMediums.length} Academic Medium Stream{selectedMediums.length > 1 ? 's' : ''}
                  </span>
                )}
                {coCurricularCategories.length > 0 && (
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {coCurricularCategories.length} Co-Curricular Stream{coCurricularCategories.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* 1. Academic Curriculum Matrix */}
            {curriculumCategories.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-extrabold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                  <span>📖</span> 1. Curriculum Stream (Board × Medium × Grade Relation)
                </span>
                <div className="overflow-x-auto rounded-2xl border border-[#b9c0cb]/40 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafb] border-b border-[#b9c0cb]/40 text-[11px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                        <th className="py-2.5 px-4 min-w-[180px]">Curriculum Domain(s)</th>
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
                                {curriculumCategories.map((cId) => {
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
            )}

            {/* 2. Co-Curricular Matrix */}
            {coCurricularCategories.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[10.5px] font-extrabold text-amber-900 uppercase tracking-wider font-heading flex items-center gap-1">
                  <span>🎭</span> 2. Co-Curricular Stream (Medium Only — No Board / No Grade)
                </span>
                <div className="overflow-x-auto rounded-2xl border border-amber-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#fdfbf7] border-b border-amber-200 text-[11px] font-bold text-amber-900 uppercase tracking-wider font-heading">
                        <th className="py-2.5 px-4 min-w-[160px]">Co-Curricular Domain</th>
                        <th className="py-2.5 px-4 min-w-[120px]">Dependency</th>
                        <th className="py-2.5 px-4 min-w-[200px]">Active Medium(s)</th>
                        <th className="py-2.5 px-4 min-w-[200px]">Linked Drive / Sheet</th>
                        <th className="py-2.5 px-4 text-right min-w-[80px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100 bg-white">
                      {coCurricularCategories.map((catName) => {
                        const opt = CONTENT_OPTIONS.find((o) => o.id === catName);
                        const medList = coCurricularMediums[catName] || ['Hindi', 'English'];

                        return (
                          <tr key={catName} className="hover:bg-amber-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-[#1c4d52]">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-2xs ${opt?.color || 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                <span>{opt?.icon || '🎭'}</span>
                                <span>{catName}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 font-extrabold text-amber-800 text-[11px]">
                              Language Medium Only
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 flex-wrap">
                                {medList.map((m) => (
                                  <span key={m} className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-[#fdfbf7] border border-amber-300 text-amber-900 shadow-2xs">
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-[#4a5462]">
                              {medList.map((m) => {
                                const d = coCurricularDetails[catName]?.[m];
                                return (
                                  <div key={m} className="truncate max-w-[220px]">
                                    <strong className="text-amber-800">{m}:</strong> {d?.driveLink || d?.sheetUrl || 'Configured via medium inputs'}
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                READY
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
