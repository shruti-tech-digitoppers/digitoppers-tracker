'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  BookOpen,
  Upload,
  Loader2,
  LayoutGrid,
  Palette,
  FileText,
} from 'lucide-react';
import { IUser } from '../../../types/auth';

export interface ICurriculumMediumSheet {
  id: string;
  sectionType?: 'curriculum' | 'cocurricular';
  curriculum: string; // e.g. 'CBSE', 'Simulations', 'Moral Stories'
  medium: string; // e.g. 'English', 'Hindi'
  board?: string; // e.g. 'CBSE'
  classes?: string; // e.g. 'Class 1 - 10'
  sheetTitle: string;
  sheetUrl: string;
  status: 'READY' | 'IN_PROGRESS' | 'NEEDS_REVIEW' | 'PENDING';
  totalChapters?: number | string;
  verifiedBy?: string;
  remarks?: string;
  fileName?: string;
  updatedAt?: string;
}

export interface SheetReadinessValue {
  sheets?: ICurriculumMediumSheet[];
  items?: ICurriculumMediumSheet[];
  overallDriveUrl?: string;
  [key: string]: any;
}

interface SheetReadinessSectionProps {
  value?: SheetReadinessValue | any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
  employees?: IUser[];
  project?: any;
}

const DEFAULT_MEDIUM_OPTIONS = [
  'English',
  'Hindi',
  'Marathi',
  'Kannada',
  'Tamil',
  'Telugu',
  'Gujarati',
  'Bengali',
  'Urdu',
  'Punjabi',
  'Hinglish',
];

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  READY: {
    label: 'Ready & Verified',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  IN_PROGRESS: {
    label: 'In Progress',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  NEEDS_REVIEW: {
    label: 'Needs Review',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: AlertCircle,
  },
  PENDING: {
    label: 'Pending Upload',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: Clock,
  },
};

function formatClassesClean(raw: any): string {
  if (!raw) return 'Class 1 - 10';
  if (typeof raw === 'string') {
    if (raw.includes(',')) {
      const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
      return formatClassesClean(parts);
    }
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0) {
    const has1 = raw.some((c: string) => c === '1' || c.startsWith('1 '));
    const has12 = raw.some((c: string) => c.includes('12'));
    const has11 = raw.some((c: string) => c.includes('11'));
    const has10 = raw.some((c: string) => c === '10' || c.includes('10'));

    if (has1 && (has12 || has11)) return 'Class 1 - 12';
    if (has1 && has10) return 'Class 1 - 10';
    if (raw.length > 3) return 'Class ' + raw[0] + ' - ' + raw[raw.length - 1];
    return raw.join(', ');
  }
  return 'Class 1 - 10';
}

export function SheetReadinessSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
  project = null,
}: SheetReadinessSectionProps) {
  // 1. Backend Content State
  const [backendContent, setBackendContent] = useState<any>(null);
  const [uploadingSheetId, setUploadingSheetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentUploadTargetId, setCurrentUploadTargetId] = useState<string | null>(null);

  // Active View Tab: 'ALL' | 'CURRICULUM' | 'CO_CURRICULAR'
  const [activeTab, setActiveTab] = useState<'ALL' | 'CURRICULUM' | 'CO_CURRICULAR'>('ALL');

  // Resolved Project ID
  const projectId = useMemo(() => {
    return project?._id || project?.projectId || allFormData?.projectId || allFormData?.project || '';
  }, [project, allFormData]);

  // Fetch project content from backend
  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;
    const fetchProjectContent = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        const res = await fetch(baseUrl + '/content/project/' + projectId, {
          headers: {
            ...(token ? { Authorization: 'Bearer ' + token } : {}),
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setBackendContent(json.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch project content from backend:', err);
      }
    };

    fetchProjectContent();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Combined Content Configuration from allFormData + backend
  const contentConfig = useMemo(() => {
    return (
      allFormData?.contentConfigData ||
      allFormData?.stage3ContentData ||
      allFormData?.stage3ContentNode?.contentSets ||
      allFormData?.stage3ContentNode?.formData?.contentSets ||
      allFormData?.stage3ContentNode?.formData ||
      allFormData?.stage3ContentNode ||
      backendContent ||
      allFormData?.contentReq ||
      {}
    );
  }, [allFormData, backendContent]);

  // Configured Board from Content Configuration
  const configuredBoard = useMemo<string>(() => {
    return contentConfig?.board || contentConfig?.curriculumBoard || project?.board || 'CBSE';
  }, [contentConfig, project]);

  // Configured Curriculum Mediums (Languages) from Content Configuration
  const configuredMediums = useMemo<string[]>(() => {
    if (Array.isArray(contentConfig?.mediums) && contentConfig.mediums.length > 0) {
      return contentConfig.mediums;
    }
    if (Array.isArray(contentConfig?.languages) && contentConfig.languages.length > 0) {
      return contentConfig.languages;
    }
    if (typeof contentConfig?.medium === 'string' && contentConfig.medium.trim()) {
      return [contentConfig.medium.trim()];
    }
    if (typeof contentConfig?.language === 'string' && contentConfig.language.trim()) {
      return contentConfig.language.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return DEFAULT_MEDIUM_OPTIONS.slice(0, 2);
  }, [contentConfig]);

  // Configured Curriculum Classes Clean Summary
  const cleanClassesText = useMemo<string>(() => {
    return formatClassesClean(contentConfig?.classes || contentConfig?.gradesConfigured);
  }, [contentConfig]);

  // Configured Co-Curricular Categories & Mediums from Backend Configuration ONLY
  const coCurricularConfig = useMemo<{ categories: string[]; mediumMap: Record<string, string[]> }>(() => {
    const cats: string[] = [];
    const map: Record<string, string[]> = {};

    // 1. From contentConfig.categories or contentConfig.contents
    const rawCategories = contentConfig?.categories || contentConfig?.contents || [];
    if (Array.isArray(rawCategories)) {
      rawCategories.forEach((catItem: any) => {
        const catName = typeof catItem === 'string' ? catItem : catItem?.name;
        if (catName && catName !== 'Syllabus Content') {
          if (!cats.includes(catName)) cats.push(catName);
        }
      });
    }

    // 2. From contentReq.categories
    if (contentConfig?.contentReq && Array.isArray(contentConfig.contentReq.categories)) {
      contentConfig.contentReq.categories.forEach((c: any) => {
        if (!c.isCurriculum && c.name && c.name !== 'Syllabus Content') {
          if (!cats.includes(c.name)) cats.push(c.name);
          const mediums = (c.coCurricularReq || c.nonCurriculumReq || []).map((m: any) => m.medium).filter(Boolean);
          if (mediums.length > 0) {
            map[c.name] = mediums;
          }
        }
      });
    }

    // 3. From backendContent categories
    if (backendContent && Array.isArray(backendContent.categories)) {
      backendContent.categories.forEach((c: any) => {
        if (!c.isCurriculum && c.name && c.name !== 'Syllabus Content') {
          if (!cats.includes(c.name)) cats.push(c.name);
          const mediums = (c.coCurricularReq || c.nonCurriculumReq || []).map((m: any) => m.medium).filter(Boolean);
          if (mediums.length > 0) {
            map[c.name] = mediums;
          }
        }
      });
    }

    // 4. From existing saved sheets in value (if any co-curricular sheets already exist)
    const existingSheets = (value && Array.isArray(value.sheets) && value.sheets) || (Array.isArray(value) && value) || [];
    existingSheets.forEach((s: any) => {
      if (s.sectionType === 'cocurricular' && s.curriculum) {
        if (!cats.includes(s.curriculum)) cats.push(s.curriculum);
      }
    });

    // Map mediums ONLY for categories explicitly selected in backend
    const formCoCurrMap = contentConfig?.coCurricularMediums || contentConfig?.nonCurriculumMediums;
    if (formCoCurrMap && typeof formCoCurrMap === 'object') {
      cats.forEach((cName) => {
        if (formCoCurrMap[cName] && Array.isArray(formCoCurrMap[cName]) && formCoCurrMap[cName].length > 0) {
          map[cName] = formCoCurrMap[cName];
        }
      });
    }

    // Ensure every selected category has mapped mediums
    cats.forEach((cName) => {
      if (!map[cName] || map[cName].length === 0) {
        map[cName] = configuredMediums;
      }
    });

    return { categories: cats, mediumMap: map };
  }, [contentConfig, backendContent, configuredMediums, value]);

  // Reconciled Sheets: Direct Board x Medium (Curriculum) + Domain x Medium (Co-Curricular). ZERO SUBJECTS.
  const sheets: ICurriculumMediumSheet[] = useMemo(() => {
    const rawExisting = (
      (value && Array.isArray(value.sheets) && value.sheets) ||
      (value && Array.isArray(value.items) && value.items) ||
      (Array.isArray(value) && value) ||
      []
    );

    const existingMap = new Map<string, ICurriculumMediumSheet>();
    rawExisting.forEach((s: any) => {
      const isCoCurr = s.sectionType === 'cocurricular' || (s.curriculum && s.curriculum !== 'CBSE' && s.curriculum !== configuredBoard && !s.curriculum.toLowerCase().includes('curriculum'));
      const secType = isCoCurr ? 'cocurricular' : 'curriculum';
      const curricLabel = isCoCurr ? s.curriculum : configuredBoard;
      const key = secType + '__' + (curricLabel || '').toLowerCase().trim() + '__' + (s.medium || '').toLowerCase().trim();

      if (!existingMap.has(key)) {
        existingMap.set(key, {
          ...s,
          sectionType: secType,
          curriculum: curricLabel,
          board: configuredBoard,
          sheetTitle: isCoCurr ? `${curricLabel} (${s.medium})` : `${configuredBoard} (${s.medium})`,
        });
      }
    });

    const result: ICurriculumMediumSheet[] = [];
    const mediumClassesMap = contentConfig?.mediumClasses || {};

    // 1. Add Curriculum sheets: One sheet per configured Board x Medium
    configuredMediums.forEach((med) => {
      const curricLabel = configuredBoard;
      const key = 'curriculum__' + curricLabel.toLowerCase().trim() + '__' + med.toLowerCase().trim();
      const existing = existingMap.get(key);
      const specificClasses = mediumClassesMap[med] ? formatClassesClean(mediumClassesMap[med]) : cleanClassesText;

      if (existing) {
        result.push({
          ...existing,
          curriculum: configuredBoard,
          board: configuredBoard,
          sheetTitle: `${configuredBoard} (${med})`,
          classes: existing.classes || specificClasses,
        });
        existingMap.delete(key);
      } else {
        result.push({
          id: 'sheet_curric_' + configuredBoard.toLowerCase().replace(/\s+/g, '_') + '_' + med.toLowerCase(),
          sectionType: 'curriculum',
          curriculum: curricLabel,
          medium: med,
          board: configuredBoard,
          classes: specificClasses,
          sheetTitle: `${configuredBoard} (${med})`,
          sheetUrl: '',
          status: 'PENDING',
          remarks: '',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // 2. Add Co-Curricular sheets: One sheet per selected Domain x Medium
    coCurricularConfig.categories.forEach((catName) => {
      const catMediums = coCurricularConfig.mediumMap[catName] || configuredMediums;
      catMediums.forEach((med) => {
        const key = 'cocurricular__' + catName.toLowerCase().trim() + '__' + med.toLowerCase().trim();
        const existing = existingMap.get(key);
        if (existing) {
          result.push({
            ...existing,
            curriculum: catName,
            board: configuredBoard,
            sheetTitle: `${catName} (${med})`,
          });
          existingMap.delete(key);
        } else {
          result.push({
            id: 'sheet_cocurric_' + catName.toLowerCase().replace(/\s+/g, '_') + '_' + med.toLowerCase(),
            sectionType: 'cocurricular',
            curriculum: catName,
            medium: med,
            board: configuredBoard,
            sheetTitle: `${catName} (${med})`,
            sheetUrl: '',
            status: 'PENDING',
            remarks: '',
            updatedAt: new Date().toISOString(),
          });
        }
      });
    });

    return result;
  }, [value, configuredMediums, configuredBoard, cleanClassesText, coCurricularConfig, contentConfig]);


  // Search & Filter State
  const [filterMedium, setFilterMedium] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Emit helper
  const emitChanges = (updatedSheets: ICurriculumMediumSheet[]) => {
    const nextVal = {
      ...(typeof value === 'object' && value !== null ? value : {}),
      sheets: updatedSheets,
      items: updatedSheets,
      totalSheets: updatedSheets.length,
      readySheets: updatedSheets.filter((s) => s.status === 'READY').length,
      lastUpdated: new Date().toISOString(),
    };
    onChange(nextVal);
  };

  // Upload handler for PDF or spreadsheet
  const triggerFileUpload = (sheetId: string) => {
    if (disabled) return;
    setCurrentUploadTargetId(sheetId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUploadTargetId) return;

    try {
      setUploadingSheetId(currentUploadTargetId);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(baseUrl + '/upload', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        body: uploadFormData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'File upload failed');
      }

      const uploadedUrl = data.data?.url || data.url || '';

      const updated = sheets.map((s) => {
        if (s.id === currentUploadTargetId) {
          return {
            ...s,
            sheetUrl: uploadedUrl,
            fileName: file.name,
            status: 'READY' as const,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      emitChanges(updated);
    } catch (err: any) {
      alert('Upload error: ' + (err.message || 'Could not upload PDF / Sheet'));
    } finally {
      setUploadingSheetId(null);
      setCurrentUploadTargetId(null);
    }
  };

  const handleInlineStatusChange = (id: string, status: any) => {
    if (disabled) return;
    const updated = sheets.map((s) => (s.id === id ? { ...s, status, updatedAt: new Date().toISOString() } : s));
    emitChanges(updated);
  };

  // Filtered sheets by Tab, Search and Filters
  const filteredSheets = useMemo(() => {
    return sheets.filter((sheet) => {
      const isCoCurric = sheet.sectionType === 'cocurricular';
      if (activeTab === 'CURRICULUM' && isCoCurric) return false;
      if (activeTab === 'CO_CURRICULAR' && !isCoCurric) return false;

      if (filterMedium !== 'ALL' && sheet.medium !== filterMedium) return false;
      if (filterStatus !== 'ALL' && sheet.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (sheet.sheetTitle || '').toLowerCase().includes(q);
        const matchesCurr = (sheet.curriculum || '').toLowerCase().includes(q);
        const matchesMed = (sheet.medium || '').toLowerCase().includes(q);
        const matchesBoard = (sheet.board || '').toLowerCase().includes(q);
        const matchesFile = (sheet.fileName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesCurr && !matchesMed && !matchesBoard && !matchesFile) return false;
      }
      return true;
    });
  }, [sheets, activeTab, filterMedium, filterStatus, searchQuery]);

  // Counts
  const totalCount = sheets.length;
  const curriculumCount = sheets.filter((s) => s.sectionType === 'curriculum').length;
  const coCurricularCount = sheets.filter((s) => s.sectionType === 'cocurricular').length;
  const readyCount = sheets.filter((s) => s.status === 'READY').length;
  const inProgressCount = sheets.filter((s) => s.status === 'IN_PROGRESS').length;
  const pendingCount = sheets.filter((s) => s.status === 'PENDING' || !s.sheetUrl).length;

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Hidden File Input for Direct PDF / Spreadsheet Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".pdf,.xlsx,.xls,.csv,.doc,.docx"
        className="hidden"
      />

      {/* 1. Header Banner - Clean Sheet Readiness & Configured Selection */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50/80 via-white to-indigo-50/60 border border-teal-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-black text-sm text-[#0f172a] flex items-center gap-2">
                Sheet Readiness
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                  {configuredBoard} Board
                </span>
              </h3>
            </div>
          </div>

          {/* Configured Selection Badges - Clean & Compact */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Selection:
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-300 text-teal-900 shadow-2xs">
              🏛️ {configuredBoard}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-300 text-blue-900 shadow-2xs">
              🌐 {configuredMediums.join(', ')}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs">
              🎓 {cleanClassesText}
            </span>
            {coCurricularConfig.categories.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 shadow-2xs">
                🎨 {coCurricularConfig.categories.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Section Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ' + (
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            All Sheets ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CURRICULUM')}
            className={'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ' + (
              activeTab === 'CURRICULUM'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-teal-700'
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum Sheets ({curriculumCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CO_CURRICULAR')}
            className={'px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ' + (
              activeTab === 'CO_CURRICULAR'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-purple-700'
            )}
          >
            <Palette className="w-3.5 h-3.5" />
            Co-Curricular Sheets ({coCurricularCount})
          </button>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            ✅ {readyCount} Ready
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
            ⏳ {inProgressCount} In Progress
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            📄 {pendingCount} Pending Upload
          </span>
        </div>
      </div>

      {/* 3. Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medium, board, domain..."
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-700"
            />
          </div>

          {/* Medium Filter */}
          <select
            value={filterMedium}
            onChange={(e) => setFilterMedium(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="ALL">All Mediums</option>
            {configuredMediums.map((m) => (
              <option key={m} value={m}>
                Medium: {m}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="READY">Ready & Verified</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="PENDING">Pending Upload</option>
          </select>
        </div>

        <div className="text-[11px] font-bold text-slate-500 shrink-0">
          Showing {filteredSheets.length} of {sheets.length} sheets
        </div>
      </div>

      {/* 4. Sheets Cards List */}
      {filteredSheets.length === 0 ? (
        <div className="p-8 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h4 className="font-heading font-black text-sm text-slate-800">
            {activeTab === 'CURRICULUM'
              ? 'No Curriculum Sheets Configured'
              : activeTab === 'CO_CURRICULAR'
              ? 'No Co-Curricular Sheets Configured'
              : 'No Sheets Found'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Sheets will appear based on Content Configuration selection.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSheets.map((sheet, index) => {
            const statusMeta = STATUS_CONFIG[sheet.status] || STATUS_CONFIG.PENDING;
            const isCoCurric = sheet.sectionType === 'cocurricular';
            const isUploadingThis = uploadingSheetId === sheet.id;
            const isPdf = sheet.fileName?.toLowerCase().endsWith('.pdf') || sheet.sheetUrl?.toLowerCase().endsWith('.pdf');

            // Resolved URL for uploaded files
            const openUrl = sheet.sheetUrl?.startsWith('/uploads')
              ? ((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '') + sheet.sheetUrl)
              : sheet.sheetUrl;

            return (
              <div
                key={sheet.id}
                className={'p-3.5 bg-white border hover:shadow-xs rounded-2xl transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 group ' + (
                  isCoCurric ? 'border-purple-200/90 hover:border-purple-300' : 'border-slate-200 hover:border-teal-300'
                )}
              >
                {/* Left: Clean Label & Selected Value Badges (Category -> Board -> Medium -> Class OR Category -> Domain -> Medium) */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                    #{index + 1}
                  </span>

                  {/* 1. Category Label & Selected Value */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Category:</span>
                    <span className={'font-black ' + (isCoCurric ? 'text-purple-700' : 'text-teal-700')}>
                      {isCoCurric ? 'Co-Curricular' : 'Curricular'}
                    </span>
                  </div>

                  {/* 2. Curricular flow: Board -> Medium -> Class */}
                  {!isCoCurric && (
                    <>
                      {/* Board Label & Selected Value */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50/70 border border-teal-200 text-xs shadow-2xs">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">Board:</span>
                        <span className="font-bold text-teal-950">{sheet.board || configuredBoard}</span>
                      </div>

                      {/* Medium (Language) Label & Selected Value */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200 text-xs shadow-2xs">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Medium:</span>
                        <span className="font-bold text-blue-950">{sheet.medium}</span>
                      </div>

                      {/* Class Label & Selected Value */}
                      {(sheet.classes || cleanClassesText) && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs shadow-2xs">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Class:</span>
                          <span className="font-bold text-indigo-950">{sheet.classes || cleanClassesText}</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* 3. Co-Curricular flow: Domain -> Medium */}
                  {isCoCurric && (
                    <>
                      {/* Domain/Category Label & Selected Value */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50/70 border border-purple-200 text-xs shadow-2xs">
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wide">Domain:</span>
                        <span className="font-bold text-purple-950">{sheet.curriculum}</span>
                      </div>

                      {/* Medium (Language) Label & Selected Value */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/70 border border-blue-200 text-xs shadow-2xs">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Medium:</span>
                        <span className="font-bold text-blue-950">{sheet.medium}</span>
                      </div>
                    </>
                  )}

                  {/* Uploaded File Indicator Pill (If file has been uploaded) */}
                  {(sheet.fileName || sheet.sheetUrl) && (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all hover:opacity-85 shadow-2xs ' + (
                        isPdf
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}
                      title="Click to view uploaded sheet/PDF in new tab"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[170px]">{sheet.fileName || 'Uploaded Sheet'}</span>
                      <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                    </a>
                  )}
                </div>

                {/* Right / Samne: Upload PDF / Sheet button and Status dropdown ONLY (No link text input) */}
                <div className="flex items-center gap-2 lg:shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Upload PDF / Sheet Button */}
                  <button
                    type="button"
                    disabled={disabled || isUploadingThis}
                    onClick={() => triggerFileUpload(sheet.id)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    title="Upload PDF sheet or spreadsheet (.pdf, .xlsx, .xls, .csv)"
                  >
                    {isUploadingThis ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{sheet.fileName || sheet.sheetUrl ? 'Re-upload PDF / Sheet' : 'Upload PDF / Sheet'}</span>
                      </>
                    )}
                  </button>

                  {/* Status Dropdown */}
                  <select
                    disabled={disabled}
                    value={sheet.status}
                    onChange={(e) => handleInlineStatusChange(sheet.id, e.target.value)}
                    className={'text-[11px] font-black px-2.5 py-1.5 rounded-xl border focus:outline-none cursor-pointer shadow-2xs ' + statusMeta.badge}
                  >
                    <option value="READY">✅ Ready & Verified</option>
                    <option value="IN_PROGRESS">⏳ In Progress</option>
                    <option value="NEEDS_REVIEW">⚠️ Needs Review</option>
                    <option value="PENDING">📄 Pending Upload</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
