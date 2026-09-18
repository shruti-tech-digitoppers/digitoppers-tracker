import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { IUser } from '../../../types/auth';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface DeleteEmployeeModalProps {
  employee: IUser | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<any>;
}

export function DeleteEmployeeModal({
  employee,
  isOpen,
  onClose,
  onConfirm,
}: DeleteEmployeeModalProps) {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(isOpen && employee) });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !employee) return null;

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onConfirm(employee._id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to delete employee.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#b9c0cb]/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="text-center">
            <h2 className="text-base font-bold text-[#333333] font-heading">Delete Employee</h2>
            <p className="text-xs text-[#4a5462] mt-1">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-[#333333]">{employee.name}</span> (
              <span className="font-mono text-[#51a8b1]">{employee.employeeCode}</span>)?
            </p>
            <p className="text-[11px] text-rose-500 mt-2 bg-rose-50/60 p-2 rounded-xl border border-rose-100">
              This action will remove the employee and all their explicit project assignments.
            </p>
          </div>

          {error && (
            <div className="p-2.5 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-medium text-center">
              {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
