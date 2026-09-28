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
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { FormFieldUpload } from './FormFieldUpload';
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

  // Derive initial values from value or project
  const initialProjectName = value.projectName || value.organizationName || (project as any)?.projectName || project?.title || (project as any)?.organization || '';
  const initialEmail = (value.email !== undefined && value.email !== '') ? value.email : ((project as any)?.email || '');
  const initialPhone = (value.phone !== undefined && value.phone !== '') ? value.phone : ((project as any)?.phone || '');
  const initialCountry = (value.country !== undefined && value.country !== '') ? value.country : ((project as any)?.countryName || (project as any)?.country || 'India');
  const initialAddress = (value.address !== undefined && value.address !== '') ? value.address : (value.location || (project as any)?.address || '');
  const pmName = project?.projectManager && typeof project.projectManager === 'object'
    ? (project.projectManager as any).name || (project.projectManager as any).email
    : (project?.projectManager || currentUser?.name || value.reviewedBy || 'Project Manager');

  // Sync initial values on mount or when project loads
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
  }, [project, initialProjectName, initialEmail, initialPhone, initialCountry, initialAddress]);

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
      {/* ── Project Details Inputs (Name, Email, Country, Phone, Address) ── */}
      <div className="bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#b9c0cb]/20 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
            <Building2 className="w-4 h-4 text-[#51a8b1]" />
            Project Details
          </span>
          <span className="text-[10px] text-[#6b7280]">Verified from Dashboard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {/* 1. Project Name (Non-Editable) */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={value.projectName || value.organizationName || initialProjectName || 'N/A'}
                placeholder="Project Name..."
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/90 text-[#1f2937] cursor-not-allowed shadow-2xs select-text"
              />
            </div>
          </div>

          {/* 2. Email Address (Non-Editable) */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={value.email || initialEmail || 'N/A'}
                placeholder="Email address..."
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/90 text-[#1f2937] cursor-not-allowed shadow-2xs select-text"
              />
            </div>
          </div>

          {/* 3. Country (Non-Editable) */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Country
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={value.country || initialCountry || 'India'}
                placeholder="Country..."
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/90 text-[#1f2937] cursor-not-allowed shadow-2xs select-text"
              />
            </div>
          </div>

          {/* 4. Phone Number (Non-Editable) */}
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                disabled
                value={value.phone || initialPhone || 'N/A'}
                placeholder="Phone number..."
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/90 text-[#1f2937] cursor-not-allowed shadow-2xs select-text"
              />
            </div>
          </div>

          {/* 5. Address (Non-Editable) */}
          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-xs font-bold text-[#374151] mb-1">
              Address / Deployment Location
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={value.address || value.location || initialAddress || 'N/A'}
              placeholder="Site / deployment address..."
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/90 text-[#1f2937] cursor-not-allowed shadow-2xs select-text"
            />
          </div>
        </div>
      </div>

      {/* ── Project Plan Upload (PDF / Images • Max 2MB) ── */}
      <div className="bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl p-4 space-y-2 shadow-2xs">
        <FormFieldUpload
          field={{
            key: 'projectPlanUrl',
            name: 'projectPlanUrl',
            label: 'Project Plan Document',
            type: 'file',
            required: false,
            hint: 'Upload official Project Plan (PDF / Images • Max 2MB)'
          }}
          name="projectPlanUrl"
          value={value.projectPlanUrl || ''}
          onChange={(val) => handleInputChange('projectPlanUrl', val)}
          disabled={disabled}
        />
      </div>

      {/* ── Project Reviewed Decision (YES / NO) ─── */}
      <div className="bg-white border-2 border-[#51a8b1]/40 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
            <FileCheck2 className="w-4 h-4 text-[#51a8b1]" />
            Project Reviewed &amp; Created (YES / NO)?
          </h4>

          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
            projectReviewed === 'YES'
              ? 'bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6]'
              : projectReviewed === 'NO'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {projectReviewed === 'YES' ? '✅ YES' : projectReviewed === 'NO' ? '❌ NO' : '⏳ Awaiting Decision'}
          </span>
        </div>

        {/* 2 Clean Direct YES / NO Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* YES Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleReviewDecision('YES')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-sm ${
              projectReviewed === 'YES'
                ? 'bg-[#f7fbe9] border-[#a8cf45] text-[#2c3e10] shadow-xs ring-2 ring-[#a8cf45]/20'
                : 'bg-white border-gray-200 text-gray-700 hover:border-[#a8cf45]/60 hover:bg-[#f7fbe9]/30'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${projectReviewed === 'YES' ? 'text-[#759724]' : 'text-gray-400'}`} />
            <span>YES</span>
          </button>

          {/* NO Button */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleReviewDecision('NO')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-sm ${
              projectReviewed === 'NO'
                ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-2 ring-rose-500/20'
                : 'bg-white border-gray-200 text-gray-700 hover:border-rose-300 hover:bg-rose-50/30'
            }`}
          >
            <XCircle className={`w-5 h-5 ${projectReviewed === 'NO' ? 'text-rose-600' : 'text-gray-400'}`} />
            <span>NO</span>
          </button>
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
            <span>{submittingAction === 'REJECT' ? 'Saving...' : 'Save'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
