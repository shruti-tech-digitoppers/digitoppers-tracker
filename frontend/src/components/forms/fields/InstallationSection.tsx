'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Building2, 
  Camera, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Eye, 
  X, 
  RefreshCw,
  Cpu,
  Hash,
  Sparkles,
  Layers
} from 'lucide-react';
import { IUser } from '../../../types/auth';
import { DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';

export interface IHardwareInstalledItem {
  id?: string;
  itemKey?: string;
  productName: string;
  specifications?: string;
  quantity: number;
  serialNumbers: string;
  individualSerials?: string[];
  roomLocation?: string;
  status?: 'INSTALLED' | 'IN_PROGRESS' | 'PENDING';
}

export interface ISchoolInstallationData {
  schoolId?: string;
  schoolName: string;
  schoolCode?: string;
  address?: string;
  hardwareItems: IHardwareInstalledItem[];
  image1Url?: string;
  image1Caption?: string;
  image2Url?: string;
  image2Caption?: string;
  image3Url?: string;
  image3Caption?: string;
}

interface InstallationSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
  project?: any;
}

// Helper to extract hardware list selected in Hardware Requirements / Stage 03 for a specific school
function resolveOrderHardwareForSchool(
  allFormData: Record<string, any> = {},
  schoolId?: string,
  schoolIndex: number = 0,
  schoolName?: string,
  project?: any
): IHardwareInstalledItem[] {
  const list: IHardwareInstalledItem[] = [];

  // 1. Check schoolWiseHardware (from Stage 03 or Project Order Requirement)
  const schoolWiseHw = 
    allFormData?.stage3SchoolWiseHardware || 
    allFormData?.schoolWiseHardware || 
    project?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
    project?.orderRequirement?.schoolWiseHardware ||
    {};

  let targetSchoolHwMap = null;

  if (schoolId && schoolWiseHw[schoolId]) {
    targetSchoolHwMap = schoolWiseHw[schoolId];
  } else {
    const entries = Object.entries(schoolWiseHw);
    if (entries.length > schoolIndex) {
      targetSchoolHwMap = entries[schoolIndex][1];
    } else if (entries.length > 0) {
      targetSchoolHwMap = entries[0][1];
    }
  }

  if (targetSchoolHwMap && typeof targetSchoolHwMap === 'object' && Object.keys(targetSchoolHwMap).length > 0) {
    Object.entries(targetSchoolHwMap).forEach(([hwKey, hwVal]: [string, any]) => {
      const defObj = DEFAULT_HARDWARE_ITEMS.find(d => d.key === hwKey);
      const qty = Number(hwVal?.quantity || 1);
      if (qty > 0) {
        const rawSerials = hwVal?.serialNotes || hwVal?.serialNumbers || '';
        const rawList = typeof rawSerials === 'string' && rawSerials.trim()
          ? rawSerials.split(',').map((s: string) => s.trim())
          : [];
        const individualSerials = Array.from({ length: qty }, (_, i) => rawList[i] || '');

        list.push({
          itemKey: hwKey,
          productName: hwVal?.itemName || defObj?.label || hwKey,
          specifications: hwVal?.specNotes || defObj?.desc || '',
          quantity: qty,
          serialNumbers: rawSerials,
          individualSerials: individualSerials,
        });
      }
    });
    if (list.length > 0) return list;
  }

  // 2. Check activeHardwareKeys with Stage 03 items or project order requirement items
  const activeKeys: string[] = 
    allFormData?.stage3HardwareKeys || 
    allFormData?.activeHardwareKeys || 
    project?.orderRequirement?.hardwareRequirement?.activeHardwareKeys ||
    [];

  const stage3Items = 
    allFormData?.stage3HardwareItems || 
    allFormData?.hardwareRequirements?.items || 
    allFormData?.items || 
    project?.orderRequirement?.hardwareRequirement?.items ||
    project?.orderRequirement?.hardware?.items ||
    {};

  if (Array.isArray(activeKeys) && activeKeys.length > 0) {
    activeKeys.forEach((key) => {
      const defObj = DEFAULT_HARDWARE_ITEMS.find(d => d.key === key);
      const itemData = stage3Items[key] || {};
      const qty = Number(itemData.quantity) || (key === 'STUDENT_TABLETS' ? 10 : 1);
      const rawSerials = itemData.serialNotes || itemData.serialNumbers || '';
      const rawList = typeof rawSerials === 'string' && rawSerials.trim()
        ? rawSerials.split(',').map((s: string) => s.trim())
        : [];
      const individualSerials = Array.from({ length: qty }, (_, i) => rawList[i] || '');

      list.push({
        itemKey: key,
        productName: itemData.itemName || defObj?.label || key,
        specifications: itemData.specNotes || itemData.specifications || defObj?.desc || '',
        quantity: qty,
        serialNumbers: rawSerials,
        individualSerials: individualSerials,
      });
    });
    if (list.length > 0) return list;
  }

  // 3. Check legacy / generic items map
  if (stage3Items && typeof stage3Items === 'object' && Object.keys(stage3Items).length > 0) {
    Object.entries(stage3Items).forEach(([key, val]: [string, any]) => {
      if (val && (val.selected !== false || val.quantity > 0)) {
        const defObj = DEFAULT_HARDWARE_ITEMS.find(d => d.key === key);
        const qty = Number(val.quantity || 1);
        const rawSerials = val.serialNotes || val.serialNumbers || '';
        const rawList = typeof rawSerials === 'string' && rawSerials.trim()
          ? rawSerials.split(',').map((s: string) => s.trim())
          : [];
        const individualSerials = Array.from({ length: qty }, (_, i) => rawList[i] || '');

        list.push({
          itemKey: key,
          productName: val.itemName || defObj?.label || key,
          specifications: val.specifications || val.specNotes || val.specs || defObj?.desc || '',
          quantity: qty,
          serialNumbers: rawSerials,
          individualSerials: individualSerials,
        });
      }
    });
    if (list.length > 0) return list;
  }

  // 4. Default fallback package
  return [
    {
      itemKey: 'IFP',
      productName: 'IFP',
      specifications: 'Interactive Flat Panel Touch Display',
      quantity: 1,
      serialNumbers: '',
      individualSerials: [''],
    },
    {
      itemKey: 'OPS',
      productName: 'OPS',
      specifications: 'Open Pluggable Specification PC Module',
      quantity: 1,
      serialNumbers: '',
      individualSerials: [''],
    }
  ];
}

export function InstallationSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
  project,
}: InstallationSectionProps) {
  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Extract upstream schools from Stage 01 / Stage 03 School Info
  const upstreamSchools = useMemo(() => {
    if (allFormData?.stage3Schools && Array.isArray(allFormData.stage3Schools) && allFormData.stage3Schools.length > 0) {
      return allFormData.stage3Schools;
    }
    if (allFormData?.schools && Array.isArray(allFormData.schools) && allFormData.schools.length > 0) {
      return allFormData.schools;
    }
    if (allFormData?.orderRequirement?.schoolInformation?.schools && Array.isArray(allFormData.orderRequirement.schoolInformation.schools)) {
      return allFormData.orderRequirement.schoolInformation.schools;
    }
    if (project?.schools && Array.isArray(project.schools) && project.schools.length > 0) {
      return project.schools;
    }
    return [];
  }, [allFormData, project]);

  // Normalize initial data and ensure individualSerials array matches quantity
  const schoolsList: ISchoolInstallationData[] = useMemo(() => {
    let list: ISchoolInstallationData[] = [];
    if (Array.isArray(value?.schools) && value.schools.length > 0) {
      list = value.schools;
    } else if (Array.isArray(value?.schoolInstallations) && value.schoolInstallations.length > 0) {
      list = value.schoolInstallations;
    } else if (Array.isArray(value) && value.length > 0) {
      list = value;
    }

    if (list.length === 0) {
      if (upstreamSchools.length > 0) {
        list = upstreamSchools.map((s: any, idx: number) => {
          const resolvedHw = resolveOrderHardwareForSchool(allFormData, s.id || s._id, idx, s.schoolName || s.name, project);
          return {
            schoolId: s.id || s._id || `sch_${idx}`,
            schoolName: s.schoolName || s.name || `School Branch #${idx + 1}`,
            schoolCode: s.schoolCode || `SCH-00${idx + 1}`,
            address: s.address || '',
            hardwareItems: resolvedHw,
            image1Url: '',
            image1Caption: '',
            image2Url: '',
            image2Caption: '',
            image3Url: '',
            image3Caption: '',
          };
        });
      } else {
        const resolvedHw = resolveOrderHardwareForSchool(allFormData, 'main_school', 0, project?.projectName, project);
        list = [
          {
            schoolId: 'main_school',
            schoolName: project?.projectName || project?.title || 'Main School Campus',
            schoolCode: 'SCH-001',
            address: project?.address || '',
            hardwareItems: resolvedHw,
            image1Url: '',
            image1Caption: '',
            image2Url: '',
            image2Caption: '',
            image3Url: '',
            image3Caption: '',
          }
        ];
      }
    }

    // Ensure all hardware items have individualSerials populated matching quantity
    list = list.map(sch => ({
      ...sch,
      hardwareItems: (sch.hardwareItems || []).map(item => {
        const qty = Number(item.quantity) || 1;
        let serials = item.individualSerials || [];
        if (serials.length !== qty) {
          const existingList = (item.serialNumbers || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          serials = Array.from({ length: qty }, (_, i) => existingList[i] || serials[i] || '');
        }
        return {
          ...item,
          quantity: qty,
          individualSerials: serials,
          serialNumbers: item.serialNumbers || serials.filter(Boolean).join(', ')
        };
      })
    }));

    return list;
  }, [value, upstreamSchools, allFormData, project]);

  const currentSchool = schoolsList[activeSchoolIndex] || schoolsList[0];

  const updateCurrentSchool = useCallback((updates: Partial<ISchoolInstallationData>) => {
    if (disabled) return;
    const nextSchools = schoolsList.map((s, idx) => (idx === activeSchoolIndex ? { ...s, ...updates } : s));
    onChange({
      schools: nextSchools,
      schoolInstallations: nextSchools,
      image1Url: nextSchools[0]?.image1Url || '',
      image2Url: nextSchools[0]?.image2Url || '',
      image3Url: nextSchools[0]?.image3Url || '',
      installedItems: nextSchools.map(s => `${s.schoolName}: ${(s.hardwareItems || []).map(h => `${h.productName} (S/N: ${h.serialNumbers || 'Pending'})`).join(', ')}`).join(' | '),
    });
  }, [disabled, schoolsList, activeSchoolIndex, onChange]);

  const handleAddSchool = () => {
    if (disabled) return;
    const newSchoolNum = schoolsList.length + 1;
    const resolvedHw = resolveOrderHardwareForSchool(allFormData, `sch_${newSchoolNum}`, newSchoolNum - 1, undefined, project);
    const newSchool: ISchoolInstallationData = {
      schoolId: `sch_${newSchoolNum}`,
      schoolName: `School Branch #${newSchoolNum}`,
      schoolCode: `SCH-00${newSchoolNum}`,
      hardwareItems: resolvedHw,
      image1Url: '',
      image2Url: '',
      image3Url: '',
    };
    const nextSchools = [...schoolsList, newSchool];
    setActiveSchoolIndex(nextSchools.length - 1);
    onChange({
      schools: nextSchools,
      schoolInstallations: nextSchools,
    });
  };

  const handleDeleteSchool = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || schoolsList.length <= 1) return;
    if (!window.confirm(`Delete installation data for "${schoolsList[indexToDelete]?.schoolName}"?`)) return;

    const nextSchools = schoolsList.filter((_, idx) => idx !== indexToDelete);
    setActiveSchoolIndex(Math.max(0, indexToDelete - 1));
    onChange({
      schools: nextSchools,
      schoolInstallations: nextSchools,
    });
  };

  // Sync / Refresh hardware items directly from Stage 03 Order Requirements
  const handleSyncHardwareFromOrder = () => {
    if (disabled || !currentSchool) return;
    const orderHw = resolveOrderHardwareForSchool(
      allFormData, 
      currentSchool.schoolId, 
      activeSchoolIndex, 
      currentSchool.schoolName,
      project
    );

    const mergedHw = orderHw.map(oItem => {
      const existing = (currentSchool.hardwareItems || []).find(
        e => e.itemKey === oItem.itemKey || e.productName.toLowerCase() === oItem.productName.toLowerCase()
      );
      if (existing) {
        return {
          ...oItem,
          serialNumbers: existing.serialNumbers || oItem.serialNumbers,
          individualSerials: existing.individualSerials || oItem.individualSerials,
        };
      }
      return oItem;
    });

    updateCurrentSchool({ hardwareItems: mergedHw });
  };

  // Update a single unit's serial number inside a hardware item
  const handleUpdateUnitSerial = (hIndex: number, unitIndex: number, serialValue: string) => {
    if (disabled || !currentSchool) return;
    const nextHw = (currentSchool.hardwareItems || []).map((item, idx) => {
      if (idx !== hIndex) return item;
      const qty = Number(item.quantity) || 1;
      const nextSerials = [...(item.individualSerials || Array.from({ length: qty }, () => ''))];
      nextSerials[unitIndex] = serialValue;
      return {
        ...item,
        individualSerials: nextSerials,
        serialNumbers: nextSerials.filter(s => s.trim().length > 0).join(', ')
      };
    });
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  // Add a new custom hardware product row
  const handleAddHardwareRow = () => {
    if (disabled || !currentSchool) return;
    const newRow: IHardwareInstalledItem = {
      productName: '',
      quantity: 1,
      serialNumbers: '',
      individualSerials: [''],
    };
    const nextHw = [...(currentSchool.hardwareItems || []), newRow];
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  // Update generic fields on hardware item (productName, quantity)
  const handleUpdateHardwareRow = (hIndex: number, field: keyof IHardwareInstalledItem, val: any) => {
    if (disabled || !currentSchool) return;
    const nextHw = (currentSchool.hardwareItems || []).map((item, idx) => {
      if (idx !== hIndex) return item;
      if (field === 'quantity') {
        const newQty = Math.max(1, parseInt(val) || 1);
        const existingSerials = item.individualSerials || [];
        const nextSerials = Array.from({ length: newQty }, (_, i) => existingSerials[i] || '');
        return {
          ...item,
          quantity: newQty,
          individualSerials: nextSerials,
          serialNumbers: nextSerials.filter(Boolean).join(', ')
        };
      }
      return { ...item, [field]: val };
    });
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  const handleDeleteHardwareRow = (hIndex: number) => {
    if (disabled || !currentSchool) return;
    const nextHw = (currentSchool.hardwareItems || []).filter((_, idx) => idx !== hIndex);
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  // File / Image upload handler
  const handleUploadImage = async (file: File, imageKey: 'image1Url' | 'image2Url' | 'image3Url') => {
    try {
      setUploadingSlot(imageKey);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || 'Upload failed');
      }

      const uploadedUrl = data.data?.url || data.url;
      updateCurrentSchool({ [imageKey]: uploadedUrl });
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Please try again'}`);
    } finally {
      setUploadingSlot(null);
    }
  };

  if (!currentSchool) return null;

  // Calculate total units & serial filled counts
  const totalUnits = (currentSchool.hardwareItems || []).reduce((acc, h) => acc + (Number(h.quantity) || 1), 0);
  const totalSerialsFilled = (currentSchool.hardwareItems || []).reduce((acc, h) => {
    const filled = (h.individualSerials || []).filter(s => (s || '').trim().length > 0).length;
    return acc + filled;
  }, 0);
  const isAllFilled = totalUnits > 0 && totalSerialsFilled === totalUnits;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── SCHOOL BRANCH SELECTOR (If multi-school project) ───────── */}
      {schoolsList.length > 1 && (
        <div className="bg-[#f0f9fa] border border-[#b6e0e4] rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1f4e53] font-heading">
                Select School ({schoolsList.length} Schools)
              </span>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={handleAddSchool}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2d6b73] border border-[#b6e0e4] hover:bg-[#3a7d84] hover:text-white transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add School</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
            {schoolsList.map((s, idx) => {
              const isActive = idx === activeSchoolIndex;
              const sUnits = (s.hardwareItems || []).reduce((acc, h) => acc + (Number(h.quantity) || 1), 0);
              const sFilled = (s.hardwareItems || []).reduce((acc, h) => acc + (h.individualSerials || []).filter(v => (v || '').trim().length > 0).length, 0);
              const sComplete = sUnits > 0 && sFilled === sUnits;
              
              return (
                <div
                  key={idx}
                  onClick={() => setActiveSchoolIndex(idx)}
                  className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-[#3a7d84] text-white border-[#2d6b73] shadow-xs'
                      : 'bg-white text-[#334155] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{idx + 1}. {s.schoolName || `School #${idx + 1}`}</span>
                  {sUnits > 0 && (
                    <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive 
                        ? (sComplete ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white') 
                        : (sComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')
                    }`}>
                      {sFilled} / {sUnits} Serials
                    </span>
                  )}

                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSchool(idx, e)}
                      className={`p-0.5 rounded-md hover:bg-rose-600 hover:text-white transition opacity-60 group-hover:opacity-100 ${isActive ? 'text-white' : 'text-slate-500'}`}
                      title="Delete school"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 1. HARDWARE SERIAL NUMBERS INPUT LIST ─────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                Hardware Serial Numbers Entry
              </h4>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isAllFilled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-[#f0f9fa] text-[#2d6b73] border-[#b6e0e4]'
              }`}>
                {totalSerialsFilled} of {totalUnits} Units Recorded {isAllFilled && '✓'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hardware Requirements mein select hue sabhi products ke har ek unit ka Serial Number yahan fill karein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={handleSyncHardwareFromOrder}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
                  title="Sync exact hardware requirements from Stage 03"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sync Hardware Requirements</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddHardwareRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3a7d84] hover:bg-[#2d6b73] text-white transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hardware</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hardware Items List */}
        {(currentSchool.hardwareItems || []).length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
            <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Hardware Requirements Found for this School</p>
            <p className="text-[11px] text-slate-500">Click &quot;Sync Hardware Requirements&quot; to auto-import the exact hardware items selected in Stage 03.</p>
            {!disabled && (
              <button
                type="button"
                onClick={handleSyncHardwareFromOrder}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#3a7d84] text-white hover:bg-[#2d6b73] transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Hardware from Requirements</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(currentSchool.hardwareItems || []).map((item, hIdx) => {
              const qty = Number(item.quantity) || 1;
              const serials = item.individualSerials || Array.from({ length: qty }, () => '');
              const filledInItem = serials.filter(s => (s || '').trim().length > 0).length;
              const isItemComplete = filledInItem === qty;

              return (
                <div
                  key={hIdx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isItemComplete
                      ? 'border-emerald-200 bg-emerald-50/15'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar of Product: Name, Qty & Action */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {hIdx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          disabled={disabled}
                          value={item.productName || ''}
                          onChange={(e) => handleUpdateHardwareRow(hIdx, 'productName', e.target.value)}
                          placeholder="e.g. 75 Inch Interactive Flat Panel"
                          className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none truncate"
                        />
                        {item.specifications && (
                          <p className="text-[10.5px] text-slate-500 truncate mt-0.5">{item.specifications}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                        <span className="text-[10px] text-slate-500 font-medium">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          disabled={disabled}
                          value={qty}
                          onChange={(e) => handleUpdateHardwareRow(hIdx, 'quantity', e.target.value)}
                          className="w-12 text-xs font-bold text-center bg-white border border-slate-200 rounded px-1 py-0.5 font-mono"
                        />
                      </div>

                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                        isItemComplete
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {filledInItem} / {qty} Serials
                      </span>

                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleDeleteHardwareRow(hIdx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove hardware item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Individual Unit Serial Inputs */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#3a7d84]" />
                      <span>Input Serial Number for each unit:</span>
                    </div>

                    <div className={`grid gap-2.5 ${qty === 1 ? 'grid-cols-1' : qty <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                      {Array.from({ length: qty }).map((_, unitIdx) => {
                        const serialVal = serials[unitIdx] || '';
                        const hasVal = serialVal.trim().length > 0;

                        return (
                          <div
                            key={unitIdx}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                              hasVal 
                                ? 'border-emerald-300 bg-emerald-50/30' 
                                : 'border-slate-200 bg-slate-50/50 focus-within:border-[#51a8b1] focus-within:bg-white'
                            }`}
                          >
                            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                              #{unitIdx + 1}
                            </span>
                            
                            <input
                              type="text"
                              disabled={disabled}
                              value={serialVal}
                              onChange={(e) => handleUpdateUnitSerial(hIdx, unitIdx, e.target.value)}
                              placeholder={`Serial No. for Unit #${unitIdx + 1}`}
                              className="w-full text-xs font-mono font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-sans"
                            />

                            {hasVal ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-dashed border-slate-300 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. ADD 3 INSTALLATION SITE IMAGES ────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                Installation Area Images (3 Photos)
              </h4>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0f9fa] text-[#2d6b73] border border-[#b6e0e4]">
                {[currentSchool.image1Url, currentSchool.image2Url, currentSchool.image3Url].filter(Boolean).length} / 3 Uploaded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Installation area ki 3 photos upload karein.
            </p>
          </div>
        </div>

        {/* 3 Photo Upload Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Photo 1 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <span className="w-4 h-4 rounded-full bg-[#3a7d84] text-white font-mono font-bold text-[9px] flex items-center justify-center">1</span>
                Image 1
              </span>
              {currentSchool.image1Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Uploaded
                </span>
              )}
            </div>

            {currentSchool.image1Url ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                <img
                  src={currentSchool.image1Url}
                  alt="Installation Area Photo 1"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(currentSchool.image1Url || null)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition cursor-pointer"
                    title="View Fullsize"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => updateCurrentSchool({ image1Url: '' })}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className={`
                border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition aspect-video
                border-slate-300 bg-white hover:bg-[#f0f9fa] hover:border-[#51a8b1]
                ${uploadingSlot === 'image1Url' ? 'opacity-60 pointer-events-none' : ''}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={disabled || uploadingSlot === 'image1Url'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadImage(f, 'image1Url');
                  }}
                  className="hidden"
                />
                {uploadingSlot === 'image1Url' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#3a7d84]" />
                    <span className="text-[11px] font-bold text-[#3a7d84]">Uploading photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#3a7d84]" />
                    <span className="text-xs font-bold text-slate-800">Upload Image 1</span>
                    <span className="text-[10px] text-slate-400">Click to browse / upload</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Photo 2 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <span className="w-4 h-4 rounded-full bg-[#3a7d84] text-white font-mono font-bold text-[9px] flex items-center justify-center">2</span>
                Image 2
              </span>
              {currentSchool.image2Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Uploaded
                </span>
              )}
            </div>

            {currentSchool.image2Url ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                <img
                  src={currentSchool.image2Url}
                  alt="Installation Area Photo 2"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(currentSchool.image2Url || null)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition cursor-pointer"
                    title="View Fullsize"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => updateCurrentSchool({ image2Url: '' })}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className={`
                border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition aspect-video
                border-slate-300 bg-white hover:bg-[#f0f9fa] hover:border-[#51a8b1]
                ${uploadingSlot === 'image2Url' ? 'opacity-60 pointer-events-none' : ''}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={disabled || uploadingSlot === 'image2Url'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadImage(f, 'image2Url');
                  }}
                  className="hidden"
                />
                {uploadingSlot === 'image2Url' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#3a7d84]" />
                    <span className="text-[11px] font-bold text-[#3a7d84]">Uploading photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#3a7d84]" />
                    <span className="text-xs font-bold text-slate-800">Upload Image 2</span>
                    <span className="text-[10px] text-slate-400">Click to browse / upload</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Photo 3 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <span className="w-4 h-4 rounded-full bg-[#3a7d84] text-white font-mono font-bold text-[9px] flex items-center justify-center">3</span>
                Image 3
              </span>
              {currentSchool.image3Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Uploaded
                </span>
              )}
            </div>

            {currentSchool.image3Url ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900">
                <img
                  src={currentSchool.image3Url}
                  alt="Installation Area Photo 3"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewImageUrl(currentSchool.image3Url || null)}
                    className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white transition cursor-pointer"
                    title="View Fullsize"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => updateCurrentSchool({ image3Url: '' })}
                      className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className={`
                border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition aspect-video
                border-slate-300 bg-white hover:bg-[#f0f9fa] hover:border-[#51a8b1]
                ${uploadingSlot === 'image3Url' ? 'opacity-60 pointer-events-none' : ''}
                ${disabled ? 'opacity-50 pointer-events-none' : ''}
              `}>
                <input
                  type="file"
                  accept="image/*"
                  disabled={disabled || uploadingSlot === 'image3Url'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadImage(f, 'image3Url');
                  }}
                  className="hidden"
                />
                {uploadingSlot === 'image3Url' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#3a7d84]" />
                    <span className="text-[11px] font-bold text-[#3a7d84]">Uploading photo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#3a7d84]" />
                    <span className="text-xs font-bold text-slate-800">Upload Image 3</span>
                    <span className="text-[10px] text-slate-400">Click to browse / upload</span>
                  </>
                )}
              </label>
            )}
          </div>

        </div>
      </div>

      {/* ── IMAGE FULLSIZE LIGHTBOX MODAL ───────────────────────────── */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 text-white">
              <span className="text-xs font-bold font-heading flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#51a8b1]" /> Site Installation Photo Preview
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewImageUrl}
                alt="Full size site installation photo"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
