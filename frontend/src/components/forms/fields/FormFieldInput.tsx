'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';

interface FormFieldInputProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function FormFieldInput({
  field,
  name,
  value,
  onChange,
  disabled = false,
}: FormFieldInputProps) {
  const type = field.type === 'number' 
    ? 'number' 
    : field.type === 'date' 
    ? 'date' 
    : field.type === 'url' 
    ? 'url' 
    : 'text';

  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333] mb-1">
        {field.label || name}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder || `Enter ${field.label || name}...`}
        className="w-full px-3 py-2 text-xs rounded-xl border border-[#b9c0cb]/50 bg-[#f8fafb] text-[#333333] placeholder-[#4a5462]/60 focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}
