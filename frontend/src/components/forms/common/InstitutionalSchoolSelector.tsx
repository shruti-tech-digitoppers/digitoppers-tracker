'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2,
  School,
  ChevronDown,
  Search,
  X,
  Copy,
  Check,
  MapPin,
  UserCheck,
  Layers,
  Sparkles
} from 'lucide-react';
import { EffectiveSchoolItem } from '../utils/formHelpers';
import { ConfirmCopyModal } from './ConfirmCopyModal';

interface InstitutionalSchoolSelectorProps {
  schools: EffectiveSchoolItem[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  activeItemCount: number;
  itemTypeLabel: string; // e.g. "Solutions", "Hardware Products"
  totalAcrossSchoolsText?: string;
  getItemCountForSchool?: (schoolId: string, index: number) => number;
  onApplyToAll?: () => void;
  disabled?: boolean;
}

export function InstitutionalSchoolSelector({
  schools,
  activeIndex,
  onSelectIndex,
  activeItemCount,
  itemTypeLabel,
  totalAcrossSchoolsText,
  getItemCountForSchool,
  onApplyToAll,
  disabled = false,
}: InstitutionalSchoolSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentSchool =
    schools[Math.min(activeIndex, schools.length - 1)] ||
    schools[0] || { id: 'school-1', name: 'Primary School' };

  // Filter schools for search dropdown
  const filteredSchoolsList = useMemo(() => {
    if (!searchQuery.trim()) {
      return schools.map((sch, idx) => ({ sch, originalIndex: idx }));
    }
    const q = searchQuery.toLowerCase().trim();
    return schools
      .map((sch, idx) => ({ sch, originalIndex: idx }))
      .filter(
        ({ sch, originalIndex }) =>
          (sch.name || '').toLowerCase().includes(q) ||
          (sch.address || '').toLowerCase().includes(q) ||
          (sch.pocName || '').toLowerCase().includes(q) ||
          (sch.contactPerson || '').toLowerCase().includes(q) ||
          `school ${originalIndex + 1}`.toLowerCase().includes(q) ||
          `branch ${originalIndex + 1}`.toLowerCase().includes(q)
      );
  }, [schools, searchQuery]);

  return (
    <div className="relative bg-white rounded-2xl border border-[#b6e0e4] shadow-xs">
      {/* 1. Header Banner: Active School Identity & Actions */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] border-b border-[#b6e0e4] rounded-t-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          {/* School Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3a7d84] to-[#245257] text-white flex items-center justify-center shrink-0 shadow-xs border border-[#3a7d84]/40">
            <Building2 className="w-6 h-6 text-teal-100" />
          </div>

          {/* Title & Metadata Tagline */}
          <div className="min-w-0 space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-[#3a7d84] text-white shadow-2xs">
                <School className="w-3.5 h-3.5 text-teal-200" />
                <span>
                  School {activeIndex + 1} of {schools.length}
                </span>
              </span>
              {totalAcrossSchoolsText && (
                <span className="text-[11px] font-bold text-[#2d6b73] bg-[#f0f8f9] border border-[#b6e0e4] px-2.5 py-0.5 rounded-lg shadow-2xs">
                  {totalAcrossSchoolsText}
                </span>
              )}
            </div>

            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {currentSchool.name || (schools.length > 1 ? `Untitled School ${activeIndex + 1}` : 'Untitled School')}
            </h3>

            <div className="text-xs text-slate-600 flex items-center gap-2.5 flex-wrap font-medium pt-0.5">
              {currentSchool.address && (
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3 h-3 text-[#3a7d84] shrink-0" />
                  <span className="truncate max-w-xs sm:max-w-md">{currentSchool.address}</span>
                </span>
              )}
              {(currentSchool.pocName || currentSchool.contactPerson) && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <UserCheck className="w-3 h-3 text-[#3a7d84] shrink-0" />
                    <span>POC:</span>
                    <strong className="font-bold text-slate-900">
                      {currentSchool.pocName || currentSchool.contactPerson}
                    </strong>
                  </span>
                </>
              )}
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 text-[#2d6b73] font-bold bg-[#e0f3f5] px-2 py-0.5 rounded-md">
                <Layers className="w-3 h-3" />
                <span>
                  {activeItemCount} {itemTypeLabel} Configured
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          {/* Search Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition shadow-2xs cursor-pointer ${
                isDropdownOpen
                  ? 'bg-[#3a7d84] text-white border-[#3a7d84]'
                  : 'bg-white hover:bg-[#f0f8f9] text-slate-800 border-[#b6e0e4] hover:border-[#51a8b1]'
              }`}
            >
              <Search className={`w-3.5 h-3.5 ${isDropdownOpen ? 'text-white' : 'text-[#2d6b73]'}`} />
              <span>Switch School</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-white' : 'text-slate-400'
                }`}
              />
            </button>

            {/* School Search Popover Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-white border border-[#b6e0e4] rounded-2xl shadow-2xl p-3 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#3a7d84]" />
                    <span className="text-xs font-bold text-slate-800">
                      Select School ({schools.length} total)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search schools by name, location, POC..."
                    className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400"
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

                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {filteredSchoolsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No schools found matching &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredSchoolsList.map(({ sch, originalIndex }) => {
                      const isSelected = originalIndex === activeIndex;
                      const itemCount = getItemCountForSchool
                        ? getItemCountForSchool(sch.id, originalIndex)
                        : 0;

                      return (
                        <div
                          key={sch.id || `school-opt-${originalIndex}`}
                          onClick={() => {
                            onSelectIndex(originalIndex);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-3 cursor-pointer transition border ${
                            isSelected
                              ? 'bg-[#f0f8f9] text-[#2d6b73] font-bold border-[#51a8b1] shadow-2xs'
                              : 'bg-white hover:bg-slate-50/80 text-slate-700 font-medium border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="min-w-0 flex items-start gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected
                                  ? 'bg-[#3a7d84] text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {originalIndex + 1}
                            </span>
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-bold text-slate-900 leading-snug break-words">
                                {sch.name || (schools.length > 1 ? `Untitled School ${originalIndex + 1}` : 'Untitled School')}
                              </div>
                              {sch.address && (
                                <div className="text-[11px] text-slate-500 line-clamp-1">
                                  {sch.address}
                                </div>
                              )}
                              {(sch.pocName || sch.contactPerson) && (
                                <div className="text-[10px] text-slate-400">
                                  POC: {sch.pocName || sch.contactPerson}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {getItemCountForSchool && (
                              <span
                                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-lg border ${
                                  isSelected
                                    ? 'bg-[#e0f3f5] text-[#2d6b73] border-[#b6e0e4]'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {itemCount} {itemTypeLabel}
                              </span>
                            )}
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#3a7d84] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Copy Current School Config to All Schools Action */}
          {onApplyToAll && schools.length > 1 && !disabled && (
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f0f8f9] hover:bg-[#e0f3f5] text-xs font-bold text-[#2d6b73] border border-[#b6e0e4] transition shadow-2xs cursor-pointer"
              title={`Copy current school's ${itemTypeLabel.toLowerCase()} to all other schools`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Apply to All</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. School Branches Horizontal Selector Strip */}
      <div className="bg-[#f8fcfd] px-4 py-2.5 rounded-b-2xl flex items-center gap-2 overflow-x-auto scrollbar-thin">
        <span className="text-[11px] font-extrabold text-[#2d6b73] uppercase tracking-wider shrink-0 mr-1 select-none flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5" />
          <span>Schools ({schools.length}):</span>
        </span>

        <div className="flex items-center gap-2 flex-nowrap">
          {schools.map((sch, idx) => {
            const isActive = idx === activeIndex;
            const displayName = sch.name || (schools.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School');
            const itemCount = getItemCountForSchool
              ? getItemCountForSchool(sch.id, idx)
              : 0;

            return (
              <button
                key={sch.id || `school-tab-${idx}`}
                type="button"
                onClick={() => onSelectIndex(idx)}
                className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap shadow-2xs shrink-0 border ${
                  isActive
                    ? 'bg-[#3a7d84] text-white border-[#2c5f64] shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#b6e0e4] text-slate-700'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded-md text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>

                <span className="truncate max-w-[180px] sm:max-w-[240px]">
                  {displayName}
                </span>

                {getItemCountForSchool && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {itemCount} {itemTypeLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {onApplyToAll && (
        <ConfirmCopyModal
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          onConfirm={onApplyToAll}
          sourceSchoolName={currentSchool.name || (schools.length > 1 ? `Untitled School ${activeIndex + 1}` : 'Untitled School')}
          targetSchoolsCount={schools.length - 1}
          itemTypeLabel={itemTypeLabel}
        />
      )}
    </div>
  );
}

export default InstitutionalSchoolSelector;
