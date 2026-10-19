'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Building2,
  Calendar,
  UserCheck,
  UserPlus,
  Trash2,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Copy,
  Check,
  FileText,
  Upload,
  Eye,
  ExternalLink,
  FileCheck2,
  Award,
  GraduationCap,
  Cpu,
  BookOpen,
  BadgeCheck,
  Camera,
  Star,
  Link2,
  CheckSquare,
  X,
  Loader2,
  Paperclip,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Monitor,
  HardDrive,
  Tablet,
  Smartphone,
  Key,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { IUser } from '../../../types/auth';
import { IProject } from '../../../types/project';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import { licensesApi, ISchoolHardwareLicense } from '../../../lib/api/licenses.api';
import { hardwareApi, HardwareItem } from '../../../lib/api/hardware.api';
import { specsApi, IHardwareSpec } from '../../../lib/api/specs.api';
import {
  extractEffectiveSchools,
  EffectiveSchoolItem,
  DEFAULT_HARDWARE_ITEMS
} from '../utils/formHelpers';

export interface ITrainingExecutionChecklist {
  trainingDone: boolean;
  applicationWorking: boolean;
  teachersTraining: boolean;
  teachersIdCreated: boolean;
  photographyShootsDone: boolean;
  googleReviews: boolean;
}

export interface ISchoolTrainingExecution {
  schoolId: string;
  schoolName: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  principalName?: string;
  assignedTrainerName?: string;
  assignedTrainerPhone?: string;
  planOutDate?: string;

  // 4 Required Documents to be uploaded as PDF / Doc
  deliveryConfirmationSheetUrl?: string;
  appreciationLetterUrl?: string;
  workCompletionLetterUrl?: string;
  teachersDetailsDocUrl?: string;
  attendanceSheetUrl?: string;

  // Interactive Animated Checklist
  checklist: ITrainingExecutionChecklist;

  // Extra fields for Photography & Google Reviews
  photographyPhotosUrl?: string;
  googleReviewsNotes?: string;

  // Verified Hardware Units on ground during training
  verifiedHardwareUnits?: string[];

  // Serial numbers logged per hardware unit
  hardwareSerials?: Record<string, string>;

  // Execution feedback & notes
  issuesNoted?: string;
  onGroundFeedback?: string;
  remarks?: string;
}

// Helper to pick hardware icon for visual distinction
const getHardwareIcon = (hardwareKey: string) => {
  const key = (hardwareKey || '').toUpperCase();
  if (key.includes('IFP') || key.includes('SCREEN') || key.includes('DISPLAY') || key.includes('TV') || key.includes('TOUCH')) {
    return <Monitor className="w-4 h-4 text-cyan-600" />;
  }
  if (key.includes('OPS') || key.includes('PC') || key.includes('CPU') || key.includes('COMPUTER') || key.includes('AIO')) {
    return <Cpu className="w-4 h-4 text-indigo-600" />;
  }
  if (key.includes('TAB') || key.includes('PAD')) {
    return <Tablet className="w-4 h-4 text-amber-600" />;
  }
  if (key.includes('USB') || key.includes('PENDRIVE') || key.includes('DISK') || key.includes('KEY') || key.includes('SD')) {
    return <HardDrive className="w-4 h-4 text-emerald-600" />;
  }
  return <Smartphone className="w-4 h-4 text-[#3a7d84]" />;
};

// Helper for clean professional tab labels (without emojis)
const getHardwareTabLabel = (key: string, name?: string): string => {
  const k = (key || '').toUpperCase();
  if (k.includes('IFP')) return 'IFP';
  if (k.includes('OPS')) return 'OPS PC';
  if (k.includes('PENDRIVE') || k.includes('USB')) return 'Pendrive';
  if (k.includes('TAB')) return 'Tablet';
  if (k.includes('SD')) return 'SD Card';
  if (k.includes('CAMERA')) return 'Camera';
  if (k.includes('CHARGING')) return 'Charging Trolley';
  if (k.includes('ROBOT')) return 'Robotics';
  if (k.includes('STEM')) return 'STEM Kit';
  if (name) {
    return name.length > 20 ? name.slice(0, 18) + '...' : name;
  }
  return key;
};

// Helper to match a school object to allocation records from SchoolHardwareLicense collection
function matchAllocationsForSchool(school: any, allocations: ISchoolHardwareLicense[]): ISchoolHardwareLicense[] {
  if (!school || !Array.isArray(allocations) || allocations.length === 0) return [];
  const sId = String(school.id || school._id || school.schoolId || '').trim();
  const sName = String(school.name || school.schoolName || '').trim().toLowerCase();

  return allocations.filter((a) => {
    // 1. By School ObjectId / Id
    const aSchoolId = String(
      typeof a.schoolId === 'object' ? a.schoolId?._id || a.schoolId?.id : a.schoolId || ''
    ).trim();
    if (sId && aSchoolId && sId === aSchoolId) return true;

    // 2. By School Name
    const aName = String(
      a.schoolName || (typeof a.schoolId === 'object' ? a.schoolId?.name : '') || ''
    ).trim().toLowerCase();
    if (sName && aName && (sName === aName || sName.includes(aName) || aName.includes(sName))) return true;

    return false;
  });
}

interface TrainingExecutionSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
  project?: IProject | null;
  schools?: any[];
}

export function TrainingExecutionSection({
  value,
  onChange,
  disabled = false,
  employees = [],
  allFormData = {},
  project = null,
  schools = [],
}: TrainingExecutionSectionProps) {
  // 1. Effective Schools List
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);

  const currentSchool =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0] || { id: 'school-1', name: 'Primary School' };

  // File upload state tracking
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // 2. Unified helper to extract and initialize school execution map from all available sources
  const extractExecutionsMap = useCallback(
    (sourceValue: any, schoolsList: EffectiveSchoolItem[]): Record<string, ISchoolTrainingExecution> => {
      const map: Record<string, ISchoolTrainingExecution> = {};

      // A. From direct map source (value or allFormData)
      const sourceMap =
        (sourceValue?.schoolWiseTrainingExecutions && typeof sourceValue.schoolWiseTrainingExecutions === 'object' && !Array.isArray(sourceValue.schoolWiseTrainingExecutions) ? sourceValue.schoolWiseTrainingExecutions : null) ||
        (sourceValue?.trainingExecutionSection && typeof sourceValue.trainingExecutionSection === 'object' && !Array.isArray(sourceValue.trainingExecutionSection) ? sourceValue.trainingExecutionSection : null) ||
        (allFormData?.schoolWiseTrainingExecutions && typeof allFormData.schoolWiseTrainingExecutions === 'object' && !Array.isArray(allFormData.schoolWiseTrainingExecutions) ? allFormData.schoolWiseTrainingExecutions : null) ||
        (allFormData?.trainingExecutionSection && typeof allFormData.trainingExecutionSection === 'object' && !Array.isArray(allFormData.trainingExecutionSection) ? allFormData.trainingExecutionSection : null) ||
        {};

      Object.entries(sourceMap).forEach(([k, v]: [string, any]) => {
        if (v && typeof v === 'object' && (v.schoolId || v.schoolName || v.checklist || v.deliveryConfirmationSheetUrl)) {
          map[k] = v;
          if (v.schoolId && !map[v.schoolId]) map[v.schoolId] = v;
        }
      });

      // B. From array sources (value, allFormData, project)
      const rawArray =
        (Array.isArray(sourceValue) ? sourceValue : null) ||
        (Array.isArray(sourceValue?.schools) ? sourceValue.schools : null) ||
        (Array.isArray(sourceValue?.plannedSchools) ? sourceValue.plannedSchools : null) ||
        (Array.isArray(allFormData?.schools) ? allFormData.schools : null) ||
        (Array.isArray(allFormData?.plannedSchools) ? allFormData.plannedSchools : null);

      if (Array.isArray(rawArray) && rawArray.length > 0) {
        rawArray.forEach((item: any) => {
          const sId = String(item.schoolId || item.id || item._id || '');
          if (sId) {
            map[sId] = {
              ...map[sId],
              ...item,
              schoolId: sId
            };
          }
        });
      }

      // C. Ensure every effective school has an entry, merging with existing DB school and training planning data
      schoolsList.forEach((sch) => {
        const found =
          map[sch.id] ||
          (sch.school ? map[String(sch.school)] : null) ||
          Object.values(map).find(
            (p: any) =>
              (p.schoolId && (p.schoolId === sch.id || p.schoolId === String(sch.school))) ||
              (p.schoolName && sch.name && p.schoolName.toLowerCase().trim() === sch.name.toLowerCase().trim())
          );

        // Check if school has training info stored in DB or in Stage 07.1 Planning
        const dbTraining = sch.training || (sch.school && typeof sch.school === 'object' ? sch.school.training : null) || {};
        const stage71Plan =
          allFormData?.schoolWiseTrainingPlans?.[sch.id] ||
          (Array.isArray(allFormData?.trainingPlanning)
            ? allFormData.trainingPlanning.find((p: any) => String(p.schoolId || p.id || p._id) === sch.id)
            : null);

        const assignedTrainerName =
          stage71Plan?.trainerName ||
          stage71Plan?.technicalPersonName ||
          stage71Plan?.trainers?.[0]?.name ||
          dbTraining.trainerName ||
          sch.technicalPersonName ||
          sch.trainers?.[0]?.name ||
          '';

        const assignedTrainerPhone =
          stage71Plan?.trainerPhone ||
          stage71Plan?.contactNumber ||
          stage71Plan?.trainers?.[0]?.phone ||
          dbTraining.trainerPhone ||
          sch.contactNumber ||
          sch.trainers?.[0]?.phone ||
          '';

        const planOutDate =
          stage71Plan?.planOutDate ||
          dbTraining.planOutDate ||
          sch.planOutDate ||
          '';

        // Check root level fallbacks for initial form fill
        const rootIssues = (sourceValue as any)?.issuesNoted || (allFormData as any)?.issuesNoted || '';
        const rootFeedback = (sourceValue as any)?.onGroundFeedback || (allFormData as any)?.onGroundFeedback || '';
        const rootRemarks = (sourceValue as any)?.remarks || (allFormData as any)?.remarks || '';

        const baseChecklist = found?.checklist || dbTraining.checklist || {};

        map[sch.id] = {
          schoolId: sch.id,
          schoolName: sch.name || found?.schoolName || 'School',
          address: sch.address || found?.address || 'Campus Location',
          contactPerson: sch.pocName || sch.contactPerson || sch.principalName || found?.contactPerson || 'Site Principal',
          contactPhone: sch.pocContact || sch.contactPhone || sch.phone || found?.contactPhone || '',
          principalName: sch.principalName || found?.principalName || '',
          assignedTrainerName: assignedTrainerName || found?.assignedTrainerName || '',
          assignedTrainerPhone: assignedTrainerPhone || found?.assignedTrainerPhone || '',
          planOutDate: planOutDate || found?.planOutDate || '',

          // Documents (Exact keys from models)
          deliveryConfirmationSheetUrl:
            found?.deliveryConfirmationSheetUrl ||
            dbTraining.deliveryConfirmationSheetUrl ||
            (allFormData as any)?.deliveryConfirmationSheetUrl ||
            '',
          appreciationLetterUrl:
            found?.appreciationLetterUrl ||
            dbTraining.appreciationLetterUrl ||
            (allFormData as any)?.appreciationLetterUrl ||
            '',
          workCompletionLetterUrl:
            found?.workCompletionLetterUrl ||
            dbTraining.workCompletionLetterUrl ||
            (allFormData as any)?.workCompletionLetterUrl ||
            '',
          teachersDetailsDocUrl:
            found?.teachersDetailsDocUrl ||
            (found as any)?.teachersDetailsUrl ||
            dbTraining.teachersDetailsDocUrl ||
            (allFormData as any)?.teachersDetailsDocUrl ||
            (allFormData as any)?.teachersDetailsUrl ||
            '',
          attendanceSheetUrl:
            found?.attendanceSheetUrl ||
            dbTraining.attendanceSheetUrl ||
            (allFormData as any)?.attendanceSheetUrl ||
            '',

          // Checklist (Exact keys from trainingChecklistSchema)
          checklist: {
            trainingDone: Boolean(baseChecklist.trainingDone),
            applicationWorking: Boolean(baseChecklist.applicationWorking),
            teachersTraining: Boolean(baseChecklist.teachersTraining),
            teachersIdCreated: Boolean(baseChecklist.teachersIdCreated),
            photographyShootsDone: Boolean(baseChecklist.photographyShootsDone),
            googleReviews: Boolean(baseChecklist.googleReviews)
          },

          // Media & Public Ratings
          photographyPhotosUrl:
            found?.photographyPhotosUrl ||
            dbTraining.photographyPhotosUrl ||
            (allFormData as any)?.photographyPhotosUrl ||
            '',
          googleReviewsNotes:
            found?.googleReviewsNotes ||
            dbTraining.googleReviewsNotes ||
            (allFormData as any)?.googleReviewsNotes ||
            '',

          // Hardware Serials
          verifiedHardwareUnits: found?.verifiedHardwareUnits || [],
          hardwareSerials: found?.hardwareSerials || dbTraining.hardwareSerials || (allFormData as any)?.hardwareSerials || {},

          // Notes & Observations
          issuesNoted: found?.issuesNoted || dbTraining.issuesNoted || rootIssues,
          onGroundFeedback: found?.onGroundFeedback || dbTraining.onGroundFeedback || rootFeedback,
          remarks: found?.remarks || dbTraining.remarks || rootRemarks
        };
      });

      return map;
    },
    [allFormData]
  );

  // 3. School-wise training executions map keyed by schoolId
  const [schoolExecutionsMap, setSchoolExecutionsMap] = useState<Record<string, ISchoolTrainingExecution>>(() => {
    return extractExecutionsMap(value, effectiveSchools);
  });

  // Ensure every effective school stays in sync when value or effectiveSchools changes
  useEffect(() => {
    if (!value) return;
    setSchoolExecutionsMap((prev) => {
      const freshMap = extractExecutionsMap(value, effectiveSchools);
      return { ...prev, ...freshMap };
    });
  }, [value, effectiveSchools, extractExecutionsMap]);

  // Synchronize update up to parent form using canonical keys
  const emitUpdate = useCallback(
    (nextMap: Record<string, ISchoolTrainingExecution>) => {
      const activeExecList = effectiveSchools.map((sch) => {
        return (
          nextMap[sch.id] || {
            schoolId: sch.id,
            schoolName: sch.name,
            checklist: {
              trainingDone: false,
              applicationWorking: false,
              teachersTraining: false,
              teachersIdCreated: false,
              photographyShootsDone: false,
              googleReviews: false,
            },
            verifiedHardwareUnits: [],
            issuesNoted: '',
            onGroundFeedback: '',
            remarks: ''
          }
        );
      });

      const firstExec = activeExecList[0] || {};

      onChange({
        // 1. Canonical maps matching backend Training model & timeline schema
        schoolWiseTrainingExecutions: nextMap,
        trainingExecutionSection: nextMap,

        // 2. School units list for backend Training.schools & ProjectSchools compatibility
        schools: activeExecList,
        plannedSchools: activeExecList,

        // 3. Project-wide top-level fields matching timeline.js & training.model.js
        issuesNoted: firstExec.issuesNoted || '',
        onGroundFeedback: firstExec.onGroundFeedback || '',
        remarks: firstExec.remarks || '',

        // 4. Root mirrors for document uploads & checklist compatibility
        deliveryConfirmationSheetUrl: firstExec.deliveryConfirmationSheetUrl || '',
        appreciationLetterUrl: firstExec.appreciationLetterUrl || '',
        workCompletionLetterUrl: firstExec.workCompletionLetterUrl || '',
        teachersDetailsDocUrl: firstExec.teachersDetailsDocUrl || '',
        teachersDetailsUrl: firstExec.teachersDetailsDocUrl || '',
        attendanceSheetUrl: firstExec.attendanceSheetUrl || '',
        photographyPhotosUrl: firstExec.photographyPhotosUrl || '',
        googleReviewsNotes: firstExec.googleReviewsNotes || '',
        verifiedHardwareUnits: firstExec.verifiedHardwareUnits || [],
        hardwareSerials: firstExec.hardwareSerials || {},
        checklist: firstExec.checklist || {}
      });
    },
    [effectiveSchools, onChange]
  );

  // Active School's current execution data
  const currentExec: ISchoolTrainingExecution = useMemo(() => {
    const existing = schoolExecutionsMap[currentSchool.id];
    if (existing) {
      return {
        ...existing,
        verifiedHardwareUnits: existing.verifiedHardwareUnits || [],
        hardwareSerials: existing.hardwareSerials || {},
        checklist: existing.checklist || {
          trainingDone: false,
          applicationWorking: false,
          teachersTraining: false,
          teachersIdCreated: false,
          photographyShootsDone: false,
          googleReviews: false,
        }
      };
    }

    return {
      schoolId: currentSchool.id,
      schoolName: currentSchool.name,
      address: currentSchool.address || '',
      contactPerson: currentSchool.pocName || currentSchool.contactPerson || '',
      contactPhone: currentSchool.pocContact || '',
      deliveryConfirmationSheetUrl: '',
      appreciationLetterUrl: '',
      workCompletionLetterUrl: '',
      teachersDetailsDocUrl: '',
      checklist: {
        trainingDone: false,
        applicationWorking: false,
        teachersTraining: false,
        teachersIdCreated: false,
        photographyShootsDone: false,
        googleReviews: false,
      },
      photographyPhotosUrl: '',
      googleReviewsNotes: '',
      verifiedHardwareUnits: [],
      hardwareSerials: {},
      issuesNoted: '',
      onGroundFeedback: '',
      remarks: ''
    };
  }, [schoolExecutionsMap, currentSchool]);

  // ── ACTIVE PROJECT ID RESOLUTION ──
  const activeProjectId = useMemo(() => {
    return (
      project?._id ||
      project?.projectId ||
      (project as any)?.id ||
      allFormData?.projectId ||
      allFormData?.project?._id ||
      allFormData?.project?.projectId ||
      ''
    );
  }, [project, allFormData]);

  // ── HARDWARE ALLOCATIONS & CATALOGS STATE ──
  const [allocations, setAllocations] = useState<ISchoolHardwareLicense[]>([]);
  const [hardwareCatalog, setHardwareCatalog] = useState<HardwareItem[]>([]);
  const [specsCatalog, setSpecsCatalog] = useState<IHardwareSpec[]>([]);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState<boolean>(false);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState<boolean>(false);
  const [updatingUnitId, setUpdatingUnitId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isTableExpanded, setIsTableExpanded] = useState<boolean>(true);

  // Fetch Hardware & Specifications Catalogs from Backend
  useEffect(() => {
    let isMounted = true;
    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [hwList, specsList] = await Promise.all([
          hardwareApi.getHardware(),
          specsApi.getSpecs(),
        ]);
        if (isMounted) {
          setHardwareCatalog(hwList || []);
          setSpecsCatalog(specsList || []);
        }
      } catch (err) {
        console.warn('Failed to load hardware/specs catalogs in TrainingExecutionSection:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    };
    loadCatalogs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch project's live hardware allocations from backend MongoDB API
  const fetchAllocations = useCallback(async () => {
    if (!activeProjectId) return;
    setIsLoadingAllocations(true);
    try {
      const data = await licensesApi.getAllocations({ projectId: activeProjectId });
      if (Array.isArray(data)) {
        setAllocations(data);
      }
    } catch (err) {
      console.warn('Failed to load hardware allocations in TrainingExecutionSection:', err);
    } finally {
      setIsLoadingAllocations(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  // Copy license key with feedback
  const handleCopyLicenseKey = (key: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  // Match live allocations to active school
  const currentSchoolAllocations = useMemo(() => {
    return matchAllocationsForSchool(currentSchool, allocations);
  }, [currentSchool, allocations]);

  // Fallback hardware units if no database allocations exist yet
  const fallbackSchoolHardware = useMemo(() => {
    if (currentSchoolAllocations.length > 0) return [];

    const rawItems =
      (currentSchool as any)?.hardware ||
      (currentSchool as any)?.hardwareItems ||
      allFormData?.stage3HardwareItems ||
      allFormData?.hardwareRequirements?.items ||
      (project as any)?.orderRequirement?.hardwareRequirement?.items ||
      {};

    const list: ISchoolHardwareLicense[] = [];
    if (Array.isArray(rawItems)) {
      rawItems.forEach((item: any, idx: number) => {
        const key = (item.key || item.hardwareKey || item.itemKey || `HW_${idx + 1}`).toUpperCase();
        const qty = Number(item.quantity || item.qty || 1);
        for (let u = 1; u <= qty; u++) {
          list.push({
            projectId: activeProjectId,
            schoolId: currentSchool.id,
            schoolName: currentSchool.name,
            hardwareKey: key,
            hardwareName: item.label || item.name || item.productName || key,
            unitIndex: u,
            licenseKey: `LIC-${currentSchool.schoolId || 'SCH'}-${key}-${String(u).padStart(2, '0')}`,
            status: 'ALLOCATED',
            isRegistered: false,
            registeredTo: null,
            remarks: 'Configured from project hardware BOM'
          });
        }
      });
    } else if (typeof rawItems === 'object' && rawItems !== null) {
      Object.entries(rawItems).forEach(([key, val]: [string, any]) => {
        if (!val || val.selected === false) return;
        const qty = Number(val.quantity || 1);
        const def = (DEFAULT_HARDWARE_ITEMS as any[])?.find?.((d) => d.key === key);
        for (let u = 1; u <= qty; u++) {
          list.push({
            projectId: activeProjectId,
            schoolId: currentSchool.id,
            schoolName: currentSchool.name,
            hardwareKey: key,
            hardwareName: val.itemName || val.name || def?.label || key,
            unitIndex: u,
            licenseKey: `LIC-${currentSchool.schoolId || 'SCH'}-${key}-${String(u).padStart(2, '0')}`,
            status: 'ALLOCATED',
            isRegistered: false,
            registeredTo: null,
            remarks: val.specNotes || def?.desc || 'Project hardware requirement'
          });
        }
      });
    }

    return list;
  }, [currentSchoolAllocations, currentSchool, allFormData, project, activeProjectId]);

  // Active units for current school (Direct unified list — no tabs!)
  const activeSchoolUnits: ISchoolHardwareLicense[] = useMemo(() => {
    return currentSchoolAllocations.length > 0 ? currentSchoolAllocations : fallbackSchoolHardware;
  }, [currentSchoolAllocations, fallbackSchoolHardware]);

  const filteredUnits = activeSchoolUnits;

  // Helper to read unit serial number with fallback to registeredTo
  const getUnitSerial = (unitKey: string, fallbackRegisteredTo?: string | null): string => {
    const serials = currentExec.hardwareSerials || {};
    if (serials[unitKey] !== undefined) {
      return serials[unitKey];
    }
    return fallbackRegisteredTo || '';
  };

  // Update serial number for a specific unit (with auto sync to backend)
  const handleUpdateUnitSerial = (unitKey: string, serialValue: string, unit?: ISchoolHardwareLicense) => {
    if (disabled) return;
    const currentSerials = currentExec.hardwareSerials || {};
    const nextSerials = {
      ...currentSerials,
      [unitKey]: serialValue
    };

    const nextPlan: ISchoolTrainingExecution = {
      ...currentExec,
      hardwareSerials: nextSerials
    };

    const nextMap = {
      ...schoolExecutionsMap,
      [currentSchool.id]: nextPlan
    };

    setSchoolExecutionsMap(nextMap);
    emitUpdate(nextMap);

    // Optimistically update registeredTo locally on unit
    if (unit) {
      setAllocations((prev) =>
        prev.map((a) => {
          if ((unit._id && a._id === unit._id) || a.licenseKey === unit.licenseKey) {
            return { ...a, registeredTo: serialValue };
          }
          return a;
        })
      );

      // Async sync to backend
      if (unit._id) {
        licensesApi.updateAllocation(unit._id, { registeredTo: serialValue }).catch((err) => {
          console.warn('Failed to update serial on backend:', err);
        });
      }
    }
  };

  // Update Hardware for a specific unit
  const handleUpdateUnitHardware = async (unit: ISchoolHardwareLicense, newHwKey: string) => {
    if (disabled) return;
    const selectedHw = hardwareCatalog.find((h) => h.key === newHwKey);
    const hwName = selectedHw?.label || selectedHw?.name || newHwKey;
    const hwId = selectedHw?._id || null;

    // Filter specs matching this newly selected hardware
    const matchingSpecs = specsCatalog.filter(
      (s) =>
        (hwId && (s.hardwareId?._id === hwId || s.hardwareId === hwId)) ||
        s.hardwareKey === newHwKey ||
        s.hardwareId?.key === newHwKey
    );
    const firstSpec = matchingSpecs[0] || null;

    // 1. Optimistically update local allocations state
    setAllocations((prev) =>
      prev.map((a) => {
        if ((unit._id && a._id === unit._id) || a.licenseKey === unit.licenseKey) {
          return {
            ...a,
            hardwareId: hwId,
            hardwareKey: newHwKey,
            hardwareName: hwName,
            specId: firstSpec?._id || null,
            specName: firstSpec?.name || '',
            specKey: firstSpec?.code || '',
          };
        }
        return a;
      })
    );

    // 2. Persist to backend database
    if (unit._id) {
      try {
        setUpdatingUnitId(unit._id);
        await licensesApi.updateAllocation(unit._id, {
          hardwareId: hwId,
          hardwareKey: newHwKey,
          hardwareName: hwName,
          specId: firstSpec?._id || null,
          specName: firstSpec?.name || '',
          specKey: firstSpec?.code || '',
        });
      } catch (err) {
        console.error('Failed to update allocation hardware:', err);
      } finally {
        setUpdatingUnitId(null);
      }
    }
  };

  // Update Specification for a specific unit
  const handleUpdateUnitSpec = async (unit: ISchoolHardwareLicense, newSpecId: string) => {
    if (disabled) return;
    const selectedSpec = specsCatalog.find((s) => s._id === newSpecId);
    const specName = selectedSpec?.name || '';
    const specKey = selectedSpec?.code || '';

    // 1. Optimistically update local allocations state
    setAllocations((prev) =>
      prev.map((a) => {
        if ((unit._id && a._id === unit._id) || a.licenseKey === unit.licenseKey) {
          return {
            ...a,
            specId: newSpecId || null,
            specName,
            specKey,
          };
        }
        return a;
      })
    );

    // 2. Persist to backend database
    if (unit._id) {
      try {
        setUpdatingUnitId(unit._id);
        await licensesApi.updateAllocation(unit._id, {
          specId: newSpecId || null,
          specName,
          specKey,
        });
      } catch (err) {
        console.error('Failed to update allocation spec:', err);
      } finally {
        setUpdatingUnitId(null);
      }
    }
  };

  // Toggle Is Registered status for a specific unit
  const handleToggleUnitRegistration = async (unit: ISchoolHardwareLicense, nextRegistered?: boolean) => {
    if (disabled) return;
    const newIsReg = nextRegistered !== undefined ? nextRegistered : !unit.isRegistered;
    const newStatus = newIsReg ? 'REGISTERED' : 'ALLOCATED';

    // 1. Optimistically update local allocations state
    setAllocations((prev) =>
      prev.map((a) => {
        if ((unit._id && a._id === unit._id) || a.licenseKey === unit.licenseKey) {
          return {
            ...a,
            isRegistered: newIsReg,
            status: newStatus,
          };
        }
        return a;
      })
    );

    // 2. Persist to backend database
    if (unit._id) {
      try {
        setUpdatingUnitId(unit._id);
        await licensesApi.updateAllocation(unit._id, {
          isRegistered: newIsReg,
          status: newStatus,
        });
      } catch (err) {
        console.error('Failed to update allocation registration:', err);
      } finally {
        setUpdatingUnitId(null);
      }
    }
  };

  // Add a new unit to the school
  const handleAddNewUnit = async () => {
    if (disabled) return;
    const defaultHw = hardwareCatalog[0] || { key: 'IFP_75', label: '75" 4K IFP', _id: null };
    const matchingSpecs = specsCatalog.filter(
      (s) =>
        (defaultHw._id && (s.hardwareId?._id === defaultHw._id || s.hardwareId === defaultHw._id)) ||
        s.hardwareKey === defaultHw.key ||
        s.hardwareId?.key === defaultHw.key
    );
    const firstSpec = matchingSpecs[0] || null;
    const nextIndex = activeSchoolUnits.length + 1;
    const schCode = (currentSchool.schoolId || 'SCH').replace(/[^0-9A-Za-z]/g, '').slice(-6) || 'SCH';
    const licenseKey = `LIC-${(activeProjectId || 'PRJ').slice(0, 6)}-${schCode}-${defaultHw.key.slice(0, 8)}-${String(nextIndex).padStart(2, '0')}`;

    try {
      setIsLoadingAllocations(true);
      const newAlloc = await licensesApi.upsertAllocation({
        projectId: activeProjectId,
        schoolId: currentSchool.id,
        schoolName: currentSchool.name,
        hardwareId: defaultHw._id,
        hardwareKey: defaultHw.key,
        hardwareName: defaultHw.label || (defaultHw as any).name || defaultHw.key,
        specId: firstSpec?._id || null,
        specName: firstSpec?.name || '',
        specKey: firstSpec?.code || '',
        unitIndex: nextIndex,
        licenseKey,
        isRegistered: false,
        status: 'ALLOCATED',
        remarks: 'Added via Training Execution portal'
      });

      if (newAlloc) {
        setAllocations((prev) => [...prev, newAlloc]);
      }
    } catch (err) {
      console.error('Failed to add new unit allocation:', err);
    } finally {
      setIsLoadingAllocations(false);
    }
  };

  // Delete a unit allocation
  const handleDeleteUnit = async (unit: ISchoolHardwareLicense) => {
    if (disabled) return;
    if (!confirm(`Are you sure you want to remove license unit ${unit.licenseKey}?`)) return;

    if (unit._id) {
      try {
        setIsLoadingAllocations(true);
        await licensesApi.deleteAllocation(unit._id);
        setAllocations((prev) => prev.filter((a) => a._id !== unit._id));
      } catch (err) {
        console.error('Failed to delete allocation:', err);
      } finally {
        setIsLoadingAllocations(false);
      }
    } else {
      setAllocations((prev) => prev.filter((a) => a.licenseKey !== unit.licenseKey));
    }
  };

  // Toggle unit on-ground verification during training
  const handleToggleUnitVerification = (unitIdentifier: string) => {
    if (disabled) return;
    const currentList = currentExec.verifiedHardwareUnits || [];
    const nextList = currentList.includes(unitIdentifier)
      ? currentList.filter((k) => k !== unitIdentifier)
      : [...currentList, unitIdentifier];

    handleUpdateSchoolField('verifiedHardwareUnits', nextList);
  };

  // Generic document upload handler using backend /api/v1/upload
  const handleUploadDocument = async (
    fieldKey: 'deliveryConfirmationSheetUrl' | 'appreciationLetterUrl' | 'workCompletionLetterUrl' | 'teachersDetailsDocUrl' | 'photographyPhotosUrl',
    file: File
  ) => {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File exceeds 10MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    try {
      setUploadingDocKey(fieldKey);
      setUploadError(null);

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
        throw new Error(data.message || data.error?.message || 'File upload failed');
      }

      const uploadedUrl = data.data?.url || data.url;

      const nextPlan: ISchoolTrainingExecution = {
        ...currentExec,
        [fieldKey]: uploadedUrl
      };

      const nextMap = {
        ...schoolExecutionsMap,
        [currentSchool.id]: nextPlan
      };

      setSchoolExecutionsMap(nextMap);
      emitUpdate(nextMap);

      setActionSuccess(`File "${file.name}" uploaded successfully.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error('File upload failed:', err);
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploadingDocKey(null);
    }
  };

  // Remove document
  const handleRemoveDocument = (fieldKey: 'deliveryConfirmationSheetUrl' | 'appreciationLetterUrl' | 'workCompletionLetterUrl' | 'teachersDetailsDocUrl' | 'photographyPhotosUrl') => {
    const nextPlan: ISchoolTrainingExecution = {
      ...currentExec,
      [fieldKey]: ''
    };

    const nextMap = {
      ...schoolExecutionsMap,
      [currentSchool.id]: nextPlan
    };

    setSchoolExecutionsMap(nextMap);
    emitUpdate(nextMap);
  };

  // Toggle checklist item
  const handleToggleChecklistItem = (itemKey: keyof ITrainingExecutionChecklist) => {
    if (disabled) return;

    const currentChecklist = currentExec.checklist || {
      trainingDone: false,
      applicationWorking: false,
      teachersTraining: false,
      teachersIdCreated: false,
      photographyShootsDone: false,
      googleReviews: false,
    };

    const nextChecklist: ITrainingExecutionChecklist = {
      ...currentChecklist,
      [itemKey]: !currentChecklist[itemKey]
    };

    const nextPlan: ISchoolTrainingExecution = {
      ...currentExec,
      checklist: nextChecklist
    };

    const nextMap = {
      ...schoolExecutionsMap,
      [currentSchool.id]: nextPlan
    };

    setSchoolExecutionsMap(nextMap);
    emitUpdate(nextMap);
  };

  // Update top-level field for active school
  const handleUpdateSchoolField = (fieldKey: keyof ISchoolTrainingExecution, val: any) => {
    const nextPlan: ISchoolTrainingExecution = {
      ...currentExec,
      [fieldKey]: val
    };

    const nextMap = {
      ...schoolExecutionsMap,
      [currentSchool.id]: nextPlan
    };

    setSchoolExecutionsMap(nextMap);
    emitUpdate(nextMap);
  };

  // Apply to all schools
  const handleApplyToAllSchools = useCallback(() => {
    const sourcePlan = currentExec;
    const nextMap = { ...schoolExecutionsMap };

    effectiveSchools.forEach((sch) => {
      if (sch.id !== currentSchool.id) {
        nextMap[sch.id] = {
          schoolId: sch.id,
          schoolName: sch.name,
          address: sch.address || '',
          contactPerson: sch.pocName || sch.contactPerson || '',
          contactPhone: sch.pocContact || '',
          deliveryConfirmationSheetUrl: sourcePlan.deliveryConfirmationSheetUrl || '',
          appreciationLetterUrl: sourcePlan.appreciationLetterUrl || '',
          workCompletionLetterUrl: sourcePlan.workCompletionLetterUrl || '',
          teachersDetailsDocUrl: sourcePlan.teachersDetailsDocUrl || '',
          checklist: { ...sourcePlan.checklist },
          photographyPhotosUrl: sourcePlan.photographyPhotosUrl || '',
          googleReviewsNotes: sourcePlan.googleReviewsNotes || '',
          hardwareSerials: { ...(sourcePlan.hardwareSerials || {}) },
          remarks: sourcePlan.remarks || ''
        };
      }
    });

    setSchoolExecutionsMap(nextMap);
    emitUpdate(nextMap);

    setActionSuccess('Training execution checklist & documents applied to all schools.');
    setTimeout(() => setActionSuccess(null), 4000);
  }, [currentExec, effectiveSchools, currentSchool.id, schoolExecutionsMap, emitUpdate]);

  // Compute completed checklist count for active school
  const completedChecklistCount = useMemo(() => {
    const cl = currentExec.checklist || ({} as ITrainingExecutionChecklist);
    return [
      cl.trainingDone,
      cl.applicationWorking,
      cl.teachersTraining,
      cl.teachersIdCreated,
      cl.photographyShootsDone,
      cl.googleReviews
    ].filter(Boolean).length;
  }, [currentExec.checklist]);

  // Compute uploaded documents count for active school (out of 4)
  const uploadedDocsCount = useMemo(() => {
    return [
      currentExec.deliveryConfirmationSheetUrl,
      currentExec.appreciationLetterUrl,
      currentExec.workCompletionLetterUrl,
      currentExec.teachersDetailsDocUrl
    ].filter(Boolean).length;
  }, [
    currentExec.deliveryConfirmationSheetUrl,
    currentExec.appreciationLetterUrl,
    currentExec.workCompletionLetterUrl,
    currentExec.teachersDetailsDocUrl
  ]);

  // Compute total completed verified items for a school (4 docs + 6 checklist items)
  const getCompletedItemsForSchool = useCallback(
    (schoolId: string) => {
      const plan = schoolExecutionsMap[schoolId];
      if (!plan) return 0;
      let count = 0;
      if (plan.deliveryConfirmationSheetUrl) count++;
      if (plan.appreciationLetterUrl) count++;
      if (plan.workCompletionLetterUrl) count++;
      if (plan.teachersDetailsDocUrl) count++;
      const cl = plan.checklist || ({} as ITrainingExecutionChecklist);
      if (cl.trainingDone) count++;
      if (cl.applicationWorking) count++;
      if (cl.teachersTraining) count++;
      if (cl.teachersIdCreated) count++;
      if (cl.photographyShootsDone) count++;
      if (cl.googleReviews) count++;
      return count;
    },
    [schoolExecutionsMap]
  );

  // Active items count for active school selector badge
  const activeSchoolCompletedItems = getCompletedItemsForSchool(currentSchool.id);

  // Checklist item definition list
  const CHECKLIST_ITEMS = [
    {
      key: 'trainingDone' as const,
      title: 'Training Done',
      icon: GraduationCap,
    },
    {
      key: 'applicationWorking' as const,
      title: 'Application Working',
      icon: Cpu,
    },
    {
      key: 'teachersTraining' as const,
      title: 'Teachers Training',
      icon: BookOpen,
    },
    {
      key: 'teachersIdCreated' as const,
      title: 'Teachers ID Created',
      icon: BadgeCheck,
    },
    {
      key: 'photographyShootsDone' as const,
      title: 'Photography / Shoots Done',
      icon: Camera,
    },
    {
      key: 'googleReviews' as const,
      title: 'Google Reviews',
      icon: Star,
    }
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* ── STEP 1: Institutional School Selector (School According) ── */}
      <InstitutionalSchoolSelector
        schools={effectiveSchools}
        activeIndex={activeSchoolIndex}
        onSelectIndex={setActiveSchoolIndex}
        activeItemCount={activeSchoolCompletedItems}
        itemTypeLabel="Items Verified"
        totalAcrossSchoolsText={`Total Schools: ${effectiveSchools.length}`}
        getItemCountForSchool={getCompletedItemsForSchool}
        onApplyToAll={handleApplyToAllSchools}
        disabled={disabled}
      />

      {/* ── STEP 2: SCHOOL-WISE TRAINING EXECUTION & SIGN-OFF CARD ── */}
      <div
        key={currentSchool.id || `school-training-exec-${activeSchoolIndex}`}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5 animate-in fade-in-50 duration-200"
      >
        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              2
            </span>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                TRAINING EXECUTION FOR <span className="text-[#3a7d84]">{currentSchool.name}</span>
              </h3>
            </div>
          </div>

          {effectiveSchools.length > 1 && (
            <button
              type="button"
              onClick={handleApplyToAllSchools}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0f8f9] hover:bg-[#e0f3f5] text-[#3a7d84] border border-[#b6e0e4] transition shadow-2xs cursor-pointer active:scale-95 self-start sm:self-auto"
              title="Copy documents & checklist template to all schools"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Apply to All Schools</span>
            </button>
          )}
        </div>

        {/* Feedback Banners */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{uploadError}</span>
          </div>
        )}

        {/* School Auto-Populated Info Banner */}
        <div className="p-3 rounded-xl bg-[#f8fafb] border border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-700">

          {/* Address */}
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
            <span className="text-slate-500">Address:</span>
            <strong className="text-slate-900 truncate max-w-xs sm:max-w-md">
              {currentSchool.address || 'Address registered in school database'}
            </strong>
          </div>

          {/* Principal */}
          {currentSchool.principalName && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              <span className="text-slate-500">Principal:</span>
              <strong className="text-slate-900">
                {currentSchool.principalName}
              </strong>
            </div>
          )}

          {/* Site POC */}
          {(currentSchool.pocName || currentSchool.contactPerson) && (
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              <span className="text-slate-500">Site POC:</span>
              <strong className="text-slate-900">
                {currentSchool.pocName || currentSchool.contactPerson}
              </strong>
            </div>
          )}

          {/* Phone */}
          {(currentSchool.pocContact || currentSchool.contactPhone || currentSchool.phone) && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              <span className="text-slate-500">Phone:</span>
              <strong className="text-slate-900">
                {currentSchool.pocContact || currentSchool.contactPhone || currentSchool.phone}
              </strong>
            </div>
          )}

          {/* Assigned Trainer from Stage 07.1 Planning */}
          {(currentExec.assignedTrainerName || currentSchool.technicalPersonName || currentSchool.trainers?.[0]?.name) && (
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="text-slate-500">Assigned Trainer:</span>
              <strong className="text-indigo-950 font-medium">
                {currentExec.assignedTrainerName || currentSchool.technicalPersonName || currentSchool.trainers?.[0]?.name}
                {(currentExec.assignedTrainerPhone || currentSchool.contactNumber) && ` (${currentExec.assignedTrainerPhone || currentSchool.contactNumber})`}
              </strong>
            </div>
          )}

          {/* Scheduled Date from Stage 07.1 Planning */}
          {(currentExec.planOutDate || currentSchool.planOutDate) && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-500">Scheduled Date:</span>
              <strong className="text-emerald-900 font-mono text-[11px]">
                {currentExec.planOutDate || currentSchool.planOutDate}
              </strong>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── SECTION 01: UPLOAD SCHOOL DOCUMENTS ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
          {/* Section Header */}
          <div className="p-4 bg-gradient-to-r from-[#fbfdfd] via-[#f7fafb] to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
                01
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#eef7f8] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shrink-0 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                    Upload School Documents
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                    {uploadedDocsCount} of 4 Uploaded
                  </span>
                  {uploadedDocsCount === 4 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      All Complete
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                PDF, DOC, DOCX &bull; Max 10MB
              </span>
            </div>
          </div>

          {/* Section Body */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Document 1: Delivery Confirmation Sheet */}
              <DocumentUploadCard
                title="Delivery Confirmation Sheet"
                icon={FileCheck2}
                url={currentExec.deliveryConfirmationSheetUrl}
                uploadKey="deliveryConfirmationSheetUrl"
                isUploading={uploadingDocKey === 'deliveryConfirmationSheetUrl'}
                disabled={disabled}
                onUpload={(file) => handleUploadDocument('deliveryConfirmationSheetUrl', file)}
                onRemove={() => handleRemoveDocument('deliveryConfirmationSheetUrl')}
              />

              {/* Document 2: Appreciation Letter */}
              <DocumentUploadCard
                title="Appreciation Letter"
                icon={Award}
                url={currentExec.appreciationLetterUrl}
                uploadKey="appreciationLetterUrl"
                isUploading={uploadingDocKey === 'appreciationLetterUrl'}
                disabled={disabled}
                onUpload={(file) => handleUploadDocument('appreciationLetterUrl', file)}
                onRemove={() => handleRemoveDocument('appreciationLetterUrl')}
              />

              {/* Document 3: Work Completion Letter */}
              <DocumentUploadCard
                title="Work Completion Letter"
                icon={CheckSquare}
                url={currentExec.workCompletionLetterUrl}
                uploadKey="workCompletionLetterUrl"
                isUploading={uploadingDocKey === 'workCompletionLetterUrl'}
                disabled={disabled}
                onUpload={(file) => handleUploadDocument('workCompletionLetterUrl', file)}
                onRemove={() => handleRemoveDocument('workCompletionLetterUrl')}
              />

              {/* Document 4: Teachers Details */}
              <DocumentUploadCard
                title="Teachers Details"
                icon={GraduationCap}
                url={currentExec.teachersDetailsDocUrl}
                uploadKey="teachersDetailsDocUrl"
                isUploading={uploadingDocKey === 'teachersDetailsDocUrl'}
                disabled={disabled}
                onUpload={(file) => handleUploadDocument('teachersDetailsDocUrl', file)}
                onRemove={() => handleRemoveDocument('teachersDetailsDocUrl')}
              />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── SECTION 02: HARDWARE LICENSES ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
          {/* Card Top Title & Information Bar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-[#fbfdfd] via-[#f7fafb] to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-[#3a7d84] text-white flex items-center justify-center font-bold text-[11px] font-mono shrink-0 shadow-2xs">
                02
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#eef7f8] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shrink-0 shadow-2xs">
                <Key className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                    Hardware Licenses
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                    {activeSchoolUnits.length} Units for {currentSchool.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action controls & status indicators */}
            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto flex-wrap">
              {(isLoadingAllocations || isLoadingCatalogs) && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  <Loader2 className="w-3 h-3 animate-spin text-[#3a7d84]" />
                  <span>Syncing...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddNewUnit}
                disabled={disabled || isLoadingAllocations}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#3a7d84] text-white hover:bg-[#2c5f64] transition shadow-xs cursor-pointer disabled:opacity-50"
                title="Add a new hardware license unit to this school"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Unit</span>
              </button>

              <button
                type="button"
                onClick={fetchAllocations}
                disabled={isLoadingAllocations}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3a7d84] hover:text-[#2c5f64] px-2 py-1 rounded-lg hover:bg-[#f0f8f9] transition cursor-pointer border border-[#b6e0e4]"
                title="Reload hardware allocations from database"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAllocations ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTableExpanded((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition cursor-pointer border border-slate-200"
                title={isTableExpanded ? 'Collapse Table' : 'Expand Table'}
              >
                {isTableExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 text-slate-600" />
                    <span className="hidden sm:inline">Collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 text-slate-600" />
                    <span className="hidden sm:inline">Expand</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── EXPANDABLE CONTENT: UNIFIED HARDWARE LICENSES TABLE (NO TABS, FULL VIEWPORT FIT) ── */}
          {isTableExpanded && (
            <div className="p-3 space-y-2 bg-white animate-in fade-in duration-200">
              {activeSchoolUnits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <Key className="w-5 h-5 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-xs">No hardware license units found for this school</p>
                  <p className="text-[10px] text-slate-400">Click &quot;Add Unit&quot; above to configure a new hardware license.</p>
                  <button
                    type="button"
                    onClick={handleAddNewUnit}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-lg text-xs font-bold bg-[#3a7d84] text-white hover:bg-[#2c5f64] transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add First Unit</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs w-full">
                  <table className="w-full table-fixed text-left text-xs">
                    <thead className="bg-[#f8fafb] border-b border-slate-200 text-[10px] uppercase tracking-wider font-heading font-bold text-slate-600">
                      <tr>
                        <th className="py-2.5 px-2 w-[4%] text-center">#</th>
                        <th className="py-2.5 px-2 w-[22%]">License Key</th>
                        <th className="py-2.5 px-2 w-[13%]">Is Registered</th>
                        <th className="py-2.5 px-2 w-[17%]">Hardware</th>
                        <th className="py-2.5 px-2 w-[25%]">Specifications</th>
                        <th className="py-2.5 px-2 w-[15%]">Serial No</th>
                        <th className="py-2.5 px-1 w-[4%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSchoolUnits.map((unit, idx) => {
                        const unitKey = unit.licenseKey || `${unit.hardwareKey}-${unit.unitIndex || idx + 1}`;
                        const isCopied = copiedKey === unit.licenseKey;
                        const isUpdating = updatingUnitId === unit._id;

                        // Find specs for current unit's hardware
                        const hwSpecs = specsCatalog.filter((s) => {
                          if (unit.hardwareId) {
                            const sHwId = typeof s.hardwareId === 'object' ? s.hardwareId?._id : s.hardwareId;
                            const uHwId = typeof unit.hardwareId === 'object' ? unit.hardwareId?._id : unit.hardwareId;
                            if (sHwId && uHwId && String(sHwId) === String(uHwId)) return true;
                          }
                          if (s.hardwareKey && unit.hardwareKey) {
                            return s.hardwareKey.toUpperCase() === unit.hardwareKey.toUpperCase();
                          }
                          return false;
                        });

                        return (
                          <tr
                            key={unit._id || unitKey}
                            className={`hover:bg-[#fbfdfd] transition-colors ${
                              isUpdating ? 'bg-cyan-50/30' : ''
                            }`}
                          >
                            {/* 1. Bullet / Index */}
                            <td className="py-2 px-1 text-center font-mono text-[10.5px] font-semibold text-slate-500">
                              {idx + 1}
                            </td>

                            {/* 2. License Key (with copy button) */}
                            <td className="py-2 px-2 min-w-0">
                              <div className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg shadow-2xs w-full min-w-0">
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <Key className="w-3 h-3 text-[#3a7d84] shrink-0" />
                                  <span
                                    className="font-mono font-bold text-[10.5px] text-[#3a7d84] tracking-tight truncate select-all"
                                    title={unit.licenseKey}
                                  >
                                    {unit.licenseKey || 'PENDING-KEY'}
                                  </span>
                                </div>
                                {unit.licenseKey && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyLicenseKey(unit.licenseKey)}
                                    className="text-slate-400 hover:text-[#3a7d84] transition cursor-pointer p-0.5 shrink-0"
                                    title={isCopied ? 'Copied' : 'Copy License ID'}
                                  >
                                    {isCopied ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* 3. Is Registered (Dropdown / Toggle) */}
                            <td className="py-2 px-2 min-w-0">
                              <select
                                value={unit.isRegistered ? 'REGISTERED' : 'ALLOCATED'}
                                onChange={(e) =>
                                  handleToggleUnitRegistration(unit, e.target.value === 'REGISTERED')
                                }
                                disabled={disabled}
                                className={`w-full px-2 py-1 text-[11px] font-bold rounded-lg border focus:outline-none transition cursor-pointer shadow-2xs truncate ${
                                  unit.isRegistered
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-1 focus:ring-emerald-500'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 focus:ring-1 focus:ring-slate-400'
                                }`}
                              >
                                <option value="ALLOCATED">Allocated</option>
                                <option value="REGISTERED">Registered</option>
                              </select>
                            </td>

                            {/* 4. Hardware (Dropdown Select) */}
                            <td className="py-2 px-2 min-w-0">
                              <select
                                value={unit.hardwareKey}
                                onChange={(e) => handleUpdateUnitHardware(unit, e.target.value)}
                                disabled={disabled}
                                className="w-full px-2 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3a7d84] focus:border-[#3a7d84] shadow-2xs transition cursor-pointer truncate"
                                title={unit.hardwareName || unit.hardwareKey}
                              >
                                {hardwareCatalog.length > 0 ? (
                                  hardwareCatalog.map((hw) => (
                                    <option key={hw._id || hw.key} value={hw.key}>
                                      {hw.label || hw.name || hw.key}
                                    </option>
                                  ))
                                ) : (
                                  <option value={unit.hardwareKey}>
                                    {unit.hardwareName || unit.hardwareKey}
                                  </option>
                                )}
                              </select>
                            </td>

                            {/* 5. Specifications (Dropdown Select with Hardware as Foreign Key) */}
                            <td className="py-2 px-2 min-w-0">
                              <select
                                value={unit.specId?._id || unit.specId || ''}
                                onChange={(e) => handleUpdateUnitSpec(unit, e.target.value)}
                                disabled={disabled}
                                className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3a7d84] focus:border-[#3a7d84] shadow-2xs transition cursor-pointer truncate"
                                title={unit.specName || 'Select Specification'}
                              >
                                {hwSpecs.length > 0 ? (
                                  hwSpecs.map((spec) => (
                                    <option key={spec._id} value={spec._id}>
                                      {spec.name}
                                    </option>
                                  ))
                                ) : (
                                  <>
                                    <option value="">
                                      {unit.specName || 'Standard Specification'}
                                    </option>
                                    {specsCatalog.map((s) => (
                                      <option key={s._id} value={s._id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </>
                                )}
                              </select>
                            </td>

                            {/* 6. Serial No (Input Field) */}
                            <td className="py-2 px-2 min-w-0">
                              <input
                                type="text"
                                value={getUnitSerial(unitKey, unit.registeredTo)}
                                onChange={(e) =>
                                  handleUpdateUnitSerial(unitKey, e.target.value, unit)
                                }
                                disabled={disabled}
                                placeholder="Serial No..."
                                className="w-full px-2 py-1 text-[11px] font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3a7d84] focus:border-[#3a7d84] placeholder:text-slate-400 placeholder:font-sans transition shadow-2xs truncate"
                              />
                            </td>

                            {/* 7. Delete Action */}
                            <td className="py-2 px-1 text-center min-w-0">
                              <button
                                type="button"
                                onClick={() => handleDeleteUnit(unit)}
                                disabled={disabled}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer inline-flex items-center justify-center"
                                title="Delete unit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer info with Quick Add Button */}
              <div className="px-3 py-2 bg-[#fbfdfd] border border-slate-200 rounded-xl text-[10.5px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Total: <strong className="text-slate-800">{activeSchoolUnits.length}</strong> Units
                  </span>
                  <span>&bull;</span>
                  <span className="text-emerald-700 font-semibold">
                    {activeSchoolUnits.filter((u) => u.isRegistered).length} Registered
                  </span>
                  <span>&bull;</span>
                  <span className="text-slate-500">
                    {activeSchoolUnits.filter((u) => !u.isRegistered).length} Allocated
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewUnit}
                    disabled={disabled || isLoadingAllocations}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#3a7d84] hover:bg-[#f0f8f9] border border-[#b6e0e4] transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Unit</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── SECTION 03: OPERATIONAL & VERIFICATION CHECKLIST ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
          {/* Section Header */}
          <div className="p-4 bg-gradient-to-r from-[#fbfdfd] via-[#f7fafb] to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
                03
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#eef7f8] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                    Operational & Verification Checklist
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                    {completedChecklistCount} of {CHECKLIST_ITEMS.length} Completed
                  </span>
                  {completedChecklistCount === CHECKLIST_ITEMS.length && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      All Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist Progress */}
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-mono font-bold text-slate-600">
                {Math.round((completedChecklistCount / CHECKLIST_ITEMS.length) * 100)}% Complete
              </span>
              <div className="w-24 sm:w-28 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3a7d84] to-emerald-500 transition-all duration-300"
                  style={{ width: `${(completedChecklistCount / CHECKLIST_ITEMS.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Section Body */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = Boolean(currentExec.checklist?.[item.key]);
                const IconComp = item.icon;

                return (
                  <div
                    key={item.key}
                    onClick={() => handleToggleChecklistItem(item.key)}
                    className={`
                      group p-3.5 rounded-2xl border transition-all duration-200 select-none cursor-pointer flex flex-col justify-between gap-3 shadow-2xs
                      ${isChecked
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200/50 hover:bg-emerald-50'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'}
                      ${disabled ? 'opacity-60 pointer-events-none' : 'active:scale-[0.98]'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`
                          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                          ${isChecked ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500 group-hover:bg-[#f0f8f9] group-hover:text-[#3a7d84]'}
                        `}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-bold font-heading truncate block ${isChecked ? 'text-emerald-950' : 'text-slate-900'}`}>
                          {item.title}
                        </span>
                      </div>

                      {/* Animated Tick / Radio Circle */}
                      <div className="shrink-0 pt-0.5">
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300
                          ${isChecked
                            ? 'bg-emerald-500 border-2 border-emerald-500 text-white shadow-xs ring-4 ring-emerald-100 scale-105'
                            : 'border-2 border-slate-300 bg-white group-hover:border-[#3a7d84]'}
                        `}>
                          {isChecked && (
                            <Check className="w-3 h-3 text-white stroke-[3] animate-in zoom-in-50 duration-200" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status pill badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100/60">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {isChecked ? '✓ Verified / Done' : '○ Pending Sign-off'}
                      </span>
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-600">
                        Click to {isChecked ? 'Uncheck' : 'Confirm'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conditional Input: Photography / Shoots Google Drive Link if checked */}
            {currentExec.checklist?.photographyShootsDone && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs animate-in fade-in duration-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5 font-heading">
                    <Camera className="w-4 h-4 text-amber-700" />
                    <span>Session Photos / Video Shoots (Google Drive Link)</span>
                  </label>
                  {currentExec.photographyPhotosUrl && (
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-700" /> Drive Link Added
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700">
                      <Link2 className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="url"
                      value={currentExec.photographyPhotosUrl || ''}
                      onChange={(e) => handleUpdateSchoolField('photographyPhotosUrl', e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... (Paste Google Drive Link)"
                      disabled={disabled}
                      className="w-full text-xs font-medium py-2 pl-9 pr-3 bg-white border border-amber-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-2xs"
                    />
                  </div>

                  {currentExec.photographyPhotosUrl && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={currentExec.photographyPhotosUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition cursor-pointer shadow-2xs"
                        title="Open Google Drive link in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-800" />
                        <span className="hidden sm:inline">Open Drive</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleUpdateSchoolField('photographyPhotosUrl', '')}
                        disabled={disabled}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer"
                        title="Clear Google Drive link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-[10.5px] text-amber-900/75">
                  Share the public or institutional Google Drive folder link containing high-resolution classroom action photos and training video clips.
                </p>
              </div>
            )}

            {/* Conditional Input: Google Reviews Link / Notes if checked */}
            {currentExec.checklist?.googleReviews && (
              <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-1.5 text-xs animate-in fade-in duration-200">
                <label className="font-bold text-indigo-900 flex items-center gap-1.5 font-heading">
                  <Star className="w-4 h-4 text-indigo-700" />
                  <span>Google Review Link / Stakeholder Testimonial Notes</span>
                </label>
                <input
                  type="text"
                  value={currentExec.googleReviewsNotes || ''}
                  onChange={(e) => handleUpdateSchoolField('googleReviewsNotes', e.target.value)}
                  placeholder="e.g. https://maps.app.goo.gl/... or '5 Star rating given by Principal Mr. Sharma'"
                  disabled={disabled}
                  className="w-full text-xs font-medium py-1.5 px-3 bg-white border border-indigo-300 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 shadow-2xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* ── SECTION 04: REMARKS & FIELD OBSERVATIONS ── */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all duration-200">
          {/* Section Header */}
          <div className="p-4 bg-gradient-to-r from-[#fbfdfd] via-[#f7fafb] to-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
                04
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#eef7f8] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-heading">
                    Remarks & Field Observations
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Execution Notes
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Form Inputs &bull; Auto Saved
              </span>
            </div>
          </div>

          {/* Section Body - Form Fields */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field 1: Issues Noted */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 font-heading flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Issues Noted during Training / Setup</span>
                </label>
                <textarea
                  rows={3}
                  value={currentExec.issuesNoted || ''}
                  onChange={(e) => handleUpdateSchoolField('issuesNoted', e.target.value)}
                  placeholder="Note down any hardware, application, school infrastructure, or teacher attendance issues observed..."
                  disabled={disabled}
                  className="w-full text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] text-slate-900 placeholder:text-slate-400 shadow-2xs resize-none transition"
                />
              </div>

              {/* Field 2: On Ground Feedback */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 font-heading flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>On Ground Feedback from Teachers / Principal</span>
                </label>
                <textarea
                  rows={3}
                  value={currentExec.onGroundFeedback || ''}
                  onChange={(e) => handleUpdateSchoolField('onGroundFeedback', e.target.value)}
                  placeholder="Enter direct feedback, teacher reactions, usability remarks, or special requests from ground..."
                  disabled={disabled}
                  className="w-full text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] text-slate-900 placeholder:text-slate-400 shadow-2xs resize-none transition"
                />
              </div>
            </div>

            {/* Field 3: General Remarks - Full Width */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 font-heading flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>School Training Execution Remarks & Observations</span>
              </label>
              <textarea
                rows={2}
                value={currentExec.remarks || ''}
                onChange={(e) => handleUpdateSchoolField('remarks', e.target.value)}
                placeholder="Enter overall training execution sign-off remarks, trainer observations, or next steps..."
                disabled={disabled}
                className="w-full text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] text-slate-900 placeholder:text-slate-400 shadow-2xs resize-none transition"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable Document Upload Card ──
interface DocumentUploadCardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  uploadKey: string;
  isUploading: boolean;
  disabled?: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

function DocumentUploadCard({
  title,
  subtitle,
  icon: Icon,
  url,
  uploadKey,
  isUploading,
  disabled = false,
  onUpload,
  onRemove,
}: DocumentUploadCardProps) {
  return (
    <div className={`
      p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 shadow-2xs
      ${url 
        ? 'border-emerald-300 bg-emerald-50/30' 
        : 'border-slate-200 bg-white hover:border-[#b6e0e4] hover:bg-[#f8fafb]'}
    `}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`
            w-7 h-7 rounded-lg flex items-center justify-center shrink-0
            ${url ? 'bg-emerald-600 text-white' : 'bg-[#f0f8f9] text-[#3a7d84]'}
          `}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h5 className="text-xs font-bold text-slate-900 truncate font-heading">
              {title}
            </h5>
            {subtitle && (
              <p className="text-[10px] text-slate-500 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {url ? (
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md shrink-0">
            PDF
          </span>
        )}
      </div>

      {/* Upload button or view action */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
        <label className={`
          grow border border-dashed rounded-xl px-2 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition shadow-2xs
          ${url
            ? 'border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700'
            : 'border-slate-300 bg-[#f8fafb] hover:bg-[#e0f3f5] text-[#3a7d84]'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf"
            disabled={disabled || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="hidden"
          />
          {isUploading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-[#3a7d84]" />
              <span>Uploading...</span>
            </>
          ) : url ? (
            <>
              <Upload className="w-3 h-3 text-emerald-600" />
              <span>Replace PDF</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 text-[#3a7d84]" />
              <span>Upload PDF</span>
            </>
          )}
        </label>

        {url && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#3a7d84] hover:bg-white border border-emerald-300 rounded-xl transition cursor-pointer shadow-2xs shrink-0"
              title="View uploaded document in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-xl transition cursor-pointer shrink-0"
              title="Remove document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TrainingExecutionSection;
