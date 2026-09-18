import React, { useState, useEffect } from 'react';
import { X, Send, ShieldCheck, User, Building2, RefreshCw } from 'lucide-react';
import { IUser } from '../../../types/auth';
import { requestsApi } from '../../../lib/api/requests.api';
import { ICreateProjectRequestPayload } from '../../../types/request';
import { useClickOutside } from '../../../hooks/useClickOutside';

interface CreateProjectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: IUser[];
  onSubmit: (payload: ICreateProjectRequestPayload) => Promise<any>;
}

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'United Arab Emirates',
  'Saudi Arabia',
  'Singapore',
  'Germany',
  'France',
  'Qatar',
  'Oman',
  'South Africa',
  'Other'
];

export function CreateProjectRequestModal({
  isOpen,
  onClose,
  employees,
  onSubmit,
}: CreateProjectRequestModalProps) {
  const [requestId, setRequestId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('India');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Workflow fields
  const [requestedTo, setRequestedTo] = useState('');
  const [projectManager, setProjectManager] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-fetch next guaranteed unique sequential Request ID on open
  useEffect(() => {
    if (isOpen) {
      handleRegenerateId(true);
    }
  }, [isOpen]);

  const handleRegenerateId = async (onlyIfEmpty: boolean = false) => {
    try {
      const res = await requestsApi.getNextRequestId();
      if (res.nextRequestId) {
        if (!onlyIfEmpty || !requestId) {
          setRequestId(res.nextRequestId);
          setFormError(null);
        }
      }
    } catch {
      // Fallback
    }
  };

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: isOpen });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setFormError('Please enter a Project Name.');
      return;
    }
    if (!email.trim()) {
      setFormError('Please enter an Email.');
      return;
    }
    if (!country) {
      setFormError('Please select a Country.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a Phone number.');
      return;
    }
    if (!requestedTo) {
      setFormError('Please select Requested To.');
      return;
    }
    if (!projectManager) {
      setFormError('Please select an Assigned Project Manager.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await onSubmit({
        requestId: requestId.trim().toUpperCase() || undefined,
        title: projectName.trim(),
        projectName: projectName.trim(),
        email: email.trim(),
        country,
        phone: phone.trim(),
        address: address.trim(),
        isActive,
        requestedTo,
        projectManager,
      });

      // Reset
      setRequestId('');
      setProjectName('');
      setEmail('');
      setCountry('India');
      setPhone('');
      setAddress('');
      setIsActive(true);
      setRequestedTo('');
      setProjectManager('');
      onClose();
    } catch (err: any) {
      const msg = 
        err.response?.data?.error?.message || 
        err.response?.data?.message || 
        err.message || 
        'Failed to submit project request.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isDuplicateError = 
    formError && 
    (formError.toLowerCase().includes('already in use') || 
     formError.toLowerCase().includes('already exists') || 
     formError.toLowerCase().includes('duplicate'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
      <div ref={modalRef} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#b9c0cb]/40 p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header matching screenshot */}
        <div className="flex items-start justify-between pb-3 border-b border-[#f1f3f6]">
          <div>
            <h2 className="text-xl font-bold text-[#1f2937] leading-tight">
              Request for Project Creation
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#f0f8f9] border border-[#b6e0e4] px-2 py-0.5 rounded-md">
                <span className="text-[11px] font-semibold text-[#4a5462]">Request ID:</span>
                <input
                  type="text"
                  value={requestId}
                  onChange={(e) => {
                    setRequestId(e.target.value.toUpperCase());
                    setFormError(null);
                  }}
                  placeholder="REQ-2026-001"
                  className="text-xs font-mono font-bold text-[#3a7d84] bg-transparent focus:outline-none uppercase w-28"
                  title="Request ID (Editable if custom ID needed)"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRegenerateId(false)}
                className="text-[11px] text-[#3a7d84] hover:text-[#51a8b1] hover:bg-[#f0f8f9] px-2 py-1 rounded-md border border-transparent hover:border-[#b6e0e4] flex items-center gap-1 font-semibold transition cursor-pointer"
                title="Generate next available sequential unique ID"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-ID</span>
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {formError && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>{formError}</span>
            {isDuplicateError && (
              <button
                type="button"
                onClick={() => handleRegenerateId(false)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1 self-start sm:self-auto"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-Fix ID</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Project Name* & Email* */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Project Name<span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Email<span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Row 2: Country* & Phone* */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Country<span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent text-[#374151] transition cursor-pointer"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Phone<span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder=""
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Address
            </label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder=""
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition resize-none"
            />
          </div>

          {/* Row 4: Status Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1.5">
              Status
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActive ? 'bg-[#51a8b1]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs font-medium text-[#374151]">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Workflow Routing Card */}
          <div className="p-3.5 rounded-xl bg-[#f0f8f9]/50 border border-[#b6e0e4]/80 space-y-2.5">
            <div className="text-[11px] font-bold text-[#3a7d84] uppercase tracking-wider">
              Request Routing & PM Assignment
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#3a7d84] mb-1">
                  Requested To <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={requestedTo}
                  onChange={(e) => setRequestedTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#b6e0e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] text-[#333333] font-medium transition cursor-pointer"
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({emp.globalRole || 'Employee'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3a7d84] mb-1">
                  Assigned Project Manager <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#b6e0e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51a8b1] text-[#333333] font-medium transition cursor-pointer"
                >
                  <option value="">Select Project Manager</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions matching screenshot */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1f3f6]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-medium text-[#4b5563] bg-[#9cb943]/20 hover:bg-[#9cb943]/30 text-[#556b2f] rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 text-xs font-medium text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Sending Request...' : 'Send Request'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
