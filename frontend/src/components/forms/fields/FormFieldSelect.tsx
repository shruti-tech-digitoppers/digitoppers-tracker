'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { normalizeOption } from '../utils/formHelpers';

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
