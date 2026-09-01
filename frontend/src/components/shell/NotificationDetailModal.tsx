'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { INotificationItem } from '../../lib/api/notifications.api';
import { 
  Bell, 
  X, 
  ArrowRight, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface NotificationDetailModalProps {
  notification: INotificationItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDetailModal({
  notification,
  isOpen,
  onClose,
}: NotificationDetailModalProps) {
  const router = useRouter();

  if (!isOpen || !notification) return null;

  const handleNavigateToTask = () => {
    onClose();
    // Check if metadata has target routing information
    const meta = notification.metadata || {};
    if (meta.targetUrl) {
      router.push(meta.targetUrl);
    } else if (meta.projectId || notification.relatedProject || (notification as any).project) {
      router.push('/tracker');
    } else {
      router.push('/tracker');
    }
  };

  const formattedDate = new Date(notification.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const meta = notification.metadata || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
      />

      {/* Center Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white border border-[#b9c0cb]/40 shadow-2xl rounded-3xl z-10 text-[#333333] animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f6] bg-gradient-to-r from-[#f8fafb] to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#51a8b1] shadow-2xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#eff8d0] text-[#465b1c] border border-[#dfefa6] px-2 py-0.5 rounded-full">
                {notification.type || 'TASK ASSIGNMENT'}
              </span>
              <h3 className="font-heading font-bold text-sm sm:text-base text-[#333333] mt-0.5">
                Notification Details
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Notification Title */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#333333] font-heading leading-snug">
              {notification.title}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-[#4a5462]">
              <Calendar className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Project / Stage Information Pill */}
          {(meta.projectCode || meta.projectTitle || meta.nodeKey) && (
            <div className="p-3 bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl space-y-1 text-xs">
              {meta.projectTitle && (
                <div className="flex items-center gap-1.5 font-semibold text-[#333333]">
                  <Layers className="w-3.5 h-3.5 text-[#51a8b1] flex-shrink-0" />
                  <span className="truncate">{meta.projectCode ? `[${meta.projectCode}] ` : ''}{meta.projectTitle}</span>
                </div>
              )}
              {meta.nodeKey && (
                <p className="text-[10.5px] font-mono text-[#51a8b1] pl-5">
                  Assigned Step: <strong>{meta.nodeKey}</strong>
                </p>
              )}
            </div>
          )}

          {/* Complete Full Notification Message */}
          <div className="p-4 bg-[#f0f8f9]/50 border border-[#b6e0e4]/60 rounded-2xl">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#3a7d84] font-heading mb-1">
              Assignment Message
            </label>
            <p className="text-xs text-[#333333] leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-[#f1f3f6] bg-[#f8fafb] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#4a5462] hover:text-[#333333] hover:bg-white rounded-xl border border-[#b9c0cb]/40 transition cursor-pointer"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleNavigateToTask}
            className="px-4 py-2 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Assigned Task</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
