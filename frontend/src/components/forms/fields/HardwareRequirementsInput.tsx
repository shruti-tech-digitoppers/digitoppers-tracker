'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_HARDWARE_ITEMS,
  DEFAULT_SOLUTIONS,
  EffectiveSchoolItem,
  extractEffectiveSchools
} from '../utils/formHelpers';
import { useSolutionsAndHardware, MasterHardware, MasterSolution } from '@/lib/hooks/useSolutionsAndHardware';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import {
  Check,
  Cpu,
  ChevronDown,
  Search,
  X,
  Plus,
  Trash2,
  Wrench,
  Sparkles,
  Layers,
  Building2,
  PlusCircle,
  PackageCheck,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface SchoolHardwareItem {
  itemKey: string;
  itemName: string;
  quantity: number;
  specNotes: string;
  serialNotes: string;
  solutionKey?: string;
  solutionName?: string;
}

interface HardwareRequirementsInputProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  schools?: any[];
  allFormData?: Record<string, any>;
}

// Recommended hardware mapping per solution
export const DEFAULT_SOLUTION_HARDWARE_MAP: Record<string, string[]> = {
  SMART_SHAALA: ['IFP', 'OPS', 'SCHOOL_BELL_PRO', 'CAMERA', 'PODIUM', 'WIRELESS_KEYBOARD_MOUSE', 'UPS'],
  STEM_LAB: ['STEM_KIT', 'TABLET', 'ANDROID_LAPTOP', 'AR_VR', 'CHARGING_TROLLEY', 'COMPUTER_SYSTEM'],
  ROBOTICS: ['ROBOTICS', 'STEM_KIT', 'ANDROID_LAPTOP', 'TABLET', 'CHARGING_TROLLEY', 'COMPUTER_SYSTEM'],
  ASTRONOMY: ['ASTRONOMY_KIT', 'AR_VR', 'IFP', 'TABLET', 'CAMERA'],
  LANGUAGE: ['TABLET', 'CHARGING_TROLLEY', 'ANDROID_LAPTOP', 'COMPUTER_SYSTEM', 'IFP', 'WIRELESS_KEYBOARD_MOUSE'],
  EPATHSHALA: ['IFP', 'OPS', 'PENDRIVE', 'SD_CARD', 'ANDROID_LAPTOP', 'UPS'],
  SCIENCE_LEARNING: ['STEM_KIT', 'TABLET', 'IFP', 'AR_VR', 'CHARGING_TROLLEY'],
};

// ─── ADD HARDWARE POPOVER SELECTOR (PER SOLUTION) ───
interface AddHardwarePopoverProps {
  solutionKey: string;
  solutionName: string;
  hardwareList: MasterHardware[];
  selectedKeys: string[];
  onSelectHardware: (itemKey: string) => void;
  disabled?: boolean;
}

function AddHardwarePopover({
  solutionKey,
  solutionName,
  hardwareList,
  selectedKeys,
  onSelectHardware,
  disabled = false,
}: AddHardwarePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  const availableHardware = useMemo(() => {
    return hardwareList.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc || item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [hardwareList, searchQuery]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-[#3a7d84] text-white border-[#3a7d84] shadow-xs'
            : 'bg-white hover:bg-[#f0f8f9] text-[#2d6b73] border-[#b6e0e4] hover:border-[#51a8b1] shadow-2xs'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Hardware to {solutionName}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 sm:right-auto sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#b6e0e4] rounded-2xl shadow-2xl p-3 space-y-2.5 max-h-[380px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Select Hardware for <span className="text-[#3a7d84]">{solutionName}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-slate-50 text-slate-800"
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

          <div className="overflow-y-auto space-y-1 pr-1 flex-1 max-h-[240px]">
            {availableHardware.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No hardware found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              availableHardware.map((item) => {
                const isAlreadySelected = selectedKeys.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onSelectHardware(item.key);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                      isAlreadySelected
                        ? 'bg-[#f0f8f9] border-[#51a8b1] text-slate-800'
                        : 'bg-white border-slate-100 hover:border-[#51a8b1] hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{item.icon || '🖥️'}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-slate-800">{item.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isAlreadySelected ? (
                        <span className="text-[10px] font-bold text-[#3a7d84] bg-[#e0f3f5] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> Added
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-[#3a7d84] hover:text-white px-2 py-0.5 rounded-md transition flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ATTACH SOLUTION POPOVER (IF NO SOLUTIONS CONFIGURED IN PREVIOUS STEP) ───
interface AttachSolutionPopoverProps {
  solutionsList: MasterSolution[];
  currentSolutionKeys: string[];
  onSelectSolution: (solKey: string) => void;
  disabled?: boolean;
}

function AttachSolutionPopover({
  solutionsList,
  currentSolutionKeys,
  onSelectSolution,
  disabled = false,
}: AttachSolutionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
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

  const availableSolutions = useMemo(() => {
    return solutionsList.filter((item) => {
      const matchesSearch =
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.desc || item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [solutionsList, searchQuery]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#3a7d84] hover:bg-[#2d6268] text-white shadow-2xs transition cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Attach Solution to this School</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#b6e0e4] rounded-2xl shadow-2xl p-3 space-y-2.5 max-h-[380px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800">
              Select Solution to Configure Hardware
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search solutions (e.g. Smart Shaala, STEM Lab)..."
              className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-slate-50 text-slate-800"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto space-y-1 pr-1 flex-1 max-h-[240px]">
            {availableSolutions.map((sol) => {
              const isAlreadyPresent = currentSolutionKeys.includes(sol.key);
              return (
                <button
                  key={sol.key}
                  type="button"
                  onClick={() => {
                    onSelectSolution(sol.key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer ${
                    isAlreadyPresent
                      ? 'bg-[#f0f8f9] border-[#51a8b1] text-slate-800'
                      : 'bg-white border-slate-100 hover:border-[#51a8b1] hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{sol.icon || '🔬'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-800">{sol.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{sol.desc}</div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isAlreadyPresent ? (
                      <span className="text-[10px] font-bold text-[#3a7d84] bg-[#e0f3f5] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-[#3a7d84] hover:text-white px-2 py-0.5 rounded-md transition flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Select
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
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
  const { hardware: masterHardware, solutions: masterSolutions } = useSolutionsAndHardware();
  const catalogHardware = masterHardware;
  const catalogSolutions = masterSolutions;

  // 1. Determine effective schools list
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);

  // Local state to allow manually attaching solutions to a school if none were set in previous step
  const [locallyAttachedSolutions, setLocallyAttachedSolutions] = useState<Record<string, string[]>>({});

  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0] || { id: 'school-1', name: 'Primary School' };

  // 2. Extract ONLY CONFIGURED / SELECTED SOLUTIONS FOR THE CURRENT SCHOOL FROM DB / FORMDATA
  const currentSchoolSolutions = useMemo(() => {
    // Collect all possible schoolWiseSolutions maps from DB and cross-node payloads
    const candidateMaps: Record<string, any>[] = [
      allFormData?.stage3SchoolWiseSolutions,
      allFormData?.stage3SolutionsData?.schoolWiseSolutions,
      allFormData?.solutionSelection?.schoolWiseSolutions,
      allFormData?.orderRequirement?.solutionSelection?.schoolWiseSolutions,
      allFormData?.project?.orderRequirement?.solutionSelection?.schoolWiseSolutions,
      allFormData?.schoolWiseSolutions,
      value?.schoolWiseSolutions,
    ].filter((m) => m && typeof m === 'object' && Object.keys(m).length > 0);

    let schoolSolData: Record<string, any> | null = null;

    for (const solMap of candidateMaps) {
      // 1. Direct ID match
      if (solMap[currentSchool.id]) {
        schoolSolData = solMap[currentSchool.id];
        break;
      }
      // 2. Match by _id if different
      if ((currentSchool as any)._id && solMap[(currentSchool as any)._id]) {
        schoolSolData = solMap[(currentSchool as any)._id];
        break;
      }
      // 3. Match by name or schoolName
      const schoolNameKey = (currentSchool.name || (currentSchool as any).schoolName || '').toLowerCase().trim();
      const matchingKeyByName = Object.keys(solMap).find(
        (k) => k.toLowerCase().trim() === schoolNameKey
      );
      if (matchingKeyByName && solMap[matchingKeyByName]) {
        schoolSolData = solMap[matchingKeyByName];
        break;
      }
      // 4. Match by school-1, school-2 index key
      const indexedKey = `school-${activeSchoolIndex + 1}`;
      if (solMap[indexedKey]) {
        schoolSolData = solMap[indexedKey];
        break;
      }
      // 5. Positional index match if keys count matches schools
      const mapKeys = Object.keys(solMap);
      if (mapKeys[activeSchoolIndex] && solMap[mapKeys[activeSchoolIndex]]) {
        schoolSolData = solMap[mapKeys[activeSchoolIndex]];
        break;
      }
    }

    // Convert matched solution entries
    const configuredList: any[] = [];
    if (schoolSolData && typeof schoolSolData === 'object') {
      Object.entries(schoolSolData).forEach(([solKey, item]: [string, any]) => {
        // Skip if not an active/selected object or false
        if (!item || item === false) return;
        const defObj =
          catalogSolutions.find((d) => d.key === solKey) ||
          DEFAULT_SOLUTIONS.find((d) => d.key === solKey);

        configuredList.push({
          solutionKey: solKey,
          solutionName: item.solutionName || defObj?.label || solKey,
          icon: defObj?.icon || '🔬',
          desc: defObj?.desc || '',
          quantity: Number(item.quantity) || 1,
          targetClasses: Array.isArray(item.targetClasses)
            ? item.targetClasses
            : typeof item.targetClasses === 'string' && item.targetClasses
              ? item.targetClasses.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          board: item.board || 'CBSE',
          notes: item.notes || '',
        });
      });
    }

    // Top-level fallback IF no school-wise structure exists but top-level solutions exist
    if (configuredList.length === 0) {
      const topLevelKeys =
        allFormData?.solutionSelection?.activeSolutionKeys ||
        allFormData?.stage3SolutionsData?.activeSolutionKeys ||
        allFormData?.activeSolutionKeys ||
        (Array.isArray(allFormData?.project?.orderRequirement?.solutionSelection?.activeSolutionKeys)
          ? allFormData.project.orderRequirement.solutionSelection.activeSolutionKeys
          : []);

      if (Array.isArray(topLevelKeys) && topLevelKeys.length > 0) {
        topLevelKeys.forEach((solKey: string) => {
          const topData =
            allFormData?.solutionSelection?.[solKey] ||
            allFormData?.stage3SolutionsData?.[solKey] ||
            allFormData?.[solKey] ||
            {};
          const defObj =
            catalogSolutions.find((d) => d.key === solKey) ||
            DEFAULT_SOLUTIONS.find((d) => d.key === solKey);

          configuredList.push({
            solutionKey: solKey,
            solutionName: topData.solutionName || defObj?.label || solKey,
            icon: defObj?.icon || '🔬',
            desc: defObj?.desc || '',
            quantity: Number(topData.quantity) || 1,
            targetClasses: Array.isArray(topData.targetClasses)
              ? topData.targetClasses
              : typeof topData.targetClasses === 'string' && topData.targetClasses
                ? topData.targetClasses.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [],
            board: topData.board || 'CBSE',
            notes: topData.notes || '',
          });
        });
      }
    }

    // Merge any solutions attached manually via the UI button for this school
    const localKeys = locallyAttachedSolutions[currentSchool.id] || [];
    localKeys.forEach((solKey) => {
      if (!configuredList.some((s) => s.solutionKey === solKey)) {
        const defObj =
          catalogSolutions.find((d) => d.key === solKey) ||
          DEFAULT_SOLUTIONS.find((d) => d.key === solKey);
        configuredList.push({
          solutionKey: solKey,
          solutionName: defObj?.label || solKey,
          icon: defObj?.icon || '🔬',
          desc: defObj?.desc || '',
          quantity: 1,
          targetClasses: ['Class 6', 'Class 7', 'Class 8'],
          board: 'CBSE',
          notes: '',
        });
      }
    });

    // RETURN ONLY SELECTED/CONFIGURED SOLUTIONS FOR THIS PARTICULAR SCHOOL!
    // (If none selected, returns empty array [] - does NOT dump all solutions)
    return configuredList;
  }, [
    allFormData,
    currentSchool.id,
    currentSchool.name,
    activeSchoolIndex,
    catalogSolutions,
    locallyAttachedSolutions,
    value?.schoolWiseSolutions
  ]);

  // Normalization helper for hardware key aliases
  const normalizeHwKey = useCallback((rawKey: string): string => {
    if (!rawKey) return '';
    const upper = rawKey.toUpperCase().trim();
    if (upper === 'IFP_PANEL' || upper === 'IFP_75' || upper === 'IFP_65') return 'IFP';
    if (upper === 'STUDENT_TABLETS' || upper === 'TABLETS' || upper === 'TABLET_10') return 'TABLET';
    if (upper === 'SERVER_MINI_PC' || upper === 'MINI_PC') return 'COMPUTER_SYSTEM';
    if (upper === 'NETWORKING_ROUTER' || upper === 'ROUTER') return 'COMPUTER_SYSTEM';
    return upper;
  }, []);

  // 3. School-wise hardware allocations state
  const schoolAllocations = useMemo<Record<string, Record<string, SchoolHardwareItem>>>(() => {
    const rawSchoolWise =
      value?.schoolWiseHardware ||
      allFormData?.hardwareRequirement?.schoolWiseHardware ||
      allFormData?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
      allFormData?.project?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
      allFormData?.stage3HardwareData?.schoolWiseHardware;

    const initialMap: Record<string, Record<string, SchoolHardwareItem>> = {};
    effectiveSchools.forEach((sch) => {
      initialMap[sch.id] = {};
    });

    const addItem = (schoolLookup: any, rawItemKey: string, rawVal: any) => {
      const schLookupStr = String(schoolLookup || '').toLowerCase().trim();
      const targetSchool = effectiveSchools.find((s, sIdx) => {
        const sId = String(s.id || '').toLowerCase().trim();
        const s_Id = String((s as any)._id || '').toLowerCase().trim();
        const sSchoolId = String((s as any).schoolId || '').toLowerCase().trim();
        const sName = String(s.name || '').toLowerCase().trim();
        return (
          sId === schLookupStr ||
          s_Id === schLookupStr ||
          sSchoolId === schLookupStr ||
          sName === schLookupStr ||
          `school-${sIdx + 1}` === schLookupStr ||
          String(sIdx) === schLookupStr
        );
      });

      const schoolId = targetSchool?.id || schoolLookup;
      if (!initialMap[schoolId]) {
        initialMap[schoolId] = {};
      }

      const itemKey = normalizeHwKey(rawItemKey);
      const defObj =
        catalogHardware.find((d) => d.key === itemKey || d.key === rawItemKey) ||
        DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.key === rawItemKey);

      const qty = Number(rawVal?.quantity || rawVal?.qty || rawVal) || 1;
      const spec = rawVal?.specNotes || rawVal?.specs || rawVal?.specifications || defObj?.desc || '';
      const serial = rawVal?.serialNotes || rawVal?.room || '';
      const solKey = rawVal?.solutionKey || '';
      const solName = rawVal?.solutionName || '';

      initialMap[schoolId][itemKey] = {
        itemKey,
        itemName: rawVal?.itemName || defObj?.label || itemKey,
        quantity: qty,
        specNotes: spec,
        serialNotes: serial,
        solutionKey: solKey,
        solutionName: solName,
      };
    };

    // 1. If rawSchoolWise is an Array (from MongoDB seed / schema: [ { schoolId: '...', hardware: { ... } } ])
    if (Array.isArray(rawSchoolWise) && rawSchoolWise.length > 0) {
      rawSchoolWise.forEach((entry, idx) => {
        const schKey = entry.schoolId || entry.id || entry.schoolName || effectiveSchools[idx]?.id || `school-${idx + 1}`;
        const hwObj = entry.hardware || entry.items || entry;
        if (hwObj && typeof hwObj === 'object') {
          Object.entries(hwObj).forEach(([k, v]) => {
            if (k !== 'schoolId' && k !== 'schoolName' && k !== 'id' && k !== '_id' && v) {
              addItem(schKey, k, v);
            }
          });
        }
      });
      return initialMap;
    }

    // 2. If rawSchoolWise is an Object (e.g. { 'SCH-DEL-0101': { 'IFP': { ... } } })
    if (rawSchoolWise && typeof rawSchoolWise === 'object' && Object.keys(rawSchoolWise).length > 0) {
      Object.entries(rawSchoolWise).forEach(([schKey, hwMap]) => {
        if (hwMap && typeof hwMap === 'object') {
          Object.entries(hwMap as Record<string, any>).forEach(([k, v]) => {
            if (v) addItem(schKey, k, v);
          });
        }
      });
      return initialMap;
    }

    // 3. Fallback to top-level items / activeHardwareKeys
    const legacyItems = value?.hardware || value?.items || value || {};
    const fallbackKeys = Array.isArray(value?.activeHardwareKeys)
      ? value.activeHardwareKeys
      : Object.keys(legacyItems).filter((k) => k !== 'schoolWiseHardware' && k !== 'activeHardwareKeys');

    effectiveSchools.forEach((sch) => {
      fallbackKeys.forEach((rawItemKey: string) => {
        const legacy = legacyItems[rawItemKey] || {};
        const itemKey = normalizeHwKey(rawItemKey);
        const defObj =
          catalogHardware.find((d) => d.key === itemKey || d.key === rawItemKey) ||
          DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.key === rawItemKey);

        initialMap[sch.id][itemKey] = {
          itemKey,
          itemName: legacy.itemName || defObj?.label || itemKey,
          quantity: Number(legacy.quantity) || (itemKey === 'TABLET' ? 10 : 1),
          specNotes: legacy.specNotes || legacy.specifications || defObj?.desc || '',
          serialNotes: legacy.serialNotes || '',
          solutionKey: legacy.solutionKey || '',
          solutionName: legacy.solutionName || '',
        };
      });
    });

    return initialMap;
  }, [value, allFormData, effectiveSchools, catalogHardware, normalizeHwKey]);

  // Synchronize state with parent
  const emitUpdate = useCallback(
    (updatedSchoolMap: Record<string, Record<string, SchoolHardwareItem>>) => {
      const allActiveKeys = Array.from(
        new Set(
          Object.values(updatedSchoolMap).flatMap((sMap) =>
            sMap && typeof sMap === 'object' ? Object.keys(sMap) : []
          )
        )
      );

      const legacyItems: Record<string, any> = {};
      allActiveKeys.forEach((itemKey) => {
        const defObj =
          catalogHardware.find((d) => d.key === itemKey) ||
          DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
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
    },
    [value, onChange, catalogHardware]
  );

  // Active school's selected hardware map
  const activeSchoolHardware = useMemo(() => {
    return (
      schoolAllocations[currentSchool.id] ||
      schoolAllocations[(currentSchool as any).schoolId] ||
      schoolAllocations[(currentSchool as any)._id] ||
      schoolAllocations[`school-${activeSchoolIndex + 1}`] ||
      {}
    );
  }, [schoolAllocations, currentSchool, activeSchoolIndex]);

  const activeSchoolKeys = useMemo(() => {
    return Object.keys(activeSchoolHardware);
  }, [activeSchoolHardware]);

  // Toggle hardware selection for a specific solution in the active school
  const handleToggleHardwareForSolution = useCallback(
    (itemKey: string, solutionKey: string, solutionName: string) => {
      const schoolId = currentSchool.id;
      const nextSchoolMap = { ...schoolAllocations };
      nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

      if (nextSchoolMap[schoolId][itemKey]) {
        delete nextSchoolMap[schoolId][itemKey];
      } else {
        const defObj =
          catalogHardware.find((d) => d.key === itemKey) ||
          DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
        nextSchoolMap[schoolId][itemKey] = {
          itemKey,
          itemName: defObj?.label || itemKey,
          quantity: itemKey === 'TABLET' ? 10 : 1,
          specNotes: defObj?.desc || '',
          serialNotes: '',
          solutionKey,
          solutionName,
        };
      }

      emitUpdate(nextSchoolMap);
    },
    [currentSchool.id, schoolAllocations, emitUpdate, catalogHardware]
  );

  // Add a hardware item to a solution
  const handleAddHardwareToSolution = useCallback(
    (itemKey: string, solutionKey: string, solutionName: string) => {
      const schoolId = currentSchool.id;
      const nextSchoolMap = { ...schoolAllocations };
      nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };

      const defObj =
        catalogHardware.find((d) => d.key === itemKey) ||
        DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);

      nextSchoolMap[schoolId][itemKey] = {
        itemKey,
        itemName: defObj?.label || itemKey,
        quantity: nextSchoolMap[schoolId][itemKey]?.quantity || (itemKey === 'TABLET' ? 10 : 1),
        specNotes: nextSchoolMap[schoolId][itemKey]?.specNotes || defObj?.desc || '',
        serialNotes: nextSchoolMap[schoolId][itemKey]?.serialNotes || '',
        solutionKey,
        solutionName,
      };

      emitUpdate(nextSchoolMap);
    },
    [currentSchool.id, schoolAllocations, emitUpdate, catalogHardware]
  );

  // Update hardware field (quantity, specNotes, serialNotes, etc.)
  const handleUpdateHardwareField = useCallback(
    (itemKey: string, field: keyof SchoolHardwareItem, val: any) => {
      const schoolId = currentSchool.id;
      const nextSchoolMap = { ...schoolAllocations };
      nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
      const defObj =
        catalogHardware.find((d) => d.key === itemKey) ||
        DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);

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
    },
    [currentSchool.id, schoolAllocations, emitUpdate, catalogHardware]
  );

  // Remove a hardware item from the active school
  const handleRemoveHardware = useCallback(
    (itemKey: string) => {
      const schoolId = currentSchool.id;
      const nextSchoolMap = { ...schoolAllocations };
      nextSchoolMap[schoolId] = { ...(nextSchoolMap[schoolId] || {}) };
      delete nextSchoolMap[schoolId][itemKey];
      emitUpdate(nextSchoolMap);
    },
    [currentSchool.id, schoolAllocations, emitUpdate]
  );

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

  // Manually attach a solution to this school from the UI
  const handleAttachSolutionToSchool = useCallback(
    (solKey: string) => {
      setLocallyAttachedSolutions((prev) => ({
        ...prev,
        [currentSchool.id]: Array.from(new Set([...(prev[currentSchool.id] || []), solKey])),
      }));
    },
    [currentSchool.id]
  );

  // Helper to get recommended hardware keys for a solution
  const getRecommendedHardwareKeys = useCallback(
    (solKey: string): string[] => {
      const mappedFromCatalog = catalogHardware
        .filter((item) => (item.solutions || []).includes(solKey))
        .map((item) => item.key);

      if (mappedFromCatalog.length > 0) return mappedFromCatalog;

      return DEFAULT_SOLUTION_HARDWARE_MAP[solKey] || ['IFP', 'TABLET', 'UPS'];
    },
    [catalogHardware]
  );

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

  // Total units for active school
  const activeSchoolTotalUnits = useMemo(() => {
    return Object.values(activeSchoolHardware).reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    );
  }, [activeSchoolHardware]);

  return (
    <div className="space-y-4 font-sans">
      {/* ── STEP 1: Institutional School Master-Card Selector ────── */}
      <InstitutionalSchoolSelector
        schools={effectiveSchools}
        activeIndex={activeSchoolIndex}
        onSelectIndex={setActiveSchoolIndex}
        activeItemCount={activeSchoolKeys.length}
        itemTypeLabel="Hardware Items"
        totalAcrossSchoolsText={`Total Across Schools: ${totalUnitsAcrossSchools} Units`}
        getItemCountForSchool={(schoolId) => Object.keys(schoolAllocations[schoolId] || {}).length}
        onApplyToAll={handleApplyToAllSchools}
        disabled={disabled}
      />

      {/* ── LIVE SCHOOL SUMMARY BANNER ── */}
      <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] border border-[#b6e0e4] rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center shrink-0 shadow-2xs">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-heading truncate">
              {currentSchool.name || (effectiveSchools.length > 1 ? `Untitled School ${activeSchoolIndex + 1}` : 'Untitled School')} Hardware Plan
            </h4>
            <p className="text-[11px] text-slate-500 font-normal">
              Showing <strong className="text-[#2d6b73] font-bold">{currentSchoolSolutions.length}</strong> selected solution{currentSchoolSolutions.length === 1 ? '' : 's'} from database for this school.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] text-[#2d6b73] shadow-2xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#51a8b1]" />
            <span>{currentSchoolSolutions.length} Solution{currentSchoolSolutions.length === 1 ? '' : 's'} Selected</span>
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-2xs">
            {activeSchoolKeys.length} Products Selected
          </span>
          <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-[#3a7d84] text-white shadow-2xs">
            {activeSchoolTotalUnits} Total Units
          </span>
        </div>
      </div>

      {/* ── STEP 2: SELECTED SOLUTIONS DIRECT DISPLAY WITH HARDWARE SELECTION ── */}
      {currentSchoolSolutions.length === 0 ? (
        /* Empty State when no solutions were selected for this school in previous stage */
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800 font-heading">
              No Solutions Selected for {currentSchool.name || (effectiveSchools.length > 1 ? `Untitled School ${activeSchoolIndex + 1}` : 'Untitled School')}
            </h4>
            <p className="text-xs text-slate-500">
              In Stage 03 (Solution Selection), no academic solutions were configured for this specific school branch yet. You can attach a solution below or configure general school hardware.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2">
            <AttachSolutionPopover
              solutionsList={catalogSolutions}
              currentSolutionKeys={currentSchoolSolutions.map((s) => s.solutionKey)}
              onSelectSolution={handleAttachSolutionToSchool}
              disabled={disabled}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSchoolSolutions.map((sol) => {
            const recommendedKeys = getRecommendedHardwareKeys(sol.solutionKey);

            // Filter active hardware items belonging to this specific solution
            const selectedHardwareUnderSolution = activeSchoolKeys
              .filter((key) => {
                const item = activeSchoolHardware[key];
                if (item?.solutionKey && item.solutionKey === sol.solutionKey) return true;
                if (!item?.solutionKey) {
                  if (recommendedKeys.includes(key)) return true;
                  const isFirstSolution = currentSchoolSolutions[0]?.solutionKey === sol.solutionKey;
                  const matchesOtherSolution = currentSchoolSolutions.some(
                    (otherSol) =>
                      otherSol.solutionKey !== sol.solutionKey &&
                      getRecommendedHardwareKeys(otherSol.solutionKey).includes(key)
                  );
                  if (isFirstSolution && !matchesOtherSolution) return true;
                }
                return false;
              })
              .map((key) => {
                const defObj =
                  catalogHardware.find((d) => d.key === key) ||
                  DEFAULT_HARDWARE_ITEMS.find((d) => d.key === key);
                return (
                  activeSchoolHardware[key] || {
                    itemKey: key,
                    itemName: defObj?.label || key,
                    quantity: key === 'TABLET' ? 10 : 1,
                    specNotes: defObj?.desc || '',
                    serialNotes: '',
                    solutionKey: sol.solutionKey,
                    solutionName: sol.solutionName,
                  }
                );
              });

            const solutionUnits = selectedHardwareUnderSolution.reduce(
              (sum, item) => sum + (Number(item.quantity) || 1),
              0
            );

            return (
              <div
                key={sol.solutionKey}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#51a8b1]/60 shadow-2xs transition-all overflow-hidden"
              >
                {/* Solution Header Card */}
                <div className="p-4 bg-gradient-to-r from-[#f8fcfd] via-white to-slate-50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      {sol.icon || '🔬'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 font-heading">
                          {sol.solutionName}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                          {sol.solutionKey}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5 flex-wrap">
                        <span>Board: <strong className="text-slate-700">{sol.board || 'CBSE'}</strong></span>
                        <span>•</span>
                        <span>{sol.quantity} Solution Unit{sol.quantity > 1 ? 's' : ''}</span>
                        {sol.targetClasses && sol.targetClasses.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-medium">
                              {sol.targetClasses.slice(0, 3).join(', ')}
                              {sol.targetClasses.length > 3 ? ` +${sol.targetClasses.length - 3} more` : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]">
                      {selectedHardwareUnderSolution.length} Hardware Selected ({solutionUnits} Units)
                    </span>
                    <AddHardwarePopover
                      solutionKey={sol.solutionKey}
                      solutionName={sol.solutionName}
                      hardwareList={catalogHardware}
                      selectedKeys={activeSchoolKeys}
                      onSelectHardware={(key) =>
                        handleAddHardwareToSolution(key, sol.solutionKey, sol.solutionName)
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                {/* Solution Body: Hardware Selection & Configuration */}
                <div className="p-4 space-y-4">
                  {/* 1. Quick Recommended Hardware Toggle Chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#3a7d84]" />
                      <span>Recommended Hardware for {sol.solutionName}</span>
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {recommendedKeys.map((itemKey) => {
                        const defObj =
                          catalogHardware.find((d) => d.key === itemKey) ||
                          DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey);
                        const isSelected = !!activeSchoolHardware[itemKey];

                        return (
                          <button
                            key={itemKey}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              handleToggleHardwareForSolution(
                                itemKey,
                                sol.solutionKey,
                                sol.solutionName
                              )
                            }
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#3a7d84] text-white border-[#3a7d84] shadow-xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-[#51a8b1]'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span>{defObj?.icon || '🖥️'}</span>
                            <span>{defObj?.label || itemKey}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <Plus className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Active Hardware List for this Solution */}
                  {selectedHardwareUnderSolution.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
                      <p className="text-xs text-slate-500 font-medium">
                        No hardware selected for {sol.solutionName} yet. Click on the recommended items above or use &ldquo;Add Hardware to {sol.solutionName}&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Configured Hardware ({selectedHardwareUnderSolution.length} items)</span>
                        <span className="text-slate-400 font-normal normal-case">
                          Set required quantities & specifications for {sol.solutionName}
                        </span>
                      </div>

                      {selectedHardwareUnderSolution.map((item) => {
                        const defObj =
                          catalogHardware.find((d) => d.key === item.itemKey) ||
                          DEFAULT_HARDWARE_ITEMS.find((d) => d.key === item.itemKey);

                        return (
                          <div
                            key={item.itemKey}
                            className="bg-slate-50/80 border border-slate-200 hover:border-[#51a8b1]/60 rounded-xl p-3.5 shadow-2xs space-y-3 transition-all"
                          >
                            {/* Hardware Title & Action Row */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{defObj?.icon || '🖥️'}</span>
                                <h5 className="text-xs font-bold text-slate-800 font-heading">
                                  {defObj?.label || item.itemKey}
                                </h5>
                                <span className="text-[10px] text-slate-400">
                                  ({defObj?.desc || item.itemKey})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]">
                                  {item.quantity || 1} Unit{item.quantity > 1 ? 's' : ''}
                                </span>
                                {!disabled && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveHardware(item.itemKey)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                    title="Remove hardware product"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Inputs Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* Quantity Needed */}
                              <div>
                                <label className="block text-[10.5px] font-bold text-slate-700 mb-1">
                                  Quantity (No. of Units) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  disabled={disabled}
                                  value={item.quantity || 1}
                                  onChange={(e) =>
                                    handleUpdateHardwareField(
                                      item.itemKey,
                                      'quantity',
                                      Math.max(1, Number(e.target.value) || 1)
                                    )
                                  }
                                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-bold"
                                />
                              </div>

                              {/* Specification / Model Requirement */}
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
                                    handleUpdateHardwareField(item.itemKey, 'specNotes', e.target.value)
                                  }
                                  placeholder="e.g., 75-inch 4K UHD, 4GB/32GB Android 13..."
                                  className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] bg-white text-slate-900 font-medium placeholder:text-slate-400"
                                />
                              </div>
                            </div>

                            {/* Deployment Room / Location */}
                            <div>
                              <input
                                type="text"
                                disabled={disabled}
                                value={item.serialNotes || ''}
                                onChange={(e) =>
                                  handleUpdateHardwareField(item.itemKey, 'serialNotes', e.target.value)
                                }
                                placeholder={`Deployment room / setup location for ${sol.solutionName} (e.g., Lab Room 101, Smart Class 2)...`}
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
          })}
        </div>
      )}
    </div>
  );
}

export default HardwareRequirementsInput;
