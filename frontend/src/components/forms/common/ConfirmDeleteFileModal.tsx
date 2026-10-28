'use client';

import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export interface ConfirmDeleteFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  fileName?: string;
  confirmButtonText?: string;
}

export function ConfirmDeleteFileModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Attachment?',
  description = 'Are you sure you want to delete this attached file? This action will remove the document reference from this form.',
  fileName,
  confirmButtonText = 'Yes, Delete',
}: ConfirmDeleteFileModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Extract clean filename from URL or path if needed
  const displayFileName = fileName ? fileName.split('/').pop()?.split('?')[0] : '';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div 
        className="relative w-full max-w-md bg-white border border-rose-100 shadow-2xl rounded-3xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Warning Icon */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 id="confirm-delete-title" className="font-heading font-extrabold text-base text-slate-900 leading-snug">
              {title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* File Name Pill if present */}
        {displayFileName && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-slate-700 min-w-0">
            <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate font-mono font-medium text-[11px]" title={displayFileName}>
              {displayFileName}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteFileModal;
