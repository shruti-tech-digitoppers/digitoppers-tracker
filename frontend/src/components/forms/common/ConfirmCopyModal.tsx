import React from 'react';
import { Copy, X } from 'lucide-react';

interface ConfirmCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sourceSchoolName: string;
  targetSchoolsCount: number;
  itemTypeLabel: string; // e.g. "solutions", "hardware equipment"
}

export function ConfirmCopyModal({
  isOpen,
  onClose,
  onConfirm,
  sourceSchoolName,
  targetSchoolsCount,
  itemTypeLabel,
}: ConfirmCopyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#b6e0e4] space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e6f4f6] text-[#2d6b73] flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">
                Apply to All Schools?
              </h3>
              <p className="text-xs text-slate-500">
                Bulk overwrite {itemTypeLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to copy the exact {itemTypeLabel} configured for{' '}
          <strong className="text-slate-900 font-bold">{sourceSchoolName}</strong>{' '}
          to all other <strong className="text-slate-900">{targetSchoolsCount} school branches</strong>?
          This will overwrite any individual school configurations previously made.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold bg-[#2d6b73] hover:bg-[#23545b] text-white rounded-xl shadow-xs transition cursor-pointer"
          >
            Yes, Apply to All
          </button>
        </div>
      </div>
    </div>
  );
}
