'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Download,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { schoolsApi } from '../../../lib/api/schools.api';
import { licensesApi, ISchoolHardwareLicense } from '../../../lib/api/licenses.api';
import { ISchool } from '../../../types/school';
import { IProject } from '../../../types/project';

interface SchoolLicenseListSectionProps {
  value?: any;
  onChange?: (val: any) => void;
  disabled?: boolean;
  project?: IProject | null;
  allFormData?: Record<string, any>;
}

export function SchoolLicenseListSection({
  value,
  onChange,
  disabled = false,
  project = null,
  allFormData = {},
}: SchoolLicenseListSectionProps) {
  // Interactive search & selection states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [isSchoolSelectorExpanded, setIsSchoolSelectorExpanded] = useState<boolean>(false);
  const [schools, setSchools] = useState<ISchool[]>([]);
  const [allocations, setAllocations] = useState<ISchoolHardwareLicense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close collapsible selector on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSchoolSelectorExpanded(false);
      }
    }
    if (isSchoolSelectorExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSchoolSelectorExpanded]);

  // Extract project ID from project prop or allFormData
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

  // Fetch live schools and hardware license allocations from backend MongoDB
  const fetchSchoolsAndAllocations = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    setError(null);
    try {
      let data = await schoolsApi.getSchools({ projectId: activeProjectId });
      if ((!Array.isArray(data) || data.length === 0) && project?.projectId && project.projectId !== activeProjectId) {
        data = await schoolsApi.getSchools({ projectId: project.projectId });
      }

      if (Array.isArray(data) && data.length > 0) {
        setSchools(data);
      } else {
        const fallback =
          allFormData?.stage3Schools ||
          allFormData?.schools ||
          (project as any)?.orderRequirement?.schoolInformation?.schools ||
          [];
        if (fallback.length > 0) {
          setSchools(
            fallback.map((s: any, idx: number) => ({
              _id: s.id || s._id || `sch-${idx + 1}`,
              name: s.schoolName || s.name || `School ${idx + 1}`,
              district: s.district || s.city || '',
              state: s.state || '',
              address: s.address || '',
              projectId: activeProjectId,
              hardware: s.hardware || [],
            } as any))
          );
        } else {
          setSchools([]);
        }
      }

      // Fetch or auto-sync license allocations from DB
      try {
        let allocList = await licensesApi.getAllocations({ projectId: activeProjectId });
        if (!Array.isArray(allocList) || allocList.length === 0) {
          allocList = await licensesApi.syncProjectAllocations(activeProjectId);
        }
        if (Array.isArray(allocList)) {
          setAllocations(allocList);
        }
      } catch (allocErr) {
        console.warn('Could not fetch hardware license allocations:', allocErr);
      }
    } catch (err: any) {
      console.error('Failed to fetch school list from DB:', err);
      setError('Could not load school list from backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchoolsAndAllocations();
  }, [activeProjectId]);

  // Map allocations by schoolId
  const schoolAllocationsMap = useMemo(() => {
    const map: Record<string, ISchoolHardwareLicense[]> = {};
    for (const alloc of allocations) {
      const sId = typeof alloc.schoolId === 'object' ? alloc.schoolId?._id : alloc.schoolId;
      if (sId) {
        if (!map[sId]) map[sId] = [];
        map[sId].push(alloc);
      }
    }
    return map;
  }, [allocations]);

  // Select all schools by default when loaded
  useEffect(() => {
    if (schools.length > 0) {
      setSelectedSchoolIds((prev) => {
        if (prev.length > 0) {
          const valid = prev.filter((id) => schools.some((s) => s._id === id));
          if (valid.length > 0) return valid;
        }
        return schools.map((s) => s._id);
      });
    }
  }, [schools]);

  const isAllSelected = schools.length > 0 && selectedSchoolIds.length === schools.length;

  const toggleSchool = (id: string) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllSchools = () => {
    setSelectedSchoolIds(schools.map((s) => s._id));
    setSearchQuery('');
  };

  const deselectAllSchools = () => {
    setSelectedSchoolIds([]);
    setSearchQuery('');
  };

  // Filtered list of schools for search selector
  const searchableSchoolsList = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase().trim();
    return schools.filter(
      (sch) =>
        sch.name?.toLowerCase().includes(q) ||
        sch.district?.toLowerCase().includes(q) ||
        (sch.state && sch.state.toLowerCase().includes(q))
    );
  }, [schools, searchQuery]);

  // Selected schools list
  const targetedSchoolsForDownload = useMemo(() => {
    return schools.filter((s) => selectedSchoolIds.includes(s._id));
  }, [schools, selectedSchoolIds]);

  // Total licenses count across selected schools
  const totalSelectedLicensesCount = useMemo(() => {
    return targetedSchoolsForDownload.reduce((acc, school) => {
      const schAllocs = schoolAllocationsMap[school._id] || [];
      return acc + (schAllocs.length > 0 ? schAllocs.length : (school.hardware?.length || 1));
    }, 0);
  }, [targetedSchoolsForDownload, schoolAllocationsMap]);

  // Batch download for selected schools connected with backend
  const handleDownloadLicenses = () => {
    const targets = targetedSchoolsForDownload;
    if (targets.length === 0) return;

    setIsDownloading(true);
    setTimeout(() => {
      const projectBundle = targets.map((school) => {
        const schAllocs = schoolAllocationsMap[school._id] || [];
        return {
          school: {
            id: school._id,
            name: school.name,
            district: school.district || 'N/A',
            state: school.state || 'N/A',
          },
          totalLicenses: schAllocs.length,
          hardwareLicenses: schAllocs.map((a) => ({
            licenseKey: a.licenseKey,
            hardwareKey: a.hardwareKey,
            hardwareName: a.hardwareName,
            specName: a.specName || null,
            specKey: a.specKey || null,
            unitIndex: a.unitIndex,
            status: a.status || 'ACTIVE',
            isRegistered: !!a.isRegistered,
            registeredTo: a.registeredTo || null,
          })),
        };
      });

      const payload = {
        project: {
          id: activeProjectId,
          title: project?.title || (project as any)?.projectName || 'DigiToppers Project',
        },
        generatedAt: new Date().toISOString(),
        selectedSchoolsCount: targets.length,
        totalLicensesCount: totalSelectedLicensesCount,
        schools: projectBundle,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const countLabel = targets.length === schools.length ? `All_${schools.length}` : `${targets.length}`;
      a.download = `Licenses_${(project?.title || (project as any)?.projectName || 'Project').replace(/\s+/g, '_')}_${countLabel}_Schools.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
    }, 350);
  };

  return (
    <div className="w-full col-span-1 sm:col-span-2 space-y-2 font-sans" ref={containerRef}>
      {/* ── Search Bar with Beside Download License Button ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        
        {/* Search Input Container */}
        <div className="relative flex-1 flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#51a8b1]">
            <Search className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isSchoolSelectorExpanded) setIsSchoolSelectorExpanded(true);
            }}
            onFocus={() => {
              if (!isSchoolSelectorExpanded) setIsSchoolSelectorExpanded(true);
            }}
            placeholder="Search school by name, district, or code..."
            className="w-full h-11 pl-10 pr-32 text-xs rounded-xl border border-[#b6e0e4] bg-[#f8fafb] text-[#1c4d52] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium shadow-2xs"
          />

          {/* Right side controls inside Search Bar */}
          <div className="absolute inset-y-0 right-1.5 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Expand / Collapse Button Pill */}
            <button
              type="button"
              onClick={() => setIsSchoolSelectorExpanded(!isSchoolSelectorExpanded)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer border ${
                isSchoolSelectorExpanded
                  ? 'bg-[#eef7f8] text-[#1c4d52] border-[#51a8b1]'
                  : 'bg-white text-[#3a7d84] border-[#b6e0e4] hover:bg-[#eef7f8]'
              }`}
              title={isSchoolSelectorExpanded ? 'Collapse School Selector' : 'Expand School Selector'}
            >
              <Building2 className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span className="text-[11px] whitespace-nowrap">
                {selectedSchoolIds.length}/{schools.length}
              </span>
              {isSchoolSelectorExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#3a7d84]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#3a7d84]" />
              )}
            </button>
          </div>
        </div>

        {/* ── Download License Button Placed Right Beside Search Bar ── */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleDownloadLicenses}
            disabled={isDownloading || targetedSchoolsForDownload.length === 0}
            className="h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 rounded-xl text-xs font-bold bg-[#51a8b1] hover:bg-[#3a7d84] text-white transition shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
            title="Download hardware licenses for selected schools"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {targetedSchoolsForDownload.length === 0
                    ? 'Select School'
                    : isAllSelected
                    ? `Download All (${totalSelectedLicensesCount} Licenses)`
                    : `Download (${totalSelectedLicensesCount} Licenses)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Collapsible School List with Tick Checkbox Options ── */}
      {isSchoolSelectorExpanded && (
        <div className="p-3 bg-white rounded-2xl border-2 border-[#51a8b1]/40 shadow-lg space-y-2.5 animate-in fade-in duration-150">
          
          {/* List Controls: Select All / Deselect All / Collapse */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1c4d52]">
                Select Schools
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                ({searchableSchoolsList.length} {searchableSchoolsList.length === 1 ? 'school' : 'schools'} found)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={selectAllSchools}
                className="text-xs font-bold text-[#3a7d84] hover:text-[#51a8b1] hover:underline cursor-pointer transition flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Select All</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={deselectAllSchools}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:underline cursor-pointer transition flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Deselect All</span>
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setIsSchoolSelectorExpanded(false)}
                className="text-xs font-bold text-[#3a7d84] hover:text-[#1c4d52] hover:underline cursor-pointer transition flex items-center gap-0.5"
                title="Collapse school list"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </button>
            </div>
          </div>

          {/* School Cards Grid with Checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {searchableSchoolsList.length === 0 ? (
              <div className="col-span-1 sm:col-span-2 py-4 text-center text-xs text-slate-400 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                No schools found matching &quot;{searchQuery}&quot;.
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="ml-2 text-[#3a7d84] font-bold hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              searchableSchoolsList.map((sch) => {
                const isChecked = selectedSchoolIds.includes(sch._id);
                const schAllocs = schoolAllocationsMap[sch._id] || [];
                return (
                  <div
                    key={sch._id}
                    onClick={() => toggleSchool(sch._id)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isChecked
                        ? 'bg-[#f0f8f9] border-[#51a8b1] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-[#b6e0e4] hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox with Tick */}
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isChecked
                            ? 'bg-[#51a8b1] border-[#51a8b1] text-white shadow-2xs'
                            : 'border-slate-300 bg-white hover:border-[#51a8b1]'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1c4d52] truncate">
                          {sch.name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                          <span>{sch.district || 'District N/A'}</span>
                          {sch.state && <span>• {sch.state}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Licenses Count Badge */}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#b6e0e4] text-[#3a7d84] shrink-0 font-mono shadow-2xs">
                      {schAllocs.length} Licenses
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Status & Collapse Bar */}
          <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-500">
            <span>
              Active selection: <strong>{selectedSchoolIds.length} of {schools.length} schools</strong> ({totalSelectedLicensesCount} licenses)
            </span>
            <button
              type="button"
              onClick={() => setIsSchoolSelectorExpanded(false)}
              className="text-[#3a7d84] hover:text-[#1c4d52] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Done Selecting</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── When Collapsed: Compact Status Line ── */}
      {!isSchoolSelectorExpanded && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Active: <strong>{selectedSchoolIds.length}</strong> of <strong>{schools.length}</strong> schools (<strong>{totalSelectedLicensesCount}</strong> licenses)
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <button
              type="button"
              onClick={() => setIsSchoolSelectorExpanded(true)}
              className="text-[#3a7d84] hover:underline font-bold cursor-pointer"
            >
              {isAllSelected ? 'Filter / Select Schools' : 'Change Selection'}
            </button>
          </div>

          {!isAllSelected && schools.length > 0 && (
            <button
              type="button"
              onClick={selectAllSchools}
              className="text-[#3a7d84] hover:underline font-bold cursor-pointer"
            >
              Select All ({schools.length})
            </button>
          )}
        </div>
      )}

      {/* Error state if backend fails */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={fetchSchoolsAndAllocations} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default SchoolLicenseListSection;
