'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu,
  Layers,
  School,
  Loader2,
  Download,
  Search,
  Key,
  Users,
  Building2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Upload,
  FileCheck,
  Smartphone,
  Monitor
} from 'lucide-react';
import { IProject } from '../../../types/project';
import { schoolsApi } from '../../../lib/api/schools.api';
import { timelineApi } from '../../../lib/api/timeline.api';
import { projectsApi } from '../../../lib/api/projects.api';
import { licensesApi } from '../../../lib/api/licenses.api';
import { AppBuildUploadSection } from './AppBuildUploadSection';
import { EffectiveSchoolItem, extractEffectiveSchools } from '../utils/formHelpers';

interface TechProjectConfigSectionProps {
  value?: any;
  onChange: (val: any) => void;
  disabled?: boolean;
  project?: IProject | null;
  allFormData?: Record<string, any>;
  schools?: any[];
  onSuccessMsg?: (msg: string) => void;
  onErrorMsg?: (msg: string) => void;
}

export function TechProjectConfigSection({
  value = {},
  onChange,
  disabled = false,
  project = null,
  allFormData = {},
  schools: rawSchoolsList,
  onSuccessMsg,
  onErrorMsg,
}: TechProjectConfigSectionProps) {
  // ── Extract active project identifier ─────────────────────────────────────
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
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  const currentProject = liveProject || project;

  // ── Form State Toggles ────────────────────────────────────────────────────
  const projectCreation = value?.projectCreation ?? 'YES';
  const schoolCreation = value?.schoolCreation ?? 'YES';
  const licenseCreation = value?.licenseCreation ?? 'YES';
  const remarks = value?.remarks ?? '';
  const apkFileUrl = value?.apkFileUrl ?? value?.appFileUrl ?? '';

  const handleFieldChange = (fieldKey: string, val: any) => {
    onChange({
      ...value,
      [fieldKey]: val,
    });
  };

  // ── Core Backend Schools ──────────────────────────────────────────────────
  const [coreBackendSchools, setCoreBackendSchools] = useState<Array<{ id: string; name: string; address: string; schoolId?: string; city?: string; state?: string }>>([]);
  const [loadingCoreSchools, setLoadingCoreSchools] = useState<boolean>(false);
  const [coreSearchQuery, setCoreSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!activeProjectId) return;
    let isMounted = true;
    setLoadingCoreSchools(true);

    schoolsApi
      .getCoreSchools(activeProjectId)
      .then((schools) => {
        if (isMounted) {
          setCoreBackendSchools(Array.isArray(schools) ? schools : []);
        }
      })
      .catch(() => {
        if (isMounted) setCoreBackendSchools([]);
      })
      .finally(() => {
        if (isMounted) setLoadingCoreSchools(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  // ── Live Licenses from Core Backend API ────────────────────────────────────
  const [coreLicenses, setCoreLicenses] = useState<any[]>([]);
  const [loadingCoreLicenses, setLoadingCoreLicenses] = useState<boolean>(false);
  const [selectedLicenseSchoolKeys, setSelectedLicenseSchoolKeys] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchLiveCoreLicenses = useCallback(async () => {
    if (!activeProjectId) return;
    setLoadingCoreLicenses(true);
    try {
      const res = await licensesApi.getLicenses({ projectId: activeProjectId });
      setCoreLicenses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('[TechProjectConfigSection] Failed to load core licenses:', err);
      setCoreLicenses([]);
    } finally {
      setLoadingCoreLicenses(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchLiveCoreLicenses();
  }, [fetchLiveCoreLicenses]);

  // ── Preceding Task Data (Hardware from Stage 3 Task 3) ───────────────────
  const [dbLoadedHardware, setDbLoadedHardware] = useState<any>(null);

  useEffect(() => {
    if (!activeProjectId) return;
    let isMounted = true;

    async function fetchHardwareRequirements() {
      try {
        const res = await timelineApi.getTimelineByProjectId(activeProjectId);
        if (isMounted && res?.timeline?.nodes) {
          const findNodeRecursive = (nodes: any[], targetKey: string): any => {
            for (const n of nodes) {
              const k = (n.key || n.nodeId || n.id || '').toUpperCase();
              const name = (n.name || n.title || '').toLowerCase();
              if (k === targetKey || (targetKey === 'HARDWARE_REQUIREMENT' && (k.includes('HARDWARE') || name.includes('hardware')))) {
                return n;
              }
              if (n.children && n.children.length > 0) {
                const found = findNodeRecursive(n.children, targetKey);
                if (found) return found;
              }
            }
            return null;
          };

          const hwNode = findNodeRecursive(res.timeline.nodes, 'HARDWARE_REQUIREMENT');
          if (hwNode?.formData) {
            setDbLoadedHardware(hwNode.formData);
          }
        }
      } catch (_) {}
    }

    fetchHardwareRequirements();
    return () => {
      isMounted = false;
    };
  }, [activeProjectId]);

  // ── Resolve Demographic Schools ───────────────────────────────────────────
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    const combinedSchools =
      rawSchoolsList ||
      allFormData?.stage3Schools ||
      allFormData?.schools ||
      allFormData?.projectSchools ||
      (currentProject as any)?.schools ||
      [];

    if (!Array.isArray(combinedSchools) || combinedSchools.length === 0) {
      return [
        {
          id: currentProject?.projectId || currentProject?._id || 'prj',
          name: currentProject?.projectName || currentProject?.title || 'School',
          email: currentProject?.email || '',
          phone: currentProject?.phone || '',
          address: currentProject?.address || '',
          block: '',
          state: '',
          city: '',
          numberOfStudents: 0,
          numberOfTeachers: 0,
          coordinatorId: currentProject?.projectId || 'prj',
          pocType: 'School Coordinator',
        }
      ];
    }

    return extractEffectiveSchools(combinedSchools, allFormData, value, currentProject?.projectName || 'Project');
  }, [rawSchoolsList, allFormData, currentProject]);

  // ── Hardware Source ───────────────────────────────────────────────────────
  const hardwareSource = useMemo(() => {
    const rawHw =
      dbLoadedHardware ||
      allFormData?.stage3HardwareData ||
      allFormData?.hardwareRequirement ||
      allFormData?.hardwareRequirements ||
      (currentProject as any)?.orderRequirement?.hardwareRequirement ||
      {};

    const schoolWiseMap: Record<string, any> =
      rawHw?.schoolWiseHardware ||
      rawHw?.hardwareRequirements?.schoolWiseHardware ||
      allFormData?.stage3SchoolWiseHardware ||
      allFormData?.schoolWiseHardware ||
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
      });
    });

    return { schoolWiseMap, flatItems };
  }, [dbLoadedHardware, allFormData, currentProject]);

  // ── Helper to normalize school names ──────────────────────────────────────
  const normalizeSchoolName = (name?: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/\s*\([a-z0-9_-]+\)$/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  const isSchoolMatched = useCallback(
    (coreSchool: { name?: string; id?: string }) => {
      if (!coreSchool?.name) return false;
      const coreNorm = normalizeSchoolName(coreSchool.name);
      if (!coreNorm) return false;

      return effectiveSchools.some((es) => {
        if (!es.name) return false;
        const esNorm = normalizeSchoolName(es.name);
        if (!esNorm) return false;
        if (coreNorm === esNorm) return true;
        if (coreNorm.length >= 10 && esNorm.length >= 10 && (coreNorm.includes(esNorm) || esNorm.includes(coreNorm))) {
          return true;
        }
        return false;
      });
    },
    [effectiveSchools]
  );

  const matchedCoreSchools = useMemo(() => {
    return coreBackendSchools.filter((cs) => isSchoolMatched(cs));
  }, [coreBackendSchools, isSchoolMatched]);

  const filteredCoreSchools = useMemo(() => {
    if (!coreSearchQuery.trim()) return matchedCoreSchools;
    const q = coreSearchQuery.toLowerCase().trim();
    return matchedCoreSchools.filter((s) => {
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.schoolId && s.schoolId.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.state && s.state.toLowerCase().includes(q))
      );
    });
  }, [matchedCoreSchools, coreSearchQuery]);

  // ── Get Hardware for School ───────────────────────────────────────────────
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
                specName: val.selectedSpecName || val.specName || val.specNotes || '',
              };
            }
            return {
              key,
              itemKey: key,
              name: key,
              itemName: key,
              quantity: typeof val === 'number' ? val : 1,
              specName: '',
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

  // ── Hardware Requiring License ────────────────────────────────────────────
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

  // ── Live Core API Licenses for School ─────────────────────────────────────
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

      if (matched.length === 0 && coreBackendSchools.length === 1 && coreLicenses.length > 0) {
        return coreLicenses;
      }

      return matched;
    },
    [coreLicenses, coreBackendSchools.length]
  );

  // ── Selection State for Download ──────────────────────────────────────────
  const isAllLicenseSchoolsSelected = useMemo(() => {
    return (
      filteredCoreSchools.length > 0 &&
      filteredCoreSchools.every((cs) => selectedLicenseSchoolKeys.includes(cs.id || cs.schoolId || cs.name))
    );
  }, [filteredCoreSchools, selectedLicenseSchoolKeys]);

  const handleToggleSelectAllLicenseSchools = useCallback(() => {
    if (isAllLicenseSchoolsSelected) {
      setSelectedLicenseSchoolKeys([]);
    } else {
      setSelectedLicenseSchoolKeys(filteredCoreSchools.map((cs) => cs.id || cs.schoolId || cs.name));
    }
  }, [isAllLicenseSchoolsSelected, filteredCoreSchools]);

  const handleToggleSelectSchoolForDownload = useCallback((schoolKey: string) => {
    setSelectedLicenseSchoolKeys((prev) =>
      prev.includes(schoolKey) ? prev.filter((k) => k !== schoolKey) : [...prev, schoolKey]
    );
  }, []);

  // ── CSV Export Handler ────────────────────────────────────────────────────
  const handleDownloadSelectedLicenses = useCallback(() => {
    const targetSchoolKeys =
      selectedLicenseSchoolKeys.length > 0
        ? selectedLicenseSchoolKeys
        : filteredCoreSchools.map((cs) => cs.id || cs.schoolId || cs.name);

    if (targetSchoolKeys.length === 0) {
      alert('Please select at least one school to download licenses.');
      return;
    }

    const exportRows: any[] = [];

    targetSchoolKeys.forEach((key) => {
      const cs = coreBackendSchools.find((s) => (s.id || s.schoolId || s.name) === key);
      if (!cs) return;

      const hwItems = getLicenseRequiredHardwareForSchool(cs);
      const lics = getLicensesForSchool(cs);

      if (lics.length > 0) {
        lics.forEach((lic: any, lIdx: number) => {
          const correspondingHw = hwItems[lIdx % (hwItems.length || 1)];
          exportRows.push({
            'School Name': cs.name || '',
            'School ID': cs.schoolId || cs.id || '',
            'City': cs.city || '',
            'State': cs.state || '',
            'Address': cs.address || '',
            'Hardware Item': correspondingHw?.itemName || correspondingHw?.name || lic.platform || 'Compute Unit',
            'Hardware Qty': correspondingHw?.quantity || 1,
            'Platform': lic.platform || 'N/A',
            'License Key': lic.licenseKey || '',
            'License Days': lic.licenseDays || 365,
            'Status': lic.status || 'ACTIVE',
            'Registered Device': lic.registeredTo || '',
            'Allocated Date': lic.createdAt ? new Date(lic.createdAt).toLocaleDateString() : ''
          });
        });
      } else if (hwItems.length > 0) {
        hwItems.forEach((hw: any) => {
          exportRows.push({
            'School Name': cs.name || '',
            'School ID': cs.schoolId || cs.id || '',
            'City': cs.city || '',
            'State': cs.state || '',
            'Address': cs.address || '',
            'Hardware Item': hw.itemName || hw.name || hw.key,
            'Hardware Qty': hw.quantity || 1,
            'Platform': hw.key || 'N/A',
            'License Key': 'PENDING_CORE_CREATION',
            'License Days': 365,
            'Status': 'PENDING',
            'Registered Device': '',
            'Allocated Date': ''
          });
        });
      } else {
        exportRows.push({
          'School Name': cs.name || '',
          'School ID': cs.schoolId || cs.id || '',
          'City': cs.city || '',
          'State': cs.state || '',
          'Address': cs.address || '',
          'Hardware Item': 'Digital Platform Software',
          'Hardware Qty': 1,
          'Platform': 'SmartShala',
          'License Key': 'NOT_CONFIGURED',
          'License Days': 365,
          'Status': 'PENDING',
          'Registered Device': '',
          'Allocated Date': ''
        });
      }
    });

    if (exportRows.length === 0) {
      alert('No license data found to export.');
      return;
    }

    const headers = Object.keys(exportRows[0]).join(',');
    const csvBody = exportRows
      .map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const csvContent = `${headers}\n${csvBody}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const projNameClean = (currentProject?.projectName || 'Project').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `Digitoppers_Licenses_${projNameClean}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedLicenseSchoolKeys, filteredCoreSchools, coreBackendSchools, getLicenseRequiredHardwareForSchool, getLicensesForSchool, currentProject]);

  return (
    <div className="space-y-5">
      {/* ── 1. Top Configuration Status Cards (Project, Schools, Licenses) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Project Creation Status */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">Project Creation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${projectCreation === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {projectCreation}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Project registered on Core Backend Dashboard.</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('projectCreation', 'YES')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                projectCreation === 'YES'
                  ? 'bg-[#51a8b1] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('projectCreation', 'NO')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                projectCreation === 'NO'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* School Creation Status */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">School Creation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${schoolCreation === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {schoolCreation}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Schools mapped on Core Backend Dashboard.</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('schoolCreation', 'YES')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                schoolCreation === 'YES'
                  ? 'bg-[#51a8b1] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('schoolCreation', 'NO')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                schoolCreation === 'NO'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* License Creation Status */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 font-heading">License Creation</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${licenseCreation === 'YES' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
              {licenseCreation}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Licenses generated via Core API.</p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('licenseCreation', 'YES')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                licenseCreation === 'YES'
                  ? 'bg-[#51a8b1] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFieldChange('licenseCreation', 'NO')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                licenseCreation === 'NO'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              NO
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. SCHOOLS, HARDWARE & LIVE CORE API LICENSES TABLE ─────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Header Toolbar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-[#3a7d84] flex items-center justify-center font-bold">
              <Key className="w-4 h-4 text-[#3a7d84]" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-heading block leading-tight">
                School Hardware & Live Core API Licenses
              </span>
              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live stream from Core Backend API ({matchedCoreSchools.length} {matchedCoreSchools.length === 1 ? 'school' : 'schools'} mapped)</span>
              </div>
            </div>
            {selectedLicenseSchoolKeys.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#3a7d84] text-white border border-[#2d666d] ml-1 shadow-2xs">
                ✓ {selectedLicenseSchoolKeys.length} Selected
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Download License Button */}
            <button
              type="button"
              onClick={handleDownloadSelectedLicenses}
              disabled={filteredCoreSchools.length === 0}
              style={{ color: '#ffffff' }}
              className="px-4 py-2 rounded-xl bg-[#3a7d84] hover:bg-[#2c6870] active:scale-[0.98] !text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm shadow-[#3a7d84]/25 font-heading disabled:opacity-40 disabled:cursor-not-allowed"
              title="Download licenses for selected schools (CSV format)"
            >
              <Download className="w-4 h-4 !text-white shrink-0" />
              <span className="!text-white font-bold">
                Download Licenses
              </span>
              {selectedLicenseSchoolKeys.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white/25 !text-white text-[11px] font-mono font-bold leading-none">
                  {selectedLicenseSchoolKeys.length}
                </span>
              )}
            </button>

            {/* Refresh Live Licenses */}
            <button
              type="button"
              onClick={fetchLiveCoreLicenses}
              disabled={loadingCoreLicenses}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300 text-xs transition cursor-pointer shadow-2xs"
              title="Refresh live licenses from Core API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCoreLicenses ? 'animate-spin text-[#3a7d84]' : 'text-slate-600'}`} />
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={coreSearchQuery}
                onChange={(e) => setCoreSearchQuery(e.target.value)}
                placeholder="Search school, city, or license..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#3a7d84] w-44 sm:w-52"
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

        {/* Main Table */}
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[950px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                {/* 1. Selection Checkbox */}
                <th className="p-2.5 text-center w-12 border-r border-slate-200">
                  <input
                    type="checkbox"
                    checked={isAllLicenseSchoolsSelected}
                    onChange={handleToggleSelectAllLicenseSchools}
                    disabled={filteredCoreSchools.length === 0}
                    className="w-4 h-4 rounded text-[#3a7d84] border-slate-300 focus:ring-[#3a7d84] cursor-pointer"
                    title="Select/Deselect All Schools for Download"
                  />
                </th>

                {/* 2. Row # */}
                <th className="p-2.5 text-center w-12 border-r border-slate-200 text-slate-500 font-bold">#</th>

                {/* 3. School Details */}
                <th className="p-2.5 min-w-[240px] border-r border-slate-200">
                  <div className="font-heading text-slate-900 font-bold">School Details</div>
                  <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">name & code</div>
                </th>

                {/* 4. Hardware where license is required */}
                <th className="p-2.5 min-w-[280px] border-r border-slate-200">
                  <div className="flex items-center gap-1.5 font-heading text-slate-900 font-bold">
                    <Cpu className="w-3.5 h-3.5 text-[#3a7d84]" />
                    <span>Hardware (License Required)</span>
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">IFP, Tablets, Laptops</div>
                </th>

                {/* 5. Core API Licenses */}
                <th className="p-2.5 min-w-[340px]">
                  <div className="flex items-center gap-1.5 font-heading text-slate-900 font-bold">
                    <Key className="w-3.5 h-3.5 text-[#3a7d84]" />
                    <span>Core API Licenses</span>
                  </div>
                  <div className="text-[9.5px] font-mono text-slate-500 font-normal normal-case">live keys & status via core api</div>
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
                          : 'Schools and licenses are not created on the dashboard yet'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {coreSearchQuery
                          ? 'Try adjusting your search query.'
                          : 'Please ensure project and schools are registered in the Core Backend Dashboard.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCoreSchools.map((cs, cIdx) => {
                  const schoolKey = cs.id || cs.schoolId || cs.name;
                  const isSelected = selectedLicenseSchoolKeys.includes(schoolKey);

                  // Hardware requiring license for this school
                  const schoolHwItems = getLicenseRequiredHardwareForSchool(cs);

                  // Live licenses from Core API for this school
                  const schoolLics = getLicensesForSchool(cs);

                  return (
                    <tr
                      key={cs.id || cIdx}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-teal-50/25' : ''
                      }`}
                    >
                      {/* 1. Selection Checkbox */}
                      <td className="p-2.5 text-center border-r border-slate-100 bg-slate-50/40">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectSchoolForDownload(schoolKey)}
                          className="w-4 h-4 rounded text-[#51a8b1] border-slate-300 focus:ring-[#51a8b1] cursor-pointer"
                          title="Select school to download license"
                        />
                      </td>

                      {/* 2. Row # */}
                      <td className="p-2.5 text-center font-mono text-[11px] text-slate-400 border-r border-slate-100 bg-slate-50/40">
                        {cIdx + 1}
                      </td>

                      {/* 3. School Details */}
                      <td className="px-3 py-2.5 border-r border-slate-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#51a8b1] shrink-0"></span>
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
                          {cs.address && (
                            <div className="text-[10px] text-slate-400 line-clamp-1 max-w-[280px]">
                              {cs.address}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 4. Hardware (License Required) */}
                      <td className="px-3 py-2.5 border-r border-slate-100 align-top">
                        {schoolHwItems.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1">
                            No compute hardware configured
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-w-[320px]">
                            {schoolHwItems.map((hw: any, hIdx: number) => {
                              const hwName = hw.name || hw.itemName || hw.key;
                              const qty = hw.quantity || hw.qty || 1;

                              return (
                                <div
                                  key={hIdx}
                                  className="p-2 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs space-y-0.5"
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-bold text-slate-900 text-[12px] truncate">
                                      {hwName}
                                    </span>
                                    <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-[#245960] shrink-0">
                                      {qty} {qty === 1 ? 'Unit' : 'Units'}
                                    </span>
                                  </div>
                                  {hw.specName && (
                                    <div className="text-[10.5px] text-slate-600 font-mono line-clamp-1 pt-0.5">
                                      {hw.specName}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* 5. Core API Licenses */}
                      <td className="px-3 py-2.5 align-top">
                        {loadingCoreLicenses ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 py-1">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3a7d84]" />
                            <span>Loading live licenses...</span>
                          </div>
                        ) : schoolLics.length === 0 ? (
                          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-medium">Licenses not yet created on Core Dashboard</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-w-[360px]">
                            {schoolLics.map((lic: any, lIdx: number) => {
                              return (
                                <div
                                  key={lic._id || lic.licenseKey || lIdx}
                                  className="p-2.5 rounded-xl bg-[#f0f8f9] border border-[#a1d6dc] space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-mono font-black text-slate-900 text-[12.5px] select-all tracking-wide">
                                      {lic.licenseKey}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(lic.licenseKey);
                                        setCopiedKey(lic.licenseKey);
                                        setTimeout(() => setCopiedKey(null), 1500);
                                      }}
                                      className="text-[10px] px-2 py-0.5 rounded-md bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-300 flex items-center gap-1 cursor-pointer font-bold transition shadow-2xs shrink-0"
                                      title="Copy license key to clipboard"
                                    >
                                      {copiedKey === lic.licenseKey ? (
                                        <>
                                          <Check className="w-3 h-3 text-emerald-600" />
                                          <span className="text-emerald-700">Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-slate-500" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                    {lic.platform && (
                                      <span className="px-2 py-0.5 rounded-md bg-white text-slate-800 border border-slate-300 uppercase font-bold text-[10px]">
                                        {lic.platform}
                                      </span>
                                    )}
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] border ${
                                        String(lic.status).toUpperCase() === 'ACTIVE'
                                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                          : String(lic.status).toUpperCase() === 'REGISTERED'
                                          ? 'bg-blue-100 text-blue-900 border-blue-300'
                                          : 'bg-teal-100 text-teal-900 border-teal-300'
                                      }`}
                                    >
                                      {lic.status || 'ACTIVE'}
                                    </span>
                                    {lic.licenseDays && (
                                      <span className="text-slate-600 font-mono font-medium text-[10.5px]">
                                        {lic.licenseDays} days
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Application Build Upload Section ──────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Upload className="w-4 h-4 text-[#3a7d84]" />
          <h4 className="text-sm font-bold text-slate-800 font-heading">
            Application / APK File Upload
          </h4>
        </div>
        <AppBuildUploadSection
          field={{ key: 'apkFileUrl', label: 'Upload Application / APK File', type: 'file' }}
          name="apkFileUrl"
          value={apkFileUrl}
          onChange={(val) => handleFieldChange('apkFileUrl', val)}
          disabled={disabled}
          allFormData={allFormData}
          onFormDataChange={(updates) => onChange({ ...value, ...updates })}
          onSuccessMsg={onSuccessMsg}
          onErrorMsg={onErrorMsg}
        />
      </div>

      {/* ── 4. Configuration Remarks ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <label className="block text-xs font-bold text-slate-700 font-heading">
          Configuration Remarks
        </label>
        <textarea
          rows={3}
          disabled={disabled}
          value={remarks}
          onChange={(e) => handleFieldChange('remarks', e.target.value)}
          placeholder="Enter configuration notes, credentials status, or deployment observations..."
          className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
        />
      </div>
    </div>
  );
}

export default TechProjectConfigSection;

