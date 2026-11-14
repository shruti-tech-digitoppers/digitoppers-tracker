'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { AlertCircle } from 'lucide-react';

interface FormFieldTextareaProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export function FormFieldTextarea({
  field,
  name,
  value,
  onChange,
  disabled = false,
  error,
}: FormFieldTextareaProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333] mb-1">
        {field.label || name}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <textarea
        name={name}
        rows={3}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || `Enter ${field.label || name}...`}
        className={`w-full px-3 py-2 text-xs rounded-xl border bg-[#f8fafb] text-[#333333] placeholder-[#4a5462]/60 focus:outline-none focus:ring-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-none ${
          error
            ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
            : 'border-[#b9c0cb]/50 focus:ring-[#51a8b1] focus:border-[#51a8b1] focus:bg-white'
        }`}
      />
      {error && (
        <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
