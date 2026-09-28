'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_HARDWARE_ITEMS,
  EffectiveSchoolItem,
  extractEffectiveSchools
} from '../utils/formHelpers';
import {
  Check,
  Cpu,
  ChevronDown,
  Search,
  X,
  School,
  Copy,
  Trash2,
  Layers,
  Wrench,
  Hash
} from 'lucide-react';

export interface SchoolHardwareItem {
  itemKey: string;
  itemName: string;
  quantity: number;
  specNotes: string;
  serialNotes: string;
}

interface HardwareRequirementsInputProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  schools?: any[];
  allFormData?: Record<string, any>;
}

// ─── SCHOOL-SPECIFIC HARDWARE MULTI-SELECT DROPDOWN COMPONENT ───
interface SchoolHardwareDropdownProps {
  selectedKeys: string[];
  schoolName: string;
  onToggleHardware: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function SchoolHardwareMultiSelectDropdown({
  selectedKeys,
  schoolName,
  onToggleHardware,
  onSelectAll,
  onClearAll,
  disabled = false,
}: SchoolHardwareDropdownProps) {
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

  const filteredHardware = useMemo(() =>
    DEFAULT_HARDWARE_ITEMS.filter(
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
              Click to select required hardware items for {schoolName} (IFP, Tablets, Charging Cart, etc.)...
            </span>
          ) : (
            selectedKeys.map((key) => {
              const item = DEFAULT_HARDWARE_ITEMS.find((s) => s.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{item?.label || key}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHardware(key);
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
              title="Clear all hardware for this school"
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

      {/* Hardware Popover Dropdown Menu */}
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
                placeholder="Search hardware by name or specification..."
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

          {/* Hardware Items List */}
          <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 max-h-[220px]">
            {filteredHardware.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No hardware products match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredHardware.map((item) => {
                const isSelected = selectedKeys.includes(item.key);
                return (
                  <div
                    key={item.key}
                    onClick={() => onToggleHardware(item.key)}
                    className={`px-3 py-2 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#f0f8f9] border-[#51a8b1] ring-1 ring-[#51a8b1] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-[#51a8b1] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate font-heading">
                        {item.label}
                      </h5>
                      <span className="text-[10.5px] text-slate-400 truncate">
                        {item.desc}
                      </span>
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
              Hardware products allocated for {schoolName}
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

// ─── MAIN HARDWARE REQUIREMENTS INPUT COMPONENT ───
export function HardwareRequirementsInput({
  value,
  onChange,
  disabled = false,
  schools = [],
  allFormData = {},
}: HardwareRequirementsInputProps) {
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

  // 2. School-wise hardware allocations state (CLEAN 0 DEFAULT - no hardcoded hardware!)
  const schoolAllocations = useMemo<Record<string, Record<string, SchoolHardwareItem>>>(() => {
    if (value?.schoolWiseHardware && typeof value.schoolWiseHardware === 'object') {
      return value.schoolWiseHardware;
    }
    const legacyItems = value?.items || value || {};
    const fallbackKeys = Array.isArray(value?.activeHardwareKeys)
      ? value.activeHardwareKeys
      : [];

    const initialMap: Record<string, Record<string, SchoolHardwareItem>> = {};
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      initialMap[sch.id] = {};
      fallbackKeys.forEach((itemKey: string) => {
        const legacy = legacyItems[itemKey] || {};
        const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
        initialMap[sch.id][itemKey] = {
          itemKey,
          itemName: legacy.itemName || defObj?.label || itemKey,
          quantity: Number(legacy.quantity) || 1,
          specNotes: legacy.specNotes || defObj?.desc || '',
          serialNotes: legacy.serialNotes || '',
        };
      });
    });
    return initialMap;
  }, [value, effectiveSchools]);

  // Synchronize changes up to parent
  const emitUpdate = useCallback((
    updatedSchoolMap: Record<string, Record<string, SchoolHardwareItem>>
  ) => {
    const allActiveKeys = Array.from(
      new Set(
        Object.values(updatedSchoolMap).flatMap((sMap) =>
          sMap && typeof sMap === 'object' ? Object.keys(sMap) : []
        )
      )
    );

    const legacyItems: Record<string, any> = {};
    allActiveKeys.forEach((itemKey) => {
      const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
      let aggregatedQty = 0;
      let combinedSpecs = '';

      Object.values(updatedSchoolMap).forEach((schMap) => {
        const item = schMap[itemKey];
        if (item) {
          aggregatedQty += Number(item.quantity) || 1;
          if (item.specNotes) combinedSpecs = item.specNotes;
        }
      });

      legacyItems[itemKey] = {
        selected: true,
        itemName: defObj?.label || itemKey,
        quantity: aggregatedQty || 1,
        specNotes: combinedSpecs || defObj?.desc || '',
      };
    });

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      activeHardwareKeys: allActiveKeys,
      schoolWiseHardware: updatedSchoolMap,
      items: legacyItems,
      ...legacyItems,
    });
  }, [value, onChange]);

  // Toggle hardware product for the ACTIVE school
  const handleToggleSchoolHardware = useCallback((itemKey: string) => {
    const schoolId = currentSchool.id;
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

    if (nextSchoolMap[schoolId][itemKey]) {
      delete nextSchoolMap[schoolId][itemKey];
    } else {
      const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
      nextSchoolMap[schoolId][itemKey] = {
        itemKey,
        itemName: defObj?.label || itemKey,
        quantity: itemKey === 'TABLET' ? 10 : 1,
        specNotes: defObj?.desc || '',
        serialNotes: '',
      };
    }

    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, schoolAllocations, emitUpdate]);

  const handleSelectAllForSchool = useCallback(() => {
    const schoolId = currentSchool.id;
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

    DEFAULT_HARDWARE_ITEMS.forEach((item) => {
      if (!nextSchoolMap[schoolId][item.key]) {
        nextSchoolMap[schoolId][item.key] = {
          itemKey: item.key,
          itemName: item.label,
          quantity: item.key === 'TABLET' ? 10 : 1,
          specNotes: item.desc || '',
          serialNotes: '',
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

  const handleUpdateSchoolHardwareField = useCallback((
    schoolId: string,
    itemKey: string,
    field: keyof SchoolHardwareItem,
    val: any
  ) => {
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
    const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);

    const existing = nextSchoolMap[schoolId][itemKey] || {
      itemKey,
      itemName: defObj?.label || itemKey,
      quantity: 1,
      specNotes: defObj?.desc || '',
      serialNotes: '',
    };

    nextSchoolMap[schoolId][itemKey] = {
      ...existing,
      [field]: val,
    };

    emitUpdate(nextSchoolMap);
  }, [schoolAllocations, emitUpdate]);

  const handleRemoveHardwareFromSchool = useCallback((schoolId: string, itemKey: string) => {
    const nextSchoolMap = { ...schoolAllocations };
    nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
    delete nextSchoolMap[schoolId][itemKey];
    emitUpdate(nextSchoolMap);
  }, [schoolAllocations, emitUpdate]);

  // Copy current school config to all other schools
  const handleApplyToAllSchools = useCallback(() => {
    const sourceHardware = schoolAllocations[currentSchool.id] || {};
    const nextSchoolMap = { ...schoolAllocations };

    effectiveSchools.forEach((sch) => {
      if (sch.id !== currentSchool.id) {
        nextSchoolMap[sch.id] = JSON.parse(JSON.stringify(sourceHardware));
      }
    });

    emitUpdate(nextSchoolMap);
  }, [currentSchool.id, effectiveSchools, schoolAllocations, emitUpdate]);

  // Active school's selected hardware items
  const activeSchoolHardware = useMemo(() => {
    return schoolAllocations[currentSchool.id] || {};
  }, [schoolAllocations, currentSchool.id]);

  const activeSchoolKeys = useMemo(() => {
    return Object.keys(activeSchoolHardware);
  }, [activeSchoolHardware]);

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
              Total Across Schools: <strong>{totalUnitsAcrossSchools} Units</strong>
            </span>
            {effectiveSchools.length > 1 && !disabled && (
              <button
                type="button"
                onClick={handleApplyToAllSchools}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Copy current school's hardware allocation to all other campuses"
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
                {activeSchoolKeys.length} items configured
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
                    const hwItems = Object.values(schoolAllocations[sch.id] || {});
                    const count = hwItems.length;
                    const units = hwItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

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
                            {count} items • {units}u
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
              const schHwItems = Object.values(schoolAllocations[school.id] || {});
              const count = schHwItems.length;
              const units = schHwItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0);

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
                    {count} ({units}u)
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── STEP 2: SELECT HARDWARE PRODUCTS FOR THE ACTIVE SCHOOL ── */}
      <div 
        key={currentSchool.id || `school-hardware-${activeSchoolIndex}`}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 animate-in fade-in-50 duration-200"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0">
            2
          </span>
          <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900 truncate">
            Step 2: Select Hardware Products for {currentSchool.name}
          </h4>
        </div>

        {/* Dropdown to pick hardware products */}
        <SchoolHardwareMultiSelectDropdown
          selectedKeys={activeSchoolKeys}
          schoolName={currentSchool.name}
          onToggleHardware={handleToggleSchoolHardware}
          onSelectAll={handleSelectAllForSchool}
          onClearAll={handleClearAllForSchool}
          disabled={disabled}
        />
      </div>

      {/* ── STEP 3: CONFIGURE QUANTITIES (NO.) & SPECIFICATIONS FOR SELECTED HARDWARE ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center shrink-0">
              3
            </span>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-slate-900">
              Step 3: Hardware Quantity (No.) &amp; Specifications
            </h4>
          </div>

          <span className="text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-1 rounded-lg border border-[#b6e0e4]">
            {activeSchoolKeys.length} Products Active
          </span>
        </div>

        {/* If no hardware selected yet */}
        {activeSchoolKeys.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-1">
            <Cpu className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              No hardware products allocated for {currentSchool.name}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {activeSchoolKeys.map((itemKey) => {
              const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
              const item = activeSchoolHardware[itemKey] || {
                itemKey,
                itemName: defObj?.label || itemKey,
                quantity: 1,
                specNotes: defObj?.desc || '',
                serialNotes: '',
              };

              return (
                <div
                  key={itemKey}
                  className="bg-slate-50/70 border border-slate-200 hover:border-[#51a8b1]/60 rounded-2xl p-4 shadow-2xs space-y-3 transition-all"
                >
                  {/* Hardware Card Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#51a8b1]" />
                      <h5 className="text-xs font-bold text-slate-800 font-heading">
                        {defObj?.label || itemKey}
                      </h5>
                      <span className="text-[10px] text-slate-400">
                        ({defObj?.desc || itemKey})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                        {item.quantity || 1} Unit(s)
                      </span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemoveHardwareFromSchool(currentSchool.id, itemKey)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove item from this school"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quantity (No.) & Specifications Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity / Number Input */}
                    <div>
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                        Quantity Needed (Number) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleUpdateSchoolHardwareField(
                            currentSchool.id,
                            itemKey,
                            'quantity',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-bold"
                      />
                    </div>

                    {/* Specification / Model Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-[#51a8b1]" />
                        <span>Specifications / Model Requirement</span>
                      </label>
                      <input
                        type="text"
                        disabled={disabled}
                        value={item.specNotes || ''}
                        onChange={(e) =>
                          handleUpdateSchoolHardwareField(
                            currentSchool.id,
                            itemKey,
                            'specNotes',
                            e.target.value
                          )
                        }
                        placeholder="e.g. 75-inch 4K UHD with 4GB/32GB Android 13..."
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-medium placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Room / Deployment Notes */}
                  <div>
                    <input
                      type="text"
                      disabled={disabled}
                      value={item.serialNotes || ''}
                      onChange={(e) =>
                        handleUpdateSchoolHardwareField(
                          currentSchool.id,
                          itemKey,
                          'serialNotes',
                          e.target.value
                        )
                      }
                      placeholder="Deployment room / location (e.g., Room 102 - Smart Class 1)..."
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

export default HardwareRequirementsInput;
