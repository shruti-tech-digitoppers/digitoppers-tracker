'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { schoolsApi } from '../../lib/api/schools.api';
import { ISchool, ISchoolProgressSummary, InstallationStatus, TrainingStatus } from '../../types/school';
import { IUser } from '../../types/auth';
import {
  School as SchoolIcon,
  Wrench,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  HardDrive,
  Calendar,
  FileCheck,
  Star,
  RefreshCw,
  X
} from 'lucide-react';

interface ProjectSchoolsViewProps {
  projectId: string;
  projectName?: string;
  employees: IUser[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSchoolsView({
  projectId,
  projectName,
  employees,
  isOpen,
  onClose,
}: ProjectSchoolsViewProps) {
  const [schools, setSchools] = useState<ISchool[]>([]);
  const [summary, setSummary] = useState<ISchoolProgressSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterInstallation, setFilterInstallation] = useState<string>('ALL');
  const [filterTraining, setFilterTraining] = useState<string>('ALL');

  // Modal states for editing
  const [editingSchool, setEditingSchool] = useState<ISchool | null>(null);
  const [actionType, setActionType] = useState<'INSTALLATION' | 'TRAINING' | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states
  const [installStatus, setInstallStatus] = useState<InstallationStatus>('PENDING');
  const [installEngineerId, setInstallEngineerId] = useState<string>('');
  const [installChallanUrl, setInstallChallanUrl] = useState<string>('');
  const [installRemarks, setInstallRemarks] = useState<string>('');

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>('PENDING');
  const [trainingTrainerId, setTrainingTrainerId] = useState<string>('');
  const [trainingTeachersCount, setTrainingTeachersCount] = useState<number>(0);
  const [trainingRating, setTrainingRating] = useState<number>(5);
  const [trainingAttendanceUrl, setTrainingAttendanceUrl] = useState<string>('');
  const [deliverySheetUrl, setDeliverySheetUrl] = useState<string>('');
  const [appreciationUrl, setAppreciationUrl] = useState<string>('');
  const [workCompletionUrl, setWorkCompletionUrl] = useState<string>('');
  const [teachersDetailsDocUrl, setTeachersDetailsDocUrl] = useState<string>('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    trainingDone: false,
    applicationWorking: false,
    teachersTraining: false,
    teachersIdCreated: false,
    photographyShootsDone: false,
    googleReviews: false,
  });
  const [trainingIssuesNoted, setTrainingIssuesNoted] = useState<string>('');
  const [trainingFeedback, setTrainingFeedback] = useState<string>('');
  const [trainingRemarks, setTrainingRemarks] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [schoolsData, summaryData] = await Promise.all([
        schoolsApi.getSchools({ projectId }),
        schoolsApi.getProjectSchoolSummary(projectId).catch(() => null),
      ]);
      setSchools(schoolsData || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load schools:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleOpenInstallModal = (school: ISchool) => {
    setEditingSchool(school);
    setActionType('INSTALLATION');
    setInstallStatus(school.installation?.status || 'PENDING');
    setInstallEngineerId(
      typeof school.installation?.assignedEngineerId === 'object'
        ? school.installation.assignedEngineerId?._id || ''
        : school.installation?.assignedEngineerId || ''
    );
    setInstallChallanUrl(school.installation?.signedChallanUrl || '');
    setInstallRemarks(school.installation?.remarks || '');
  };

  const handleOpenTrainingModal = (school: ISchool) => {
    setEditingSchool(school);
    setActionType('TRAINING');
    setTrainingStatus(school.training?.status || 'PENDING');
    setTrainingTrainerId(
      typeof school.training?.assignedTrainerId === 'object'
        ? school.training.assignedTrainerId?._id || ''
        : school.training?.assignedTrainerId || ''
    );
    setTrainingTeachersCount(school.training?.teachersTrainedCount || 0);
    setTrainingRating(school.training?.feedbackRating || 5);
    setTrainingAttendanceUrl(school.training?.attendanceSheetUrl || '');
    setDeliverySheetUrl(school.training?.deliveryConfirmationSheetUrl || '');
    setAppreciationUrl(school.training?.appreciationLetterUrl || '');
    setWorkCompletionUrl(school.training?.workCompletionLetterUrl || '');
    setTeachersDetailsDocUrl(school.training?.teachersDetailsDocUrl || '');
    setChecklist(
      school.training?.checklist || {
        trainingDone: false,
        applicationWorking: false,
        teachersTraining: false,
        teachersIdCreated: false,
        photographyShootsDone: false,
        googleReviews: false,
      }
    );
    setTrainingIssuesNoted(school.training?.issuesNoted || '');
    setTrainingFeedback(school.training?.onGroundFeedback || '');
    setTrainingRemarks(school.training?.remarks || '');
  };

  const handleSaveInstallation = async () => {
    if (!editingSchool) return;
    try {
      setSubmitting(true);
      await schoolsApi.updateInstallation(editingSchool._id, {
        status: installStatus,
        assignedEngineerId: installEngineerId || null,
        signedChallanUrl: installChallanUrl,
        remarks: installRemarks,
        completedDate: installStatus === 'COMPLETED' ? new Date().toISOString() : null,
      });
      setActionType(null);
      setEditingSchool(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save installation:', err);
      alert('Failed to update installation status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveTraining = async () => {
    if (!editingSchool) return;
    try {
      setSubmitting(true);
      await schoolsApi.updateTraining(editingSchool._id, {
        status: trainingStatus,
        assignedTrainerId: trainingTrainerId || null,
        teachersTrainedCount: Number(trainingTeachersCount),
        feedbackRating: Number(trainingRating),
        attendanceSheetUrl: trainingAttendanceUrl,
        deliveryConfirmationSheetUrl: deliverySheetUrl,
        appreciationLetterUrl: appreciationUrl,
        workCompletionLetterUrl: workCompletionUrl,
        teachersDetailsDocUrl: teachersDetailsDocUrl,
        checklist: checklist,
        issuesNoted: trainingIssuesNoted,
        onGroundFeedback: trainingFeedback,
        remarks: trainingRemarks,
        trainingDate: trainingStatus === 'COMPLETED' ? new Date().toISOString() : null,
      });
      setActionType(null);
      setEditingSchool(null);
      await loadData();
    } catch (err) {
      console.error('Failed to save training:', err);
      alert('Failed to update training status');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchools = schools.filter((s) => {
    const matchQuery =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.district && s.district.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchInstall =
      filterInstallation === 'ALL' || s.installation?.status === filterInstallation;

    const matchTrain =
      filterTraining === 'ALL' || s.training?.status === filterTraining;

    return matchQuery && matchInstall && matchTrain;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <SchoolIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                School-Centric Execution Hub
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {schools.length} Schools
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Project: <span className="text-slate-200 font-medium">{projectName || projectId}</span> • 1 School = 1 Autonomous Record
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Summary Cards */}
        {summary && (
          <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Installation Done</p>
                <p className="text-xl font-bold text-white font-heading">
                  {summary.installationCompleted} / {summary.totalSchools}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Install In-Progress</p>
                <p className="text-xl font-bold text-white font-heading">
                  {summary.installationInProgress + summary.installationScheduled}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider">Teacher Training</p>
                <p className="text-xl font-bold text-white font-heading">
                  {summary.trainingCompleted} / {summary.totalSchools}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-300">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Teachers Trained</p>
                <p className="text-xl font-bold text-white font-heading">{summary.totalTeachersTrained}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by school name, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>
            <select
              value={filterInstallation}
              onChange={(e) => setFilterInstallation(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
            >
              <option value="ALL">All Installations</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="IN_PROGRESS">⏳ In Progress</option>
              <option value="SCHEDULED">📅 Scheduled</option>
              <option value="PENDING">⚪ Pending</option>
            </select>

            <select
              value={filterTraining}
              onChange={(e) => setFilterTraining(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
            >
              <option value="ALL">All Trainings</option>
              <option value="COMPLETED">✅ Completed</option>
              <option value="SCHEDULED">📅 Scheduled</option>
              <option value="PENDING">⚪ Pending</option>
            </select>
          </div>
        </div>

        {/* School Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm">Loading school records...</p>
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-white/[0.01] rounded-2xl border border-white/5">
              <SchoolIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No schools match your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchools.map((school) => {
                const installDone = school.installation?.status === 'COMPLETED';
                const trainingDone = school.training?.status === 'COMPLETED';

                const engineer =
                  typeof school.installation?.assignedEngineerId === 'object'
                    ? school.installation.assignedEngineerId?.name
                    : 'Unassigned';

                const trainer =
                  typeof school.training?.assignedTrainerId === 'object'
                    ? school.training.assignedTrainerId?.name
                    : 'Unassigned';

                return (
                  <div
                    key={school._id}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all duration-200 flex flex-col justify-between shadow-sm group hover:border-emerald-500/30"
                  >
                    <div>
                      {/* School Title */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors font-heading leading-tight">
                            {school.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {school.district && (
                              <span className="text-[10.5px] text-slate-400">
                                📍 {school.district}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Allocated Hardware Tags */}
                      {school.hardware && school.hardware.length > 0 && (
                        <div className="my-2.5 flex flex-wrap gap-1.5">
                          {school.hardware.map((hw, idx) => {
                            const name =
                              typeof hw.hardwareId === 'object'
                                ? hw.hardwareId?.label || hw.hardwareId?.name
                                : 'Hardware';
                            return (
                              <span
                                key={idx}
                                className="text-[9.5px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-medium"
                              >
                                {name} × {hw.allocatedQuantity}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Installation & Training Mini Status Cards */}
                      <div className="mt-3 space-y-2 pt-3 border-t border-white/5">
                        {/* Installation Line */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-slate-300 font-medium">Installation:</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              installDone
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : school.installation?.status === 'IN_PROGRESS'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {school.installation?.status || 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-5">
                          Engineer: <span className="text-slate-200">{engineer}</span>
                        </p>

                        {/* Training Line */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-slate-300 font-medium">Training:</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              trainingDone
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {school.training?.status || 'PENDING'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 pl-5">
                          Trainer: <span className="text-slate-200">{trainer}</span>
                          {school.training?.teachersTrainedCount ? (
                            <span className="text-emerald-400 font-mono ml-1.5">
                              ({school.training.teachersTrainedCount} Teachers)
                            </span>
                          ) : null}
                        </p>

                        {/* Training Documents & Checklist Pills */}
                        {((school.training?.deliveryConfirmationSheetUrl) ||
                          (school.training?.appreciationLetterUrl) ||
                          (school.training?.workCompletionLetterUrl) ||
                          (school.training?.teachersDetailsDocUrl) ||
                          (school.training?.checklist && Object.values(school.training.checklist).some(Boolean))) && (
                          <div className="pt-2 pl-5 flex flex-wrap gap-1">
                            {school.training?.deliveryConfirmationSheetUrl && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                📄 Delivery Sheet
                              </span>
                            )}
                            {school.training?.appreciationLetterUrl && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                🏆 Appreciation
                              </span>
                            )}
                            {school.training?.workCompletionLetterUrl && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                📑 Completion
                              </span>
                            )}
                            {school.training?.teachersDetailsDocUrl && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                👥 Teachers PDF
                              </span>
                            )}
                            {school.training?.checklist && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                ✓ {Object.values(school.training.checklist).filter(Boolean).length}/6 Checks
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenInstallModal(school)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1"
                      >
                        <Wrench className="w-3 h-3" /> Update Install
                      </button>
                      <button
                        onClick={() => handleOpenTrainingModal(school)}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-medium transition-all flex items-center justify-center gap-1"
                      >
                        <GraduationCap className="w-3 h-3" /> Update Train
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ MODAL: Update Installation */}
      {actionType === 'INSTALLATION' && editingSchool && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/20 rounded-2xl w-full max-w-md p-5 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2 font-heading">
              <Wrench className="w-4 h-4 text-amber-400" /> Update Installation Status
            </h3>
            <p className="text-xs text-slate-400 mb-4">{editingSchool.name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Installation Status</label>
                <select
                  value={installStatus}
                  onChange={(e) => setInstallStatus(e.target.value as InstallationStatus)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="PENDING">PENDING (Not Started)</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED (Fully Installed & Tested)</option>
                  <option value="FAILED">FAILED (Issues found)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign Field Engineer</label>
                <select
                  value={installEngineerId}
                  onChange={(e) => setInstallEngineerId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">Select Field Engineer</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || 'Engineer'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Signed Challan / Proof URL</label>
                <input
                  type="text"
                  placeholder="https://s3.../challan.pdf"
                  value={installChallanUrl}
                  onChange={(e) => setInstallChallanUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Engineer Remarks</label>
                <textarea
                  rows={2}
                  placeholder="IFP mounting details, cable wiring, etc."
                  value={installRemarks}
                  onChange={(e) => setInstallRemarks(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setActionType(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSaveInstallation}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20"
              >
                {submitting ? 'Saving...' : 'Save Installation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎓 MODAL: Update Training */}
      {actionType === 'TRAINING' && editingSchool && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-white/20 rounded-2xl w-full max-w-xl max-h-[88vh] overflow-y-auto p-5 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2 font-heading">
              <GraduationCap className="w-4 h-4 text-sky-400" /> Update Teacher Training Status & Execution
            </h3>
            <p className="text-xs text-slate-400 mb-4">{editingSchool.name}</p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Training Status</label>
                  <select
                    value={trainingStatus}
                    onChange={(e) => setTrainingStatus(e.target.value as TrainingStatus)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-400"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assign Trainer</label>
                  <select
                    value={trainingTrainerId}
                    onChange={(e) => setTrainingTrainerId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">Select Trainer</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.designation || 'Trainer'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Teachers Trained Count</label>
                  <input
                    type="number"
                    min={0}
                    value={trainingTeachersCount}
                    onChange={(e) => setTrainingTeachersCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Feedback Rating (1-5)</label>
                  <select
                    value={trainingRating}
                    onChange={(e) => setTrainingRating(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                    <option value={3}>⭐⭐⭐ (3/5 Good)</option>
                    <option value={2}>⭐⭐ (2/5 Average)</option>
                    <option value={1}>⭐ (1/5 Needs Improvement)</option>
                  </select>
                </div>
              </div>

              {/* Stage 07 Execution Documents Grid */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2.5">
                <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5" /> Stage 07 Sign-off Documents (PDF Uploads)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-slate-400 mb-0.5">1. Delivery Confirmation Sheet</label>
                    <input
                      type="text"
                      placeholder="https://.../delivery_sheet.pdf"
                      value={deliverySheetUrl}
                      onChange={(e) => setDeliverySheetUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">2. Appreciation Letter</label>
                    <input
                      type="text"
                      placeholder="https://.../appreciation.pdf"
                      value={appreciationUrl}
                      onChange={(e) => setAppreciationUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">3. Work Completion Letter</label>
                    <input
                      type="text"
                      placeholder="https://.../completion.pdf"
                      value={workCompletionUrl}
                      onChange={(e) => setWorkCompletionUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-0.5">4. Teachers Details (PDF Upload)</label>
                    <input
                      type="text"
                      placeholder="https://.../teachers_details.pdf"
                      value={teachersDetailsDocUrl}
                      onChange={(e) => setTeachersDetailsDocUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 07 Interactive Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/10 space-y-2">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Training Verification Checklist
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'trainingDone', label: '1. Training Done' },
                    { key: 'applicationWorking', label: '2. Application Working' },
                    { key: 'teachersTraining', label: '3. Teachers Training' },
                    { key: 'teachersIdCreated', label: '4. Teachers ID Created' },
                    { key: 'photographyShootsDone', label: '5. Photography / Shoots Done' },
                    { key: 'googleReviews', label: '6. Google Reviews' },
                  ].map((item) => {
                    const isChecked = !!checklist[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                        }
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-sm'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                            isChecked ? 'bg-emerald-500 text-white' : 'border border-slate-600'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </div>
                        <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Issues Noted, On Ground Feedback, Remarks */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Issues Noted during Training / Setup
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Note down any hardware, application, or attendance issues..."
                    value={trainingIssuesNoted}
                    onChange={(e) => setTrainingIssuesNoted(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" /> On Ground Feedback from Teachers / Principal
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter teacher reactions, usability remarks, or requests from ground..."
                    value={trainingFeedback}
                    onChange={(e) => setTrainingFeedback(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 resize-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Remarks & Observations</label>
                  <textarea
                    rows={2}
                    placeholder="Enter general training execution notes or observations..."
                    value={trainingRemarks}
                    onChange={(e) => setTrainingRemarks(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-sky-400 resize-none text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/10 pt-4">
              <button
                onClick={() => setActionType(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSaveTraining}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                {submitting ? 'Saving...' : 'Save Training to ProjectSchools'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
