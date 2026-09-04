'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Globe2,
  UserCheck,
  ShieldCheck,
  RefreshCw,
  FileCheck2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { IProject } from '../../../types/project';
import { IUser } from '../../../types/auth';

interface ProjectReviewSectionProps {
  value: Record<string, any>;
  onChange: (val: Record<string, any>) => void;
  disabled?: boolean;
  project?: IProject | null;
  currentUser?: IUser | null;
  onSubmitAndComplete?: (data: Record<string, any>) => Promise<void>;
  onSubmitAndReject?: (data: Record<string, any>) => Promise<void>;
}

export function ProjectReviewSection({
  value = {},
  onChange,
  disabled = false,
  project = null,
  currentUser = null,
  onSubmitAndComplete,
  onSubmitAndReject,
}: ProjectReviewSectionProps) {
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  // Derive initial values from project if not in value
  const initialProjectName = value.projectName || project?.title || (project as any)?.projectName || value.organizationName || '';
  const initialEmail = value.email !== undefined ? value.email : ((project as any)?.email || '');
  const initialPhone = value.phone !== undefined ? value.phone : ((project as any)?.phone || '');
  const initialCountry = value.country !== undefined ? value.country : ((project as any)?.countryName || (project as any)?.country || 'India');
  const initialAddress = value.address !== undefined ? value.address : ((project as any)?.address || value.location || '');
  const pmName = project?.projectManager && typeof project.projectManager === 'object'
    ? (project.projectManager as any).name || (project.projectManager as any).email
    : (project?.projectManager || currentUser?.name || value.reviewedBy || 'Project Manager');

  // Sync initial values on mount
  useEffect(() => {
    const updates: Record<string, any> = {};
    let hasUpdates = false;

    if (!value.projectName && initialProjectName) {
      updates.projectName = initialProjectName;
      updates.organizationName = initialProjectName;
      hasUpdates = true;
    }
    if (!value.email && initialEmail) {
      updates.email = initialEmail;
      hasUpdates = true;
    }
    if (!value.phone && initialPhone) {
      updates.phone = initialPhone;
      hasUpdates = true;
    }
    if (!value.country && initialCountry) {
      updates.country = initialCountry;
      hasUpdates = true;
    }
    if (!value.address && initialAddress) {
      updates.address = initialAddress;
      updates.location = initialAddress;
      hasUpdates = true;
    }
    if (!value.reviewedBy && pmName) {
      updates.reviewedBy = pmName;
      hasUpdates = true;
    }

    if (hasUpdates) {
      onChange({ ...value, ...updates });
    }
  }, [project, currentUser]);

  const handleInputChange = (field: string, val: string) => {
    const updates: Record<string, any> = { [field]: val };
    if (field === 'projectName') updates.organizationName = val;
    if (field === 'address') updates.location = val;
    onChange({
      ...value,
      ...updates,
    });
  };

  // State of review decision: YES / NO / PENDING
  const projectReviewed = value.projectReviewed || (value.confirmed === 'YES' ? 'YES' : value.confirmed === 'NO' ? 'NO' : 'PENDING');
  const projectCreated = value.projectCreated || (projectReviewed === 'YES' ? 'YES' : projectReviewed === 'NO' ? 'NO' : 'PENDING');

  // When clicking "Project Reviewed: YES / NO" -> Automatically shifts "Project Created" to YES (GREEN) or NO (RED)
  const handleReviewDecision = (decision: 'YES' | 'NO') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isYes = decision === 'YES';

    onChange({
      ...value,
      projectName: value.projectName || initialProjectName,
      organizationName: value.projectName || initialProjectName,
      email: value.email !== undefined ? value.email : initialEmail,
      phone: value.phone !== undefined ? value.phone : initialPhone,
      country: value.country !== undefined ? value.country : initialCountry,
      address: value.address !== undefined ? value.address : initialAddress,
      location: value.address !== undefined ? value.address : initialAddress,
      projectReviewed: decision,
      projectCreated: isYes ? 'YES' : 'NO', // Auto-shift to YES or NO
      confirmed: isYes ? 'YES' : 'NO',
      pmReviewStatus: isYes ? 'APPROVED' : 'REJECTED',
      confirmationDate: value.confirmationDate || todayStr,
      reviewedBy: pmName,
    });
  };

  const handleCreatedToggle = (createdVal: 'YES' | 'NO') => {
    onChange({
      ...value,
      projectCreated: createdVal,
      confirmed: createdVal === 'YES' ? 'YES' : 'NO',
      pmReviewStatus: createdVal === 'YES' ? 'APPROVED' : 'REJECTED',
    });
  };

  const handleCompleteStage = async () => {
    if (disabled || submittingAction) return;
    try {
      setSubmittingAction('APPROVE');
      const todayStr = new Date().toISOString().split('T')[0];
      const dataToSave = {
        ...value,
        projectName: value.projectName || initialProjectName,
        organizationName: value.projectName || initialProjectName,
        email: value.email !== undefined ? value.email : initialEmail,
        phone: value.phone !== undefined ? value.phone : initialPhone,
        country: value.country !== undefined ? value.country : initialCountry,
        address: value.address !== undefined ? value.address : initialAddress,
        location: value.address !== undefined ? value.address : initialAddress,
        projectReviewed: 'YES',
        projectCreated: 'YES',
        confirmed: 'YES',
        pmReviewStatus: 'APPROVED',
        confirmationDate: value.confirmationDate || todayStr,
        reviewedBy: pmName,
        autoComplete: true,
      };
      onChange(dataToSave);
      if (onSubmitAndComplete) {
        await onSubmitAndComplete(dataToSave);
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleRejectStage = async () => {
    if (disabled || submittingAction) return;
    try {
      setSubmittingAction('REJECT');
      const todayStr = new Date().toISOString().split('T')[0];
      const dataToSave = {
        ...value,
        projectName: value.projectName || initialProjectName,
        organizationName: value.projectName || initialProjectName,
        email: value.email !== undefined ? value.email : initialEmail,
        phone: value.phone !== undefined ? value.phone : initialPhone,
        country: value.country !== undefined ? value.country : initialCountry,
        address: value.address !== undefined ? value.address : initialAddress,
        location: value.address !== undefined ? value.address : initialAddress,
        projectReviewed: 'NO',
        projectCreated: 'NO',
        confirmed: 'NO',
        pmReviewStatus: 'REJECTED',
        confirmationDate: value.confirmationDate || todayStr,
        reviewedBy: pmName,
      };
      onChange(dataToSave);
      if (onSubmitAndReject) {
        await onSubmitAndReject(dataToSave);
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Top Header ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#3a7d84]/15 via-[#51a8b1]/10 to-white border border-[#51a8b1]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#51a8b1]/20 text-[#3a7d84] border border-[#51a8b1]/30">
                Stage 01
              </span>
              <h3 className="text-sm font-bold text-[#1f2937] font-heading">
                01 — PROJECT REVIEWER
              </h3>
            </div>
            <p className="text-xs text-[#4a5462] mt-0.5">
              Review project inputs, confirm review (Yes/No), and verify Project Created status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-[#51a8b1]" />
            PM: <strong>{pmName}</strong>
          </span>
        </div>
      </div>

      {/* ── 2. Project Details Inputs (Name, Email, Country, Phone, Address) ── */}
      <div className="bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#b9c0cb]/20 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
            <Building2 className="w-4 h-4 text-[#51a8b1]" />
            Project Details &amp; Inputs
          </span>
          <span className="text-[10px] text-[#6b7280]">Verified from Dashboard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* 1. Project Name */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                value={value.projectName !== undefined ? value.projectName : initialProjectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter Project Name..."
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
              />
            </div>
          </div>

          {/* 2. Email Address */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                disabled={disabled}
                value={value.email !== undefined ? value.email : initialEmail}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address..."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
              />
            </div>
          </div>

          {/* 3. Country */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Country
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                value={value.country !== undefined ? value.country : initialCountry}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="e.g. India"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
              />
            </div>
          </div>

          {/* 4. Phone Number */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={disabled}
                value={value.phone !== undefined ? value.phone : initialPhone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number..."
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
              />
            </div>
          </div>

          {/* 5. Address */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Address / Deployment Location
            </label>
            <input
              type="text"
              disabled={disabled}
              value={value.address !== undefined ? value.address : initialAddress}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter site / deployment address..."
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Step 1: Project Reviewed Option (YES / NO) ─── */}
      <div className="bg-white border-2 border-[#51a8b1]/40 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
              <FileCheck2 className="w-4 h-4 text-[#51a8b1]" />
              Step 1: Project Reviewed (Yes / No)?
            </h4>
            <p className="text-xs text-[#4a5462] mt-0.5">
              Has this project been reviewed and confirmed by Project Manager?
            </p>
          </div>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
            projectReviewed === 'YES'
              ? 'bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6]'
              : projectReviewed === 'NO'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {projectReviewed === 'YES' ? '✅ Reviewed (YES)' : projectReviewed === 'NO' ? '❌ Not Reviewed (NO)' : '⏳ Awaiting Decision'}
          </span>
        </div>

        {/* 2 Buttons: YES / NO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* YES Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleReviewDecision('YES')}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              projectReviewed === 'YES'
                ? 'bg-[#f7fbe9] border-[#a8cf45] shadow-md ring-2 ring-[#a8cf45]/20'
                : 'bg-white border-gray-200 hover:border-[#a8cf45]/60 hover:bg-[#f7fbe9]/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                projectReviewed === 'YES' ? 'bg-[#a8cf45] text-white shadow-xs' : 'bg-gray-100 text-gray-400'
              }`}>
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1f2937] block">
                  YES — Project Reviewed
                </span>
                <span className="text-[11px] text-[#4b5563]">
                  Shifts &amp; turns Project Created to <strong className="text-[#3b5e14]">GREEN</strong>
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              projectReviewed === 'YES' ? 'bg-[#a8cf45] text-[#2c3e10]' : 'bg-gray-100 text-gray-500'
            }`}>
              YES
            </span>
          </button>

          {/* NO Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleReviewDecision('NO')}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
              projectReviewed === 'NO'
                ? 'bg-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/20'
                : 'bg-white border-gray-200 hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                projectReviewed === 'NO' ? 'bg-rose-500 text-white shadow-xs' : 'bg-gray-100 text-gray-400'
              }`}>
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#1f2937] block">
                  NO — Not Approved
                </span>
                <span className="text-[11px] text-[#4b5563]">
                  Shifts &amp; turns Project Created to <strong className="text-rose-700">RED</strong>
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
              projectReviewed === 'NO' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
            }`}>
              NO
            </span>
          </button>
        </div>
      </div>

      {/* ── 4. Step 2: Task: Project Created (Automatic Green / Red Shift) ── */}
      <div className={`rounded-2xl p-4.5 border-2 transition-all duration-300 ${
        projectCreated === 'YES'
          ? 'bg-gradient-to-r from-[#f7fbe9] via-[#f1f8db] to-[#f7fbe9] border-[#a8cf45] shadow-md ring-2 ring-[#a8cf45]/30'
          : projectCreated === 'NO'
          ? 'bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-rose-500 shadow-md ring-2 ring-rose-500/30'
          : 'bg-gray-50 border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0 transition-colors ${
              projectCreated === 'YES'
                ? 'bg-gradient-to-br from-[#a8cf45] to-[#759724]'
                : projectCreated === 'NO'
                ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                : 'bg-gray-400'
            }`}>
              {projectCreated === 'YES' ? (
                <CheckCircle2 className="w-5 h-5 animate-in zoom-in-75 duration-200" />
              ) : projectCreated === 'NO' ? (
                <XCircle className="w-5 h-5 animate-in zoom-in-75 duration-200" />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-current">
                  Subtask Status
                </span>
                <h4 className="text-sm font-bold font-heading">
                  Task: Project Created
                </h4>
              </div>

              <p className="text-xs mt-0.5 font-medium">
                {projectCreated === 'YES' ? (
                  <span className="text-[#3b5e14] font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#759724]" />
                    Project Created is Confirmed &amp; Verified (GREEN)
                  </span>
                ) : projectCreated === 'NO' ? (
                  <span className="text-rose-700 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Project Created is Rejected / Blocked (RED)
                  </span>
                ) : (
                  <span>Select Project Reviewed (Yes/No) above to auto-activate</span>
                )}
              </p>
            </div>
          </div>

          {/* Direct toggle for Project Created if needed */}
          <div className="flex items-center gap-1.5 bg-white/90 p-1.5 rounded-xl border border-gray-200/80 shadow-2xs">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleCreatedToggle('YES')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                projectCreated === 'YES'
                  ? 'bg-[#a8cf45] text-[#2c3e10] shadow-2xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              YES
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleCreatedToggle('NO')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                projectCreated === 'NO'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              NO
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Action Execution Bar ────────────────────────── */}
      <div className="pt-2 flex items-center justify-end border-t border-gray-100">
        {projectReviewed === 'YES' ? (
          <button
            type="button"
            disabled={disabled || submittingAction !== null}
            onClick={handleCompleteStage}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#a8cf45] to-[#759724] text-[#1e2a06] hover:brightness-105 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-[#a8cf45]/40"
          >
            {submittingAction === 'APPROVE' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#1e2a06]" />
            )}
            <span>Complete Stage 1 (YES)</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || submittingAction !== null}
            onClick={handleRejectStage}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-600/30"
          >
            {submittingAction === 'REJECT' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 text-white" />
            )}
            <span>Save Decision (NO — On Hold)</span>
          </button>
        )}
      </div>
    </div>
  );
}
