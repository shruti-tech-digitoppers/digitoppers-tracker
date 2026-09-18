'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  Copy,
  Check,
  AlertCircle,
  Search,
  ChevronDown,
  MapPin,
  Clock
} from 'lucide-react';
import { IProjectRequest } from '../../../types/request';
import { IProject } from '../../../types/project';
import { requestsApi } from '../../../lib/api/requests.api';
import { projectsApi } from '../../../lib/api/projects.api';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface ProjectRequestReviewModalProps {
  request: IProjectRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  isApprover?: boolean;
}

export function ProjectRequestReviewModal({
  request,
  isOpen,
  onClose,
  onConfirmed,
  isApprover = true,
}: ProjectRequestReviewModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dbProjects, setDbProjects] = useState<IProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isCreatedInDashboard, setIsCreatedInDashboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(isOpen && request) });

  // Click outside to close inner project dropdown
  const dropdownRef = useClickOutside<HTMLDivElement>(() => {
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  }, { enabled: isDropdownOpen });

  useEffect(() => {
    if (request && isOpen) {
      setSelectedProjectId('');
      setProjectSearchQuery('');
      setIsDropdownOpen(false);
      setReviewNotes('');
      setIsCreatedInDashboard(false);
      setError(null);

      // Fetch projects list directly from database API
      setLoadingProjects(true);
      projectsApi.getProjects({ status: 'ALL' })
        .then((res) => {
          if (res.projects && res.projects.length > 0) {
            setDbProjects(res.projects);
          } else {
            requestsApi.getDashboardProjects().then((dashRes) => {
              if (dashRes.projects) {
                setDbProjects(dashRes.projects as any);
              }
            }).catch(() => {});
          }
        })
        .catch((err) => {
          console.error('Failed to load DB projects list:', err);
          requestsApi.getDashboardProjects().then((dashRes) => {
            if (dashRes.projects) {
              setDbProjects(dashRes.projects as any);
            }
          }).catch(() => {});
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
  }, [request, isOpen]);

  // Filtered projects for search dropdown
  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return dbProjects;
    const q = projectSearchQuery.toLowerCase().trim();
    return dbProjects.filter((p) => {
      const code = (p.projectId || p._id || '').toLowerCase();
      const name = (p.projectName || p.title || '').toLowerCase();
      const org = (p.organization || '').toLowerCase();
      return code.includes(q) || name.includes(q) || org.includes(q);
    });
  }, [dbProjects, projectSearchQuery]);

  // Find currently selected project object
  const selectedProjectObj = useMemo(() => {
    if (!selectedProjectId) return null;
    return dbProjects.find((p) => {
      const code = p.projectId || p._id;
      return code === selectedProjectId;
    }) || null;
  }, [dbProjects, selectedProjectId]);

  if (!isOpen || !request) return null;

  const reqBy = typeof request.requestedBy === 'object' && request.requestedBy !== null 
    ? (request.requestedBy as any) 
    : { name: 'Employee', email: '' };

  const pmEmp = typeof request.projectManager === 'object' && request.projectManager !== null 
    ? (request.projectManager as any) 
    : { name: 'Assigned PM', email: '' };

  const reqToEmp = typeof request.requestedTo === 'object' && request.requestedTo !== null 
    ? (request.requestedTo as any) 
    : { name: 'Requested To', email: '' };

  const isPending = request.status === 'PENDING';
  const isApproved = request.status === 'APPROVED';
  const canApprove = isApprover && isPending;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId.trim()) {
      setError('Please select a Project from the list.');
      return;
    }

    if (!isCreatedInDashboard) {
      setError('Please check the verification confirmation box.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await requestsApi.approveRequest(request._id, {
        projectId: selectedProjectId.trim().toUpperCase(),
        dashboardProjectId: selectedProjectId.trim().toUpperCase(),
        reviewNotes: reviewNotes.trim(),
      });

      onConfirmed();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to confirm project request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this project request?')) return;
    try {
      setRejecting(true);
      setError(null);
      await requestsApi.rejectRequest(request._id, {
        reviewNotes: reviewNotes.trim(),
      });
      onConfirmed();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to reject request.');
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-[#b9c0cb]/40 p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#f1f3f6]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-2xs ${isApproved
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : canApprove
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              }`}>
              {isApproved ? <CheckCircle2 className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#333333] font-heading leading-tight">
                Request for Project Creation
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {request.requestId}
                </span>
                <span className="text-xs text-[#4a5462]">
                  {canApprove
                    ? 'Awaiting your confirmation'
                    : isPending
                      ? 'Pending Review by Approver'
                      : isApproved
                        ? 'Confirmed & Active'
                        : request.status}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#4a5462] hover:bg-[#f1f3f6] hover:text-[#333333] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {isPending && !canApprove ? (
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-purple-950">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Awaiting Review &amp; Confirmation</span>
            </div>
            <p className="text-[11.5px] text-purple-800 leading-relaxed">
              This project request was assigned to <strong>{reqToEmp.name}</strong> for review and confirmation.
            </p>
          </div>
        ) : isApproved && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Project Confirmed &amp; Active</span>
            </div>
            <p className="text-[11.5px] text-emerald-800 leading-relaxed">
              This request was confirmed with Project ID: <strong>{request.projectId || request.dashboardProjectId || 'Linked'}</strong>.
            </p>
          </div>
        )}

        {/* ── SECTION 1: PROJECT DETAILS ─────────────────────────────── */}
        <div className="rounded-2xl bg-[#f8fafb] border border-[#b9c0cb]/50 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#e9edf1]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#3a7d84]" />
              <h3 className="text-xs font-bold font-heading text-[#2f4154] uppercase tracking-wider">
                Project Details
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(request.title || request.projectName || '');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[11px] text-[#3a7d84] hover:underline flex items-center gap-1 shrink-0 font-medium cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Name'}</span>
            </button>
          </div>

          <div className="text-xs">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#4a5462] block">
              Project Name
            </span>
            <p className="font-bold text-sm text-[#333333] mt-0.5">{request.projectName || request.title}</p>
          </div>

          {/* Contact Details (Email, Phone, Country, Organization) */}
          <div className="pt-2.5 border-t border-[#e9edf1] grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
            <div>
              <span className="text-[#4a5462] block text-[10px] uppercase font-semibold">Contact Email</span>
              <span className="font-medium text-[#333333] truncate block">{request.email || '—'}</span>
            </div>
            <div>
              <span className="text-[#4a5462] block text-[10px] uppercase font-semibold">Contact Phone</span>
              <span className="font-medium text-[#333333] truncate block">{request.phone || '—'}</span>
            </div>
            <div>
              <span className="text-[#4a5462] block text-[10px] uppercase font-semibold">Country</span>
              <span className="font-medium text-[#333333] block">{request.country || '—'}</span>
            </div>
            <div>
              <span className="text-[#4a5462] block text-[10px] uppercase font-semibold">Organization</span>
              <span className="font-medium text-[#333333] block">{request.organization || '—'}</span>
            </div>
          </div>

          {/* Address */}
          <div className="pt-2.5 border-t border-[#e9edf1]">
            <div className="flex items-center gap-1 text-[#4a5462] mb-0.5">
              <MapPin className="w-3 h-3 text-[#3a7d84]" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Address</span>
            </div>
            <p className="text-[11.5px] text-[#333333] font-medium leading-relaxed">
              {request.address || '—'}
            </p>
          </div>

          {request.description && (
            <div className="pt-2.5 border-t border-[#e9edf1]">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#4a5462] block">
                Scope / Description
              </span>
              <p className="text-[11px] text-[#4a5462] mt-0.5 italic">{request.description}</p>
            </div>
          )}
        </div>

        {/* ── SECTION 2: ASSIGNED PM & WORKFLOW PERSONNEL ─────────────── */}
        <div className="rounded-2xl bg-[#f0f8f9]/50 border border-[#b6e0e4]/80 p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#b6e0e4]/40">
            <Briefcase className="w-4 h-4 text-[#3a7d84]" />
            <h3 className="text-xs font-bold font-heading text-[#3a7d84] uppercase tracking-wider">
              Assignment &amp; Approvals
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Submitted By */}
            <div className="p-2.5 rounded-xl bg-white border border-[#b6e0e4]/60">
              <span className="text-[10.5px] font-bold text-[#4a5462] block uppercase tracking-wider">
                Submitted By
              </span>
              <p className="font-bold text-[#333333] mt-0.5">{reqBy.name}</p>
              {reqBy.email && (
                <span className="text-[10px] text-[#4a5462] truncate block mt-0.5">{reqBy.email}</span>
              )}
            </div>

            {/* Assigned Project Manager */}
            <div className="p-2.5 rounded-xl bg-white border border-[#b6e0e4]/60">
              <span className="text-[10.5px] font-bold text-[#3a7d84] block uppercase tracking-wider">
                Assigned PM
              </span>
              <p className="font-bold text-[#3a7d84] mt-0.5 flex items-center gap-1">
                <span>{pmEmp.name}</span>
              </p>
              {pmEmp.email && (
                <span className="text-[10px] text-[#4a5462] truncate block mt-0.5">{pmEmp.email}</span>
              )}
            </div>

            {/* Requested To */}
            <div className="p-2.5 rounded-xl bg-white border border-[#b6e0e4]/60">
              <span className="text-[10.5px] font-bold text-[#4a5462] block uppercase tracking-wider">
                Requested To
              </span>
              <p className="font-bold text-[#333333] mt-0.5">{reqToEmp.name}</p>
              {reqToEmp.email && (
                <span className="text-[10px] text-[#4a5462] truncate block mt-0.5">{reqToEmp.email}</span>
              )}
            </div>
          </div>

          {request.reviewNotes && (
            <div className="pt-2 border-t border-[#b6e0e4]/40">
              <span className="text-[10.5px] font-bold text-[#4a5462] block uppercase tracking-wider">
                Review Remarks
              </span>
              <p className="text-[11px] text-[#333333] mt-0.5 font-medium">{request.reviewNotes}</p>
            </div>
          )}
        </div>

        {/* ── SECTION 3: INTERACTIVE CONFIRMATION FORM (APPROVER) ───────── */}
        {canApprove ? (
          <form onSubmit={handleApprove} className="space-y-4 pt-1">

            {/* Searchable Project Selection with Dedicated Search Button & Dropdown */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#51a8b1]/30 shadow-2xs space-y-3" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#2f4154]">
                  Select Available Project <span className="text-rose-500">*</span>
                </label>
                {loadingProjects ? (
                  <span className="text-[10.5px] text-[#51a8b1] font-semibold animate-pulse">
                    Loading projects from DB...
                  </span>
                ) : (
                  <span className="text-[10.5px] text-[#556987] font-medium">
                    {dbProjects.length} projects available
                  </span>
                )}
              </div>

              {/* Selected Project Card Preview (if chosen) */}
              {selectedProjectObj ? (
                <div className="p-3.5 bg-gradient-to-r from-[#f0f8f9] to-[#e6f4f6] border border-[#51a8b1]/40 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#2a6d74] bg-white px-2.5 py-1 rounded-lg border border-[#b6e0e4] shadow-2xs">
                        {selectedProjectObj.projectId}
                      </span>
                      <span className="text-xs font-bold text-[#1e2c3a] truncate">
                        {selectedProjectObj.projectName || selectedProjectObj.title}
                      </span>
                    </div>
                    {selectedProjectObj.organization && (
                      <p className="text-[11px] text-[#556987] mt-1 truncate pl-1">
                        Organization: <span className="font-semibold text-[#1e2c3a]">{selectedProjectObj.organization}</span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectId('');
                      setProjectSearchQuery('');
                      setIsDropdownOpen(true);
                    }}
                    className="text-xs font-bold text-[#2a6d74] hover:text-[#1c4d52] bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-[#b6e0e4] transition cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    Change Project
                  </button>
                </div>
              ) : (
                /* Search Input Box + Search Button + Dropdown Menu */
                <div className="space-y-2.5 relative">
                  {/* Search Bar + Action Button */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={projectSearchQuery}
                        onChange={(e) => {
                          setProjectSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search project by ID, name, or organization..."
                        className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:bg-white text-[#2f4154] font-medium shadow-2xs transition"
                      />
                      {projectSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setProjectSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search & Open Projects Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="px-4 py-2.5 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3d8c95] rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95"
                    >
                      <span>{isDropdownOpen ? 'Close List' : 'Browse Projects'}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Options List */}
                  {isDropdownOpen && (
                    <div className="border border-[#b9c0cb]/60 rounded-2xl overflow-hidden bg-white max-h-56 overflow-y-auto divide-y divide-slate-100 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#556987]">
                        <span>Available Projects ({filteredProjects.length})</span>
                        {projectSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setProjectSearchQuery('')}
                            className="text-[#51a8b1] hover:underline cursor-pointer"
                          >
                            Clear Filter
                          </button>
                        )}
                      </div>

                      {loadingProjects ? (
                        <div className="p-5 text-center text-xs text-[#556987] flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-[#51a8b1] border-t-transparent rounded-full animate-spin" />
                          <span>Loading projects from database...</span>
                        </div>
                      ) : filteredProjects.length === 0 ? (
                        <div className="p-5 text-center text-xs text-[#556987] space-y-1.5">
                          <p className="font-medium text-slate-600">No matching projects found for &quot;{projectSearchQuery}&quot;</p>
                          <button
                            type="button"
                            onClick={() => setProjectSearchQuery('')}
                            className="text-[11.5px] font-semibold text-[#51a8b1] hover:underline cursor-pointer"
                          >
                            Show all {dbProjects.length} projects
                          </button>
                        </div>
                      ) : (
                        filteredProjects.map((p) => {
                          const code = (p.projectId || p._id || '').toString();
                          const name = p.projectName || p.title || 'Untitled';
                          const isSel = selectedProjectId === code;
                          return (
                            <div
                              key={p._id || code}
                              onClick={() => {
                                setSelectedProjectId(code);
                                setIsDropdownOpen(false);
                              }}
                              className={`p-3 text-xs flex items-center justify-between gap-2.5 hover:bg-[#f0f8f9] transition cursor-pointer ${
                                isSel ? 'bg-[#f0f8f9] font-bold text-[#2a6d74]' : 'text-[#2f4154]'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-bold text-[#2a6d74] bg-[#e6f4f5] px-2 py-0.5 rounded-md border border-[#c2e7ea]">
                                    {code}
                                  </span>
                                  <span className="truncate font-semibold text-[#1e2c3a]">{name}</span>
                                </div>
                                {p.organization && (
                                  <span className="text-[11px] text-[#556987] block mt-0.5 truncate pl-1">
                                    Organization: {p.organization}
                                  </span>
                                )}
                              </div>
                              {isSel ? (
                                <Check className="w-4 h-4 text-[#2a6d74] shrink-0" />
                              ) : (
                                <span className="text-[10px] font-bold text-[#51a8b1] opacity-0 hover:opacity-100 uppercase tracking-wider shrink-0">
                                  Select
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCreatedInDashboard}
                  onChange={(e) => setIsCreatedInDashboard(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded-sm cursor-pointer"
                />
                <span className="text-[11px] font-semibold text-[#333333] leading-tight">
                  I confirm that this project selection is verified.
                </span>
              </label>
            </div>

            {/* Optional Review Notes */}
            <div>
              <label className="block text-xs font-bold text-[#333333] mb-1">
                Approval Remarks / Review Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Project confirmed and mapped to tracker."
                className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] transition resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#f1f3f6]">
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting || rejecting}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{rejecting ? 'Rejecting...' : 'Reject Request'}</span>
              </button>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-[#4a5462] hover:bg-[#f8fafb] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || rejecting || !selectedProjectId.trim() || !isCreatedInDashboard}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Confirming Request...' : 'Confirm Request'}</span>
                </button>
              </div>
            </div>

          </form>
        ) : (
          /* Read-Only Footer */
          <div className="flex items-center justify-end pt-3 border-t border-[#f1f3f6]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-[#4a5462] hover:bg-[#f1f3f6] hover:text-[#333333] border border-[#b9c0cb]/60 rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
