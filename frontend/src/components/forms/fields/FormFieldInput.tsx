'use client';

import React from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { isContactNumberField, sanitizeContactNumber } from '../utils/formHelpers';
import { AlertCircle } from 'lucide-react';

interface FormFieldInputProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export function FormFieldInput({
  field,
  name,
  value,
  onChange,
  disabled = false,
  error,
}: FormFieldInputProps) {
  const isContact = isContactNumberField(field, name);

  const type = isContact
    ? 'tel'
    : field.type === 'number'
    ? 'number'
    : field.type === 'date'
    ? 'date'
    : field.type === 'url'
    ? 'url'
    : 'text';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isContact) {
      // Strictly only numbers allowed - no alphabets or special characters
      const numericOnly = sanitizeContactNumber(e.target.value);
      onChange(numericOnly);
      return;
    }

    if (field.type === 'number') {
      onChange(e.target.value === '' ? '' : Number(e.target.value));
      return;
    }

    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isContact) {
      // Disallow alphabets directly on key press
      if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#333333] mb-1">
        {field.label || name}
        {field.required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        inputMode={isContact ? 'numeric' : undefined}
        pattern={isContact ? '[0-9]*' : undefined}
        value={value ?? ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={field.placeholder || (isContact ? 'Enter numbers only...' : `Enter ${field.label || name}...`)}
        className={`w-full px-3 py-2 text-xs rounded-xl border bg-[#f8fafb] text-[#333333] placeholder-[#4a5462]/60 focus:outline-none focus:ring-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
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
