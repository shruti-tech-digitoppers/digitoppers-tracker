'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_HARDWARE_ITEMS,
  EffectiveSchoolItem,
  extractEffectiveSchools
} from '../utils/formHelpers';
import {
  Check,
  AlertCircle,
  Building2,
  Cpu,
  MapPin,
  Wrench,
  ChevronDown,
  Search,
  X,
  School
} from 'lucide-react';

interface SchoolHardwareItem {
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

// ─── HARDWARE MULTI-SELECT DROPDOWN COMPONENT ───
interface HardwareDropdownProps {
  selectedKeys: string[];
  onToggleHardware: (key: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  disabled?: boolean;
}

function HardwareMultiSelectDropdown({
  selectedKeys,
  onToggleHardware,
  onSelectAll,
  onClearAll,
  disabled = false,
}: HardwareDropdownProps) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
          <Cpu className="w-4 h-4 text-[#51a8b1]" />
          <span>Select Hardware Products (Multi-Select Dropdown)</span>
        </label>
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#51a8b1]/15 text-[#3a7d84] border border-[#b6e0e4]">
          {selectedKeys.length} of {DEFAULT_HARDWARE_ITEMS.length} Products Active
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
              Click to select required hardware items (e.g., IFP Panel, Tablets, Mini PC, Charging Cart)...
            </span>
          ) : (
            selectedKeys.map((key) => {
              const item = DEFAULT_HARDWARE_ITEMS.find((s) => s.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-[#f0f8f9] to-[#e4f4f6] text-[#275a5f] border border-[#b6e0e4] px-2.5 py-1 rounded-lg shadow-2xs"
                >
                  <span>{item?.icon || '🖥️'}</span>
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
              title="Clear all hardware"
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

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-[#51a8b1]/50 rounded-2xl shadow-2xl p-3.5 space-y-3 max-h-[380px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar & Quick Actions */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hardware by name, model or specification..."
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

          {/* Hardware Options List */}
          <div className="overflow-y-auto space-y-2 pr-1 flex-1 max-h-[240px]">
            {filteredHardware.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No hardware products match &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredHardware.map((item) => {
                const isSelected = selectedKeys.includes(item.key);
                return (
                  <div
                    key={item.key}
                    onClick={() => onToggleHardware(item.key)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#f0f8f9] to-white border-[#51a8b1] ring-1 ring-[#51a8b1] shadow-2xs'
                        : 'bg-white border-gray-200 hover:border-[#51a8b1]/60 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border text-[10px] transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#51a8b1] border-[#51a8b1] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <h5 className="text-xs font-bold text-[#1f2937] truncate font-heading">
                          {item.label}
                        </h5>
                      </div>
                      <p className="text-[10.5px] text-[#6b7280] leading-snug mt-0.5">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-500">
              Select all hardware equipment required for this project
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

// ─── MAIN HARDWARE REQUIREMENTS INPUT COMPONENT ───
export function HardwareRequirementsInput({
  value,
  onChange,
  disabled = false,
  schools = [],
  allFormData = {},
}: HardwareRequirementsInputProps) {
  // 1. Determine active schools list with centralized helper
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value, 'Primary School Campus');
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);
  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0];

  // 2. Global Catalog Selection
  const selectedGlobalKeys = useMemo<string[]>(() => {
    if (value && Array.isArray(value.activeHardwareKeys)) {
      return value.activeHardwareKeys;
    }
    if (value?.items && typeof value.items === 'object') {
      const keys = Object.keys(value.items).filter(
        (k) => value.items[k]?.selected !== false && DEFAULT_HARDWARE_ITEMS.some((d) => d.key === k)
      );
      if (keys.length > 0) return keys;
    }
    if (value && typeof value === 'object' && !value.items) {
      const keys = Object.keys(value).filter(
        (k) =>
          k !== 'activeHardwareKeys' &&
          k !== 'schoolWiseHardware' &&
          k !== 'schools' &&
          k !== 'schoolName' &&
          k !== 'schoolCode' &&
          value[k]?.selected !== false &&
          DEFAULT_HARDWARE_ITEMS.some((d) => d.key === k)
      );
      if (keys.length > 0) return keys;
    }
    return ['IFP', 'OPS', 'PENDRIVE'];
  }, [value]);

  // 3. School-wise hardware allocations state
  const schoolAllocations = useMemo<Record<string, Record<string, SchoolHardwareItem>>>(() => {
    if (value?.schoolWiseHardware && typeof value.schoolWiseHardware === 'object') {
      return value.schoolWiseHardware;
    }
    const legacyItems = value?.items || value || {};
    const initialMap: Record<string, Record<string, SchoolHardwareItem>> = {};
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      initialMap[sch.id] = {};
      selectedGlobalKeys.forEach((itemKey) => {
        const legacy = legacyItems[itemKey] || {};
        const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
        initialMap[sch.id][itemKey] = {
          itemKey,
          itemName: legacy.itemName || defObj?.label || itemKey,
          quantity: Number(legacy.quantity) || (itemKey === 'STUDENT_TABLETS' ? 10 : 1),
          specNotes: legacy.specNotes || defObj?.desc || '',
          serialNotes: legacy.serialNotes || '',
        };
      });
    });
    return initialMap;
  }, [value, effectiveSchools, selectedGlobalKeys]);

  const emitUpdate = useCallback((
    updatedGlobalKeys: string[],
    updatedSchoolMap: Record<string, Record<string, SchoolHardwareItem>>
  ) => {
    const legacyItems: Record<string, any> = {};
    updatedGlobalKeys.forEach((itemKey) => {
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
      activeHardwareKeys: updatedGlobalKeys,
      schoolWiseHardware: updatedSchoolMap,
      items: legacyItems,
      ...legacyItems,
    });
  }, [value, onChange]);

  // --- Handlers ---
  const handleToggleGlobalHardware = useCallback((itemKey: string) => {
    let nextKeys: string[];
    const isCurrentlySelected = selectedGlobalKeys.includes(itemKey);
    if (isCurrentlySelected) {
      nextKeys = selectedGlobalKeys.filter((k) => k !== itemKey);
    } else {
      nextKeys = [...selectedGlobalKeys, itemKey];
    }

    const nextSchoolMap = { ...schoolAllocations };
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = { ...(nextSchoolMap[sch.id] || {}) };
      if (isCurrentlySelected) {
        delete nextSchoolMap[sch.id][itemKey];
      } else {
        const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
        nextSchoolMap[sch.id][itemKey] = {
          itemKey,
          itemName: defObj?.label || itemKey,
          quantity: itemKey === 'STUDENT_TABLETS' ? 10 : 1,
          specNotes: defObj?.desc || '',
          serialNotes: '',
        };
      }
    });

    emitUpdate(nextKeys, nextSchoolMap);
  }, [selectedGlobalKeys, schoolAllocations, effectiveSchools, emitUpdate]);

  const handleSelectAllHardware = useCallback(() => {
    const allKeys = DEFAULT_HARDWARE_ITEMS.map((s) => s.key);
    const nextSchoolMap = { ...schoolAllocations };

    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = { ...(nextSchoolMap[sch.id] || {}) };
      allKeys.forEach((itemKey) => {
        if (!nextSchoolMap[sch.id][itemKey]) {
          const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
          nextSchoolMap[sch.id][itemKey] = {
            itemKey,
            itemName: defObj?.label || itemKey,
            quantity: itemKey === 'STUDENT_TABLETS' ? 10 : 1,
            specNotes: defObj?.desc || '',
            serialNotes: '',
          };
        }
      });
    });

    emitUpdate(allKeys, nextSchoolMap);
  }, [schoolAllocations, effectiveSchools, emitUpdate]);

  const handleClearAllHardware = useCallback(() => {
    const nextSchoolMap: Record<string, Record<string, SchoolHardwareItem>> = {};
    effectiveSchools.forEach((sch: EffectiveSchoolItem) => {
      nextSchoolMap[sch.id] = {};
    });
    emitUpdate([], nextSchoolMap);
  }, [effectiveSchools, emitUpdate]);

  const handleUpdateSchoolHardware = useCallback((
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

    emitUpdate(selectedGlobalKeys, nextSchoolMap);
  }, [schoolAllocations, selectedGlobalKeys, emitUpdate]);

  // Calculate Aggregated Metrics
  const totalHardwareUnits = useMemo(() => {
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
      {/* ── STEP 1: GLOBAL HARDWARE MULTI-SELECT DROPDOWN ── */}
      <div className="bg-gradient-to-r from-[#f8fafb] via-white to-[#f8fafb] border border-[#51a8b1]/40 rounded-2xl p-4 shadow-2xs space-y-3">
        <HardwareMultiSelectDropdown
          selectedKeys={selectedGlobalKeys}
          onToggleHardware={handleToggleGlobalHardware}
          onSelectAll={handleSelectAllHardware}
          onClearAll={handleClearAllHardware}
          disabled={disabled}
        />
      </div>

      {/* ── STEP 2: SCHOOL & ADDRESS-WISE HARDWARE BREAKDOWN ── */}
      <div className="bg-white border border-[#b9c0cb]/50 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] text-white flex items-center justify-center text-xs shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1f2937] font-heading">
                Step 2: School &amp; Address-Wise Hardware Allocation
              </h4>
              <p className="text-[10.5px] text-[#6b7280]">
                Assign quantities and specifications per school branch and delivery address.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-lg bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
              Total Units: <strong>{totalHardwareUnits} Items</strong>
            </span>
          </div>
        </div>

        {/* ── Prominent School & Delivery Address Selection Dropdown ── */}
        <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] border-2 border-[#51a8b1]/40 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#3a7d84] mb-1.5 flex items-center gap-1.5">
                <School className="w-4 h-4 text-[#51a8b1]" />
                <span>Select School / Delivery Destination:</span>
                <span className="text-[11px] font-normal normal-case text-[#4a5462]">
                  (Hardware items &amp; specifications will configure for the selected school)
                </span>
              </label>

              <div className="relative">
                <select
                  value={activeSchoolIndex}
                  onChange={(e) => setActiveSchoolIndex(Number(e.target.value))}
                  className="w-full bg-white border-2 border-[#51a8b1] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#1f2937] shadow-xs focus:outline-none focus:ring-2 focus:ring-[#3a7d84] cursor-pointer appearance-none pr-10"
                >
                  {effectiveSchools.map((sch, idx) => {
                    const schHardware = schoolAllocations[sch.id] || {};
                    const activeCount = Object.keys(schHardware).length;
                    return (
                      <option key={sch.id || idx} value={idx}>
                        🏫 {idx + 1}. {sch.name}{' '}
                        {sch.address ? `— [${sch.address.slice(0, 40)}...]` : ''} ({activeCount}{' '}
                        items mapped)
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

          {/* Active School Delivery Address Header Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#51a8b1]/20 text-xs">
            <div>
              <span className="px-2 py-0.5 rounded-md bg-[#51a8b1] text-white font-bold text-[11px]">
                Target Destination: {currentSchool.name}
              </span>
              {currentSchool.address && (
                <div className="text-[11px] text-[#4a5462] flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#51a8b1] shrink-0" />
                  <span>Delivery Address: {currentSchool.address}</span>
                </div>
              )}
            </div>

            <span className="text-[11px] font-semibold text-[#3a7d84]">
              {selectedGlobalKeys.length} hardware product(s) mapped
            </span>
          </div>
        </div>

        {/* Selected School's Hardware Breakdown */}
        {selectedGlobalKeys.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Please select at least one hardware product from the hardware dropdown above to configure quantities and specifications.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedGlobalKeys.map((itemKey) => {
              const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
              const item = schoolAllocations[currentSchool.id]?.[itemKey] || {
                itemKey,
                itemName: defObj?.label || itemKey,
                quantity: itemKey === 'STUDENT_TABLETS' ? 10 : 1,
                specNotes: defObj?.desc || '',
                serialNotes: '',
              };

              return (
                <div
                  key={itemKey}
                  className="bg-[#fcfdfd] border border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 rounded-2xl p-3.5 shadow-2xs space-y-2.5 transition-all text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{defObj?.icon || '🖥️'}</span>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-[#1f2937] font-heading truncate">
                          {defObj?.label || itemKey}
                        </h5>
                        <p className="text-[10px] text-gray-500 truncate">{defObj?.desc}</p>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#51a8b1]/15 text-[#3a7d84] shrink-0">
                      Required: {item.quantity || 1} units
                    </span>
                  </div>

                  {/* 2-Column Inputs Grid: Quantity & Spec/Brand */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Quantity */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#4b5563] mb-1">
                        Quantity Required <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleUpdateSchoolHardware(
                            currentSchool.id,
                            itemKey,
                            'quantity',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937] font-bold"
                      />
                    </div>

                    {/* Model / Brand / Spec */}
                    <div>
                      <label className="block text-[10px] font-bold text-[#4b5563] mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-[#51a8b1]" />
                        <span>Model / Brand / Specification</span>
                      </label>
                      <input
                        type="text"
                        disabled={disabled}
                        value={item.specNotes || ''}
                        onChange={(e) =>
                          handleUpdateSchoolHardware(
                            currentSchool.id,
                            itemKey,
                            'specNotes',
                            e.target.value
                          )
                        }
                        placeholder="e.g. 75-inch UHD, Maxhub 4K, 4GB RAM"
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                      />
                    </div>
                  </div>

                  {/* Remarks / Serial Notes */}
                  <div>
                    <input
                      type="text"
                      disabled={disabled}
                      value={item.serialNotes || ''}
                      onChange={(e) =>
                        handleUpdateSchoolHardware(
                          currentSchool.id,
                          itemKey,
                          'serialNotes',
                          e.target.value
                        )
                      }
                      placeholder="Serial numbers or delivery remarks for this school branch..."
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

export default HardwareRequirementsInput;
