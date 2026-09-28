'use client';

import React, { useState } from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { Upload, FileCheck, Loader2, X } from 'lucide-react';

interface FormFieldUploadProps {
  field: IFormFieldSchema;
  name: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  onSuccessMsg?: (msg: string) => void;
  onErrorMsg?: (msg: string) => void;
}

export function FormFieldUpload({
  field,
  name,
  value,
  onChange,
  disabled = false,
  onSuccessMsg,
  onErrorMsg,
}: FormFieldUploadProps) {
  const [uploading, setUploading] = useState(false);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  const handleFileUpload = async (file: File) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const isAllowed = allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';
    
    if (!isAllowed) {
      if (onErrorMsg) onErrorMsg('Only PDF (.pdf) or Images (.jpg, .png, .webp) are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      if (onErrorMsg) onErrorMsg(`File size exceeds 2MB limit (selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    try {
      setUploading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: uploadFormData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error?.message || 'File upload failed');
      }

      const uploadedUrl = data.data?.url || data.url;
      onChange(uploadedUrl);
      if (onSuccessMsg) onSuccessMsg(`File "${file.name}" uploaded successfully.`);
    } catch (err: any) {
      if (onErrorMsg) onErrorMsg(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#333333]">
          {field.label || name}
          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <span className="text-[10px] text-[#556987] font-medium bg-[#f0f8f9] border border-[#b6e0e4] px-1.5 py-0.2 rounded">
          PDF / Image • Max 2MB
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className={`
          flex-1 border-2 border-dashed rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-medium cursor-pointer transition
          ${value ? 'border-[#a8cf45] bg-[#f7fbe9] text-[#465b1c]' : 'border-[#b9c0cb]/60 bg-[#f8fafb] hover:bg-[#f0f8f9] text-[#4a5462]'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,image/*,application/pdf"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          {uploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#51a8b1]" />
              <span>Uploading file to server...</span>
            </>
          ) : value ? (
            <>
              <FileCheck className="w-3.5 h-3.5 text-[#759724]" />
              <span className="truncate max-w-[200px]">Attached: {String(value).split('/').pop()}</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span>Click to upload PDF or Image (Max 2MB)</span>
            </>
          )}
        </label>

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
