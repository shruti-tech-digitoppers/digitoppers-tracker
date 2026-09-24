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
  AlertCircle,
  Sparkles,
  School,
  BookOpen,
  ChevronDown,
  Search,
  X,
  CheckSquare,
  Square,
  GraduationCap
} from 'lucide-react';

export {
  FOUNDATIONAL_CLASSES,
  MIDDLE_CLASSES,
  CLASS_11_STREAMS,
  CLASS_12_STREAMS,
  ALL_CLASSES,
  BOARD_OPTIONS
};

interface SchoolSolutionItem {
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
      <label className="block text-[10.5px] font-bold text-[#4b5563] mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5 text-[#51a8b1]" />
          <span>Target Classes (Multi-Select Dropdown)</span>
        </span>
        <span className="text-[10px] font-semibold text-[#3a7d84] bg-[#51a8b1]/10 px-2 py-0.5 rounded-md">
          {selectedClasses.length} Classes Selected
        </span>
      </label>

      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/25 shadow-sm'
            : 'border-gray-300 hover:border-[#51a8b1]/70'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0 py-0.5">
          {selectedClasses.length === 0 ? (
            <span className="text-xs text-gray-400 italic">
              Click to select target classes for {solutionLabel}...
            </span>
          ) : (
            <>
              {selectedClasses.slice(0, 6).map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <span className="truncate max-w-[130px]">{cls}</span>
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
              {selectedClasses.length > 6 && (
                <span className="text-[11px] font-bold bg-[#3a7d84] text-white px-2 py-0.5 rounded-md shadow-2xs">
                  +{selectedClasses.length - 6} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          {selectedClasses.length > 0 && !disabled && (
            <button
              type="button"
              title="Clear all classes"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="text-gray-400 hover:text-rose-600 p-1 rounded-md transition"
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
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes or streams (e.g., PCM, Class 9)..."
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-gray-50/70"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Presets Bar */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              <span className="text-[9.5px] font-bold text-gray-400 mr-0.5">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('PRIMARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-gray-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-gray-700 transition cursor-pointer"
              >
                Primary (1-5)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('MIDDLE')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-gray-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-gray-700 transition cursor-pointer"
              >
                Middle (6-8)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SECONDARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-gray-100 hover:bg-[#51a8b1]/20 hover:text-[#3a7d84] text-gray-700 transition cursor-pointer"
              >
                High (9-10)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SCIENCE_11_12')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer border border-emerald-200"
              >
                11-12 Science
              </button>
              <button
                type="button"
                onClick={() => applyPreset('COMMERCE_11_12')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer border border-amber-200"
              >
                11-12 Commerce
              </button>
              <button
                type="button"
                onClick={() => applyPreset('HUMANITIES_11_12')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer border border-purple-200"
              >
                11-12 Arts
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SR_SECONDARY')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer border border-blue-200"
              >
                Sr. Sec All
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ALL')}
                className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-[#51a8b1]/15 text-[#3a7d84] hover:bg-[#51a8b1]/30 transition cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => applyPreset('CLEAR')}
                className="text-[9.5px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Categorized Options List */}
          <div className="overflow-y-auto space-y-2.5 pr-1 flex-1 max-h-[220px]">
            {totalFilteredCount === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                No classes match &quot;{searchQuery}&quot;
              </div>
            ) : (
              <>
                {filteredFoundational.length > 0 && (
                  <div>
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Foundational &amp; Primary
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {filteredFoundational.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <div
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition flex items-center gap-1.5 select-none ${
                              isChecked
                                ? 'bg-[#51a8b1] text-white border-[#3a7d84] shadow-2xs'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#51a8b1]/60 hover:bg-white'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{cls}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredMiddle.length > 0 && (
                  <div className="pt-1.5 border-t border-gray-100">
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Middle &amp; Secondary (Class 6 - 10)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {filteredMiddle.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <div
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition flex items-center gap-1.5 select-none ${
                              isChecked
                                ? 'bg-[#51a8b1] text-white border-[#3a7d84] shadow-2xs'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#51a8b1]/60 hover:bg-white'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{cls}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filtered11.length > 0 && (
                  <div className="pt-1.5 border-t border-gray-100">
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#3a7d84] mb-1">
                      Class 11 Streams
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filtered11.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <div
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition flex items-center gap-1.5 select-none ${
                              isChecked
                                ? 'bg-[#3a7d84] text-white border-[#275a5f] shadow-2xs'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#3a7d84]/60 hover:bg-white'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{cls}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filtered12.length > 0 && (
                  <div className="pt-1.5 border-t border-gray-100">
                    <span className="block text-[9.5px] font-bold uppercase tracking-wider text-[#3a7d84] mb-1">
                      Class 12 Streams
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {filtered12.map((cls) => {
                        const isChecked = selectedClasses.includes(cls);
                        return (
                          <div
                            key={cls}
                            onClick={() => toggleClass(cls)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition flex items-center gap-1.5 select-none ${
                              isChecked
                                ? 'bg-[#3a7d84] text-white border-[#275a5f] shadow-2xs'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-[#3a7d84]/60 hover:bg-white'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <span className="truncate">{cls}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              {selectedClasses.length} of {ALL_CLASSES.length} classes selected
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold px-3 py-1 bg-[#51a8b1] hover:bg-[#3a7d84] text-white rounded-lg shadow-2xs transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SOLUTIONS MULTI-SELECT DROPDOWN COMPONENT ───
interface SolutionsDropdownProps {
  selectedKeys: string[];
  onToggleSolution: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function SolutionsMultiSelectDropdown({
  selectedKeys,
  onToggleSolution,
  onSelectAll,
  onClearAll,
  disabled = false,
}: SolutionsDropdownProps) {
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
      (sol) =>
        sol.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sol.key.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
          <Sparkles className="w-4 h-4 text-[#51a8b1]" />
          <span>Select Project Solutions (Multi-Select Dropdown)</span>
        </label>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#51a8b1]/15 text-[#3a7d84] border border-[#b6e0e4]">
          {selectedKeys.length} of {DEFAULT_SOLUTIONS.length} Solutions Selected
        </span>
      </div>

      {/* Main Trigger Dropdown Field */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[46px] px-3.5 py-2 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 bg-white ${
          isOpen
            ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/30 shadow-md'
            : 'border-[#51a8b1]/40 hover:border-[#51a8b1] shadow-2xs'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0 py-0.5">
          {selectedKeys.length === 0 ? (
            <span className="text-xs text-gray-400 italic">
              Click to select solutions (e.g., STEM Lab, Robotics, ePathshala, Astronomy)...
            </span>
          ) : (
            selectedKeys.map((key) => {
              const sol = DEFAULT_SOLUTIONS.find((s) => s.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-[#f0f8f9] to-[#e4f4f6] text-[#275a5f] border border-[#b6e0e4] px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{sol?.icon || '🔬'}</span>
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
              title="Clear all solutions"
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="text-gray-400 hover:text-rose-600 text-xs px-2 py-0.5 rounded hover:bg-rose-50 transition"
            >
              Clear
            </button>
          )}
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Solutions Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#51a8b1]/50 rounded-2xl shadow-2xl p-3.5 space-y-3 max-h-[380px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header with Search and Quick Actions */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solutions (e.g., Robotics, Astronomy, STEM)..."
                className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-gray-50/70 text-gray-800"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#51a8b1]/15 hover:bg-[#51a8b1]/30 text-[#3a7d84] transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                {selectedKeys.length} selected
              </span>
            </div>
          </div>

          {/* Solutions List (Clean without long descriptions) */}
          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 max-h-[240px]">
            {filteredSolutions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
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
                        ? 'bg-gradient-to-r from-[#f0f8f9] to-white border-[#51a8b1] ring-1 ring-[#51a8b1] shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-[#51a8b1]/60 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{sol.icon}</span>
                      <h5 className="text-xs font-bold text-[#1f2937] truncate font-heading">
                        {sol.label}
                      </h5>
                    </div>

                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#51a8b1] border-[#51a8b1] text-white'
                          : 'border-gray-300 bg-white'
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
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Select all solutions required for this project
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold px-4 py-1.5 bg-[#51a8b1] hover:bg-[#3a7d84] text-white rounded-xl shadow-2xs transition cursor-pointer"
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
  // 1. Determine active schools list with centralized helper
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);
  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0];

  // 2. Global Catalog Selection
  const selectedGlobalKeys = useMemo<string[]>(() => {
    if (value && Array.isArray(value.activeSolutionKeys)) {
      return value.activeSolutionKeys;
    }
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).filter(
        (k) =>
          k !== 'activeSolutionKeys' &&
          k !== 'schoolWiseSolutions' &&
          k !== 'schools' &&
          k !== 'schoolName' &&
          k !== 'schoolCode' &&
          value[k]?.selected !== false &&
          DEFAULT_SOLUTIONS.some((d) => d.key === k)
      );
      if (keys.length > 0) return keys;
    }
    return ['STEM_LAB', 'ROBOTICS'];
  }, [value]);

  // 3. School-wise allocations state
  const schoolAllocations = useMemo<Record<string, Record<string, SchoolSolutionItem>>>(() => {
    if (value?.schoolWiseSolutions && typeof value.schoolWiseSolutions === 'object') {
      return value.schoolWiseSolutions;
    }
    const initialMap: Record<string, Record<string, SchoolSolutionItem>> = {};
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      initialMap[sch.id] = {};
      selectedGlobalKeys.forEach((solKey) => {
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
  }, [value, effectiveSchools, selectedGlobalKeys]);

  const emitUpdate = useCallback((
    updatedGlobalKeys: string[],
    updatedSchoolMap: Record<string, Record<string, SchoolSolutionItem>>
  ) => {
    const legacyTopLevel: Record<string, any> = {};
    updatedGlobalKeys.forEach((solKey) => {
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
      activeSolutionKeys: updatedGlobalKeys,
      schoolWiseSolutions: updatedSchoolMap,
      ...legacyTopLevel,
    });
  }, [value, onChange]);

  // --- Handlers ---
  const handleToggleGlobalSolution = useCallback((solKey: string) => {
    let nextKeys: string[];
    const isCurrentlySelected = selectedGlobalKeys.includes(solKey);
    if (isCurrentlySelected) {
      nextKeys = selectedGlobalKeys.filter((k) => k !== solKey);
    } else {
      nextKeys = [...selectedGlobalKeys, solKey];
    }

    const nextSchoolMap = { ...schoolAllocations };
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = { ...(nextSchoolMap[sch.id] || {}) };
      if (isCurrentlySelected) {
        delete nextSchoolMap[sch.id][solKey];
      } else {
        const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
        nextSchoolMap[sch.id][solKey] = {
          solutionKey: solKey,
          solutionName: defObj?.label || solKey,
          quantity: 1,
          targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
          board: 'CBSE',
          notes: '',
        };
      }
    });

    emitUpdate(nextKeys, nextSchoolMap);
  }, [selectedGlobalKeys, schoolAllocations, effectiveSchools, emitUpdate]);

  const handleSelectAllSolutions = useCallback(() => {
    const allKeys = DEFAULT_SOLUTIONS.map((s) => s.key);
    const nextSchoolMap = { ...schoolAllocations };

    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = { ...(nextSchoolMap[sch.id] || {}) };
      allKeys.forEach((solKey) => {
        if (!nextSchoolMap[sch.id][solKey]) {
          const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
          nextSchoolMap[sch.id][solKey] = {
            solutionKey: solKey,
            solutionName: defObj?.label || solKey,
            quantity: 1,
            targetClasses: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
            board: 'CBSE',
            notes: '',
          };
        }
      });
    });

    emitUpdate(allKeys, nextSchoolMap);
  }, [schoolAllocations, effectiveSchools, emitUpdate]);

  const handleClearAllSolutions = useCallback(() => {
    const nextSchoolMap: Record<string, Record<string, SchoolSolutionItem>> = {};
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = {};
    });
    emitUpdate([], nextSchoolMap);
  }, [effectiveSchools, emitUpdate]);

  const handleUpdateSchoolSolution = useCallback((
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

    emitUpdate(selectedGlobalKeys, nextSchoolMap);
  }, [schoolAllocations, selectedGlobalKeys, emitUpdate]);

  // Calculate Aggregated Metrics
  const totalUnitsAcrossSchools = useMemo(() => {
    let total = 0;
    Object.values(schoolAllocations).forEach((schMap) => {
      Object.values(schMap).forEach((item) => {
        total += Number(item.quantity) || 1;
      });
    });
    return total;
  }, [schoolAllocations]);

  return (
    <div className="space-y-4 font-sans">
      {/* ── STEP 1: SOLUTIONS MULTI-SELECT DROPDOWN ── */}
      <div className="bg-gradient-to-r from-[#f8fafb] via-white to-[#f8fafb] border border-[#51a8b1]/40 rounded-2xl p-4 shadow-2xs space-y-3">
        <SolutionsMultiSelectDropdown
          selectedKeys={selectedGlobalKeys}
          onToggleSolution={handleToggleGlobalSolution}
          onSelectAll={handleSelectAllSolutions}
          onClearAll={handleClearAllSolutions}
          disabled={disabled}
        />
      </div>

      {/* ── STEP 2: SCHOOL-WISE SOLUTION CONFIGURATION & MULTI-CLASS DROPDOWN ── */}
      <div className="bg-white border border-[#b9c0cb]/50 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] text-white flex items-center justify-center text-xs shadow-xs">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1f2937] font-heading">
                Step 2: School Allocation, Quantities &amp; Target Classes
              </h4>
              <p className="text-[10.5px] text-[#6b7280]">
                Configure lab quantities, boards, and target classes per school branch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
              Total Units: <strong>{totalUnitsAcrossSchools} Labs</strong>
            </span>
          </div>
        </div>

        {/* ── Prominent School Selection Dropdown & Info Card ── */}
        <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] border-2 border-[#51a8b1]/40 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3a7d84] mb-1.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-[#51a8b1]" />
                <span>Select School / Campus:</span>
                <span className="text-[11px] font-normal normal-case text-[#4a5462]">
                  (Solutions &amp; Classes will configure for the selected school)
                </span>
              </label>

              <div className="relative">
                <select
                  value={activeSchoolIndex}
                  onChange={(e) => setActiveSchoolIndex(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#51a8b1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1f2937] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#3a7d84] cursor-pointer appearance-none pr-10"
                >
                  {effectiveSchools.map((sch, idx) => {
                    const schSolutions = schoolAllocations[sch.id] || {};
                    const activeCount = Object.keys(schSolutions).length;
                    return (
                      <option key={sch.id || idx} value={idx}>
                        🏫 {idx + 1}. {sch.name}{' '}
                        {sch.address ? `— [${sch.address.slice(0, 40)}...]` : ''} ({activeCount}{' '}
                        solutions configured)
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#51a8b1]">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Active School Summary Context Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#51a8b1]/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[#51a8b1] text-white font-bold text-[11px]">
                Active School: {currentSchool.name}
              </span>
              {currentSchool.address && (
                <span className="text-[11px] text-[#4a5462]">
                  [{currentSchool.address.slice(0, 50)}...]
                </span>
              )}
            </div>

            <span className="text-[11px] font-semibold text-[#3a7d84]">
              Showing {selectedGlobalKeys.length} solutions for this campus
            </span>
          </div>
        </div>

        {/* Selected School's Solutions Breakdown */}
        {selectedGlobalKeys.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Please select at least one solution from the solutions dropdown above to configure school-wise quantities and classes.
            </span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {selectedGlobalKeys.map((solKey) => {
              const defObj = DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
              const item = schoolAllocations[currentSchool.id]?.[solKey] || {
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
                  className="bg-[#fcfdfd] border border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 rounded-2xl p-3.5 shadow-2xs space-y-3 transition-all"
                >
                  {/* Header without subtitle description */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{defObj?.icon || '🔬'}</span>
                      <h5 className="text-xs font-bold text-[#1f2937] font-heading">
                        {defObj?.label || solKey}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#51a8b1]/15 text-[#3a7d84]">
                        Units: {item.quantity || 1}
                      </span>
                    </div>
                  </div>

                  {/* 2-Column Inputs Row: Quantity & Board */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#4b5563] mb-1">
                        Quantity / Labs Count <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleUpdateSchoolSolution(
                            currentSchool.id,
                            solKey,
                            'quantity',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                      />
                    </div>

                    {/* Board / Curriculum */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#4b5563] mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-[#51a8b1]" />
                        <span>Curriculum / Board</span>
                      </label>
                      <select
                        disabled={disabled}
                        value={item.board || 'CBSE'}
                        onChange={(e) =>
                          handleUpdateSchoolSolution(
                            currentSchool.id,
                            solKey,
                            'board',
                            e.target.value
                          )
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                      >
                        {BOARD_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Target Classes — MULTI-SELECT DROPDOWN */}
                  <div>
                    <ClassesMultiSelectDropdown
                      selectedClasses={currentClasses}
                      onChange={(updated) =>
                        handleUpdateSchoolSolution(
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

                  {/* Notes / Remarks */}
                  <div>
                    <input
                      type="text"
                      disabled={disabled}
                      value={item.notes || ''}
                      onChange={(e) =>
                        handleUpdateSchoolSolution(
                          currentSchool.id,
                          solKey,
                          'notes',
                          e.target.value
                        )
                      }
                      placeholder="Special customization / notes for this solution in this branch..."
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-gray-700 placeholder:text-gray-400"
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
