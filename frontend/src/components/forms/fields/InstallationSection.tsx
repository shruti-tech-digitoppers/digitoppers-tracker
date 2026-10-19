'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Layers,
  KeyRound,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { IUser } from '../../../types/auth';
import { DEFAULT_HARDWARE_ITEMS, extractEffectiveSchools, EffectiveSchoolItem } from '../utils/formHelpers';
import { apiClient } from '../../../lib/api/client';

export interface IHardwareUnitLicense {
  unitIndex: number;
  licenseKey?: string;
  status?: string;
  isRegistered?: boolean;
  registeredTo?: string;
  serialNumber?: string;
}

export interface IHardwareInstalledItem {
  id?: string;
  itemKey?: string;
  productName: string;
  specifications?: string;
  quantity: number;
  serialNumbers: string;
  individualSerials?: string[];
  unitLicenses?: IHardwareUnitLicense[];
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
  schools?: any[];
  isTrainingContext?: boolean;
}

// Helper to match a school object to allocation records from SchoolHardwareLicense collection
function matchAllocationsForSchool(school: any, allocations: any[]): any[] {
  if (!school || !Array.isArray(allocations) || allocations.length === 0) return [];
  const sId = String(school.schoolId || school._id || school.id || '').trim();
  const sName = String(school.schoolName || school.name || '').trim().toLowerCase();

  return allocations.filter((a) => {
    // 1. By School ObjectId / Id
    const aSchoolId = String(a.schoolId?._id || a.schoolId || '').trim();
    if (sId && aSchoolId && sId === aSchoolId) return true;

    // 2. By School Name
    const aName = String(a.schoolName || a.schoolId?.name || '').trim().toLowerCase();
    if (sName && aName && (sName === aName || sName.includes(aName) || aName.includes(sName))) return true;

    return false;
  });
}

// Helper to group raw license allocations into hardware items with unit-wise licenses
function groupAllocationsToHardwareItems(
  allocs: any[],
  existingHw: IHardwareInstalledItem[] = []
): IHardwareInstalledItem[] {
  if (!allocs || allocs.length === 0) return existingHw;

  const map: Record<
    string,
    {
      itemKey: string;
      productName: string;
      specifications: string;
      quantity: number;
      unitLicenses: IHardwareUnitLicense[];
      serials: string[];
    }
  > = {};

  allocs.forEach((a) => {
    const key = (a.hardwareKey || 'DEVICE').toUpperCase();
    if (!map[key]) {
      const def = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === key);
      map[key] = {
        itemKey: key,
        productName: a.hardwareName || def?.label || key,
        specifications: a.remarks || def?.desc || '',
        quantity: 0,
        unitLicenses: [],
        serials: [],
      };
    }
    map[key].quantity += 1;
    const uIdx = a.unitIndex || map[key].unitLicenses.length + 1;
    const rawReg = a.registeredTo || '';
    const cleanReg = rawReg ? rawReg.replace(/\s*\(.*\)/, '').replace(/^SN-[A-Z]+-/, '').trim() : '';

    map[key].unitLicenses.push({
      unitIndex: uIdx,
      licenseKey: a.licenseKey,
      status: a.status || (a.isRegistered ? 'REGISTERED' : 'ALLOCATED'),
      isRegistered: !!a.isRegistered,
      registeredTo: a.registeredTo || undefined,
      serialNumber: cleanReg,
    });
    map[key].serials.push(cleanReg || '');
  });

  return Object.values(map).map((group) => {
    // If user already typed serial numbers in existing items, preserve them!
    const matchedExisting = existingHw.find(
      (e) =>
        (e.itemKey && e.itemKey.toUpperCase() === group.itemKey) ||
        (e.productName && e.productName.toLowerCase() === group.productName.toLowerCase())
    );

    const mergedSerials = group.serials.map((s, idx) => {
      const fromExisting =
        matchedExisting?.individualSerials?.[idx] ||
        (matchedExisting?.serialNumbers ? matchedExisting.serialNumbers.split(',')[idx]?.trim() : '');
      return fromExisting || s;
    });

    return {
      itemKey: group.itemKey,
      productName: group.productName,
      specifications: group.specifications,
      quantity: group.quantity,
      individualSerials: mergedSerials,
      serialNumbers: mergedSerials.filter(Boolean).join(', '),
      unitLicenses: group.unitLicenses.map((lic, idx) => ({
        ...lic,
        serialNumber: mergedSerials[idx] || lic.serialNumber || '',
      })),
    };
  });
}

// Fallback helper to extract hardware list selected in Stage 03 for a specific school
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
      itemKey: 'IFP_75',
      productName: '75" 4K UHD Interactive Flat Panel',
      specifications: 'Interactive Flat Panel Touch Display',
      quantity: 1,
      serialNumbers: '',
      individualSerials: [''],
    },
    {
      itemKey: 'OPS_I5',
      productName: 'OPS Windows 11 Pro i5 16GB/512GB PC',
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
  schools = [],
  isTrainingContext = false,
}: InstallationSectionProps) {
  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // License Allocations from backend collection
  const [allocations, setAllocations] = useState<any[]>([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const projectId = project?._id || project?.projectId || project?.id;

  // 1. Fetch license allocations for current project from database
  const fetchAllocations = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoadingAllocations(true);
      const res = await apiClient.get(`/licenses/allocations?projectId=${encodeURIComponent(projectId)}`);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setAllocations(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load license allocations:', err);
    } finally {
      setIsLoadingAllocations(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  // Extract upstream schools using unified extractEffectiveSchools helper
  const upstreamSchools = useMemo(() => {
    const effective = extractEffectiveSchools(schools, allFormData, value);
    if (effective && effective.length > 0) {
      return effective;
    }
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
  }, [schools, allFormData, value, project]);

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
            schoolName: s.schoolName || s.name || (upstreamSchools.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School'),
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

  // Matched database allocations for the active school
  const currentSchoolAllocations = useMemo(() => {
    return matchAllocationsForSchool(currentSchool, allocations);
  }, [currentSchool, allocations]);

  // Compute active hardware items: combine currentSchool.hardwareItems with database allocations
  const activeHardwareItems: IHardwareInstalledItem[] = useMemo(() => {
    if (!currentSchool) return [];

    const existingHw = currentSchool.hardwareItems || [];
    if (existingHw.length > 0 && currentSchoolAllocations.length > 0) {
      // Merge unitLicenses from allocations into existing hardware items
      return existingHw.map((item) => {
        const key = (item.itemKey || '').toUpperCase();
        const matched = currentSchoolAllocations.filter(
          (a) => (a.hardwareKey || '').toUpperCase() === key
        );

        if (matched.length > 0) {
          const qty = Number(item.quantity) || matched.length;
          const unitLicenses: IHardwareUnitLicense[] = matched.map((a, idx) => ({
            unitIndex: a.unitIndex || idx + 1,
            licenseKey: a.licenseKey,
            status: a.status || (a.isRegistered ? 'REGISTERED' : 'ALLOCATED'),
            isRegistered: !!a.isRegistered,
            registeredTo: a.registeredTo || undefined,
            serialNumber: item.individualSerials?.[idx] || (a.registeredTo ? a.registeredTo.replace(/\s*\(.*\)/, '').trim() : ''),
          }));

          return {
            ...item,
            quantity: qty,
            unitLicenses,
          };
        }
        return item;
      });
    }

    // If current school has no hardware items, auto-group directly from database allocations!
    if (existingHw.length === 0 && currentSchoolAllocations.length > 0) {
      return groupAllocationsToHardwareItems(currentSchoolAllocations, []);
    }

    return existingHw;
  }, [currentSchool, currentSchoolAllocations]);

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

  // Auto-synchronize activeHardwareItems into form state when allocations are fetched if hardware was empty
  useEffect(() => {
    if (!currentSchool) return;
    if ((!currentSchool.hardwareItems || currentSchool.hardwareItems.length === 0) && activeHardwareItems.length > 0) {
      updateCurrentSchool({ hardwareItems: activeHardwareItems });
    }
  }, [activeHardwareItems, currentSchool, updateCurrentSchool]);

  const handleAddSchool = () => {
    if (disabled) return;
    const newSchoolNum = schoolsList.length + 1;
    const resolvedHw = resolveOrderHardwareForSchool(allFormData, `sch_${newSchoolNum}`, newSchoolNum - 1, undefined, project);
    const newSchool: ISchoolInstallationData = {
      schoolId: `sch_${newSchoolNum}`,
      schoolName: '',
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

  // Sync / Refresh hardware items directly from database allocations & Stage 03 Order Requirements
  const handleSyncHardwareFromOrder = () => {
    if (disabled || !currentSchool) return;

    if (currentSchoolAllocations.length > 0) {
      const groupedFromDb = groupAllocationsToHardwareItems(currentSchoolAllocations, currentSchool.hardwareItems || []);
      updateCurrentSchool({ hardwareItems: groupedFromDb });
      return;
    }

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

  // Update a single unit's serial number inside a hardware item and optionally sync with backend
  const handleUpdateUnitSerial = async (hIndex: number, unitIndex: number, serialValue: string) => {
    if (disabled || !currentSchool) return;
    const baseHw = activeHardwareItems.length > 0 ? activeHardwareItems : (currentSchool.hardwareItems || []);
    
    const nextHw = baseHw.map((item, idx) => {
      if (idx !== hIndex) return item;
      const qty = Number(item.quantity) || 1;
      const nextSerials = [...(item.individualSerials || Array.from({ length: qty }, () => ''))];
      nextSerials[unitIndex] = serialValue;

      const nextLicenses = (item.unitLicenses || []).map((lic, lIdx) => 
        lIdx === unitIndex ? { ...lic, serialNumber: serialValue } : lic
      );

      return {
        ...item,
        individualSerials: nextSerials,
        serialNumbers: nextSerials.filter(s => s.trim().length > 0).join(', '),
        unitLicenses: nextLicenses
      };
    });

    updateCurrentSchool({ hardwareItems: nextHw });

    // Background update to SchoolHardwareLicense collection if licenseKey exists
    const targetItem = baseHw[hIndex];
    const unitLic = targetItem?.unitLicenses?.[unitIndex];
    if (unitLic?.licenseKey && currentSchool.schoolId && projectId) {
      try {
        await apiClient.post('/licenses/allocations', {
          projectId: projectId,
          schoolId: currentSchool.schoolId,
          schoolName: currentSchool.schoolName,
          hardwareKey: targetItem.itemKey || 'DEVICE',
          hardwareName: targetItem.productName,
          unitIndex: unitLic.unitIndex || (unitIndex + 1),
          licenseKey: unitLic.licenseKey,
          remarks: serialValue ? `Serial No: ${serialValue}` : '',
        });
      } catch (err) {
        console.warn('Silent auto-sync of allocation serial skipped:', err);
      }
    }
  };

  // 1-Click Copy License Key to Clipboard
  const handleCopyLicense = (licKey: string) => {
    if (!licKey) return;
    navigator.clipboard.writeText(licKey);
    setCopiedKey(licKey);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === licKey ? null : prev));
    }, 2000);
  };

  // Add a new custom hardware product row
  const handleAddHardwareRow = () => {
    if (disabled || !currentSchool) return;
    const baseHw = activeHardwareItems.length > 0 ? activeHardwareItems : (currentSchool.hardwareItems || []);
    const newRow: IHardwareInstalledItem = {
      productName: '',
      quantity: 1,
      serialNumbers: '',
      individualSerials: [''],
    };
    const nextHw = [...baseHw, newRow];
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  // Update generic fields on hardware item (productName, quantity)
  const handleUpdateHardwareRow = (hIndex: number, field: keyof IHardwareInstalledItem, val: any) => {
    if (disabled || !currentSchool) return;
    const baseHw = activeHardwareItems.length > 0 ? activeHardwareItems : (currentSchool.hardwareItems || []);
    const nextHw = baseHw.map((item, idx) => {
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
    const baseHw = activeHardwareItems.length > 0 ? activeHardwareItems : (currentSchool.hardwareItems || []);
    const nextHw = baseHw.filter((_, idx) => idx !== hIndex);
    updateCurrentSchool({ hardwareItems: nextHw });
  };

  // File / Image upload handler
  const handleUploadImage = async (file: File, imageKey: 'image1Url' | 'image2Url' | 'image3Url') => {
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      alert(`File exceeds 2MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    try {
      setUploadingSlot(imageKey);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
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
  const totalUnits = activeHardwareItems.reduce((acc, h) => acc + (Number(h.quantity) || 1), 0);
  const totalSerialsFilled = activeHardwareItems.reduce((acc, h) => {
    const filled = (h.individualSerials || []).filter(s => (s || '').trim().length > 0).length;
    return acc + filled;
  }, 0);
  const totalLicensesCount = activeHardwareItems.reduce((acc, h) => acc + (h.unitLicenses?.length || 0), 0);
  const isAllFilled = totalUnits > 0 && totalSerialsFilled === totalUnits;

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── SCHOOL BRANCH SELECTOR ───────────────────────────────────── */}
      {schoolsList.length > 0 && (
        <div className="bg-[#f0f9fa] border border-[#b6e0e4] rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1f4e53] font-heading">
                  Select School ({schoolsList.length} {schoolsList.length === 1 ? 'School' : 'Schools'})
                </span>
                <span className="text-[10.5px] text-[#556987] ml-2 hidden sm:inline">
                  Click a school to view its allocated hardware &amp; provisioned licenses
                </span>
              </div>
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={handleAddSchool}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-[#2d6b73] border border-[#b6e0e4] hover:bg-[#3a7d84] hover:text-white transition shadow-2xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add School</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1">
            {schoolsList.map((s, idx) => {
              const isActive = idx === activeSchoolIndex;
              const schAllocations = matchAllocationsForSchool(s, allocations);
              const totalSchLicenses = schAllocations.length;
              const sUnits = (s.hardwareItems || []).reduce((acc, h) => acc + (Number(h.quantity) || 1), 0) || totalSchLicenses;
              const sFilled = (s.hardwareItems || []).reduce((acc, h) => acc + (h.individualSerials || []).filter(v => (v || '').trim().length > 0).length, 0);
              const sComplete = sUnits > 0 && sFilled === sUnits;
              
              return (
                <div
                  key={idx}
                  onClick={() => setActiveSchoolIndex(idx)}
                  className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all select-none cursor-pointer shrink-0 border shadow-2xs ${
                    isActive
                      ? 'bg-[#3a7d84] text-white border-[#2d6b73] shadow-xs scale-[1.01]'
                      : 'bg-white text-[#334155] border-slate-200/90 hover:bg-[#f8fafb] hover:border-[#b6e0e4]'
                  }`}
                >
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">
                    {idx + 1}. {s.schoolName || `School #${idx + 1}`}
                  </span>

                  {totalSchLicenses > 0 && (
                    <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 ${
                      isActive 
                        ? 'bg-white/20 text-white border border-white/30' 
                        : 'bg-[#f0f9fa] text-[#2d6b73] border border-[#b6e0e4]'
                    }`}>
                      <KeyRound className="w-2.5 h-2.5" />
                      {totalSchLicenses} Lic
                    </span>
                  )}

                  {sUnits > 0 && (
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? (sComplete ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white') 
                        : (sComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')
                    }`}>
                      {sFilled}/{sUnits} Serials
                    </span>
                  )}

                  {!disabled && schoolsList.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSchool(idx, e)}
                      className={`p-0.5 rounded-md hover:bg-rose-600 hover:text-white transition opacity-40 group-hover:opacity-100 ${isActive ? 'text-white' : 'text-slate-500'}`}
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

      {/* ── 1. HARDWARE & LICENSE ALLOCATION LIST ───────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center shadow-xs">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                {isTrainingContext 
                  ? 'Hardware Verification, Licenses & Serial Numbers'
                  : 'Hardware Serial Numbers & License Provisioning'}
              </h4>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isAllFilled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-[#f0f9fa] text-[#2d6b73] border-[#b6e0e4]'
              }`}>
                {totalSerialsFilled} of {totalUnits} Serials Recorded {isAllFilled && '✓'}
              </span>

              {totalLicensesCount > 0 && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-600" />
                  {totalLicensesCount} Licenses Linked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isTrainingContext 
                ? 'School ke sabhi allocated hardware units verify karein, license keys se software activate karein, aur serial numbers darj karein.' 
                : 'Select hue sabhi hardware units ke serial number darj karein aur unke mapped active licenses copy karein.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={fetchAllocations}
                  disabled={isLoadingAllocations}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-[#f0f9fa] hover:text-[#2d6b73] hover:border-[#b6e0e4] transition cursor-pointer active:scale-95"
                  title="Reload license allocations from Tech Stream"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingAllocations ? 'animate-spin text-[#3a7d84]' : ''}`} />
                  <span>{isLoadingAllocations ? 'Syncing...' : 'Sync Licenses & Hardware'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddHardwareRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#3a7d84] hover:bg-[#2d6b73] text-white transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Hardware</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hardware Items List */}
        {activeHardwareItems.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2.5">
            <Cpu className="w-9 h-9 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No Hardware Requirements or Licenses Found for this School</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Click &quot;Sync Licenses &amp; Hardware&quot; to auto-import allocations and licenses provisioned for this school.
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={handleSyncHardwareFromOrder}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3a7d84] text-white hover:bg-[#2d6b73] transition shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Hardware from Requirements</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-slate-200 text-[#556987] text-[11px] font-bold uppercase tracking-wider font-heading select-none">
                  <th className="py-3 px-3.5 text-center w-12">#</th>
                  <th className="py-3 px-4 min-w-[200px]">Hardware Type</th>
                  <th className="py-3 px-4 min-w-[220px]">Specifications</th>
                  <th className="py-3 px-4 min-w-[240px]">License ID</th>
                  <th className="py-3 px-4 min-w-[260px]">Hardware Serial Number</th>
                  {!disabled && <th className="py-3 px-3 text-center w-14">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {(() => {
                  let globalUnitIndex = 0;
                  return activeHardwareItems.flatMap((item, hIdx) => {
                    const qty = Number(item.quantity) || 1;
                    const serials = item.individualSerials || Array.from({ length: qty }, () => '');

                    return Array.from({ length: qty }).map((_, unitIdx) => {
                      globalUnitIndex += 1;
                      const currentRowNum = globalUnitIndex;
                      const serialVal = serials[unitIdx] || '';
                      const hasVal = serialVal.trim().length > 0;
                      const lic = item.unitLicenses?.[unitIdx];
                      const isCopied = lic?.licenseKey && copiedKey === lic.licenseKey;

                      return (
                        <tr 
                          key={`${hIdx}_${unitIdx}`} 
                          className={`transition-colors hover:bg-[#f0f9fa]/40 ${hasVal ? 'bg-emerald-50/10' : ''}`}
                        >
                          {/* 1. Row Index */}
                          <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-500">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center mx-auto shadow-2xs">
                              {currentRowNum}
                            </span>
                          </td>

                          {/* 2. Hardware Type */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                                {item.productName || 'Hardware Unit'}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {item.itemKey && (
                                  <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {item.itemKey}
                                  </span>
                                )}
                                {qty > 1 && (
                                  <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-md bg-[#f0f9fa] text-[#2d6b73] border border-[#b6e0e4]">
                                    Unit #{unitIdx + 1} of {qty}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Specifications */}
                          <td className="py-3.5 px-4">
                            <span className="text-[11.5px] text-slate-600 font-medium leading-relaxed">
                              {item.specifications || DEFAULT_HARDWARE_ITEMS.find(d => d.key === item.itemKey)?.desc || 'Standard interactive classroom equipment'}
                            </span>
                          </td>

                          {/* 4. License ID */}
                          <td className="py-3.5 px-4">
                            {lic?.licenseKey ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 bg-[#f0f9fa] border border-[#b6e0e4] px-2.5 py-1.5 rounded-xl w-fit shadow-2xs">
                                  <KeyRound className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
                                  <span className="text-[11.5px] font-mono font-bold text-slate-900 select-all tracking-tight">
                                    {lic.licenseKey}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLicense(lic.licenseKey!)}
                                    className={`p-1 rounded-md border transition cursor-pointer active:scale-95 ${
                                      isCopied
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : 'bg-white text-slate-600 border-slate-200 hover:text-[#2d6b73] hover:border-[#b6e0e4]'
                                    }`}
                                    title="Copy license key to clipboard"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                                    lic.status === 'REGISTERED' || lic.isRegistered
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'bg-white text-[#2d6b73] border-[#b6e0e4]'
                                  }`}>
                                    {lic.status || (lic.isRegistered ? 'REGISTERED' : 'ALLOCATED')}
                                  </span>
                                </div>

                                {lic.registeredTo && (
                                  <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    {lic.registeredTo}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No license allocated</span>
                            )}
                          </td>

                          {/* 5. Hardware Serial Number Input */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  disabled={disabled}
                                  value={serialVal}
                                  onChange={(e) => handleUpdateUnitSerial(hIdx, unitIdx, e.target.value)}
                                  placeholder={`Enter S/N (e.g. SN-${item.itemKey || 'HW'}-${String(unitIdx + 1).padStart(2, '0')})`}
                                  className="w-full text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-[#51a8b1] focus:ring-2 focus:ring-[#51a8b1]/20 focus:outline-none placeholder:font-sans placeholder:font-normal placeholder:text-slate-400 shadow-2xs transition-all"
                                />
                              </div>
                              {hasVal ? (
                                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs" title="Serial Number Recorded">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="w-6 h-6 rounded-lg border border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0 text-[10px]" title="Serial Number Pending">
                                  —
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Action */}
                          {!disabled && (
                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteHardwareRow(hIdx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title="Remove this hardware item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 2. ADD 3 INSTALLATION SITE IMAGES ────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center shadow-xs">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 font-heading">
                {isTrainingContext ? 'Training Session & Verification Images (3 Photos)' : 'Installation Area Images (3 Photos)'}
              </h4>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#f0f9fa] text-[#2d6b73] border border-[#b6e0e4]">
                {[currentSchool.image1Url, currentSchool.image2Url, currentSchool.image3Url].filter(Boolean).length} / 3 Uploaded
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isTrainingContext 
                ? 'Teacher training workshop, interactive screen hands-on demo, and signed attendance report upload (Max 2MB each).' 
                : 'Upload 3 installation site photos (PNG, JPG, WebP • Max 2MB each).'}
            </p>
          </div>
        </div>

        {/* 3 Photo Upload Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Photo 1 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <Camera className="w-3.5 h-3.5 text-[#3a7d84]" />
                {isTrainingContext ? 'Photo 1 (Training Session)' : 'Photo 1 (Front View / Smartboard)'}
              </span>
              {currentSchool.image1Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
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
                  accept="image/*,.png,.jpg,.jpeg,.webp"
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
                    <span className="text-xs font-bold text-slate-800">Upload Photo 1</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP • Max 2MB</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Photo 2 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <Camera className="w-3.5 h-3.5 text-[#3a7d84]" />
                {isTrainingContext ? 'Photo 2 (Hardware Hands-on)' : 'Photo 2 (Classroom Interior View)'}
              </span>
              {currentSchool.image2Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
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
                  accept="image/*,.png,.jpg,.jpeg,.webp"
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
                    <span className="text-xs font-bold text-slate-800">Upload Photo 2</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP • Max 2MB</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Photo 3 */}
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-heading">
                <Camera className="w-3.5 h-3.5 text-[#3a7d84]" />
                {isTrainingContext ? 'Photo 3 (Attendance / Sign-off)' : 'Photo 3 (Hardware Mounted / Setup Area)'}
              </span>
              {currentSchool.image3Url && (
                <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
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
                  accept="image/*,.png,.jpg,.jpeg,.webp"
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
                    <span className="text-xs font-bold text-slate-800">Upload Photo 3</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, WebP • Max 2MB</span>
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

export { TrainingExecutionSection } from './TrainingExecutionSection';
