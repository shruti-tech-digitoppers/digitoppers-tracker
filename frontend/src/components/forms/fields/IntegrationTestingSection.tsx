'use client';

import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  LayoutDashboard, 
  BookOpen, 
  ExternalLink, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Send,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { IUser } from '../../../types/auth';

interface StreamTestResult {
  status: 'PASS' | 'NEEDS_IMPROVEMENT' | 'PENDING';
  sheetUrl: string;
  assignedTo: string;
  remarks: string;
}

interface TestingResultsValue {
  appTesting?: StreamTestResult;
  dashboardTesting?: StreamTestResult;
  contentTesting?: StreamTestResult;
}

interface IntegrationTestingSectionProps {
  value?: TestingResultsValue | any;
  onChange: (value: TestingResultsValue) => void;
  disabled?: boolean;
  employees?: IUser[];
}

export function IntegrationTestingSection({
  value,
  onChange,
  disabled = false,
  employees = [],
}: IntegrationTestingSectionProps) {
  // Normalize current stream states
  const appTesting: StreamTestResult = useMemo(() => ({
    status: value?.appTesting?.status || 'PENDING',
    sheetUrl: value?.appTesting?.sheetUrl || value?.appTesting?.sheetLink || '',
    assignedTo: value?.appTesting?.assignedTo || '',
    remarks: value?.appTesting?.remarks || ''
  }), [value?.appTesting]);

  const dashboardTesting: StreamTestResult = useMemo(() => ({
    status: value?.dashboardTesting?.status || 'PENDING',
    sheetUrl: value?.dashboardTesting?.sheetUrl || value?.dashboardTesting?.sheetLink || '',
    assignedTo: value?.dashboardTesting?.assignedTo || '',
    remarks: value?.dashboardTesting?.remarks || ''
  }), [value?.dashboardTesting]);

  const contentTesting: StreamTestResult = useMemo(() => ({
    status: value?.contentTesting?.status || 'PENDING',
    sheetUrl: value?.contentTesting?.sheetUrl || value?.contentTesting?.sheetLink || '',
    assignedTo: value?.contentTesting?.assignedTo || '',
    remarks: value?.contentTesting?.remarks || ''
  }), [value?.contentTesting]);

  const updateStream = (
    streamKey: 'appTesting' | 'dashboardTesting' | 'contentTesting',
    updates: Partial<StreamTestResult>
  ) => {
    if (disabled) return;
    const current = 
      streamKey === 'appTesting' ? appTesting : 
      streamKey === 'dashboardTesting' ? dashboardTesting : 
      contentTesting;

    const updated = { ...current, ...updates };

    const payload: TestingResultsValue = {
      appTesting: streamKey === 'appTesting' ? updated : appTesting,
      dashboardTesting: streamKey === 'dashboardTesting' ? updated : dashboardTesting,
      contentTesting: streamKey === 'contentTesting' ? updated : contentTesting
    };

    onChange(payload);
  };

  const streamsConfig = [
    {
      key: 'appTesting' as const,
      label: 'App Testing Results',
      subtitle: 'Mobile / Tablet / Smartboard Application Build QA',
      icon: <Smartphone className="w-5 h-5" />,
      colorTheme: 'from-[#eef7f8] to-white',
      accentBorder: 'border-[#51a8b1]/40',
      badgeBg: 'bg-[#51a8b1]',
      data: appTesting,
      placeholderUrl: 'https://docs.google.com/spreadsheets/d/app-test-sheet...',
      remarksPlaceholder: 'Enter App QA feedback, crash logs, device compatibility notes or improvement instructions...'
    },
    {
      key: 'dashboardTesting' as const,
      label: 'Dashboard Testing Results',
      subtitle: 'Admin Portal, Teacher Console & Analytics Verification',
      icon: <LayoutDashboard className="w-5 h-5" />,
      colorTheme: 'from-indigo-50/50 to-white',
      accentBorder: 'border-indigo-200',
      badgeBg: 'bg-indigo-600',
      data: dashboardTesting,
      placeholderUrl: 'https://docs.google.com/spreadsheets/d/dashboard-qa-sheet...',
      remarksPlaceholder: 'Enter Dashboard QA feedback, portal bugs, role permissions, or report sync remarks...'
    },
    {
      key: 'contentTesting' as const,
      label: 'Content Testing Results',
      subtitle: 'Board, Syllabus, Classes & Question Bank Verification',
      icon: <BookOpen className="w-5 h-5" />,
      colorTheme: 'from-teal-50/50 to-white',
      accentBorder: 'border-teal-200',
      badgeBg: 'bg-teal-600',
      data: contentTesting,
      placeholderUrl: 'https://docs.google.com/spreadsheets/d/content-qa-sheet...',
      remarksPlaceholder: 'Enter Content QA feedback, chapter missing items, Hindi/English medium typos, or question remarks...'
    }
  ];

  const anyNeedsImprovement = 
    appTesting.status === 'NEEDS_IMPROVEMENT' || 
    dashboardTesting.status === 'NEEDS_IMPROVEMENT' || 
    contentTesting.status === 'NEEDS_IMPROVEMENT';

  const allPassed = 
    appTesting.status === 'PASS' && 
    dashboardTesting.status === 'PASS' && 
    contentTesting.status === 'PASS';

  return (
    <div className="space-y-4 font-sans w-full">
      
      {/* Top Banner Status */}
      {anyNeedsImprovement ? (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Feedback Iteration Active:</span> One or more streams require improvement. When saved, high-priority notifications with your remarks and sheet link will be automatically dispatched to the assigned team members.
          </div>
        </div>
      ) : allPassed ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">All Testing Streams Passed:</span> App, Dashboard, and Content QA are verified and approved.
          </div>
        </div>
      ) : null}

      {/* 3 Testing Stream Cards */}
      <div className="space-y-4">
        {streamsConfig.map((stream) => {
          const currentData = stream.data;
          const assignedEmp = employees.find((e) => e._id === currentData.assignedTo);

          return (
            <div
              key={stream.key}
              className={`p-4 rounded-3xl border ${stream.accentBorder} bg-gradient-to-br ${stream.colorTheme} shadow-xs space-y-3.5 transition-all`}
            >
              {/* Header: Icon, Title, Status Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#b9c0cb]/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl ${stream.badgeBg} text-white flex items-center justify-center shadow-2xs shrink-0`}>
                    {stream.icon}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#333333] font-heading flex items-center gap-2">
                      {stream.label}
                    </h5>
                    <p className="text-[11px] text-[#8c96a5]">
                      {stream.subtitle}
                    </p>
                  </div>
                </div>

                {/* Status Selector Pill Buttons */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/80 p-1 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateStream(stream.key, { status: 'PASS' })}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      currentData.status === 'PASS'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-[#4a5462] hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pass</span>
                  </button>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateStream(stream.key, { status: 'NEEDS_IMPROVEMENT' })}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      currentData.status === 'NEEDS_IMPROVEMENT'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-[#4a5462] hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Needs Improvement</span>
                  </button>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => updateStream(stream.key, { status: 'PENDING' })}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      currentData.status === 'PENDING'
                        ? 'bg-slate-700 text-white shadow-2xs'
                        : 'text-[#8c96a5] hover:bg-slate-100 hover:text-[#333333]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </button>
                </div>
              </div>

              {/* Form Grid: Sheet Link + Assign To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sheet Link Input */}
                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#51a8b1]" />
                      Test Sheet / Google Sheet Link
                    </span>
                    {currentData.sheetUrl && (
                      <a
                        href={currentData.sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#51a8b1] hover:underline flex items-center gap-0.5 lowercase font-semibold"
                      >
                        open sheet <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      disabled={disabled}
                      value={currentData.sheetUrl}
                      onChange={(e) => updateStream(stream.key, { sheetUrl: e.target.value })}
                      placeholder={stream.placeholderUrl}
                      className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-[#b9c0cb]/60 rounded-xl text-[#333333] placeholder-[#8c96a5] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1]"
                    />
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#8c96a5] absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {/* Assign To (Assign Button / Dropdown) */}
                <div className="space-y-1">
                  <label className="block text-[10.5px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#51a8b1]" />
                      Assign Person for Improvement / Fixes
                    </span>
                    {assignedEmp && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                        Assigned
                      </span>
                    )}
                  </label>
                  <select
                    disabled={disabled}
                    value={currentData.assignedTo || ''}
                    onChange={(e) => updateStream(stream.key, { assignedTo: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-white border border-[#b9c0cb]/60 rounded-xl text-[#333333] font-medium focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] cursor-pointer"
                  >
                    <option value="">👤 Select Team Member to Assign...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({(emp as any).globalRole || 'Contributor'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks / Feedback Notes */}
              <div className="space-y-1">
                <label className="block text-[10.5px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#51a8b1]" />
                  Remarks & QA Feedback Notes
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  value={currentData.remarks}
                  onChange={(e) => updateStream(stream.key, { remarks: e.target.value })}
                  placeholder={stream.remarksPlaceholder}
                  className="w-full p-2.5 text-xs bg-white border border-[#b9c0cb]/60 rounded-xl text-[#333333] placeholder-[#8c96a5] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1]"
                />
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
