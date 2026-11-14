'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu,
  Layers,
  BookOpen,
  School,
  Loader2,
  Table as TableIcon,
  LayoutGrid,
  Download,
  Search,
  Key,
  Users,
  FileSpreadsheet,
  Building2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { IProject } from '../../../types/project';
import { schoolsApi } from '../../../lib/api/schools.api';
import { timelineApi } from '../../../lib/api/timeline.api';
import { projectsApi } from '../../../lib/api/projects.api';
import { licensesApi } from '../../../lib/api/licenses.api';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import { extractEffectiveSchools, EffectiveSchoolItem } from '../utils/formHelpers';
import {
  PLATFORM_OPTIONS,
  PLATFORM_LABELS,
  LicensePlatform,
  doesSolutionRequirePlatform
} from '@/constants/platforms.constants';

export interface SchoolLicenseTableRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  pocType: string;
  pocName?: string;
  address: string;
  block: string;
  state: string;
  city: string;
  numberOfStudents: number;
  numberOfTeachers: number;
  coordinatorId: string;
  [key: string]: any;
}

const PLATFORM_COLOR_THEMES = [
  { groupBg: 'bg-teal-50', groupBorder: 'border-teal-200', groupText: 'text-teal-800', badgeDot: 'bg-teal-400', cellBg: 'bg-teal-50/30', borderR: 'border-teal-200', selectText: 'text-teal-900', selectBorder: 'border-teal-200' },
  { groupBg: 'bg-indigo-50', groupBorder: 'border-indigo-200', groupText: 'text-indigo-800', badgeDot: 'bg-indigo-400', cellBg: 'bg-indigo-50/30', borderR: 'border-indigo-200', selectText: 'text-indigo-900', selectBorder: 'border-indigo-200' },
  { groupBg: 'bg-purple-50', groupBorder: 'border-purple-200', groupText: 'text-purple-800', badgeDot: 'bg-purple-400', cellBg: 'bg-purple-50/30', borderR: 'border-purple-200', selectText: 'text-purple-900', selectBorder: 'border-purple-200' },
  { groupBg: 'bg-amber-50', groupBorder: 'border-amber-200', groupText: 'text-amber-800', badgeDot: 'bg-amber-400', cellBg: 'bg-amber-50/30', borderR: 'border-amber-200', selectText: 'text-amber-900', selectBorder: 'border-amber-200' },
];

interface SchoolAndLicenseCreationSectionProps {
  value?: any;
  onChange?: (val: any) => void;
  disabled?: boolean;
  project?: IProject | null;
  allFormData?: Record<string, any>;
  schools?: any[];
  onStatusChange?: (status: any) => Promise<void> | void;
  nodeStatus?: string;
  onSubmitAndComplete?: (data: any) => Promise<void>;
}

export function SchoolAndLicenseCreationSection({
  value,
  onChange,
  disabled = false,
  project = null,
  allFormData = {},
  schools: rawSchoolsList,
  onStatusChange,
  nodeStatus,
  onSubmitAndComplete,
}: SchoolAndLicenseCreationSectionProps) {
  // ── Database Live States (Direct from MongoDB) ──────────────────────────
  const [dbLoadedSchools, setDbLoadedSchools] = useState<any[]>([]);
  const [dbLoadedSolutions, setDbLoadedSolutions] = useState<any>(null);
  const [dbLoadedHardware, setDbLoadedHardware] = useState<any>(null);
  const [dbLoadedContent, setDbLoadedContent] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);

  // View Mode: Default to 'table' as requested by user
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract active project identifier
  const activeProjectId = useMemo(() => {
    return (
      project?._id ||
      project?.projectId ||
      allFormData?.projectId ||
      allFormData?.project?._id ||
      allFormData?.project?.projectId ||
      ''
    );
  }, [project, allFormData]);

  // Live project fetched from core API to guarantee real project details (email, phone, address)
  const [liveProject, setLiveProject] = useState<IProject | null>(project || null);

  useEffect(() => {
    if (!activeProjectId) return;
    let isMounted = true;
    projectsApi
      .getProjectById(activeProjectId)
      .then((res) => {
        if (isMounted && res?.project) {
          setLiveProject(res.project);
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const currentProject = liveProject || project;

  // ── Core Backend Schools (Fetched directly from Core Backend API, identical to Projects) ──
  const [coreBackendSchools, setCoreBackendSchools] = useState<any[]>([]);
  const [loadingCoreSchools, setLoadingCoreSchools] = useState<boolean>(false);
  const [coreSearchQuery, setCoreSearchQuery] = useState<string>('');

  const fetchCoreBackendSchools = useCallback(async () => {
    if (!activeProjectId) return;
    setLoadingCoreSchools(true);
    try {
      let schools: any[] = await schoolsApi.getCoreSchools(activeProjectId);
      if ((!Array.isArray(schools) || schools.length === 0) && project?.projectId && project.projectId !== activeProjectId) {
        schools = await schoolsApi.getCoreSchools(project.projectId);
      }
      if (!Array.isArray(schools) || schools.length === 0) {
        schools = await schoolsApi.getSchools({ projectId: activeProjectId });
      }
      const mapped = Array.isArray(schools)
        ? schools.map((s: any) => ({
            ...s,
            id: s.id || s._id || s.schoolId || s.name,
            name: s.name || s.schoolName || '',
            address: s.address || '',
            schoolId: s.schoolId || s.code || '',
            city: s.city || '',
            state: s.state || '',
            phone: s.phone || '',
            email: s.email || '',
            pocName: s.pocName || ''
          }))
        : [];
      setCoreBackendSchools(mapped);
    } catch (_) {
      try {
        const fallbackSchools: any = await schoolsApi.getSchools({ projectId: activeProjectId });
        const mapped = Array.isArray(fallbackSchools)
          ? fallbackSchools.map((s: any) => ({
              ...s,
              id: s.id || s._id || s.schoolId || s.name,
              name: s.name || s.schoolName || '',
              address: s.address || '',
              schoolId: s.schoolId || s.code || '',
              city: s.city || '',
              state: s.state || '',
              phone: s.phone || '',
              email: s.email || '',
              pocName: s.pocName || ''
            }))
          : [];
        setCoreBackendSchools(mapped);
      } catch (e) {
        setCoreBackendSchools([]);
      }
    } finally {
      setLoadingCoreSchools(false);
    }
  }, [activeProjectId, project?.projectId]);

  useEffect(() => {
    fetchCoreBackendSchools();
  }, [fetchCoreBackendSchools]);

  // ── Live Licenses from Core Backend API ────────────────────────────────────
  const [coreLicenses, setCoreLicenses] = useState<any[]>([]);
  const [loadingCoreLicenses, setLoadingCoreLicenses] = useState<boolean>(false);

  const fetchLiveCoreLicenses = useCallback(async () => {
    if (!activeProjectId) return;
    setLoadingCoreLicenses(true);
    try {
      const res = await licensesApi.getLicenses({ projectId: activeProjectId });
      setCoreLicenses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('[SchoolAndLicenseCreationSection] Failed to load core licenses:', err);
      setCoreLicenses([]);
    } finally {
      setLoadingCoreLicenses(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchLiveCoreLicenses();
  }, [fetchLiveCoreLicenses]);

  // ── 1. Fetch live preceding task data from MongoDB Atlas ──────────────────
  useEffect(() => {
    if (!activeProjectId) return;

    let isMounted = true;
    async function fetchDatabaseData() {
      setLoadingDb(true);
      try {
        // Query live schools from MongoDB
        try {
          const liveSchools = await schoolsApi.getSchools({ projectId: activeProjectId });
          if (isMounted && Array.isArray(liveSchools) && liveSchools.length > 0) {
            setDbLoadedSchools(liveSchools);
          }
        } catch (_) { }

        // Query live timeline nodes from MongoDB (Task 1, 2, 3, 4 formData)
        try {
          const res = await timelineApi.getTimelineByProjectId(activeProjectId);
          if (isMounted && res?.timeline?.nodes) {
            const findNodeRecursive = (nodes: any[], targetKey: string): any => {
              for (const n of nodes) {
                const k = (n.key || n.nodeId || n.id || '').toUpperCase();
                const name = (n.name || n.title || '').toLowerCase();
                if (
                  k === targetKey ||
                  (targetKey === 'SOLUTION_SELECTION' && (k.includes('SOLUTION') || name.includes('solution'))) ||
                  (targetKey === 'HARDWARE_REQUIREMENT' && (k.includes('HARDWARE') || name.includes('hardware'))) ||
                  (targetKey === 'CONTENT_CONFIGURATION' && (k.includes('CONTENT') || name.includes('content'))) ||
                  (targetKey === 'SCHOOL_ONBOARDING_INFORMATION' && (k.includes('SCHOOL') || name.includes('school')))
                ) {
                  return n;
                }
                if (n.children && n.children.length > 0) {
                  const found = findNodeRecursive(n.children, targetKey);
                  if (found) return found;
                }
              }
              return null;
            };

            const solNode = findNodeRecursive(res.timeline.nodes, 'SOLUTION_SELECTION');
            const hwNode = findNodeRecursive(res.timeline.nodes, 'HARDWARE_REQUIREMENT');
            const contentNode = findNodeRecursive(res.timeline.nodes, 'CONTENT_CONFIGURATION');
            const schoolNode = findNodeRecursive(res.timeline.nodes, 'SCHOOL_ONBOARDING_INFORMATION');

            if (solNode?.formData) setDbLoadedSolutions(solNode.formData);
            if (hwNode?.formData) setDbLoadedHardware(hwNode.formData);
            if (contentNode?.formData) setDbLoadedContent(contentNode.formData);
            if (schoolNode?.formData?.schools && Array.isArray(schoolNode.formData.schools)) {
              setDbLoadedSchools(schoolNode.formData.schools);
            }
          }
        } catch (_) { }
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    }

    fetchDatabaseData();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  // ── 2. Resolve Schools strictly from DB (Stage 3 Task 1) ─────────────────
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    const combinedSchools =
      (dbLoadedSchools.length > 0 ? dbLoadedSchools : null) ||
      rawSchoolsList ||
      allFormData?.stage3Schools ||
      allFormData?.schools ||
      allFormData?.projectSchools ||
      (currentProject as any)?.schools ||
      (currentProject as any)?.orderRequirement?.schoolInformation?.schools ||
      [];

    const projName = currentProject?.projectName || currentProject?.title || 'School';
    const projEmail = currentProject?.email || '';
    const projPhone = currentProject?.phone || '';
    const projAddress = currentProject?.address || '';
    const projId = currentProject?.projectId || currentProject?._id || 'prj';

    if (!Array.isArray(combinedSchools) || combinedSchools.length === 0) {
      return [
        {
          id: projId,
          name: projName,
          email: projEmail,
          phone: projPhone,
          address: projAddress,
          block: '',
          state: '',
          city: '',
          numberOfStudents: 0,
          numberOfTeachers: 0,
          coordinatorId: projId,
          pocName: (currentProject as any)?.projectManagerName || (currentProject as any)?.pocName || '',
          pocDesignation: (currentProject as any)?.pocDesignation || 'Project Coordinator',
          pocType: (currentProject as any)?.pocDesignation || 'Project Coordinator',
        }
      ];
    }

    const extracted = extractEffectiveSchools(
      combinedSchools,
      allFormData,
      value,
      projName
    );

    return extracted.map((sch, idx) => {
      // Clean up project code suffix from school name if attached (e.g. "Kendriya Vidyalaya ... (PRJ-SMART-2026)")
      let cleanName = (sch.name || '').trim();
      if (cleanName.includes('(') && cleanName.endsWith(')')) {
        cleanName = cleanName.replace(/\s*\([A-Za-z0-9_-]+\)$/, '').trim();
      }
      if (!cleanName) {
        cleanName = extracted.length > 1 ? `${projName} (School ${idx + 1})` : projName;
      }

      const pocType =
        sch.pocType ||
        sch.pocDesignation ||
        (sch.rawSchool as any)?.pocDesignation ||
        ((sch as any)?.survey as any)?.pocDesignation ||
        (sch.pocName ? 'School Coordinator' : 'Coordinator');

      return {
        ...sch,
        name: cleanName,
        pocType,
        pocDesignation: sch.pocDesignation || pocType,
      };
    });
  }, [dbLoadedSchools, rawSchoolsList, allFormData, value, currentProject]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);

  // Current active school from DB for Cards View
  const currentSchool: EffectiveSchoolItem | null =
    effectiveSchools[Math.min(activeSchoolIndex, effectiveSchools.length - 1)] ||
    effectiveSchools[0] ||
    null;

  // ── Core Backend Schools Verification & Stage Completion ────────────────────
  const [verifiedSchoolKeys, setVerifiedSchoolKeys] = useState<string[]>(() => {
    if (Array.isArray(value?.verifiedCoreSchoolIds) && value.verifiedCoreSchoolIds.length > 0) {
      return value.verifiedCoreSchoolIds;
    }
    return [];
  });
  const [completingStage, setCompletingStage] = useState<boolean>(false);
  const [completionSuccess, setCompletionSuccess] = useState<boolean>(false);
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Helper to normalize school names for strict matching
  const normalizeSchoolName = (name?: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\s*\([a-z0-9_-]+\)$/i, '') // Remove (PRJ-CODE)
      .replace(/[^a-z0-9]/g, '') // Remove spaces and punctuation
      .trim();
  };

  // Strictly check if a Core Backend school matches any school in this project's demographic list
  const isSchoolMatched = useCallback(
    (coreSchool: { name?: string; id?: string }) => {
      if (!coreSchool?.name) return false;
      const coreNorm = normalizeSchoolName(coreSchool.name);
      if (!coreNorm) return false;

      return effectiveSchools.some((es) => {
        if (!es.name) return false;
        const esNorm = normalizeSchoolName(es.name);
        if (!esNorm) return false;

        // Exact match
        if (coreNorm === esNorm) return true;

        // Long substring match (>= 10 chars)
        if (coreNorm.length >= 10 && esNorm.length >= 10) {
          if (coreNorm.includes(esNorm) || esNorm.includes(coreNorm)) {
            return true;
          }
        }
        return false;
      });
    },
    [effectiveSchools]
  );

  // Filter to ONLY core schools that strictly match current project schools!
  // If a school doesn't match this project, it is NOT shown; if no schools match, shows "not created".
  const matchedCoreSchools = useMemo(() => {
    return coreBackendSchools.filter((cs) => isSchoolMatched(cs));
  }, [coreBackendSchools, isSchoolMatched]);

  const filteredCoreSchools = useMemo(() => {
    if (!coreSearchQuery.trim()) return matchedCoreSchools;
    const q = coreSearchQuery.toLowerCase().trim();
    return matchedCoreSchools.filter((s) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.address && s.address.toLowerCase().includes(q)) ||
      (s.schoolId && s.schoolId.toLowerCase().includes(q))
    );
  }, [matchedCoreSchools, coreSearchQuery]);

  const matchedCoreKeys = useMemo(() => {
    return matchedCoreSchools.map((s) => s.id || s.schoolId || s.name);
  }, [matchedCoreSchools]);

  // Sync / initialize verified schools:
  // ONLY schools that ACTUALLY match project demographic schools can ever be verified!
  useEffect(() => {
    if (coreBackendSchools.length > 0) {
      const validMatched = coreBackendSchools.filter((cs) => isSchoolMatched(cs));
      const validKeys = validMatched.map((cs) => cs.id || cs.schoolId || cs.name);

      if (Array.isArray(value?.verifiedCoreSchoolIds)) {
        // Filter out any stale/unmatched IDs
        const verifiedOnlyMatching = value.verifiedCoreSchoolIds.filter((k: string) => validKeys.includes(k));
        setVerifiedSchoolKeys(verifiedOnlyMatching);
      } else {
        // Auto-select only schools that actually match
        setVerifiedSchoolKeys(validKeys);
      }
    } else {
      setVerifiedSchoolKeys([]);
    }
  }, [value?.verifiedCoreSchoolIds, coreBackendSchools, isSchoolMatched]);

  // All verified strictly requires matching schools to exist and be verified
  const isAllVerified = useMemo(() => {
    return (
      matchedCoreKeys.length > 0 &&
      matchedCoreKeys.length === effectiveSchools.length &&
      matchedCoreKeys.every((k) => verifiedSchoolKeys.includes(k))
    );
  }, [matchedCoreKeys, verifiedSchoolKeys, effectiveSchools.length]);

  const handleToggleSchool = async (schoolKey: string) => {
    // Only allow toggling if school actually matches project schools!
    const targetSchool = coreBackendSchools.find((s) => (s.id || s.schoolId || s.name) === schoolKey);
    if (!targetSchool || !isSchoolMatched(targetSchool)) {
      return; // Do NOT verify unmatched school!
    }

    setCompletionError(null);
    const isChecked = verifiedSchoolKeys.includes(schoolKey);
    const updatedKeys = isChecked
      ? verifiedSchoolKeys.filter((k) => k !== schoolKey)
      : [...verifiedSchoolKeys, schoolKey];

    setVerifiedSchoolKeys(updatedKeys);
    const allVerified =
      matchedCoreKeys.length > 0 &&
      matchedCoreKeys.length === effectiveSchools.length &&
      matchedCoreKeys.every((k) => updatedKeys.includes(k));

    const payload = {
      ...(value || {}),
      verifiedCoreSchoolIds: updatedKeys,
      coreSchoolsVerified: allVerified,
    };

    if (onChange) {
      onChange(payload);
    }

    // When all matching schools are verified, automatically complete stage
    if (allVerified && !isChecked) {
      try {
        setCompletingStage(true);
        if (onSubmitAndComplete) {
          await onSubmitAndComplete(payload);
        } else if (onStatusChange) {
          await onStatusChange('COMPLETED');
        }
        setCompletionSuccess(true);
      } catch (err: any) {
        setCompletionError(err.message || 'Failed to complete stage.');
      } finally {
        setCompletingStage(false);
      }
    }
  };

  const handleToggleAllSchools = async () => {
    if (matchedCoreKeys.length === 0) return;
    setCompletionError(null);

    const updatedKeys = isAllVerified ? [] : [...matchedCoreKeys];
    setVerifiedSchoolKeys(updatedKeys);
    const allVerified =
      !isAllVerified &&
      matchedCoreKeys.length > 0 &&
      matchedCoreKeys.length === effectiveSchools.length;

    const payload = {
      ...(value || {}),
      verifiedCoreSchoolIds: updatedKeys,
      coreSchoolsVerified: allVerified,
    };

    if (onChange) {
      onChange(payload);
    }

    if (allVerified) {
      try {
        setCompletingStage(true);
        if (onSubmitAndComplete) {
          await onSubmitAndComplete(payload);
        } else if (onStatusChange) {
          await onStatusChange('COMPLETED');
        }
        setCompletionSuccess(true);
      } catch (err: any) {
        setCompletionError(err.message || 'Failed to complete stage.');
      } finally {
        setCompletingStage(false);
      }
    }
  };

  const handleMarkStageComplete = async () => {
    if (completingStage) return;
    setCompletingStage(true);
    setCompletionError(null);

    try {
      // Ensure matching core school keys are verified
      const finalVerifiedKeys = [...matchedCoreKeys];
      setVerifiedSchoolKeys(finalVerifiedKeys);

      const payload = {
        ...(value || {}),
        verifiedCoreSchoolIds: finalVerifiedKeys,
        coreSchoolsVerified: true,
        verifiedAt: new Date().toISOString(),
      };

      if (onChange) {
        onChange(payload);
      }

      if (onSubmitAndComplete) {
        await onSubmitAndComplete(payload);
      } else if (onStatusChange) {
        await onStatusChange('COMPLETED');
      }

      setCompletionSuccess(true);
    } catch (err: any) {
      setCompletionError(err.message || 'Failed to complete stage. Please try again.');
    } finally {
      setCompletingStage(false);
    }
  };

  // ── 3. Extract Selected Solutions strictly from DB (Stage 3 Task 2) ───────
  const solutionsSource = useMemo(() => {
    const rawSol =
      dbLoadedSolutions ||
      allFormData?.stage3SolutionsData ||
      allFormData?.solutionSelection ||
      allFormData?.solutions ||
      (project as any)?.orderRequirement?.solutionSelection ||
      {};

    const schoolWiseMap: Record<string, any> =
      rawSol?.schoolWiseSolutions ||
      allFormData?.stage3SchoolWiseSolutions ||
      allFormData?.solutionSelection?.schoolWiseSolutions ||
      allFormData?.schoolWiseSolutions ||
      (project as any)?.orderRequirement?.solutionSelection?.schoolWiseSolutions ||
      {};

    const flatList: any[] = [];
    const seen = new Set<string>();

    if (Array.isArray(rawSol?.solutionsList)) {
      rawSol.solutionsList.forEach((s: any) => {
        const k = s.key || s.solutionKey;
        if (!k || seen.has(k)) return;
        seen.add(k);
        flatList.push(s);
      });
    }

    if (Array.isArray(rawSol?.solutions)) {
      rawSol.solutions.forEach((s: any) => {
        const k = s.key || s.solutionKey;
        if (!k || seen.has(k)) return;
        seen.add(k);
        flatList.push(s);
      });
    }

    if (rawSol?.solutions && typeof rawSol.solutions === 'object' && !Array.isArray(rawSol.solutions)) {
      Object.entries(rawSol.solutions).forEach(([k, v]: [string, any]) => {
        if (!v || seen.has(k)) return;
        seen.add(k);
        flatList.push({
          key: k,
          solutionKey: k,
          name: typeof v === 'object' ? v.name || v.solutionName || k : k,
          solutionName: typeof v === 'object' ? v.name || v.solutionName || k : k,
          quantity: typeof v === 'object' ? Number(v.quantity || v.qty) || 1 : 1,
          platform: typeof v === 'object' ? v.platform || '' : '',
          licenseCount: typeof v === 'object' ? Number(v.licenseCount || v.quantity || v.qty) || 1 : 1,
          licenseDays: typeof v === 'object' ? Number(v.licenseDays) || 365 : 365,
          licenseRequired: typeof v === 'object' ? v.licenseRequired ?? v.isLicenseRequired : true,
          isLicenseRequired: typeof v === 'object' ? v.isLicenseRequired ?? v.licenseRequired : true,
          targetClasses: typeof v === 'object' && Array.isArray(v.targetClasses) ? v.targetClasses : [],
          board: typeof v === 'object' ? v.board || '' : '',
          notes: typeof v === 'object' ? v.notes || '' : '',
        });
      });
    }

    return {
      schoolWiseMap,
      flatList,
    };
  }, [dbLoadedSolutions, allFormData, project]);

  // ── 4. Extract Selected Hardware strictly from DB (Stage 3 Task 3) ────────
  const hardwareSource = useMemo(() => {
    const rawHw =
      dbLoadedHardware ||
      allFormData?.stage3HardwareData ||
      allFormData?.hardwareRequirement ||
      allFormData?.hardwareRequirements ||
      (project as any)?.orderRequirement?.hardwareRequirement ||
      {};

    const schoolWiseMap: Record<string, any> =
      rawHw?.schoolWiseHardware ||
      rawHw?.hardwareRequirements?.schoolWiseHardware ||
      allFormData?.stage3SchoolWiseHardware ||
      allFormData?.schoolWiseHardware ||
      (project as any)?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
      {};

    const itemsMap: Record<string, any> =
      rawHw?.hardwareRequirements?.items ||
      rawHw?.items ||
      allFormData?.stage3HardwareItems ||
      {};

    const flatItems: any[] = [];
    const seen = new Set<string>();

    if (Array.isArray(rawHw?.itemsList)) {
      rawHw.itemsList.forEach((itm: any) => {
        const k = itm.key || itm.itemKey;
        if (!itm || seen.has(k)) return;
        seen.add(k);
        flatItems.push(itm);
      });
    }

    Object.entries(itemsMap).forEach(([k, v]: [string, any]) => {
      if (!v || seen.has(k)) return;
      seen.add(k);
      flatItems.push({
        key: k,
        itemKey: k,
        name: typeof v === 'object' ? v.name || v.itemName || k : k,
        itemName: typeof v === 'object' ? v.name || v.itemName || k : k,
        quantity: typeof v === 'object' ? Number(v.quantity || v.qty) || 1 : 1,
        specName: typeof v === 'object' ? v.specName || v.selectedSpecName || v.specNotes || '' : '',
        category: typeof v === 'object' ? v.category || '' : '',
        solutionKey: typeof v === 'object' ? v.solutionKey || '' : '',
        solutionName: typeof v === 'object' ? v.solutionName || '' : '',
      });
    });

    return {
      schoolWiseMap,
      flatItems,
    };
  }, [dbLoadedHardware, allFormData, project]);

  // ── 5. Extract Selected Content strictly from DB (Stage 3 Task 4) ────────
  const contentSource = useMemo(() => {
    const rawContent =
      dbLoadedContent?.contentSets ||
      dbLoadedContent ||
      allFormData?.stage3ContentData ||
      allFormData?.contentConfigData ||
      allFormData?.stage3ContentNode?.contentSets ||
      allFormData?.stage3ContentNode ||
      allFormData?.contentSets ||
      allFormData?.contentConfiguration ||
      (project as any)?.orderRequirement?.contentConfiguration?.contentSets ||
      (project as any)?.orderRequirement?.contentConfiguration ||
      {};

    const board = rawContent.board || '';
    const mediums: string[] = Array.isArray(rawContent.mediums)
      ? rawContent.mediums
      : Array.isArray(rawContent.languages)
        ? rawContent.languages
        : typeof rawContent.medium === 'string' && rawContent.medium
          ? [rawContent.medium]
          : typeof rawContent.language === 'string' && rawContent.language
            ? [rawContent.language]
            : [];

    const categories: string[] = Array.isArray(rawContent.categories)
      ? rawContent.categories
      : Array.isArray(rawContent.contents)
        ? rawContent.contents
        : [];

    const mediumClasses: Record<string, string[]> =
      rawContent.mediumClasses && typeof rawContent.mediumClasses === 'object'
        ? rawContent.mediumClasses
        : {};

    const allClasses: string[] = Array.isArray(rawContent.classes)
      ? rawContent.classes
      : Array.from(new Set(Object.values(mediumClasses).flat()));

    const sets = Array.isArray(rawContent.sets) ? rawContent.sets : [];
    const configurations = Array.isArray(rawContent.configurations) ? rawContent.configurations : [];

    const hasContent = Boolean(
      board || mediums.length > 0 || categories.length > 0 || allClasses.length > 0 || sets.length > 0
    );

    return {
      hasContent,
      board,
      mediums,
      categories,
      mediumClasses,
      allClasses,
      sets,
      configurations,
      remarks: rawContent.remarks || '',
    };
  }, [dbLoadedContent, allFormData, project]);

  // ── 6. Helper: Strictly Selected Solutions for School ─────────────────────
  const getSolutionsForSchool = useCallback(
    (school: EffectiveSchoolItem, sIdx: number) => {
      const sId = school.id;
      const sName = (school.name || '').toLowerCase().trim();

      const findInMap = (map: Record<string, any>) => {
        if (!map || typeof map !== 'object') return null;
        if (sId && map[sId]) return map[sId];
        if (map[`school-${sIdx + 1}`]) return map[`school-${sIdx + 1}`];
        if (sName && map[sName]) return map[sName];
        const matchKey = Object.keys(map).find((k) => {
          const lk = k.toLowerCase().trim();
          return lk === sId.toLowerCase().trim() || lk === sName || lk === `school-${sIdx + 1}`;
        });
        return matchKey ? map[matchKey] : null;
      };

      const candidate = findInMap(solutionsSource.schoolWiseMap);

      if (candidate && typeof candidate === 'object') {
        if (Array.isArray(candidate)) return candidate;
        const parsed = Object.entries(candidate)
          .map(([key, val]: [string, any]) => {
            if (!val) return null;
            if (typeof val === 'object') {
              if (val.selected === false) return null;
              const solKey = val.solutionKey || val.key || key;
              const solName = val.solutionName || val.name || val.label || key;
              const quantity = Number(val.quantity || val.qty) || 0;
              const plat = typeof val.platform === 'string' ? val.platform.trim() : '';
              const licCount =
                val.licenseCount !== undefined && val.licenseCount !== null && val.licenseCount !== ''
                  ? Number(val.licenseCount)
                  : quantity;
              const licDays =
                val.licenseDays !== undefined && val.licenseDays !== null && val.licenseDays !== ''
                  ? Number(val.licenseDays)
                  : (plat || licCount > 0 ? 365 : 0);

              const isLic =
                val.licenseRequired !== undefined
                  ? Boolean(val.licenseRequired)
                  : (val.isLicenseRequired !== undefined
                    ? Boolean(val.isLicenseRequired)
                    : doesSolutionRequirePlatform(solKey || solName));

              return {
                key: solKey,
                solutionKey: solKey,
                name: solName,
                solutionName: solName,
                quantity,
                platform: plat,
                licenseCount: licCount,
                licenseDays: licDays,
                licenseRequired: isLic,
                isLicenseRequired: isLic,
                targetClasses: Array.isArray(val.targetClasses)
                  ? val.targetClasses
                  : typeof val.targetClasses === 'string' && val.targetClasses
                    ? val.targetClasses.split(',').map((c: string) => c.trim()).filter(Boolean)
                    : [],
                board: val.board || '',
                notes: val.notes || '',
              };
            }
            return {
              key,
              solutionKey: key,
              name: key,
              solutionName: key,
              quantity: typeof val === 'number' ? val : 0,
              platform: '',
              licenseCount: typeof val === 'number' ? val : 0,
              licenseDays: 0,
              licenseRequired: doesSolutionRequirePlatform(key),
              isLicenseRequired: doesSolutionRequirePlatform(key),
              targetClasses: [],
              board: '',
            };
          })
          .filter(Boolean);
        if (parsed.length > 0) return parsed;
      }

      if (solutionsSource.flatList.length > 0) {
        return solutionsSource.flatList.map((sol: any) => {
          const solKey = sol.solutionKey || sol.key || '';
          const solName = sol.solutionName || sol.name || sol.label || solKey;
          const quantity = Number(sol.quantity || sol.qty) || 0;
          const plat = typeof sol.platform === 'string' ? sol.platform.trim() : '';
          const licCount =
            sol.licenseCount !== undefined && sol.licenseCount !== null && sol.licenseCount !== ''
              ? Number(sol.licenseCount)
              : quantity;
          const licDays =
            sol.licenseDays !== undefined && sol.licenseDays !== null && sol.licenseDays !== ''
              ? Number(sol.licenseDays)
              : (plat || licCount > 0 ? 365 : 0);
          const isLic =
            sol.licenseRequired !== undefined
              ? Boolean(sol.licenseRequired)
              : (sol.isLicenseRequired !== undefined
                ? Boolean(sol.isLicenseRequired)
                : doesSolutionRequirePlatform(solKey || solName));

          return {
            key: solKey,
            solutionKey: solKey,
            name: solName,
            solutionName: solName,
            quantity,
            platform: plat,
            licenseCount: licCount,
            licenseDays: licDays,
            licenseRequired: isLic,
            isLicenseRequired: isLic,
            targetClasses: sol.targetClasses || [],
            board: sol.board || '',
            notes: sol.notes || '',
          };
        });
      }

      return [];
    },
    [solutionsSource]
  );

  // ── 7. Helper: Strictly Selected Hardware for School ──────────────────────
  const getHardwareForSchool = useCallback(
    (school: EffectiveSchoolItem, sIdx: number) => {
      const sId = school.id;
      const sName = (school.name || '').toLowerCase().trim();

      const findInMap = (map: Record<string, any>) => {
        if (!map || typeof map !== 'object') return null;
        if (sId && map[sId]) return map[sId];
        if (map[`school-${sIdx + 1}`]) return map[`school-${sIdx + 1}`];
        if (sName && map[sName]) return map[sName];
        const matchKey = Object.keys(map).find((k) => {
          const lk = k.toLowerCase().trim();
          return lk === sId.toLowerCase().trim() || lk === sName || lk === `school-${sIdx + 1}`;
        });
        return matchKey ? map[matchKey] : null;
      };

      const candidate = findInMap(hardwareSource.schoolWiseMap);

      if (candidate && typeof candidate === 'object') {
        if (Array.isArray(candidate)) return candidate;
        const parsed = Object.entries(candidate)
          .map(([key, val]: [string, any]) => {
            if (!val) return null;
            if (typeof val === 'object') {
              return {
                key: val.key || val.itemKey || key,
                itemKey: val.itemKey || val.key || key,
                name: val.name || val.itemName || val.label || key,
                itemName: val.itemName || val.name || val.label || key,
                quantity: Number(val.quantity || val.qty) || 1,
                specName: val.selectedSpecName || val.specName || val.specNotes || val.specKey || '',
                category: val.category || '',
                solutionKey: val.solutionKey || '',
                solutionName: val.solutionName || '',
                notes: val.notes || val.serialNotes || '',
              };
            }
            return {
              key,
              itemKey: key,
              name: key,
              itemName: key,
              quantity: typeof val === 'number' ? val : 1,
              specName: '',
              solutionKey: '',
            };
          })
          .filter(Boolean);
        if (parsed.length > 0) return parsed;
      }

      if (hardwareSource.flatItems.length > 0) {
        return hardwareSource.flatItems;
      }

      return [];
    },
    [hardwareSource]
  );

  // Active school data for Cards View
  const currentSchoolSolutions = useMemo(() => {
    if (!currentSchool) return [];
    return getSolutionsForSchool(currentSchool, activeSchoolIndex);
  }, [getSolutionsForSchool, currentSchool, activeSchoolIndex]);

  const currentSchoolHardware = useMemo(() => {
    if (!currentSchool) return [];
    return getHardwareForSchool(currentSchool, activeSchoolIndex);
  }, [getHardwareForSchool, currentSchool, activeSchoolIndex]);

  // ── Hardware requiring license for a specific Core Backend school ───────────
  const getLicenseRequiredHardwareForSchool = useCallback(
    (coreSchool: any) => {
      const cNorm = normalizeSchoolName(coreSchool.name);
      const matchedEs = effectiveSchools.find((es) => {
        const eNorm = normalizeSchoolName(es.name);
        if (!cNorm || !eNorm) return false;
        if (cNorm === eNorm) return true;
        if (cNorm.length >= 10 && eNorm.length >= 10 && (cNorm.includes(eNorm) || eNorm.includes(cNorm))) {
          return true;
        }
        return false;
      });

      const esIndex = matchedEs ? effectiveSchools.indexOf(matchedEs) : 0;
      const targetSchool = matchedEs || {
        id: coreSchool.id || coreSchool.schoolId,
        name: coreSchool.name,
      };

      const allHw = getHardwareForSchool(targetSchool as any, esIndex >= 0 ? esIndex : 0);

      return allHw.filter((hw: any) => {
        const k = (hw.itemKey || hw.key || hw.hardwareKey || '').toUpperCase();
        const n = (hw.name || hw.itemName || '').toUpperCase();
        if (
          k.includes('MOUNT') || n.includes('MOUNT') ||
          k.includes('CABLE') || n.includes('CABLE') ||
          k.includes('STAND') || n.includes('STAND') ||
          k.includes('CHAIR') || n.includes('CHAIR') ||
          k.includes('TABLE') || n.includes('TABLE') ||
          k.includes('BATTERY') || n.includes('BATTERY') ||
          k.includes('UPS') || n.includes('UPS')
        ) {
          return false;
        }
        return (
          k.includes('IFP') || n.includes('IFP') || n.includes('INTERACTIVE') ||
          k.includes('TABLET') || n.includes('TABLET') ||
          k.includes('LAPTOP') || n.includes('LAPTOP') ||
          k.includes('SMART') || n.includes('SMART') ||
          k.includes('PC') || n.includes('COMPUTER') ||
          k.includes('DESKTOP') || n.includes('DESKTOP') ||
          k.includes('OPS') || n.includes('OPS') ||
          k.includes('DEVICE') || n.includes('DEVICE') ||
          hw.isLicenseRequired === true ||
          hw.licenseRequired === true
        );
      });
    },
    [effectiveSchools, getHardwareForSchool]
  );

  // ── Live Core API Licenses for a specific Core Backend school ───────────────
  const getLicensesForSchool = useCallback(
    (coreSchool: any) => {
      const schId = String(coreSchool.id || coreSchool.schoolId || coreSchool._id || '').toLowerCase().trim();
      const schName = normalizeSchoolName(coreSchool.name);

      const matched = coreLicenses.filter((lic: any) => {
        const licSchId = String(lic.schoolId || '').toLowerCase().trim();
        const licSchName = normalizeSchoolName(lic.schoolName || lic.registeredTo || '');
        if (schId && licSchId && (licSchId === schId || licSchId.includes(schId) || schId.includes(licSchId))) {
          return true;
        }
        if (schName && licSchName && (licSchName === schName || licSchName.includes(schName))) {
          return true;
        }
        return false;
      });

      // If only 1 school in project, all project licenses apply to this school
      if (matched.length === 0 && coreBackendSchools.length === 1 && coreLicenses.length > 0) {
        return coreLicenses;
      }

      return matched;
    },
    [coreLicenses, coreBackendSchools.length]
  );

  // ── 8. Solution to Dashboard Bulk Schema Mapper (Strictly from Input Keys) ──
  const getSolutionCodeFromKey = useCallback((sol: any): string => {
    if (!sol) return '';
    const rawKey = String(sol.solutionKey || sol.key || '').trim().toLowerCase();
    const rawName = String(sol.solutionName || sol.name || '').trim().toLowerCase();

    if (rawKey === 'smartshala' || rawKey === 'epathshala_lab') {
      return rawKey;
    }
    if (
      rawKey === 'smart_shaala' ||
      rawKey.includes('smart') ||
      rawName.includes('smart shaala') ||
      rawName.includes('smartshala') ||
      rawName.includes('ifp')
    ) {
      return 'smartshala';
    }
    if (
      rawKey.includes('epathshala') ||
      rawName.includes('epathshala') ||
      rawKey.includes('tablet') ||
      rawName.includes('tablet')
    ) {
      return 'epathshala_lab';
    }
    if (
      rawKey.includes('stem') ||
      rawKey.includes('robot') ||
      rawName.includes('stem') ||
      rawName.includes('robot')
    ) {
      return 'smartshala';
    }

    if (rawKey) {
      return rawKey.replace(/\s+/g, '_');
    }
    return rawName ? rawName.replace(/\s+/g, '_') : 'smartshala';
  }, []);

  // Helper to resolve platform from solution or hardware
  const resolvePlatform = useCallback((sol: any, schoolHardware: any[], solIdx: number): string => {
    // 1. Direct explicit platform
    const p = sol?.platform || (Array.isArray(sol?.platforms) && sol?.platforms[0]);
    if (p && typeof p === 'string' && p.trim()) {
      const lp = p.trim().toLowerCase();
      if (PLATFORM_OPTIONS.some((o) => o.value === lp)) return lp;
    }

    const sKey = String(sol?.solutionKey || sol?.key || '').toUpperCase();
    const sName = String(sol?.solutionName || sol?.name || '').toUpperCase();

    // 2. Hardware matching
    const hasIfp = schoolHardware.some((h) => {
      const k = String(h.itemKey || h.key || h.name || '').toUpperCase();
      return k.includes('IFP');
    });
    const hasOpsOrWin = schoolHardware.some((h) => {
      const k = String(h.itemKey || h.key || h.name || '').toUpperCase();
      return k.includes('OPS') || k.includes('WINDOWS') || k.includes('PC') || k.includes('COMPUTER');
    });
    const hasTablet = schoolHardware.some((h) => {
      const k = String(h.itemKey || h.key || h.name || '').toUpperCase();
      return k.includes('TABLET');
    });
    const hasAndroidLaptop = schoolHardware.some((h) => {
      const k = String(h.itemKey || h.key || h.name || '').toUpperCase();
      return k.includes('ANDROID');
    });

    if (sKey.includes('EPATHSHALA') || sName.includes('EPATHSHALA')) {
      if (hasTablet) return 'tablet';
      if (hasAndroidLaptop) return 'android_laptop';
      if (hasOpsOrWin) return 'windows';
      return 'tablet';
    }

    if (sKey.includes('SMART') || sName.includes('SMART') || sKey.includes('SHAALA')) {
      if (solIdx === 0 && hasIfp) return 'ifp';
      if (hasOpsOrWin) return 'windows';
      if (hasIfp) return 'ifp';
      return 'ifp';
    }

    if (sKey.includes('STEM') || sName.includes('STEM') || sKey.includes('ROBOT')) {
      if (hasOpsOrWin) return 'windows';
      if (hasTablet) return 'tablet';
      return 'windows';
    }

    if (solIdx === 0 && hasIfp) return 'ifp';
    if (solIdx === 1 && hasOpsOrWin) return 'windows';
    if (hasTablet) return 'tablet';
    if (hasOpsOrWin) return 'windows';
    if (hasIfp) return 'ifp';
    return 'windows';
  }, []);

  // ── Dynamic Platform Count across all schools ──
  const maxPlatforms = useMemo(() => {
    let maxCount = 0;
    effectiveSchools.forEach((sch, sIdx) => {
      const allSol = getSolutionsForSchool(sch, sIdx);
      if (allSol.length > maxCount) {
        maxCount = allSol.length;
      }
    });
    // Defaults to at least 1 platform slot so the table has platform1
    return Math.max(maxCount, 1);
  }, [effectiveSchools, getSolutionsForSchool]);

  // ── Column Data Checkpoints & Strict Sanitizers ──
  const sanitizePhoneField = useCallback((...candidates: any[]): string => {
    for (const item of candidates) {
      if (!item) continue;
      const str = String(item).trim();

      // Checkpoint 1: Specifically labeled mobile/phone pattern
      const labeled = str.match(/(?:Mobile|Phone|Tel|Cell|Contact)[\s:|-]*(\+?\d[\d\s-]{8,14}\d)/i);
      if (labeled && labeled[1]) {
        const digits = labeled[1].replace(/\D/g, '');
        if (digits.length === 10) return digits;
        if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
        if (digits.length > 10) return digits.slice(-10);
      }

      // Checkpoint 2: Standard 10-digit mobile number starting with 6-9
      const standard = str.match(/(?:\+91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})/);
      if (standard && standard[1]) {
        const digits = standard[1].replace(/\D/g, '');
        if (digits.length === 10) return digits;
      }

      // Checkpoint 3: Pure digit string of 10-12 digits without letters, pipes, or emails
      if (!str.includes('|') && !str.includes('@') && !/[a-zA-Z]/.test(str)) {
        const digits = str.replace(/\D/g, '');
        if (digits.length === 10) return digits;
        if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
      }
    }
    // Checkpoint rule: If no clean phone number exists, NEVER return raw text/metadata!
    return '';
  }, []);

  const sanitizeEmailField = useCallback((...candidates: any[]): string => {
    for (const item of candidates) {
      if (!item) continue;
      const str = String(item).trim();
      const match = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (match && match[1]) {
        return match[1].toLowerCase().trim();
      }
    }
    // Checkpoint rule: Only valid email format allowed
    return '';
  }, []);

  const sanitizeNameField = useCallback((raw: any, fallbackIndex: number): string => {
    if (!raw) return `School ${fallbackIndex + 1}`;
    let str = String(raw).trim();
    // Strip any trailing pipe sections (e.g. "| POC: ...")
    str = str.replace(/\|\s*(?:Mobile|Phone|Email|POC|Principal).*$/i, '').trim();
    return str || `School ${fallbackIndex + 1}`;
  }, []);

  const sanitizeAddressField = useCallback((raw: any): string => {
    if (!raw) return '';
    let str = String(raw).trim();
    // Strip any trailing contact pipes or email strings
    str = str.replace(/\|\s*(?:Mobile|Phone|Email|POC|Principal).*$/i, '').trim();
    str = str.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '').trim();
    str = str.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim();
    return str;
  }, []);

  const sanitizeBlockField = useCallback((block: any, address?: string, district?: string): string => {
    if (block && typeof block === 'string') {
      const clean = block.trim();
      if (clean.length > 0 && clean.length <= 35 && !clean.includes('@') && !clean.includes('|')) {
        return clean;
      }
    }
    const addr = String(address || '');
    const m = addr.match(/(Sector\s*\d+[A-Za-z]?|Knowledge\s*Park(?:\s*[IVXLCDM]+)?|Block\s*[A-Za-z0-9]+|Ward\s*\d+)/i);
    if (m && m[1]) return m[1].trim();

    if (district && typeof district === 'string' && district.length <= 30 && !district.includes('@')) {
      return district.trim();
    }
    return '';
  }, []);

  const sanitizeCityField = useCallback((city: any, address?: string, district?: string): string => {
    if (city && typeof city === 'string') {
      const clean = city.trim();
      if (clean.length > 0 && clean.length <= 30 && !clean.includes('@') && !clean.includes('|')) {
        return clean;
      }
    }
    const addr = String(address || '').toLowerCase();
    if (addr.includes('greater noida')) return 'Greater Noida';
    if (addr.includes('noida')) return 'Noida';
    if (addr.includes('jaipur')) return 'Jaipur';
    if (addr.includes('delhi')) return 'Delhi';
    if (addr.includes('gurugram') || addr.includes('gurgaon')) return 'Gurugram';
    if (addr.includes('lucknow')) return 'Lucknow';

    if (district && typeof district === 'string' && district.length <= 30 && !district.includes('@')) {
      return district.trim();
    }
    return '';
  }, []);

  const sanitizeStateField = useCallback((state: any, address?: string): string => {
    if (state && typeof state === 'string') {
      const clean = state.trim();
      if (clean.length > 0 && clean.length <= 30 && !clean.includes('@') && !clean.includes('|')) {
        return clean;
      }
    }
    const addr = String(address || '').toLowerCase();
    if (addr.includes('uttar pradesh')) return 'Uttar Pradesh';
    if (addr.includes('rajasthan')) return 'Rajasthan';
    if (addr.includes('delhi')) return 'Delhi';
    if (addr.includes('haryana')) return 'Haryana';
    if (addr.includes('maharashtra')) return 'Maharashtra';
    return '';
  }, []);

  const sanitizeCountField = useCallback((val: any): number => {
    if (typeof val === 'number') return Math.max(0, Math.floor(val));
    const str = String(val || '').replace(/\D/g, '');
    const parsed = parseInt(str, 10);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, []);

  const sanitizeCoordinatorField = useCallback((raw: any, schoolId?: string, fallbackIdx: number = 0): string => {
    if (raw && typeof raw === 'string') {
      const clean = raw.trim();
      if (clean.length > 0 && clean.length <= 30 && !clean.includes('@') && !clean.includes('|') && !clean.includes(' ')) {
        return clean;
      }
    }
    if (schoolId && typeof schoolId === 'string') {
      const cleanId = schoolId.trim();
      if (cleanId.length > 0 && cleanId.length <= 30 && !cleanId.includes('@') && !cleanId.includes(' ')) {
        return cleanId;
      }
    }
    return `COORD-${fallbackIdx + 1}`;
  }, []);

  // ── 9. Compute Default Table Rows strictly with Checkpoints ──
  const computedDefaultRows = useMemo<SchoolLicenseTableRow[]>(() => {
    const projName = currentProject?.projectName || currentProject?.title || '';
    const projEmail = currentProject?.email || '';
    const projPhone = currentProject?.phone || '';
    const projAddress = currentProject?.address || '';
    const projId = currentProject?.projectId || currentProject?._id || '';

    return effectiveSchools.map((sch, sIdx) => {
      const allSol = getSolutionsForSchool(sch, sIdx);
      const schoolHardware = getHardwareForSchool(sch, sIdx);

      const raw = (sch as any)?.rawSchool || (sch as any)?.school || {};
      const sSurvey = (sch as any)?.survey || (raw as any)?.survey || {};

      // Checkpoint 1: School Name (Clean school name, fallback to project title only if no school name exists)
      let rawSchoolName = (sch.name || raw.name || raw.schoolName || '').trim();
      if (rawSchoolName.includes('(') && rawSchoolName.endsWith(')')) {
        rawSchoolName = rawSchoolName.replace(/\s*\([A-Za-z0-9_-]+\)$/, '').trim();
      }
      const fallbackSchoolName = effectiveSchools.length > 1 ? `${projName} (School ${sIdx + 1})` : projName;
      const name = sanitizeNameField(rawSchoolName || fallbackSchoolName, sIdx);

      // Checkpoint 2: School Email (Strictly valid email pattern only: prioritize school email / poc email)
      const email = sanitizeEmailField(sch.email, raw.email, raw.contactEmail, sSurvey.email, projEmail);

      // Checkpoint 3: Phone (Strictly pure digits phone only, NO names or metadata)
      const phone = sanitizePhoneField(sch.phone, raw.phone, raw.contactPhone, sSurvey.phone, projPhone);

      // Checkpoint 4: School POC Type & POC Name
      const pocType = String(
        sch.pocType ||
        sch.pocDesignation ||
        raw.pocDesignation ||
        sSurvey.pocDesignation ||
        raw.pocType ||
        (sch.pocName ? 'School Coordinator' : '') ||
        'Coordinator'
      ).trim();

      const pocName = String(
        sch.pocName ||
        raw.pocName ||
        sSurvey.pocName ||
        raw.contactPerson ||
        ''
      ).trim();

      // Checkpoint 5: Address (Clean address only)
      const address = sanitizeAddressField(sch.address || raw.address || sSurvey.address || projAddress);

      // Checkpoint 6: Block (Clean block name only)
      const block = sanitizeBlockField(
        sch.block || raw.block || raw.blockName || sSurvey.block,
        address,
        sch.district || raw.district
      );

      // Checkpoint 7: State (Clean state only)
      const state = sanitizeStateField(
        sch.state || raw.state || sSurvey.state,
        address
      );

      // Checkpoint 8: City (Clean city only)
      const city = sanitizeCityField(
        sch.city || raw.city || raw.district || sch.district || sSurvey.city || sSurvey.district,
        address,
        sch.district || raw.district
      );

      // Checkpoint 9: Number of Students (Non-negative integer only)
      const numberOfStudents = sanitizeCountField(
        sch.numberOfStudents ||
        raw.numberOfStudents ||
        raw.totalStudents ||
        raw.studentCount ||
        sSurvey.totalStudents ||
        sSurvey.numberOfStudents
      );

      // Checkpoint 10: Number of Teachers (Non-negative integer only)
      const numberOfTeachers = sanitizeCountField(
        sch.numberOfTeachers ||
        raw.numberOfTeachers ||
        raw.totalTeachers ||
        raw.teacherCount ||
        sSurvey.totalTeachers ||
        sSurvey.numberOfTeachers
      );

      // Checkpoint 11: Coordinator ID (Clean ID only)
      const coordinatorId = sanitizeCoordinatorField(
        sch.coordinatorId || raw.coordinatorId || raw.schoolId,
        projId || sch.schoolId,
        sIdx
      );

      const row: SchoolLicenseTableRow = {
        id: sch.id || `school-${sIdx + 1}`,
        name,
        email,
        phone,
        pocType,
        pocName,
        address,
        block,
        state,
        city,
        numberOfStudents,
        numberOfTeachers,
        coordinatorId,
      };

      for (let i = 1; i <= maxPlatforms; i++) {
        const sol = allSol[i - 1];
        if (sol) {
          const plat = resolvePlatform(sol, schoolHardware, i - 1);
          let licCount = sanitizeCountField(sol.licenseCount);
          if (licCount <= 0) {
            licCount = sanitizeCountField(sol.quantity || sol.qty);
          }
          if (licCount <= 0) {
            const hwMatch = schoolHardware.find((h) => {
              const k = String(h.itemKey || h.key || h.name || '').toUpperCase();
              if (plat === 'ifp' && k.includes('IFP')) return true;
              if (plat === 'windows' && (k.includes('OPS') || k.includes('PC'))) return true;
              if (plat === 'tablet' && k.includes('TABLET')) return true;
              return false;
            });
            licCount = hwMatch ? sanitizeCountField(hwMatch.quantity) : 1;
            if (licCount <= 0) licCount = 1;
          }

          const licDays = sanitizeCountField(sol.licenseDays) > 0 ? sanitizeCountField(sol.licenseDays) : 365;
          const solCode = getSolutionCodeFromKey(sol);

          row[`platform${i}`] = plat;
          row[`licenseCount${i}`] = licCount;
          row[`licenseDays${i}`] = licDays;
          row[`solution${i}`] = solCode;
        } else {
          row[`platform${i}`] = '';
          row[`licenseCount${i}`] = 0;
          row[`licenseDays${i}`] = 0;
          row[`solution${i}`] = '';
        }
      }

      return row;
    });
  }, [
    effectiveSchools,
    getSolutionsForSchool,
    getHardwareForSchool,
    maxPlatforms,
    getSolutionCodeFromKey,
    resolvePlatform,
    sanitizeNameField,
    sanitizeAddressField,
    sanitizeEmailField,
    sanitizePhoneField,
    sanitizeBlockField,
    sanitizeStateField,
    sanitizeCityField,
    sanitizeCountField,
    sanitizeCoordinatorField,
    currentProject
  ]);

  // Strictly Read-Only Table Rows (Derived directly from previous stages)
  const rows: SchoolLicenseTableRow[] = computedDefaultRows;

  // ── 10. Dynamic Export CSV Utility ──────────────────────────────────────
  const handleDownloadCSV = useCallback(() => {
    const headers = [
      'name',
      'email',
      'phone',
      'pocType',
      'address',
      'block',
      'state',
      'city',
      'numberOfStudents',
      'numberOfTeachers',
      'coordinatorId',
    ];

    for (let i = 1; i <= maxPlatforms; i++) {
      headers.push(`platform${i}`, `licenseCount${i}`, `licenseDays${i}`, `solution${i}`);
    }

    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.join(','),
      ...rows.map((r) => {
        const rowCells = [
          escapeCsv(r.name),
          escapeCsv(r.email),
          escapeCsv(r.phone),
          escapeCsv(r.pocType),
          escapeCsv(r.address),
          escapeCsv(r.block),
          escapeCsv(r.state),
          escapeCsv(r.city),
          r.numberOfStudents ?? 0,
          r.numberOfTeachers ?? 0,
          escapeCsv(r.coordinatorId),
        ];

        for (let i = 1; i <= maxPlatforms; i++) {
          const plat = r[`platform${i}`] || '';
          const licCount = r[`licenseCount${i}`];
          const licDays = r[`licenseDays${i}`];
          const sol = r[`solution${i}`] || '';
          rowCells.push(
            escapeCsv(plat),
            licCount > 0 ? licCount : (plat ? 0 : ''),
            licDays > 0 ? licDays : (plat ? 365 : ''),
            escapeCsv(sol)
          );
        }

        return rowCells.join(',');
      }),
    ];

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schools_licenses_bulk_${currentProject?.projectName || project?.projectName || 'export'}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [rows, maxPlatforms, currentProject?.projectName, project?.projectName]);

  // Filtered rows for Search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase().trim();
    return rows.filter((r) => {
      if (
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      ) {
        return true;
      }
      for (let i = 1; i <= maxPlatforms; i++) {
        if (
          String(r[`platform${i}`] || '').toLowerCase().includes(q) ||
          String(r[`solution${i}`] || '').toLowerCase().includes(q)
        ) {
          return true;
        }
      }
      return false;
    });
  }, [rows, searchQuery, maxPlatforms]);

  // Dynamic summary counts across active platforms
  const totalLicensesCount = useMemo(() => {
    return rows.reduce((sum, r) => {
      let rowLicenses = 0;
      for (let i = 1; i <= maxPlatforms; i++) {
        rowLicenses += Number(r[`licenseCount${i}`]) || 0;
      }
      return sum + rowLicenses;
    }, 0);
  }, [rows, maxPlatforms]);

  const totalStudentsCount = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.numberOfStudents) || 0), 0);
  }, [rows]);

  // Loading state while querying MongoDB
  if (loadingDb && effectiveSchools.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-2">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#51a8b1]" />
        <p className="text-xs font-semibold">Loading data from database...</p>
      </div>
    );
  }

  // Pure Empty State if no schools in DB
  if (effectiveSchools.length === 0 || !currentSchool) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-2 font-sans select-none shadow-2xs">
        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
          <School className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Schools Found</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please configure schools in Stage 3 Task 1 (School Information).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans select-none">
      {/* ── Top Bar: View Mode Switcher & Quick Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#51a8b1]/10 text-[#2d6b73] flex items-center justify-center font-bold shrink-0">
            {viewMode === 'table' ? (
              <TableIcon className="w-4.5 h-4.5" />
            ) : (
              <LayoutGrid className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                School & License Creation
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#1c4d52] border border-[#b6e0e4]">
                {rows.length} {rows.length === 1 ? 'School' : 'Schools'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                Read-only
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {viewMode === 'table'
                ? 'Bulk CSV format matching Dashboard school creation schema'
                : 'Detailed school breakdown with solutions, hardware, and content'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'table'
                ? 'bg-white text-[#2d6b73] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${viewMode === 'cards'
                ? 'bg-white text-[#2d6b73] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards View
            </button>
          </div>

          {/* Export CSV Button Only */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Download CSV file (18 columns schema)"
            className="px-3.5 py-1.5 rounded-xl bg-[#3a7d84] hover:bg-[#2d6268] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW 1: TABLE VIEW (BULK CSV FORMAT)                    ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="space-y-3">
          {/* Controls & Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <School className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">
                  Total Schools
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {rows.length}
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">
                  Total Licenses
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {totalLicensesCount}
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10.5px] font-bold text-slate-400 uppercase">
                  Total Students
                </div>
                <div className="text-base font-extrabold text-slate-800">
                  {totalStudentsCount}
                </div>
              </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
              <input
                type="text"
                placeholder="Search school, city, state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-700 placeholder-slate-400 outline-none bg-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 px-1 font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Main Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#3a7d84]" />
                <span className="text-xs font-bold text-slate-800">
                  Bulk School & Platform License Grid
                </span>
                <span className="text-[10.5px] font-mono text-slate-400">
                  ({11 + maxPlatforms * 4} columns schema)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                {Array.from({ length: maxPlatforms }).map((_, idx) => {
                  const pNum = idx + 1;
                  const theme = PLATFORM_COLOR_THEMES[idx % PLATFORM_COLOR_THEMES.length];
                  return (
                    <div key={pNum} className="flex items-center gap-1.5">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${theme.badgeDot}`}></span>
                      <span>Platform {pNum}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[1200px]">
                <thead>
                  {/* Column Group Header */}
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="p-2.5 bg-slate-100 text-center w-12 border-r border-slate-200">#</th>
                    <th colSpan={11} className="p-2.5 bg-slate-100/70 border-r border-slate-200 text-slate-700">
                      🏫 School Demographic Information (11 Columns)
                    </th>
                    {Array.from({ length: maxPlatforms }).map((_, idx) => {
                      const pNum = idx + 1;
                      const theme = PLATFORM_COLOR_THEMES[idx % PLATFORM_COLOR_THEMES.length];
                      const isLast = idx === maxPlatforms - 1;
                      return (
                        <th
                          key={pNum}
                          colSpan={4}
                          className={`p-2.5 ${theme.groupBg} ${!isLast ? 'border-r ' + theme.groupBorder : ''} ${theme.groupText}`}
                        >
                          💻 Platform {pNum} License (4 Columns)
                        </th>
                      );
                    })}
                  </tr>

                  {/* Individual Column Header */}
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700">
                    <th className="p-2.5 text-center border-r border-slate-200 text-slate-400">#</th>

                    {/* 1. name */}
                    <th className="p-2.5 min-w-[200px]">
                      <div>School Name *</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">name</div>
                    </th>

                    {/* 2. email */}
                    <th className="p-2.5 min-w-[180px]">
                      <div>School Email</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">email</div>
                    </th>

                    {/* 3. phone */}
                    <th className="p-2.5 min-w-[120px]">
                      <div>Phone</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">phone</div>
                    </th>

                    {/* 4. pocType */}
                    <th className="p-2.5 min-w-[160px]">
                      <div>School POC Type</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">pocType</div>
                    </th>

                    {/* 5. address */}
                    <th className="p-2.5 min-w-[180px]">
                      <div>Address</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">address</div>
                    </th>

                    {/* 6. block */}
                    <th className="p-2.5 min-w-[100px]">
                      <div>Block</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">block</div>
                    </th>

                    {/* 7. state */}
                    <th className="p-2.5 min-w-[120px]">
                      <div>State</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">state</div>
                    </th>

                    {/* 8. city */}
                    <th className="p-2.5 min-w-[120px]">
                      <div>City</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">city</div>
                    </th>

                    {/* 9. numberOfStudents */}
                    <th className="p-2.5 min-w-[90px] text-center">
                      <div>Students</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">numberOfStudents</div>
                    </th>

                    {/* 10. numberOfTeachers */}
                    <th className="p-2.5 min-w-[90px] text-center">
                      <div>Teachers</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">numberOfTeachers</div>
                    </th>

                    {/* 11. coordinatorId */}
                    <th className="p-2.5 min-w-[120px] border-r border-slate-200">
                      <div>Coordinator ID</div>
                      <div className="text-[9.5px] font-mono text-slate-400 font-normal">coordinatorId</div>
                    </th>

                    {/* Dynamic Platform Headers */}
                    {Array.from({ length: maxPlatforms }).map((_, idx) => {
                      const pNum = idx + 1;
                      const theme = PLATFORM_COLOR_THEMES[idx % PLATFORM_COLOR_THEMES.length];
                      const isLast = idx === maxPlatforms - 1;
                      return (
                        <React.Fragment key={pNum}>
                          <th className={`p-2.5 min-w-[120px] ${theme.groupBg}/50`}>
                            <div>Platform {pNum}</div>
                            <div className={`text-[9.5px] font-mono ${theme.groupText} font-normal`}>platform{pNum}</div>
                          </th>
                          <th className={`p-2.5 min-w-[90px] text-center ${theme.groupBg}/50`}>
                            <div>Licenses {pNum}</div>
                            <div className={`text-[9.5px] font-mono ${theme.groupText} font-normal`}>licenseCount{pNum}</div>
                          </th>
                          <th className={`p-2.5 min-w-[80px] text-center ${theme.groupBg}/50`}>
                            <div>Days {pNum}</div>
                            <div className={`text-[9.5px] font-mono ${theme.groupText} font-normal`}>licenseDays{pNum}</div>
                          </th>
                          <th className={`p-2.5 min-w-[130px] ${theme.groupBg}/50 ${!isLast ? 'border-r ' + theme.groupBorder : ''}`}>
                            <div>Solution {pNum}</div>
                            <div className={`text-[9.5px] font-mono ${theme.groupText} font-normal`}>solution{pNum}</div>
                          </th>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={12 + maxPlatforms * 4} className="p-8 text-center text-slate-400 text-xs">
                        No schools match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => {
                      const origIdx = rows.findIndex((r) => r.id === row.id);
                      const activeIdx = origIdx >= 0 ? origIdx : rIdx;

                      return (
                        <tr
                          key={row.id || activeIdx}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* # Index */}
                          <td className="p-2 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 bg-slate-50/40">
                            {activeIdx + 1}
                          </td>

                          {/* 1. Name */}
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-xs">
                                {row.name || <span className="text-slate-300 font-normal">—</span>}
                              </span>
                              {row.pocName && (
                                <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                                  POC: {row.pocName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Email */}
                          <td className="px-3 py-2 font-mono text-slate-700 text-xs">
                            {row.email ? (
                              <span className="text-slate-800 font-medium">{row.email}</span>
                            ) : (
                              <span className="text-slate-300 font-sans">—</span>
                            )}
                          </td>

                          {/* 3. Phone */}
                          <td className="px-3 py-2 font-mono text-slate-700 text-xs">
                            {row.phone ? (
                              <span className="text-slate-800">{row.phone}</span>
                            ) : (
                              <span className="text-slate-300 font-sans">—</span>
                            )}
                          </td>

                          {/* 4. POC Type */}
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {row.pocType ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                {row.pocType}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-sans">—</span>
                            )}
                          </td>

                          {/* 5. Address */}
                          <td className="px-3 py-2 text-slate-700 text-xs max-w-[220px] truncate" title={row.address}>
                            {row.address || <span className="text-slate-300">—</span>}
                          </td>

                          {/* 6. Block */}
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {row.block || <span className="text-slate-300">—</span>}
                          </td>

                          {/* 7. State */}
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {row.state || <span className="text-slate-300">—</span>}
                          </td>

                          {/* 8. City */}
                          <td className="px-3 py-2 text-slate-700 text-xs">
                            {row.city || <span className="text-slate-300">—</span>}
                          </td>

                          {/* 9. numberOfStudents */}
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-800 text-xs">
                            {row.numberOfStudents ?? 0}
                          </td>

                          {/* 10. numberOfTeachers */}
                          <td className="px-3 py-2 text-center font-mono font-bold text-slate-800 text-xs">
                            {row.numberOfTeachers ?? 0}
                          </td>

                          {/* 11. coordinatorId */}
                          <td className="px-3 py-2 font-mono text-slate-700 text-xs border-r border-slate-200">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                              {row.coordinatorId || '—'}
                            </span>
                          </td>

                          {/* Dynamic Platform Columns Cells */}
                          {Array.from({ length: maxPlatforms }).map((_, idx) => {
                            const pNum = idx + 1;
                            const theme = PLATFORM_COLOR_THEMES[idx % PLATFORM_COLOR_THEMES.length];
                            const isLast = idx === maxPlatforms - 1;
                            const platKey = `platform${pNum}`;
                            const licCountKey = `licenseCount${pNum}`;
                            const licDaysKey = `licenseDays${pNum}`;
                            const solKey = `solution${pNum}`;

                            const plat = row[platKey] || '';
                            const licCount = Number(row[licCountKey]) || 0;
                            const licDays = Number(row[licDaysKey]) || 0;
                            const sol = row[solKey] || '';

                            return (
                              <React.Fragment key={pNum}>
                                {/* Platform Badge */}
                                <td className={`px-3 py-2 ${theme.cellBg}`}>
                                  {plat ? (
                                    <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[11px] bg-white border ${theme.selectBorder} ${theme.selectText} shadow-2xs`}>
                                      {PLATFORM_LABELS[plat as LicensePlatform] || plat}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </td>

                                {/* License Count */}
                                <td className={`px-3 py-2 text-center ${theme.cellBg}`}>
                                  {licCount > 0 ? (
                                    <span className={`font-mono font-bold text-xs ${theme.selectText}`}>
                                      {licCount}
                                    </span>
                                  ) : plat ? (
                                    <span className="font-mono text-xs text-slate-400">0</span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </td>

                                {/* License Days */}
                                <td className={`px-3 py-2 text-center ${theme.cellBg}`}>
                                  {licDays > 0 ? (
                                    <span className="font-mono text-xs text-slate-600 font-medium">
                                      {licDays}
                                    </span>
                                  ) : plat ? (
                                    <span className="font-mono text-xs text-slate-400">365</span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </td>

                                {/* Solution Badge */}
                                <td className={`px-3 py-2 ${theme.cellBg} ${!isLast ? 'border-r ' + theme.borderR : ''}`}>
                                  {sol ? (
                                    <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[11px] bg-white border border-slate-200 text-slate-700 shadow-2xs">
                                      {sol}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 font-mono">—</span>
                                  )}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ── TABLE 2: ARE SCHOOLS CREATED ON DASHBOARD? (VERIFICATION) ── */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Header: Core Backend Schools Toolbar */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-800 font-heading">
                  Are schools created on dashboard?
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800">
                  {matchedCoreSchools.length} {matchedCoreSchools.length === 1 ? 'School' : 'Schools'}
                </span>
                {verifiedSchoolKeys.length > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    ✓ {verifiedSchoolKeys.length} of {effectiveSchools.length} Verified
                  </span>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Refresh Live Schools from Core API */}
                <button
                  type="button"
                  onClick={fetchCoreBackendSchools}
                  disabled={loadingCoreSchools}
                  className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5 font-bold"
                  title="Refresh schools from Core API"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCoreSchools ? 'animate-spin text-[#3a7d84]' : 'text-slate-600'}`} />
                  <span className="text-[11px]">Refresh</span>
                </button>

                {/* Search Bar for Core Schools */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={coreSearchQuery}
                    onChange={(e) => setCoreSearchQuery(e.target.value)}
                    placeholder="Search school or address..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d84] w-48 sm:w-56"
                  />
                  {coreSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCoreSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                    {/* 1. Row # */}
                    <th className="p-2.5 text-center w-12 border-r border-slate-200 text-slate-500 font-bold">#</th>

                    {/* 2. School Details */}
                    <th className="p-2.5 min-w-[260px] border-r border-slate-200">
                      <div className="font-heading text-slate-900 font-bold">School Details</div>
                      <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">name & code from core backend</div>
                    </th>

                    {/* 3. School Address */}
                    <th className="p-2.5 min-w-[280px] border-r border-slate-200">
                      <div className="font-heading text-slate-900 font-bold">Address & Location</div>
                      <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">address, city, state from core backend</div>
                    </th>

                    {/* 4. Contact / POC */}
                    <th className="p-2.5 min-w-[200px] border-r border-slate-200">
                      <div className="font-heading text-slate-900 font-bold">Contact Details</div>
                      <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">phone, email & poc</div>
                    </th>

                    {/* 5. Verify / Stage Completion (Tick ka mark krne wala) */}
                    <th className="p-2.5 text-center w-28">
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isAllVerified}
                          onChange={handleToggleAllSchools}
                          disabled={coreBackendSchools.length === 0 || completingStage}
                          className="w-3.5 h-3.5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          title="Verify all matching schools"
                        />
                        <span className="font-heading font-bold">Verify</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loadingCoreSchools ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#51a8b1]" />
                          <span>Fetching schools from Core Backend API...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCoreSchools.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 px-4 text-center text-xs">
                        <div className="max-w-md mx-auto space-y-1.5">
                          <p className="font-semibold text-slate-700 text-sm font-heading">
                            {coreSearchQuery
                              ? 'No matching schools found'
                              : 'Schools are not created on the dashboard yet'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {coreSearchQuery
                              ? 'Try adjusting your search query.'
                              : 'Schools have not been created on the dashboard for this project.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCoreSchools.map((cs, cIdx) => {
                      const schoolKey = cs.id || cs.schoolId || cs.name;
                      const isVerified = verifiedSchoolKeys.includes(schoolKey);

                      return (
                        <tr
                          key={cs.id || cIdx}
                          className={`hover:bg-slate-50/80 transition-colors ${isVerified ? 'bg-emerald-50/20' : ''
                            }`}
                        >
                          {/* 1. Row # */}
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 bg-slate-50/40">
                            {cIdx + 1}
                          </td>

                          {/* 2. School Details */}
                          <td className="px-3 py-2.5 border-r border-slate-100">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isVerified ? 'bg-emerald-500' : 'bg-[#51a8b1]'}`}></span>
                                <span className="font-bold text-slate-900 text-xs">{cs.name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                                {cs.schoolId && (
                                  <span className="font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200">
                                    ID: {cs.schoolId}
                                  </span>
                                )}
                                {(cs.city || cs.state) && (
                                  <span>
                                    {[cs.city, cs.state].filter(Boolean).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Address & Location from Core Backend */}
                          <td className="px-3 py-2.5 border-r border-slate-100">
                            <div className="space-y-0.5 max-w-[340px]">
                              {cs.address ? (
                                <div className="text-[11px] text-slate-700 font-medium">
                                  {cs.address}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Address not available</span>
                              )}
                              <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                {cs.city && <span>City: <strong className="text-slate-700">{cs.city}</strong></span>}
                                {cs.state && <span>State: <strong className="text-slate-700">{cs.state}</strong></span>}
                              </div>
                            </div>
                          </td>

                          {/* 4. Contact Details from Core Backend */}
                          <td className="px-3 py-2.5 border-r border-slate-100">
                            <div className="space-y-0.5 text-[11px]">
                              {cs.phone && (
                                <div className="text-slate-700 font-mono">
                                  📞 {cs.phone}
                                </div>
                              )}
                              {cs.email && (
                                <div className="text-slate-600 truncate max-w-[200px]" title={cs.email}>
                                  ✉️ {cs.email}
                                </div>
                              )}
                              {cs.pocName && (
                                <div className="text-slate-500 text-[10px]">
                                  POC: {cs.pocName}
                                </div>
                              )}
                              {!cs.phone && !cs.email && !cs.pocName && (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </div>
                          </td>

                          {/* 5. Verify / Confirm (Tick ka mark krne wala) */}
                          <td className="px-3 py-2.5 text-center w-28">
                            <button
                              type="button"
                              onClick={() => handleToggleSchool(schoolKey)}
                              disabled={completingStage}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${isVerified
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                  : 'bg-white border-2 border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600'
                                }`}
                              title={isVerified ? 'Verified: School created on Core Dashboard' : 'Click to verify school is created on Core Dashboard'}
                            >
                              <Check
                                className={`w-4 h-4 stroke-[2.5] ${isVerified ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'
                                  }`}
                              />
                              <span>{isVerified ? 'Verified' : 'Verify'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ── VIEW 2: CARDS VIEW (ORIGINAL BREAKDOWN)                 ── */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* ── 1. SCHOOLS: Institutional School Master Selector ── */}
          <InstitutionalSchoolSelector
            schools={effectiveSchools}
            activeIndex={activeSchoolIndex}
            onSelectIndex={setActiveSchoolIndex}
            activeItemCount={currentSchoolSolutions.length}
            itemTypeLabel="Solutions"
            totalAcrossSchoolsText={`${effectiveSchools.length} ${effectiveSchools.length === 1 ? 'School' : 'Schools'
              }`}
            getItemCountForSchool={(schoolId, idx) => {
              const sch = effectiveSchools[idx];
              if (!sch) return 0;
              return getSolutionsForSchool(sch, idx).length;
            }}
            disabled={disabled}
          />

          {/* ── 2. SELECTED SOLUTIONS ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3a7d84]" />
                <h4 className="text-sm font-bold text-slate-800">Selected Solutions</h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[#2d6b73]">
                {currentSchoolSolutions.length}
              </span>
            </div>

            <div className="p-4">
              {currentSchoolSolutions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No solutions selected for this school.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentSchoolSolutions.map((sol: any, idx: number) => {
                    const solName =
                      sol.name ||
                      sol.solutionName ||
                      sol.label ||
                      sol.key ||
                      `Solution #${idx + 1}`;
                    const solKey = sol.solutionKey || sol.key || '';
                    const qty = sol.quantity || sol.qty || 1;
                    const targetClasses = Array.isArray(sol.targetClasses)
                      ? sol.targetClasses
                      : [];
                    const board = sol.board || '';
                    const plat = sol.platform || '';
                    const licCount = sol.licenseCount ?? qty;

                    return (
                      <div
                        key={solKey || idx}
                        className="p-3 rounded-xl border border-slate-200 bg-[#f8fafb] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-xs text-slate-900 leading-snug">
                            {solName}
                          </div>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                            {qty} {qty === 1 ? 'Lab' : 'Labs'}
                          </span>
                        </div>

                        {plat && (
                          <div className="flex items-center gap-1.5 text-[10.5px]">
                            <span className="px-1.5 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                              Platform: {PLATFORM_LABELS[plat as LicensePlatform] || plat}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                              Licenses: {licCount}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {board && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-bold">
                              {board}
                            </span>
                          )}
                          {targetClasses.map((cls: string, cIdx: number) => (
                            <span
                              key={cIdx}
                              className="text-[9.5px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium"
                            >
                              {cls}
                            </span>
                          ))}
                        </div>

                        {sol.notes && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2 pt-1 border-t border-slate-200">
                            {sol.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── 3. SELECTED HARDWARE ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#3a7d84]" />
                <h4 className="text-sm font-bold text-slate-800">Selected Hardware</h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[#2d6b73]">
                {currentSchoolHardware.length}
              </span>
            </div>

            <div className="p-4">
              {currentSchoolHardware.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No hardware selected for this school.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentSchoolHardware.map((item: any, idx: number) => {
                    const itemName =
                      item.name || item.itemName || item.key || `Hardware #${idx + 1}`;
                    const itemKey = item.itemKey || item.key || '';
                    const qty = item.quantity || item.qty || 1;
                    const spec =
                      item.selectedSpecName || item.specName || item.specNotes || '';

                    return (
                      <div
                        key={itemKey || idx}
                        className="p-3 rounded-xl border border-slate-200 bg-[#f8fafb] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-bold text-xs text-slate-900 leading-snug">
                            {itemName}
                          </div>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0">
                            {qty} {qty === 1 ? 'Unit' : 'Units'}
                          </span>
                        </div>

                        {spec && (
                          <div className="text-[11px] font-mono text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                            {spec}
                          </div>
                        )}

                        {item.solutionName && (
                          <div className="text-[10.5px] text-slate-500 pt-0.5">
                            For: <strong>{item.solutionName}</strong>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── 4. SELECTED CONTENT ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3a7d84]" />
                <h4 className="text-sm font-bold text-slate-800">Selected Content</h4>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[#2d6b73]">
                {contentSource.hasContent ? 'Configured' : 'Empty'}
              </span>
            </div>

            <div className="p-4">
              {!contentSource.hasContent ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No content configured.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {contentSource.board && (
                      <div className="px-3 py-1.5 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] text-xs font-bold text-[#1c4d52]">
                        Board: {contentSource.board}
                      </div>
                    )}
                    {contentSource.mediums.map((med: string, mIdx: number) => (
                      <div
                        key={mIdx}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        Medium: {med}
                      </div>
                    ))}
                    {contentSource.categories.map((cat: string, cIdx: number) => (
                      <div
                        key={cIdx}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700"
                      >
                        Category: {cat}
                      </div>
                    ))}
                  </div>

                  {Object.keys(contentSource.mediumClasses).length > 0 && (
                    <div className="space-y-2 pt-1">
                      {Object.entries(contentSource.mediumClasses).map(
                        ([med, clsList]: [string, any]) => (
                          <div
                            key={med}
                            className="bg-[#f8fafb] p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap"
                          >
                            <span className="text-xs font-bold text-slate-800">
                              {med}:
                            </span>
                            {Array.isArray(clsList) &&
                              clsList.map((cls: string, cIdx: number) => (
                                <span
                                  key={cIdx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium"
                                >
                                  {cls}
                                </span>
                              ))}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {contentSource.remarks && (
                    <p className="text-xs text-slate-500 italic pt-1">
                      Note: {contentSource.remarks}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolAndLicenseCreationSection;
