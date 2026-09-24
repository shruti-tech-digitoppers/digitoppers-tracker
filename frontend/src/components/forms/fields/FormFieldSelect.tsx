'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { normalizeOption } from '../utils/formHelpers';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface FormFieldSelectProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function FormFieldSelect({
  field,
  name,
  value,
  onChange,
  disabled = false,
}: FormFieldSelectProps) {
  const options = (field.options || []).map(normalizeOption);
  const isMulti = field.type === 'multiselect';
  const isPaymentStatus = name === 'paymentStatus' || field.key === 'paymentStatus' || field.name === 'paymentStatus';

  if (isPaymentStatus) {
    const currentVal = value || 'PENDING';
    return (
      <div>
        <label className="block text-xs font-semibold text-[#333333] mb-1.5 flex items-center justify-between">
          <span>
            {field.label || 'Payment Status'}
            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
          </span>
          <span className="text-[10px] font-semibold text-gray-500">
            Selected: <strong className="text-[#3a7d84]">{currentVal}</strong>
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('PAID')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              currentVal === 'PAID'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PAID</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('PARTIALLY_PAID')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              currentVal === 'PARTIALLY_PAID' || currentVal === 'PARTIAL'
                ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>PARTIALLY PAID</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('PENDING')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
              !currentVal || currentVal === 'PENDING' || currentVal === 'UNPAID'
                ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </button>
        </div>
      </div>
    );
  }

  if (isMulti) {
    const selectedValues: string[] = Array.isArray(value) ? value : value ? [String(value)] : [];

    const handleToggle = (optVal: string) => {
      if (selectedValues.includes(optVal)) {
        onChange(selectedValues.filter((v) => v !== optVal));
      } else {
        onChange([...selectedValues, optVal]);
      }
    };

    return (
      <div>
        <label className="block text-xs font-semibold text-[#333333] mb-1.5">
          {field.label || name}
          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-[#b9c0cb]/50 bg-[#f8fafb]">
          {options.map((opt) => {
            const checked = selectedValues.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => handleToggle(opt.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border cursor-pointer ${
                  checked
                    ? 'bg-[#51a8b1] text-white border-[#3a7d84] shadow-2xs'
                    : 'bg-white text-[#4a5462] border-[#b9c0cb]/40 hover:border-[#51a8b1]/50'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333] mb-1">
        {field.label || name}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <select
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 text-xs rounded-xl border border-[#b9c0cb]/50 bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <option value="">Select {field.label || name}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
