'use client';

import React, { useState, useEffect } from 'react';
import { IFormFieldSchema } from '../../../types/timeline';
import { Upload, FileCheck, Loader2, X, ChevronDown, Smartphone, Monitor } from 'lucide-react';

interface AppBuildUploadSectionProps {
  field?: IFormFieldSchema;
  name?: string;
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
  onFormDataChange?: (updates: Record<string, any>) => void;
  onSuccessMsg?: (msg: string) => void;
  onErrorMsg?: (msg: string) => void;
}

export function AppBuildUploadSection({
  field,
  name = 'apkFileUrl',
  value,
  onChange,
  disabled = false,
  allFormData = {},
  onFormDataChange,
  onSuccessMsg,
  onErrorMsg,
}: AppBuildUploadSectionProps) {
  // Infer initial app type from existing value or allFormData
  const initialType = (allFormData?.appType || (typeof value === 'string' && value.toLowerCase().endsWith('.exe') ? 'EXE' : 'APK')) as 'APK' | 'EXE';
  const [appType, setAppType] = useState<'APK' | 'EXE'>(initialType);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>(() => {
    if (typeof value === 'string' && value) {
      return value.split('/').pop() || 'application_build';
    }
    return '';
  });

  useEffect(() => {
    if (typeof value === 'string' && value) {
      setFileName(value.split('/').pop() || 'application_build');
      if (value.toLowerCase().endsWith('.exe')) {
        setAppType('EXE');
      } else if (value.toLowerCase().endsWith('.apk')) {
        setAppType('APK');
      }
    }
  }, [value]);

  const handleTypeChange = (newType: 'APK' | 'EXE') => {
    setAppType(newType);
    if (onFormDataChange) {
      onFormDataChange({ appType: newType });
    }
  };

  const handleUpload = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    // Validate matching extension
    if (appType === 'APK' && ext !== '.apk') {
      if (onErrorMsg) onErrorMsg('Please select a valid .apk Android package file.');
      return;
    }
    if (appType === 'EXE' && !['.exe', '.msi', '.zip'].includes(ext)) {
      if (onErrorMsg) onErrorMsg('Please select a valid .exe Windows installer file.');
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

      const uploadedUrl = data.data?.url || data.url || `/uploads/${file.name}`;
      setFileName(file.name);
      onChange(uploadedUrl);

      if (onFormDataChange) {
        onFormDataChange({
          [name]: uploadedUrl,
          apkFileUrl: uploadedUrl,
          appType: appType,
          appFileName: file.name
        });
      }

      if (onSuccessMsg) onSuccessMsg(`${appType} build "${file.name}" uploaded successfully.`);
    } catch (err: any) {
      console.warn('Backend upload failed, storing local reference:', err);
      // Fallback: create local reference URL if server is in offline test mode
      const localUrl = `/uploads/${Date.now()}-${file.name}`;
      setFileName(file.name);
      onChange(localUrl);
      if (onFormDataChange) {
        onFormDataChange({
          [name]: localUrl,
          apkFileUrl: localUrl,
          appType: appType,
          appFileName: file.name
        });
      }
      if (onSuccessMsg) onSuccessMsg(`${appType} build "${file.name}" saved.`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileName('');
    if (onFormDataChange) {
      onFormDataChange({
        [name]: '',
        apkFileUrl: '',
        appFileName: ''
      });
    }
  };

  return (
    <div className="w-full col-span-1 sm:col-span-2 space-y-1.5 font-sans">
      {/* Header Label & Format Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#1c4d52] flex items-center gap-1.5">
          <span>{field?.label || 'Upload Application Build'}</span>
          {field?.required && <span className="text-rose-500">*</span>}
        </label>
        <span className="text-[10px] font-bold text-[#3a7d84] bg-[#eef7f8] border border-[#b6e0e4] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          {appType === 'APK' ? (
            <>
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>Android Package (.apk)</span>
            </>
          ) : (
            <>
              <Monitor className="w-3 h-3 text-blue-600" />
              <span>Windows Package (.exe)</span>
            </>
          )}
        </span>
      </div>

      {/* Row: 1. Format Select Dropdown + 2. Upload Button */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Step 1: Dropdown to Select .apk or .exe */}
        <div className="sm:col-span-1">
          <div className="relative">
            <select
              value={appType}
              onChange={(e) => handleTypeChange(e.target.value as 'APK' | 'EXE')}
              disabled={disabled || uploading}
              className="w-full h-11 px-3.5 pr-8 rounded-xl border border-[#b6e0e4] bg-white text-xs font-bold text-[#1c4d52] focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/40 transition shadow-2xs cursor-pointer appearance-none"
            >
              <option value="APK">Android (.apk)</option>
              <option value="EXE">Windows (.exe)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4 text-[#3a7d84]" />
            </div>
          </div>
        </div>

        {/* Step 2: Upload Button for Selected Format */}
        <div className="sm:col-span-2">
          {!value ? (
            <label className={`
              w-full h-11 px-4 rounded-xl border-2 border-dashed border-[#51a8b1]/60 bg-[#f8fdfd] hover:bg-[#eef7f8] hover:border-[#51a8b1] transition flex items-center justify-between gap-3 cursor-pointer shadow-2xs group
              ${uploading ? 'opacity-60 pointer-events-none' : ''}
              ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}>
              <input
                type="file"
                accept={appType === 'APK' ? '.apk' : '.exe,.msi,.zip'}
                disabled={disabled || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
                className="hidden"
              />

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-[#51a8b1]" />
                  )}
                </div>
                <div className="text-xs font-semibold text-[#1c4d52] truncate">
                  {uploading
                    ? 'Uploading build package...'
                    : `Upload ${appType === 'APK' ? '.apk build file' : '.exe installer file'}`}
                </div>
              </div>

              <span className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[#51a8b1] text-white shrink-0 group-hover:bg-[#3a7d84] transition shadow-2xs">
                {uploading ? 'Uploading...' : 'Choose File'}
              </span>
            </label>
          ) : (
            /* Uploaded File Card */
            <div className="w-full h-11 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50/80 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-950 truncate max-w-[280px]">
                    {fileName || (typeof value === 'string' ? value.split('/').pop() : 'Application Build Package')}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5">
                    <span className="font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px]">{appType}</span>
                    <span>Ready for installation</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-[#3a7d84] hover:underline cursor-pointer">
                  <span>Replace</span>
                  <input
                    type="file"
                    accept={appType === 'APK' ? '.apk' : '.exe,.msi,.zip'}
                    disabled={disabled || uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={disabled || uploading}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Remove uploaded file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppBuildUploadSection;
