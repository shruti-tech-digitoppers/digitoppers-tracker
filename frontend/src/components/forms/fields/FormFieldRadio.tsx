'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { normalizeOption } from '../utils/formHelpers';

interface FormFieldRadioProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function FormFieldRadio({
  field,
  name,
  value,
  onChange,
  disabled = false,
}: FormFieldRadioProps) {
  const options = (field.options || []).map(normalizeOption);

  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333] mb-1.5">
        {field.label || name}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const checked = String(value) === String(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                checked
                  ? 'bg-[#f0f8f9] text-[#3a7d84] border-[#51a8b1] shadow-2xs font-bold'
                  : 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40 hover:bg-white'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
                className="w-3.5 h-3.5 text-[#51a8b1] focus:ring-[#51a8b1]"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
