'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, Mail, Key, Hash } from 'lucide-react';
import { IUser, IUpdateEmployeePayload, GlobalRole } from '../../../types/auth';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface EditEmployeeModalProps {
  employee: IUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, payload: IUpdateEmployeePayload) => Promise<any>;
}

export function EditEmployeeModal({ employee, isOpen, onClose, onSubmit }: EditEmployeeModalProps) {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(isOpen && employee) });
  const [formData, setFormData] = useState<IUpdateEmployeePayload>({
    name: '',
    email: '',
    employeeCode: '',
    globalRole: 'EMPLOYEE',
    isActive: true,
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      const canReq = Boolean(employee.canRequestNewProject || employee.permissions?.canRequestNewProject);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        employeeCode: employee.employeeCode || '',
        globalRole: (employee.globalRole || employee.role || 'EMPLOYEE') as GlobalRole,
        isActive: employee.isActive !== undefined ? employee.isActive : true,
        canRequestNewProject: canReq,
        permissions: { canRequestNewProject: canReq },
        password: '',
      });
      setError(null);
    }
  }, [employee]);


  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.employeeCode?.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payloadToSend: IUpdateEmployeePayload = { ...formData };
      if (!payloadToSend.password) {
        delete payloadToSend.password; // do not overwrite password if blank
      }
      await onSubmit(employee._id, payloadToSend);
      onClose();
    } catch (err: any) {
      const errorMsg = 
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        err.message || 
        'Failed to update employee.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#b9c0cb]/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#333333] font-heading">Edit Employee</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-[#4a5462] hover:bg-[#f1f3f6] hover:text-[#333333] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              />
            </div>

            {/* Employee Code */}
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Employee Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent uppercase transition"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
            />
          </div>

          {/* Reset Password (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#333333] mb-1.5">
              Reset Password <span className="text-xs text-gray-400 font-normal">(Leave blank to keep current)</span>
            </label>
            <input
              type="password"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password to reset"
              className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
            />
          </div>

          {/* Global Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Global Role
              </label>
              <select
                value={formData.globalRole}
                onChange={(e) => setFormData({ ...formData, globalRole: e.target.value as GlobalRole })}
                className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              >
                <option value="EMPLOYEE">EMPLOYEE (Standard)</option>
                <option value="ADMIN">ADMIN (Full Access)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#333333] mb-1.5">
                Account Status
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permission Checkpoints */}
          <div className="pt-2 border-t border-[#f1f3f6] space-y-2">
            <label className="block text-xs font-semibold text-[#333333]">
              Permission Checkpoints
            </label>
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8fafb] border border-[#b9c0cb]/50 hover:bg-white transition cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.canRequestNewProject || formData.permissions?.canRequestNewProject)}
                onChange={(e) => {
                  const val = e.target.checked;
                  setFormData({
                    ...formData,
                    canRequestNewProject: val,
                    permissions: { ...formData.permissions, canRequestNewProject: val },
                  });
                }}
                className="mt-0.5 rounded text-[#51a8b1] focus:ring-[#51a8b1] w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="text-xs font-bold text-[#333333] leading-tight">
                  Allow New Project Requests
                </p>
                <p className="text-[11px] text-[#4a5462] leading-tight mt-0.5">
                  Grants permission to submit and request new projects.
                </p>
              </div>
            </label>
            <div className="p-2.5 rounded-xl bg-[#f0f8f9]/60 border border-[#b6e0e4]/50 flex items-center justify-between text-[11px] text-[#3a7d84]">
              <span>Default Project Access:</span>
              <span className="font-bold">Viewer across all projects</span>
            </div>
          </div>


          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1f3f6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
