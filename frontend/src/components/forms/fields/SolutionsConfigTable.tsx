'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_SOLUTIONS,
  FOUNDATIONAL_CLASSES,
  MIDDLE_CLASSES,
  CLASS_11_STREAMS,
  CLASS_12_STREAMS,
  ALL_CLASSES,
  BOARD_OPTIONS,
  EffectiveSchoolItem,
  extractEffectiveSchools,
  getClassPreset
} from '../utils/formHelpers';
import {
  Check,
  School,
  BookOpen,
  ChevronDown,
  Search,
  X,
  GraduationCap,
  Copy,
  Layers,
  Trash2,
  CheckCircle2,
  Sparkles,
  Hash
} from 'lucide-react';

export {
  FOUNDATIONAL_CLASSES,
  MIDDLE_CLASSES,
  CLASS_11_STREAMS,
  CLASS_12_STREAMS,
  ALL_CLASSES,
  BOARD_OPTIONS
};

export interface SchoolSolutionItem {
  solutionKey: string;
  solutionName: string;
  quantity: number;
  targetClasses: string[];
  board: string;
  notes: string;
}

interface SolutionsConfigTableProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  schools?: any[];
  allFormData?: Record<string, any>;
}

// ─── CLASS MULTI-SELECT DROPDOWN COMPONENT ───
interface ClassesDropdownProps {
  selectedClasses: string[];
  onChange: (classes: string[]) => void;
  disabled?: boolean;
  solutionLabel: string;
}

function ClassesMultiSelectDropdown({
  selectedClasses,
  onChange,
  disabled = false,
  solutionLabel,
}: ClassesDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleClass = useCallback((cls: string) => {
    if (selectedClasses.includes(cls)) {
      onChange(selectedClasses.filter((c) => c !== cls));
    } else {
      onChange([...selectedClasses, cls]);
    }
  }, [selectedClasses, onChange]);

  const applyPreset = useCallback((presetType: string) => {
    onChange(getClassPreset(presetType));
  }, [onChange]);

  const filteredFoundational = useMemo(() =>
    FOUNDATIONAL_CLASSES.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filteredMiddle = useMemo(() =>
    MIDDLE_CLASSES.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filtered11 = useMemo(() =>
    CLASS_11_STREAMS.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );
  const filtered12 = useMemo(() =>
    CLASS_12_STREAMS.filter((c) => c.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const totalFilteredCount =
    filteredFoundational.length +
    filteredMiddle.length +
    filtered11.length +
    filtered12.length;

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <label className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-[#51a8b1]" />
          <span>Target Classes</span>
        </span>
        <span className="text-[10px] font-semibold text-[#3a7d84] bg-[#51a8b1]/10 px-2 py-0.5 rounded-md">
          {selectedClasses.length} Selected
        </span>
      </label>

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[38px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/25 shadow-xs'
            : 'border-slate-200 hover:border-[#51a8b1]/70'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 py-0.5">
          {selectedClasses.length === 0 ? (
            <span className="text-xs text-slate-400">
              Select classes for {solutionLabel}...
            </span>
          ) : (
            <>
              {selectedClasses.slice(0, 5).map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <span className="truncate max-w-[120px]">{cls}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleClass(cls);
                      }}
                      className="text-[#51a8b1] hover:text-rose-600 rounded p-0.5 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {selectedClasses.length > 5 && (
                <span className="text-[11px] font-bold bg-[#3a7d84] text-white px-2 py-0.5 rounded-md shadow-2xs">
                  +{selectedClasses.length - 5} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedClasses.length > 0 && !disabled && (
            <button
              type="button"
              title="Clear all classes"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#51a8b1] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Popover / Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#51a8b1]/40 rounded-2xl shadow-xl p-3 space-y-2.5 max-h-[360px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar & Quick Presets */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes or streams..."
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-slate-50/70"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[9.5px] font-bold text-slate-400 mr-0.5">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('PRIMARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-slate-700 transition cursor-pointer"
              >
                Primary (1-5)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('MIDDLE')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-slate-700 transition cursor-pointer"
              >
                Middle (6-8)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SECONDARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-slate-700 transition cursor-pointer"
              >
                High (9-10)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SR_SECONDARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-slate-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-slate-700 transition cursor-pointer"
              >
                11 &amp; 12 All
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ALL')}
                className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-[#3a7d84] text-white hover:bg-[#2d6268] transition cursor-pointer"
              >
                All (1-12)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('CLEAR')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer ml-auto"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Classes Category Sections */}
          <div className="overflow-y-auto space-y-3 pr-1 flex-1 max-h-[220px]">
            {totalFilteredCount === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No classes match &quot;{searchQuery}&quot;
              </div>
            ) : (
              <>
                {/* 1. Foundational & Primary */}
                {filteredFoundational.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Foundational &amp; Primary
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {filteredFoundational.map((cls) => {
                        const isSelected = selectedClasses.includes(cls);
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center justify-between transition cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#3a7d84] text-white border-[#3a7d84]'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{cls}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white shrink-0 ml-1" />
                            ) : (
                              <div className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Middle & Secondary */}
                {filteredMiddle.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Middle &amp; Secondary (Class 6 - 10)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {filteredMiddle.map((cls) => {
                        const isSelected = selectedClasses.includes(cls);
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center justify-between transition cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#3a7d84] text-white border-[#3a7d84]'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{cls}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white shrink-0 ml-1" />
                            ) : (
                              <div className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Class 11 Streams */}
                {filtered11.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Class 11 Streams
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {filtered11.map((cls) => {
                        const isSelected = selectedClasses.includes(cls);
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center justify-between transition cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#3a7d84] text-white border-[#3a7d84]'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{cls}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white shrink-0 ml-1" />
                            ) : (
                              <div className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Class 12 Streams */}
                {filtered12.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                      Class 12 Streams
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {filtered12.map((cls) => {
                        const isSelected = selectedClasses.includes(cls);
                        return (
                          <button
                            type="button"
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium border flex items-center justify-between transition cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#3a7d84] text-white border-[#3a7d84]'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate">{cls}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-white shrink-0 ml-1" />
                            ) : (
                              <div className="w-3 h-3 rounded-xs border border-slate-300 shrink-0 ml-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Popover Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">
              {selectedClasses.length} classes mapped
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold px-3 py-1 bg-[#3a7d84] hover:bg-[#2d6268] text-white rounded-lg shadow-2xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SCHOOL-WISE SOLUTIONS MULTI-SELECT DROPDOWN COMPONENT ───
interface SchoolSolutionsDropdownProps {
  selectedKeys: string[];
  schoolName: string;
  onToggleSolution: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function SchoolSolutionsMultiSelectDropdown({
  selectedKeys,
  schoolName,
  onToggleSolution,
  onSelectAll,
  onClearAll,
  disabled = false,
}: SchoolSolutionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredSolutions = useMemo(() =>
    DEFAULT_SOLUTIONS.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Main Trigger Dropdown Field */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/20 shadow-xs'
            : 'border-slate-300 hover:border-[#51a8b1] shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 py-0.5">
          {selectedKeys.length === 0 ? (
            <span className="text-xs text-slate-400 font-medium pl-0.5">
              Click to select solutions for {schoolName} (e.g. STEM Lab, Robotics, ePathshala)...
            </span>
          ) : (
            selectedKeys.map((key) => {
              const sol = DEFAULT_SOLUTIONS.find((s) => s.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{sol?.label || key}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSolution(key);
                      }}
                      className="text-[#51a8b1] hover:text-rose-600 rounded p-0.5 transition cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[#51a8b1]">
          {selectedKeys.length > 0 && !disabled && (
            <button
              type="button"
              title="Clear all solutions for this school"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-slate-400 hover:text-rose-600 text-xs px-2 py-0.5 rounded hover:bg-rose-50 transition"
            >
              Clear
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Solutions Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#b6e0e4] rounded-2xl shadow-xl p-3 space-y-2.5 max-h-[380px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Search and Quick Actions */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solutions (e.g. Robotics, Astronomy, STEM)..."
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-slate-50 text-slate-900 font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#f0f8f9] hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedKeys.length} selected for {schoolName}
              </span>
            </div>
          </div>

          {/* Solutions List */}
          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 max-h-[220px]">
            {filteredSolutions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No solutions found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredSolutions.map((sol) => {
                const isSelected = selectedKeys.includes(sol.key);
                return (
                  <div
                    key={sol.key}
                    onClick={() => onToggleSolution(sol.key)}
                    className={`px-3 py-2 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#f0f8f9] border-[#51a8b1] ring-1 ring-[#51a8b1] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-[#51a8b1] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate font-heading">
                        {sol.label}
                      </h5>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#3a7d84] border-[#3a7d84] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Solutions configured specifically for {schoolName}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold px-4 py-1.5 bg-[#3a7d84] hover:bg-[#2d6268] text-white rounded-xl shadow-2xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN SOLUTIONS CONFIG TABLE COMPONENT ───
export function SolutionsConfigTable({
  value,
  onChange,
  disabled = false,
  schools = [],
  allFormData = {},
}: SolutionsConfigTableProps) {
  // 1. Determine effective schools list
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState<boolean>(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const schoolDropdownRef = useRef<HTMLDivElement>(null);

  // Close school dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
      }
    }
    if (isSchoolDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSchoolDropdownOpen]);

  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0] || { id: 'school-1', name: 'Primary School' };

  // 2. School-wise allocations state (CLEAN 0 DEFAULT - no hardcoded solutions!)
  const schoolAllocations = useMemo<Record<string, Record<string, SchoolSolutionItem>>>(() => {
    if (value?.schoolWiseSolutions && typeof value.schoolWiseSolutions === 'object') {
      return value.schoolWiseSolutions;
    }
    const initialMap: Record<string, Record<string, SchoolSolutionItem>> = {};
    const fallbackKeys = Array.isArray(value?.activeSolutionKeys)
      ? value.activeSolutionKeys
      : [];

    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      initialMap[sch.id] = {};
      fallbackKeys.forEach((solKey: string) => {
        const legacy = value?.[solKey] || {};
        const classesArr = Array.isArray(legacy.targetClasses)
          ? legacy.targetClasses
          : typeof legacy.targetClasses === 'string' && legacy.targetClasses
          ? legacy.targetClasses.split(',').map((c: string) => c.trim()).filter(Boolean)
          : ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

        const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
        initialMap[sch.id][solKey] = {
          solutionKey: solKey,
          solutionName: legacy.solutionName || defObj?.label || solKey,
          quantity: Number(legacy.quantity) || 1,
          targetClasses: classesArr,
          board: legacy.board || 'CBSE',
          notes: legacy.notes || '',
        };
      });
    });
    return initialMap;
  }, [value, effectiveSchools]);

  // Synchronize changes up to parent
  const emitUpdate = useCallback((
    updatedSchoolMap: Record<string, Record<string, SchoolSolutionItem>>
  ) => {
    const allActiveKeys = Array.from(
      new Set(
        Object.values(updatedSchoolMap).flatMap((sMap) =>
          sMap && typeof sMap === 'object' ? Object.keys(sMap) : []
        )
      )
    );

    const legacyTopLevel: Record<string, any> = {};
    allActiveKeys.forEach((solKey) => {
      const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
      let aggregatedQty = 0;
      const allClassesSet = new Set<string>();

      Object.values(updatedSchoolMap).forEach((schMap) => {
        const item = schMap[solKey];
        if (item) {
          aggregatedQty += Number(item.quantity) || 1;
          (item.targetClasses || []).forEach((c) => allClassesSet.add(c));
        }
      });

      legacyTopLevel[solKey] = {
        selected: true,
        solutionName: defObj?.label || solKey,
        quantity: aggregatedQty || 1,
        targetClasses: Array.from(allClassesSet).join(', ') || 'Class 6 to 10',
      };
    });

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      activeSolutionKeys: allActiveKeys,
      schoolWiseSolutions: updatedSchoolMap,
      ...legacyTopLevel,
    });
  }, [value, onChange]);

  // Toggle solution for the ACTIVE school
  const handleToggleSchoolSolution = useCallback((solKey: string) => {
    const schoolId = currentSchool.id;
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

    if (nextSchoolMap[schoolId][solKey]) {
      delete nextSchoolMap[schoolId][solKey];
    } else {
      const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
      nextSchoolMap[schoolId][solKey] = {
        solutionKey: solKey,
        solutionName: defObj?.label || solKey,
        quantity: 1,
        targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        board: 'CBSE',
        notes: '',
      };
    }

    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, schoolAllocations, emitUpdate]);

  const handleSelectAllForSchool = useCallback(() => {
    const schoolId = currentSchool.id;
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

    DEFAULT_SOLUTIONS.forEach((sol) => {
      if (!nextSchoolMap[schoolId][sol.key]) {
        nextSchoolMap[schoolId][sol.key] = {
          solutionKey: sol.key,
          solutionName: sol.label,
          quantity: 1,
          targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
          board: 'CBSE',
          notes: '',
        };
      }
    });

    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, schoolAllocations, emitUpdate]);

  const handleClearAllForSchool = useCallback(() => {
    const schoolId = currentSchool.id;
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = {};
    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, schoolAllocations, emitUpdate]);

  const handleUpdateSchoolSolutionField = useCallback((
    schoolId: string,
    solKey: string,
    field: keyof SchoolSolutionItem,
    val: any
  ) => {
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
    const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);

    const existing = nextSchoolMap[schoolId][solKey] || {
      solutionKey: solKey,
      solutionName: defObj?.label || solKey,
      quantity: 1,
      targetClasses: ['Class 6', 'Class 7', 'Class 8'],
      board: 'CBSE',
      notes: '',
    };

    nextSchoolMap[schoolId][solKey] = {
      ...existing,
      [field]: val,
    };

    emitUpdate(nextSchoolMap);
  }, [schoolAllocations, emitUpdate]);

  const handleRemoveSolutionFromSchool = useCallback((schoolId: string, solKey: string) => {
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
    delete nextSchoolMap[schoolId][solKey];
    emitUpdate(nextSchoolMap);
  }, [schoolAllocations, emitUpdate]);

  // Copy current school config to all other schools
  const handleApplyToAllSchools = useCallback(() => {
    const sourceSolutions = schoolAllocations[currentSchool.id] || {};
    const nextSchoolMap = { ...schoolAllocations };

    effectiveSchools.forEach((sch) => {
      if (sch.id !== currentSchool.id) {
        nextSchoolMap[sch.id] = JSON.parse(JSON.stringify(sourceSolutions));
      }
    });

    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, effectiveSchools, schoolAllocations, emitUpdate]);

  // Active school's selected solution keys
  const activeSchoolSolutions = useMemo(() => {
    return schoolAllocations[currentSchool.id] || {};
  }, [schoolAllocations, currentSchool.id]);

  const activeSchoolKeys = useMemo(() => {
    return Object.keys(activeSchoolSolutions);
  }, [activeSchoolSolutions]);

  // Filter schools for the dropdown search
  const filteredSchoolsList = useMemo(() => {
    return effectiveSchools.map((sch, idx) => ({ sch, originalIndex: idx })).filter(({ sch }) =>
      sch.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
      (sch.address && sch.address.toLowerCase().includes(schoolSearchQuery.toLowerCase()))
    );
  }, [effectiveSchools, schoolSearchQuery]);

  // Total summary across all schools
  const totalUnitsAcrossSchools = useMemo(() => {
    let total = 0;
    Object.values(schoolAllocations).forEach((schMap) => {
      Object.values(schMap || {}).forEach((item) => {
        total += Number(item.quantity) || 1;
      });
    });
    return total;
  }, [schoolAllocations]);

  return (
    <div className="space-y-4 font-sans">
      {/* ── STEP 1: SELECT SCHOOL CAMPUS ── */}
      <div className="bg-white p-4 rounded-2xl border border-[#b6e0e4] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Step 1 Title */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0">
              1
            </span>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Step 1: Select School Campus
            </h4>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2.5 py-1 rounded-xl">
              Total Across Schools: <strong>{totalUnitsAcrossSchools} Labs</strong>
            </span>
            {effectiveSchools.length > 1 && !disabled && (
              <button
                type="button"
                onClick={handleApplyToAllSchools}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Copy current school's solutions to all other campuses"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Apply to All</span>
              </button>
            )}
          </div>
        </div>

        {/* Searchable School Dropdown Component */}
        <div className="relative" ref={schoolDropdownRef}>
          <button
            type="button"
            onClick={() => setIsSchoolDropdownOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#f0f8f9] hover:bg-[#e4f3f5] border border-[#b6e0e4] text-[#2d6b73] text-xs font-bold transition shadow-2xs cursor-pointer text-left select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <School className="w-4 h-4 text-[#3a7d84] shrink-0" />
              <span className="truncate font-heading text-slate-800 text-sm">
                {currentSchool.name || `School Branch #${activeSchoolIndex + 1}`}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white border border-[#b6e0e4] text-[#3a7d84] shrink-0">
                #{activeSchoolIndex + 1} of {effectiveSchools.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[#3a7d84]">
              <span className="text-[10.5px] font-bold bg-white px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                {activeSchoolKeys.length} solutions configured
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSchoolDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* School Dropdown Popover */}
          {isSchoolDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-[#b6e0e4] shadow-xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  value={schoolSearchQuery}
                  onChange={(e) => setSchoolSearchQuery(e.target.value)}
                  placeholder="Search school by name or address..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] font-medium"
                />
                {schoolSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSchoolSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* School Items List */}
              <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                {filteredSchoolsList.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400 font-medium">
                    No schools match &ldquo;{schoolSearchQuery}&rdquo;
                  </div>
                ) : (
                  filteredSchoolsList.map(({ sch, originalIndex }) => {
                    const isSelected = originalIndex === activeSchoolIndex;
                    const solCount = Object.keys(schoolAllocations[sch.id] || {}).length;

                    return (
                      <div
                        key={sch.id || originalIndex}
                        onClick={() => {
                          setActiveSchoolIndex(originalIndex);
                          setIsSchoolDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#f0f8f9] text-[#2d6b73] font-bold border border-[#b6e0e4]'
                            : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#3a7d84] text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {originalIndex + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-900">
                              {sch.name || `School Branch #${originalIndex + 1}`}
                            </p>
                            {sch.address && (
                              <p className="text-[10px] text-slate-400 truncate">
                                {sch.address}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-[#b6e0e4] text-[#3a7d84]">
                            {solCount} sol.
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#3a7d84]" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Horizontal School Pills */}
        {effectiveSchools.length > 1 && (
          <div className="bg-slate-50/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-thin border border-slate-200/80">
            {effectiveSchools.map((school, idx) => {
              const isActive = idx === activeSchoolIndex;
              const schSolCount = Object.keys(schoolAllocations[school.id] || {}).length;

              return (
                <button
                  type="button"
                  key={school.id || idx}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer shrink-0 select-none border ${
                    isActive
                      ? 'bg-white text-[#2d6b73] border-[#51a8b1]/60 shadow-sm ring-2 ring-[#51a8b1]/20 font-bold'
                      : 'bg-transparent hover:bg-white/80 text-slate-600 border-transparent hover:border-slate-200 font-medium'
                  }`}
                  onClick={() => setActiveSchoolIndex(idx)}
                >
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]' : 'bg-slate-200/70 text-slate-500'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="max-w-[280px] sm:max-w-[380px] truncate text-slate-800" title={school.name || `School #${idx + 1}`}>
                    {school.name || `School #${idx + 1}`}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-[#3a7d84] text-white shadow-2xs' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {schSolCount} sol.
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STEP 2: SELECT SOLUTIONS FOR THE ACTIVE SCHOOL ── */}
      <div 
        key={currentSchool.id || `school-solutions-${activeSchoolIndex}`}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 animate-in fade-in-50 duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0">
            2
          </span>
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
            Step 2: Select Solutions for {currentSchool.name}
          </h4>
        </div>

        {/* Dropdown to pick solutions */}
        <SchoolSolutionsMultiSelectDropdown
          selectedKeys={activeSchoolKeys}
          schoolName={currentSchool.name}
          onToggleSolution={handleToggleSchoolSolution}
          onSelectAll={handleSelectAllForSchool}
          onClearAll={handleClearAllForSchool}
          disabled={disabled}
        />
      </div>

      {/* ── STEP 3: CONFIGURE QUANTITIES (NO.) & DETAILS FOR SELECTED SOLUTIONS ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0">
              3
            </span>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Step 3: Solution Quantity (No.) &amp; Class Details
            </h4>
          </div>

          <span className="text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-1 rounded-lg border border-[#b6e0e4]">
            {activeSchoolKeys.length} Solutions Active
          </span>
        </div>

        {/* If no solutions selected yet */}
        {activeSchoolKeys.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No solutions selected for {currentSchool.name}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {activeSchoolKeys.map((solKey) => {
              const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
              const item = activeSchoolSolutions[solKey] || {
                solutionKey: solKey,
                solutionName: defObj?.label || solKey,
                quantity: 1,
                targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
                board: 'CBSE',
                notes: '',
              };

              const currentClasses = item.targetClasses || [];

              return (
                <div
                  key={solKey}
                  className="bg-slate-50/70 border border-slate-200 hover:border-[#51a8b1]/60 rounded-2xl p-4 shadow-2xs space-y-3 transition-all"
                >
                  {/* Solution Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#51a8b1]" />
                      <h5 className="text-xs font-bold text-slate-800 font-heading">
                        {defObj?.label || solKey}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                        {item.quantity || 1} Unit(s)
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSolutionFromSchool(currentSchool.id, solKey)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove solution from this school"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quantity (No.) & Board Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Quantity / Number Input */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Quantity / Labs Count (Number) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleUpdateSchoolSolutionField(
                            currentSchool.id,
                            solKey,
                            'quantity',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-bold"
                      />
                    </div>

                    {/* Board / Curriculum */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#51a8b1]" />
                        <span>Curriculum / Board</span>
                      </label>
                      <select
                        disabled={disabled}
                        value={item.board || 'CBSE'}
                        onChange={(e) =>
                          handleUpdateSchoolSolutionField(
                            currentSchool.id,
                            solKey,
                            'board',
                            e.target.value
                          )
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-medium"
                      >
                        {BOARD_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Classes Dropdown */}
                  <div>
                    <ClassesMultiSelectDropdown
                      selectedClasses={currentClasses}
                      onChange={(updated) =>
                        handleUpdateSchoolSolutionField(
                          currentSchool.id,
                          solKey,
                          'targetClasses',
                          updated
                        )
                      }
                      disabled={disabled}
                      solutionLabel={defObj?.label || solKey}
                    />
                  </div>

                  {/* Room / Implementation Notes */}
                  <div>
                    <input
                      type="text"
                      disabled={disabled}
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleUpdateSchoolSolutionField(
                          currentSchool.id,
                          solKey,
                          'notes',
                          e.target.value
                        )
                      }
                      placeholder="Special customization / room allocation notes for this campus..."
                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-medium placeholder:text-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SolutionsConfigTable;
