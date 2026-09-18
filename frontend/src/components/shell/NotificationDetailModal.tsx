'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { INotificationItem } from '../../lib/api/notifications.api';
import { requestsApi } from '../../lib/api/requests.api';
import { IProjectRequest } from '../../types/request';
import { ProjectRequestReviewModal } from '../../features/requests/components/ProjectRequestReviewModal';
import { useClickOutside } from '../../hooks/useClickOutside';
import { 
  Bell, 
  X, 
  ArrowRight, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface NotificationDetailModalProps {
  notification: INotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
  onRefreshData,
}: NotificationDetailModalProps) {
  const router = useRouter();
  const [projectRequest, setProjectRequest] = useState<IProjectRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Open ProjectRequestReviewModal for any project request notification
  const isProjectReview = Boolean(
    notification?.type === 'PROJECT_REQUEST_REVIEW' ||
    notification?.type === 'PROJECT_REQUEST_CREATED' ||
    (notification?.metadata?.requestId && (
      notification?.title?.toLowerCase().includes('project request') ||
      notification?.message?.toLowerCase().includes('project request') ||
      notification?.type?.includes('REQUEST')
    ))
  );

  useEffect(() => {
    if (isOpen && notification && isProjectReview) {
      const meta = (notification.metadata || {}) as Record<string, any>;
      const targetReqId = meta.requestId || meta.requestCustomId;

      if (targetReqId) {
        setLoadingRequest(true);
        setRequestError(null);
        requestsApi.getRequestById(targetReqId)
          .then((res) => {
            if (res.request) {
              setProjectRequest(res.request);
            } else if (res as any) {
              setProjectRequest(res as any);
            }
          })
          .catch((err) => {
            console.error('Failed to fetch project request by ID:', err);
            setRequestError(err.response?.data?.message || err.message || 'Failed to load project request details.');
          })
          .finally(() => {
            setLoadingRequest(false);
          });
      }
    } else {
      setProjectRequest(null);
      setLoadingRequest(false);
      setRequestError(null);
    }
  }, [isOpen, notification, isProjectReview]);

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(isOpen && notification) });

  if (!isOpen || !notification) return null;

  // ── CASE 1: If this is a Project Request Review Notification, render the unified Confirm Modal ──
  if (isProjectReview) {
    if (loadingRequest) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#b9c0cb]/40 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
            <RefreshCw className="w-8 h-8 text-[#51a8b1] animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-bold text-[#333333] font-heading">
                Request for Project Creation
              </h3>
              <p className="text-xs text-[#4a5462] mt-1">Loading request details for confirmation...</p>
            </div>
          </div>
        </div>
      );
    }

    if (projectRequest) {
      return (
        <ProjectRequestReviewModal
          request={projectRequest}
          isOpen={isOpen}
          onClose={onClose}
          onConfirmed={() => {
            if (onRefreshData) onRefreshData();
            onClose();
          }}
          isApprover={true}
        />
      );
    }

    if (requestError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#b9c0cb]/40 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f6]">
              <h3 className="text-base font-bold text-[#333333] font-heading">
                Request for Project Creation
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#4a5462] hover:bg-[#f1f3f6] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{requestError}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-[#4a5462] hover:bg-[#f8fafb] border border-[#b9c0cb]/50 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ── CASE 2: Standard Assignment, Update, or Request Modal ──────
  const meta = (notification.metadata || {}) as Record<string, any>;
  const formattedDate = notification.createdAt
    ? new Date(notification.createdAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  // Classification for styling
  const type = notification.type || 'GENERAL';
  const notifTitle = (notification.title || '').toLowerCase();
  const notifMsg = (notification.message || '').toLowerCase();

  const isTaskAssignment = 
    type === 'TASK_ASSIGNED' || 
    meta.assignmentType === 'TASK' || 
    Boolean(meta.nodeKey) || 
    notifTitle.includes('task') || 
    notifTitle.includes('assigned step');

  const isProjectAssignment =
    type === 'ASSIGNMENT' ||
    type === 'PROJECT_ASSIGNED' ||
    type === 'MEMBER_ASSIGNED' ||
    notifTitle.includes('project manager') ||
    notifTitle.includes('contributor');

  const isRequest =
    type.includes('PROJECT_REQUEST') ||
    Boolean(meta.requestId) ||
    notifTitle.includes('request');

  // Dynamic High-Capacity Theme
  let theme = {
    badge: 'Task Assignment',
    badgeClass: 'bg-[#0d9488] text-white border-teal-700 shadow-2xs font-extrabold',
    headerIconBg: 'bg-teal-50 border-teal-200 text-[#0d9488]',
    msgBg: 'bg-gradient-to-br from-teal-50/90 via-white to-white border-teal-200 text-slate-900',
    msgLabel: 'Assignment Message',
    btnColor: 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white shadow-md shadow-teal-200',
    btnLabel: 'Open Assigned Task',
  };

  if (isProjectAssignment) {
    theme = {
      badge: 'Project Assignment',
      badgeClass: 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-extrabold',
      headerIconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      msgBg: 'bg-gradient-to-br from-indigo-50/90 via-white to-white border-indigo-200 text-slate-900',
      msgLabel: 'Project Assignment Details',
      btnColor: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-200',
      btnLabel: 'Open Project Tracker',
    };
  } else if (isRequest) {
    const isApproved = type === 'PROJECT_REQUEST_APPROVED';
    theme = {
      badge: isApproved ? 'Request Approved' : 'Project Request',
      badgeClass: isApproved ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-extrabold' : 'bg-purple-600 text-white border-purple-700 shadow-2xs font-extrabold',
      headerIconBg: isApproved ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-purple-50 border-purple-200 text-purple-600',
      msgBg: isApproved ? 'bg-gradient-to-br from-emerald-50/90 via-white to-white border-emerald-200 text-slate-900' : 'bg-gradient-to-br from-purple-50/90 via-white to-white border-purple-200 text-slate-900',
      msgLabel: 'Request Message',
      btnColor: isApproved ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md shadow-emerald-200' : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md shadow-purple-200',
      btnLabel: 'View Project Details',
    };
  } else if (!isTaskAssignment) {
    theme = {
      badge: 'Timeline Update',
      badgeClass: 'bg-amber-600 text-white border-amber-700 shadow-2xs font-extrabold',
      headerIconBg: 'bg-amber-50 border-amber-200 text-amber-600',
      msgBg: 'bg-gradient-to-br from-amber-50/90 via-white to-white border-amber-200 text-slate-900',
      msgLabel: 'Update Details',
      btnColor: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-md shadow-amber-200',
      btnLabel: 'Open Project Timeline',
    };
  }

  const handleNavigateToTask = () => {
    onClose();
    const rawProj = meta.projectId || (notification as any).project || (notification as any).relatedProject;
    const projId = typeof rawProj === 'object' && rawProj !== null ? (rawProj._id || rawProj.id || rawProj.projectId) : rawProj;
    if (projId && projId !== '[object Object]') {
      router.push(`/tracker?projectId=${projId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
      />

      {/* Center Modal Dialog */}
      <div ref={modalRef} className="relative w-full max-w-lg bg-white border border-slate-200 shadow-2xl rounded-3xl z-10 text-slate-900 animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-xs ${theme.headerIconBg}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border ${theme.badgeClass}`}>
                {theme.badge}
              </span>
              <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 mt-1">
                Notification Details
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-black text-slate-900 font-heading leading-snug">
              {(() => {
                const t = (notification.title || '').trim();
                const lower = t.toLowerCase();
                if (
                  lower.includes('project request submitted') || 
                  lower.includes('project request awaiting review') || 
                  lower.includes('project request for review') ||
                  lower === 'new project request submitted'
                ) {
                  return 'New Project Request Received';
                }
                return t;
              })()}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Project / Stage Information Pill */}
          {(() => {
            const isMongoObjectId = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
            let cleanProjCode = 
              ((notification as any).project?.projectId) ||
              (!isMongoObjectId(meta.projectId) ? meta.projectId : null) ||
              meta.requestCustomId ||
              meta.requestId ||
              null;

            if (!cleanProjCode && notification.message) {
              const reqMatch = notification.message.match(/(REQ-[0-9]{4}-[0-9]{3,4})/i) || notification.message.match(/(PRJ-[0-9]{4}-[0-9]{3,4})/i);
              if (reqMatch) cleanProjCode = reqMatch[1];
            }

            let rawTitle = meta.projectName || meta.projectTitle || (notification as any).project?.projectName || meta.title;
            if (!rawTitle && notification.message) {
              const parenMatch = notification.message.match(/\(([a-zA-Z0-9\s_-]+)\)/);
              if (parenMatch && parenMatch[1] && !parenMatch[1].startsWith('REQ-') && !parenMatch[1].startsWith('PRJ-')) {
                rawTitle = parenMatch[1];
              }
            }
            const cleanProjectTitle = rawTitle || (cleanProjCode ? 'Project Request' : null);

            if (!cleanProjCode && !cleanProjectTitle && !meta.nodeKey) return null;

            return (
              <div className="p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl space-y-1.5 text-xs">
                {(cleanProjectTitle || cleanProjCode) && (
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span>
                      {cleanProjCode ? (
                        <span className="font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 font-extrabold px-1.5 py-0.5 rounded mr-1.5">
                          {cleanProjCode}
                        </span>
                      ) : null}
                      <span className="font-extrabold text-slate-900">{cleanProjectTitle}</span>
                    </span>
                  </div>
                )}
                {meta.nodeKey && (
                  <p className="text-[11px] font-mono text-slate-600 pl-6">
                    Assigned Step: <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 font-extrabold">{meta.nodeKey}</strong>
                  </p>
                )}
              </div>
            );
          })()}

          {/* Complete Full Notification Message */}
          <div className={`p-4 rounded-2xl border ${theme.msgBg}`}>
            <label className="block text-[10.5px] font-extrabold uppercase tracking-wider text-slate-500 font-heading mb-1.5">
              {theme.msgLabel}
            </label>
            <p className="text-xs sm:text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl border border-slate-200 transition cursor-pointer"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleNavigateToTask}
            className={`px-5 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer ${theme.btnColor}`}
          >
            <span>{theme.btnLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
