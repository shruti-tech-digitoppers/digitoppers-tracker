'use client';

import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Upload, 
  FileCheck,
  Sparkles
} from 'lucide-react';

interface AppFileDownloadSectionProps {
  value?: any;
  onChange: (val: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
}

export function AppFileDownloadSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
}: AppFileDownloadSectionProps) {
  const [copied, setCopied] = useState(false);

  // Extract APK / App URL from Tech Stream (allFormData or current form value)
  const apkUrl = 
    value?.apkFileUrl ||
    value?.appFileUrl ||
    value?.fileUrl ||
    (typeof value === 'string' && value.length > 5 ? value : '') ||
    allFormData?.techApkFileUrl ||
    allFormData?.apkFileUrl ||
    allFormData?.appFileUrl ||
    allFormData?.techFormData?.apkFileUrl ||
    allFormData?.techFormData?.appFileUrl ||
    '';

  // Helper to format full URL
  const getFullDownloadUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1').replace(/\/api\/v1\/?$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${base}${cleanPath}`;
  };

  const fullUrl = getFullDownloadUrl(apkUrl);
  const fileName = apkUrl ? apkUrl.split('/').pop() || 'digitopper-app-build.apk' : '';

  const copyToClipboard = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 font-sans w-full">
      <div className="p-4 rounded-2xl border-2 border-[#51a8b1]/40 bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] shadow-xs space-y-3">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b6e0e4]/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#51a8b1] text-white flex items-center justify-center shadow-2xs">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#1c4d52] font-heading flex items-center gap-1.5">
                Application / APK Build File
                <span className="text-[10px] font-bold text-[#51a8b1] bg-white px-2 py-0.5 rounded-full border border-[#b6e0e4]">
                  Tech Stream
                </span>
              </h5>
              <p className="text-[11px] text-[#8c96a5]">
                Download and install the application file onto the test device for QA execution
              </p>
            </div>
          </div>

          {apkUrl && (
            <span className="text-[11px] font-bold text-[#3a7d84] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              Build Ready
            </span>
          )}
        </div>

        {/* Content Box */}
        {apkUrl ? (
          <div className="p-3.5 rounded-xl bg-white border border-[#b6e0e4] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 truncate">
              <div className="w-10 h-10 rounded-xl bg-[#eef7f8] text-[#51a8b1] flex items-center justify-center shrink-0 border border-[#b6e0e4]/80">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#333333] truncate font-mono">
                  {fileName}
                </p>
                <p className="text-[11px] text-[#8c96a5] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#51a8b1]" />
                  Uploaded in Tech Stream (Project Configuration)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-[#f8fafb] border border-[#b9c0cb]/50 text-[#4a5462] hover:bg-[#eef7f8] hover:text-[#1c4d52] transition cursor-pointer"
                title="Copy Direct Download Link"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#51a8b1]" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={fullUrl}
                download={fileName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#51a8b1] hover:bg-[#3a7d84] text-white shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download APK File</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>No Application / APK file uploaded yet in Tech Stream</span>
            </div>
            <p className="text-[11px] text-amber-700">
              The Tech Lead must upload the Application / APK file in Stage 04 (Tech Stream ➔ Project Configuration & Implementation). Once uploaded, the direct download button will automatically appear here for testers.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
