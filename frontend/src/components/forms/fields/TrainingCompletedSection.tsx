'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  Check,
  X,
  Clock,
  AlertCircle,
  MapPin,
  Phone,
  UserCheck,
  User,
  GraduationCap,
  Search,
  Sparkles,
  Filter,
  RotateCcw,
  FileText,
  Calendar,
  CheckSquare
} from 'lucide-react';
import { IUser } from '../../../types/auth';
import { IProject } from '../../../types/project';
import { extractEffectiveSchools, EffectiveSchoolItem } from '../utils/formHelpers';

export interface ISchoolTrainingCompletionItem {
  schoolId: string;
  schoolName: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  principalName?: string;
  assignedTrainerName?: string;
  assignedTrainerPhone?: string;
  planOutDate?: string;
  completed: 'YES' | 'NO';
  isCompleted: boolean;
  remarks?: string;
}

interface TrainingCompletedSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
  project?: IProject | null;
  schools?: any[];
}

export function TrainingCompletedSection({
  value,
  onChange,
  disabled = false,
  employees = [],
  allFormData = {},
  project = null,
  schools = [],
}: TrainingCompletedSectionProps) {
  // 1. Effective Schools List
  const effectiveSchools = useMemo<EffectiveSchoolItem[]>(() => {
    return extractEffectiveSchools(schools, allFormData, value);
  }, [schools, allFormData, value]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');

  // Overall remarks state
  const [overallRemarks, setOverallRemarks] = useState<string>(() => {
    return (
      value?.remarks ||
      allFormData?.trainingCompletedSection?.remarks ||
      allFormData?.remarks ||
      ''
    );
  });

  // 2. School-wise completion map keyed by schoolId
  const extractCompletionMap = useCallback(
    (sourceValue: any, schoolsList: EffectiveSchoolItem[]): Record<string, ISchoolTrainingCompletionItem> => {
      const map: Record<string, ISchoolTrainingCompletionItem> = {};

      // A. Existing completion map source
      const sourceMap =
        (sourceValue?.schoolWiseTrainingCompletion && typeof sourceValue.schoolWiseTrainingCompletion === 'object' && !Array.isArray(sourceValue.schoolWiseTrainingCompletion)
          ? sourceValue.schoolWiseTrainingCompletion
          : null) ||
        (sourceValue?.trainingCompletedSection && typeof sourceValue.trainingCompletedSection === 'object' && !Array.isArray(sourceValue.trainingCompletedSection)
          ? sourceValue.trainingCompletedSection
          : null) ||
        (allFormData?.schoolWiseTrainingCompletion && typeof allFormData.schoolWiseTrainingCompletion === 'object' && !Array.isArray(allFormData.schoolWiseTrainingCompletion)
          ? allFormData.schoolWiseTrainingCompletion
          : null) ||
        (allFormData?.trainingCompletedSection && typeof allFormData.trainingCompletedSection === 'object' && !Array.isArray(allFormData.trainingCompletedSection)
          ? allFormData.trainingCompletedSection
          : null) ||
        {};

      Object.entries(sourceMap).forEach(([k, v]: [string, any]) => {
        if (v && typeof v === 'object' && (v.schoolId || v.schoolName || v.completed !== undefined)) {
          const isComp = v.completed === 'YES' || v.isCompleted === true;
          map[k] = {
            ...v,
            completed: isComp ? 'YES' : 'NO',
            isCompleted: isComp
          };
          if (v.schoolId && !map[v.schoolId]) {
            map[v.schoolId] = map[k];
          }
        }
      });

      // B. Array source
      const rawArray =
        (Array.isArray(sourceValue) ? sourceValue : null) ||
        (Array.isArray(sourceValue?.schools) ? sourceValue.schools : null) ||
        (Array.isArray(sourceValue?.plannedSchools) ? sourceValue.plannedSchools : null);

      if (Array.isArray(rawArray) && rawArray.length > 0) {
        rawArray.forEach((item: any) => {
          const sId = String(item.schoolId || item.id || item._id || '');
          if (sId) {
            const isComp = item.completed === 'YES' || item.isCompleted === true || item.status === 'COMPLETED' || item.executionStatus === 'COMPLETED';
            map[sId] = {
              ...map[sId],
              schoolId: sId,
              schoolName: item.schoolName || item.name || 'School',
              completed: isComp ? 'YES' : 'NO',
              isCompleted: isComp,
              remarks: item.remarks || map[sId]?.remarks || ''
            };
          }
        });
      }

      // C. Ensure all effective schools exist in map
      schoolsList.forEach((sch) => {
        const found =
          map[sch.id] ||
          (sch.school ? map[String(sch.school)] : null) ||
          Object.values(map).find(
            (p) =>
              (p.schoolId && (p.schoolId === sch.id || p.schoolId === String(sch.school))) ||
              (p.schoolName && sch.name && p.schoolName.toLowerCase().trim() === sch.name.toLowerCase().trim())
          );

        // Check if previously marked completed in DB or Stage 07.2 Execution
        const dbTraining = sch.training || (sch.school && typeof sch.school === 'object' ? sch.school.training : null) || {};
        const stage72Exec =
          allFormData?.schoolWiseTrainingExecutions?.[sch.id] ||
          allFormData?.trainingExecutionSection?.[sch.id] ||
          {};

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

        // Check if an explicit choice was already made in sourceMap or user edits
        let isFinalCompleted = false;
        if (found && (found.completed !== undefined || found.isCompleted !== undefined)) {
          isFinalCompleted = found.completed === 'YES' || found.isCompleted === true;
        } else {
          // Auto-detect ONLY on clean initial state when no explicit choice exists
          isFinalCompleted =
            dbTraining.status === 'COMPLETED' ||
            stage72Exec.status === 'COMPLETED' ||
            stage72Exec.executionStatus === 'COMPLETED' ||
            Boolean(stage72Exec.deliveryConfirmationSheetUrl && stage72Exec.checklist?.trainingDone);
        }

        map[sch.id] = {
          schoolId: sch.id,
          schoolName: sch.name || found?.schoolName || 'School',
          address: sch.address || found?.address || '',
          contactPerson: sch.pocName || sch.contactPerson || sch.principalName || found?.contactPerson || 'Site Principal',
          contactPhone: sch.pocContact || sch.contactPhone || sch.phone || found?.contactPhone || '',
          principalName: sch.principalName || found?.principalName || '',
          assignedTrainerName: assignedTrainerName || found?.assignedTrainerName || '',
          assignedTrainerPhone: assignedTrainerPhone || found?.assignedTrainerPhone || '',
          planOutDate: planOutDate || found?.planOutDate || '',
          completed: isFinalCompleted ? 'YES' : 'NO',
          isCompleted: Boolean(isFinalCompleted),
          remarks: found?.remarks !== undefined ? found.remarks : (stage72Exec.remarks || dbTraining.remarks || '')
        };
      });

      return map;
    },
    [allFormData]
  );

  const hasUserInteractedRef = React.useRef(false);

  const [completionMap, setCompletionMap] = useState<Record<string, ISchoolTrainingCompletionItem>>(() => {
    return extractCompletionMap(value, effectiveSchools);
  });

  // Re-sync if external value or schools changes, preserving user interactions
  useEffect(() => {
    if (!value) return;
    setCompletionMap((prev) => {
      const fresh = extractCompletionMap(value, effectiveSchools);
      if (!hasUserInteractedRef.current) {
        return fresh;
      }
      // If user has interacted, keep user's manual choice for each school
      const merged: Record<string, ISchoolTrainingCompletionItem> = { ...fresh };
      Object.keys(prev).forEach((k) => {
        if (prev[k] && merged[k]) {
          merged[k] = {
            ...merged[k],
            completed: prev[k].completed,
            isCompleted: prev[k].isCompleted,
            remarks: prev[k].remarks !== undefined ? prev[k].remarks : merged[k].remarks
          };
        }
      });
      return merged;
    });
  }, [value, effectiveSchools, extractCompletionMap]);

  // Calculate metrics
  const completedCount = useMemo(() => {
    return effectiveSchools.filter((sch) => completionMap[sch.id]?.completed === 'YES').length;
  }, [effectiveSchools, completionMap]);

  const completionPercentage = useMemo(() => {
    if (effectiveSchools.length === 0) return 0;
    return Math.round((completedCount / effectiveSchools.length) * 100);
  }, [completedCount, effectiveSchools.length]);

  const isAllCompleted = effectiveSchools.length > 0 && completedCount === effectiveSchools.length;

  // Emit changes to parent
  const emitUpdate = useCallback(
    (nextMap: Record<string, ISchoolTrainingCompletionItem>, nextRemarks?: string) => {
      const rem = nextRemarks !== undefined ? nextRemarks : overallRemarks;
      const count = effectiveSchools.filter((sch) => nextMap[sch.id]?.completed === 'YES').length;
      const allDone = effectiveSchools.length > 0 && count === effectiveSchools.length;

      const activeList = effectiveSchools.map((sch) => {
        return (
          nextMap[sch.id] || {
            schoolId: sch.id,
            schoolName: sch.name,
            completed: 'NO' as const,
            isCompleted: false,
            remarks: ''
          }
        );
      });

      onChange({
        schoolWiseTrainingCompletion: nextMap,
        trainingCompletedSection: nextMap,
        completed: allDone ? 'YES' : 'NO',
        overallStatus: allDone ? 'COMPLETED' : 'IN_PROGRESS',
        completedSchoolsCount: count,
        totalSchoolsCount: effectiveSchools.length,
        remarks: rem,
        schools: activeList,
        plannedSchools: activeList
      });
    },
    [effectiveSchools, overallRemarks, onChange]
  );

  // Toggle school Yes / No completion
  const handleSetSchoolCompletion = (schoolId: string, status: 'YES' | 'NO') => {
    if (disabled) return;
    hasUserInteractedRef.current = true;
    const existing = completionMap[schoolId] || {
      schoolId,
      schoolName: effectiveSchools.find((s) => s.id === schoolId)?.name || 'School',
      completed: status,
      isCompleted: status === 'YES',
      remarks: ''
    };

    const nextMap: Record<string, ISchoolTrainingCompletionItem> = {
      ...completionMap,
      [schoolId]: {
        ...existing,
        completed: status,
        isCompleted: status === 'YES'
      }
    };

    setCompletionMap(nextMap);
    emitUpdate(nextMap);
  };

  // Update school remarks
  const handleUpdateSchoolRemarks = (schoolId: string, remarksVal: string) => {
    if (disabled) return;
    hasUserInteractedRef.current = true;
    const existing = completionMap[schoolId] || {
      schoolId,
      schoolName: effectiveSchools.find((s) => s.id === schoolId)?.name || 'School',
      completed: 'NO' as const,
      isCompleted: false,
      remarks: ''
    };

    const nextMap = {
      ...completionMap,
      [schoolId]: {
        ...existing,
        remarks: remarksVal
      }
    };

    setCompletionMap(nextMap);
    emitUpdate(nextMap);
  };

  // Bulk actions: Mark all Yes / Mark all No
  const handleMarkAll = (status: 'YES' | 'NO') => {
    if (disabled) return;
    hasUserInteractedRef.current = true;
    const nextMap: Record<string, ISchoolTrainingCompletionItem> = { ...completionMap };
    effectiveSchools.forEach((sch) => {
      const cur = nextMap[sch.id] || {
        schoolId: sch.id,
        schoolName: sch.name,
        completed: status,
        isCompleted: status === 'YES',
        remarks: ''
      };
      nextMap[sch.id] = {
        ...cur,
        completed: status,
        isCompleted: status === 'YES'
      };
    });

    setCompletionMap(nextMap);
    emitUpdate(nextMap);
  };

  // Handle overall remarks change
  const handleOverallRemarksChange = (text: string) => {
    setOverallRemarks(text);
    emitUpdate(completionMap, text);
  };

  // Filtered schools list for view
  const filteredSchools = useMemo(() => {
    return effectiveSchools.filter((sch) => {
      const item = completionMap[sch.id];
      const matchesSearch =
        !searchQuery ||
        sch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sch.address && sch.address.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'COMPLETED') {
        return item?.completed === 'YES';
      }
      if (statusFilter === 'PENDING') {
        return item?.completed !== 'YES';
      }

      return true;
    });
  }, [effectiveSchools, completionMap, searchQuery, statusFilter]);

  return (
    <div className="space-y-4 font-sans animate-in fade-in-50 duration-200">
      {/* ── HEADER CARD: SUMMARY & BULK ACTIONS ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#3a7d84] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs">
              03
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-bold text-base text-slate-900 tracking-tight leading-tight">
                  SCHOOL-WISE TRAINING COMPLETION SIGN-OFF
                </h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isAllCompleted
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]'
                }`}>
                  {completedCount} of {effectiveSchools.length} Schools Completed
                </span>
              </div>
            </div>
          </div>

          {/* Quick Bulk Actions */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleMarkAll('YES')}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="Mark all schools as completed"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark All Yes</span>
            </button>

            <button
              type="button"
              onClick={() => handleMarkAll('NO')}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
              title="Reset all schools to pending"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All No</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600">Completion Rollup</span>
            <span className="font-mono text-[#3a7d84] font-bold">{completionPercentage}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-[#3a7d84] to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative grow max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search school by name or address..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8fafb] border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#3a7d84] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({effectiveSchools.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pending ({effectiveSchools.length - completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* ── SCHOOL-WISE LIST CONTAINER ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-gradient-to-r from-[#fbfdfd] via-[#f7fafb] to-white border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 font-heading">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#3a7d84]" />
            <span>SCHOOLS LIST ({filteredSchools.length} of {effectiveSchools.length})</span>
          </div>
          <span className="text-[11px] font-normal text-slate-400">
            Select Yes if training is fully delivered & signed off
          </span>
        </div>

        {filteredSchools.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No schools found matching the filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSchools.map((sch, idx) => {
              const item = completionMap[sch.id] || {
                schoolId: sch.id,
                schoolName: sch.name,
                completed: 'NO' as const,
                isCompleted: false,
                remarks: ''
              };
              const isYes = item.completed === 'YES';

              return (
                <div
                  key={sch.id}
                  className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isYes ? 'bg-emerald-50/20 hover:bg-emerald-50/30' : 'hover:bg-[#f8fafb]'
                  }`}
                >
                  {/* Left: School Identity & Details */}
                  <div className="flex items-start gap-3 min-w-0 grow">
                    {/* Index Bullet Number */}
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 shadow-2xs transition-colors ${
                      isYes ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0 space-y-1 grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 font-heading tracking-tight truncate">
                          {sch.name}
                        </h4>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isYes
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isYes ? '✓ Completed' : '○ Pending'}
                        </span>
                      </div>

                      {/* Details row: Address & POC */}
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500">
                        {sch.address && (
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{sch.address}</span>
                          </div>
                        )}

                        {(sch.pocName || sch.contactPerson) && (
                          <div className="flex items-center gap-1 min-w-0">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{sch.pocName || sch.contactPerson}</span>
                            {(sch.pocContact || sch.contactPhone) && (
                              <span className="text-slate-400">({sch.pocContact || sch.contactPhone})</span>
                            )}
                          </div>
                        )}

                        {(item.assignedTrainerName || sch.technicalPersonName) && (
                          <div className="flex items-center gap-1 text-[#3a7d84] font-medium">
                            <User className="w-3.5 h-3.5 shrink-0" />
                            <span>Trainer: {item.assignedTrainerName || sch.technicalPersonName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Yes / No Switch + Remarks Input */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 lg:max-w-md w-full lg:w-auto">
                    {/* YES / NO Toggle Segmented Pills */}
                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0 shadow-2xs self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleSetSchoolCompletion(sch.id, 'YES')}
                        disabled={disabled}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isYes
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Yes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetSchoolCompletion(sch.id, 'NO')}
                        disabled={disabled}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          !isYes
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>No</span>
                      </button>
                    </div>

                    {/* School Remarks input */}
                    <input
                      type="text"
                      value={item.remarks || ''}
                      onChange={(e) => handleUpdateSchoolRemarks(sch.id, e.target.value)}
                      placeholder="School remarks (optional)..."
                      disabled={disabled}
                      className="grow sm:w-56 text-xs p-2 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] text-slate-900 placeholder:text-slate-400 transition shadow-2xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── OVERALL REMARKS CARD ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <label className="text-xs font-bold text-slate-900 font-heading flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-[#3a7d84]" />
          <span>Overall Training Completion Remarks</span>
        </label>
        <textarea
          rows={3}
          value={overallRemarks}
          onChange={(e) => handleOverallRemarksChange(e.target.value)}
          placeholder="Enter overall training completion sign-off remarks, coordinator feedback, or next steps..."
          disabled={disabled}
          className="w-full text-xs font-medium p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#3a7d84]/20 focus:border-[#3a7d84] text-slate-900 placeholder:text-slate-400 shadow-2xs resize-none transition"
        />
      </div>
    </div>
  );
}

export default TrainingCompletedSection;
