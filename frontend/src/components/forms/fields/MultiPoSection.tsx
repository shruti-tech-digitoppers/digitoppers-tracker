'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Building2,
  UploadCloud,
  FileCheck2,
  ExternalLink,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

export interface IPurchaseOrderItem {
  id?: string;
  poNumber: string;
  poDate?: string;
  uploadDate?: string;
  poDocumentUrl?: string;
  issuingOrganization?: string;
  remarks?: string;
}

interface MultiPoSectionProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  project?: any;
  allFormData?: Record<string, any>;
}

export function MultiPoSection({
  value,
  onChange,
  disabled = false,
  project = null,
  allFormData = {},
}: MultiPoSectionProps) {
  const today = new Date().toISOString().split('T')[0];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [errorIndex, setErrorIndex] = useState<{ index: number; msg: string } | null>(null);

  // Common Organization Name
  const organizationName = useMemo(() => {
    return (
      value?.organizationName ||
      value?.issuingOrganization ||
      project?.organization ||
      project?.projectName ||
      project?.title ||
      allFormData?.organizationName ||
      allFormData?.schoolName ||
      'DigiToppers Partner Institution'
    );
  }, [value, project, allFormData]);

  const projectId = project?.projectId || '';

  // Normalize incoming value into an array of POs
  const poList: IPurchaseOrderItem[] = useMemo(() => {
    if (value && Array.isArray(value.purchaseOrders) && value.purchaseOrders.length > 0) {
      return value.purchaseOrders.map((item: any, i: number) => ({
        id: item.id || `po-${i}`,
        poNumber: item.poNumber || '',
        poDate: item.poDate ? String(item.poDate).split('T')[0] : '',
        uploadDate: item.uploadDate ? String(item.uploadDate).split('T')[0] : (item.submittedAt ? String(item.submittedAt).split('T')[0] : today),
        poDocumentUrl: item.poDocumentUrl || '',
        issuingOrganization: item.issuingOrganization || organizationName,
        remarks: item.remarks || ''
      }));
    }
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item: any, i: number) => ({
        id: item.id || `po-${i}`,
        poNumber: item.poNumber || '',
        poDate: item.poDate ? String(item.poDate).split('T')[0] : '',
        uploadDate: item.uploadDate ? String(item.uploadDate).split('T')[0] : (item.submittedAt ? String(item.submittedAt).split('T')[0] : today),
        poDocumentUrl: item.poDocumentUrl || '',
        issuingOrganization: item.issuingOrganization || organizationName,
        remarks: item.remarks || ''
      }));
    }
    if (value?.poNumber || value?.poDocumentUrl) {
      return [{
        id: 'po-1',
        poNumber: value.poNumber || '',
        poDate: value.poDate ? String(value.poDate).split('T')[0] : '',
        uploadDate: value.uploadDate ? String(value.uploadDate).split('T')[0] : today,
        poDocumentUrl: value.poDocumentUrl || '',
        issuingOrganization: value.issuingOrganization || organizationName,
        remarks: value.remarks || ''
      }];
    }
    return [{
      id: 'po-1',
      poNumber: '',
      poDate: '',
      uploadDate: today,
      poDocumentUrl: '',
      issuingOrganization: organizationName,
      remarks: ''
    }];
  }, [value, today, organizationName]);

  const updatePoList = (updated: IPurchaseOrderItem[]) => {
    const first = updated[0] || { poNumber: '', poDate: '', uploadDate: '', poDocumentUrl: '', issuingOrganization: organizationName, remarks: '' };
    onChange({
      ...(typeof value === 'object' && !Array.isArray(value) ? value : {}),
      organizationName: value?.organizationName || organizationName,
      issuingOrganization: value?.issuingOrganization || organizationName,
      purchaseOrders: updated,
      poNumber: first.poNumber,
      poDate: first.poDate,
      uploadDate: first.uploadDate,
      poDocumentUrl: first.poDocumentUrl,
      remarks: first.remarks
    });
  };

  const handleAddPo = () => {
    const newPo: IPurchaseOrderItem = {
      id: `po-${Date.now()}`,
      poNumber: '',
      poDate: today,
      uploadDate: today,
      poDocumentUrl: '',
      issuingOrganization: organizationName,
      remarks: ''
    };
    updatePoList([...poList, newPo]);
  };

  const handleRemovePo = (index: number) => {
    if (poList.length <= 1) {
      updatePoList([{
        id: 'po-1',
        poNumber: '',
        poDate: '',
        uploadDate: today,
        poDocumentUrl: '',
        issuingOrganization: organizationName,
        remarks: ''
      }]);
      return;
    }
    const filtered = poList.filter((_, i) => i !== index);
    updatePoList(filtered);
  };

  const handlePoChange = (index: number, field: keyof IPurchaseOrderItem, val: string) => {
    const updated = [...poList];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    updatePoList(updated);
  };

  // PDF File Upload Handler
  const handlePdfUpload = async (index: number, file: File) => {
    setErrorIndex(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorIndex({ index, msg: 'Only PDF format (.pdf) is allowed.' });
      return;
    }

    try {
      setUploadingIndex(index);
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
      handlePoChange(index, 'poDocumentUrl', uploadedUrl);
    } catch (err: any) {
      setErrorIndex({ index, msg: err.message || 'Failed to upload PDF.' });
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── TOP COMMON ORGANIZATION & PROJECT HEADER ── */}
      <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f8fafb] border border-[#51a8b1]/30 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-2xs shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a7d84]">
                  Issuing Organization / Client
                </span>
                {projectId && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-[#3a7d84] border border-[#51a8b1]/30">
                    {projectId}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-[#1f2937] font-heading truncate" title={organizationName}>
                {organizationName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#51a8b1]/10 border border-[#51a8b1]/25 text-xs text-[#3a7d84] font-semibold">
              <FileCheck2 className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span>Total POs: <strong>{poList.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PURCHASE ORDERS LIST ── */}
      <div className="space-y-3 bg-[#f8fafb] border border-[#51a8b1]/30 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#51a8b1]/20 pb-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#3a7d84]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] font-heading">
              Purchase Orders ({poList.length})
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
              .pdf
            </span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleAddPo}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#3a7d84] hover:bg-[#2c5f64] active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Another PO</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {poList.map((po, index) => (
            <div
              key={po.id || index}
              className="bg-white border border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 rounded-xl p-3 shadow-2xs space-y-2.5 transition-all text-xs"
            >
              {/* Header row */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#51a8b1]/15 text-[#3a7d84]">
                  Purchase Order #{index + 1}
                </span>
                {!disabled && poList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePo(index)}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                    title="Remove this PO"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 3-Column Compact Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                    PO Number
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={po.poNumber || ''}
                    onChange={(e) => handlePoChange(index, 'poNumber', e.target.value)}
                    placeholder="e.g. PO-2026-001"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                    PO Date
                  </label>
                  <input
                    type="date"
                    disabled={disabled}
                    value={po.poDate || ''}
                    onChange={(e) => handlePoChange(index, 'poDate', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#51a8b1]" />
                    <span>Upload Date</span>
                  </label>
                  <input
                    type="date"
                    disabled={disabled}
                    value={po.uploadDate || ''}
                    onChange={(e) => handlePoChange(index, 'uploadDate', e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#51a8b1]/40 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-[#f0f8f9]/50 text-[#1f2937]"
                  />
                </div>
              </div>

              {/* PO PDF Upload & Link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#4a5462] flex items-center gap-1">
                    <span>PO Document</span>
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.1 rounded border border-rose-200">
                      PDF
                    </span>
                  </label>
                  {errorIndex?.index === index && (
                    <span className="text-[10px] text-rose-600 flex items-center gap-0.5 font-medium">
                      <AlertCircle className="w-2.5 h-2.5" />
                      {errorIndex.msg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {!disabled && (
                    <label className={`
                      flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition border shrink-0
                      ${uploadingIndex === index
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'bg-[#f0f8f9] hover:bg-[#51a8b1]/20 border-[#b6e0e4] text-[#3a7d84]'
                      }
                    `}>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        disabled={disabled || uploadingIndex === index}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePdfUpload(index, file);
                        }}
                        className="hidden"
                      />
                      {uploadingIndex === index ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-[#3a7d84]" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3 h-3 text-[#51a8b1]" />
                          <span>Upload PDF</span>
                        </>
                      )}
                    </label>
                  )}

                  <input
                    type="text"
                    disabled={disabled}
                    value={po.poDocumentUrl || ''}
                    onChange={(e) => handlePoChange(index, 'poDocumentUrl', e.target.value)}
                    placeholder="Upload or paste PDF URL..."
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                  />

                  {po.poDocumentUrl && (
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={po.poDocumentUrl.startsWith('http') ? po.poDocumentUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${po.poDocumentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1.5 rounded-lg bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6] hover:bg-[#a8cf45]/20 transition flex items-center gap-1 text-[11px] font-bold"
                        title="View PO PDF"
                      >
                        <ExternalLink className="w-3 h-3 text-[#759724]" />
                        <span>View</span>
                      </a>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handlePoChange(index, 'poDocumentUrl', '')}
                          className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Remove PDF"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <input
                  type="text"
                  disabled={disabled}
                  value={po.remarks || ''}
                  onChange={(e) => handlePoChange(index, 'remarks', e.target.value)}
                  placeholder="Optional PO remarks..."
                  className="w-full text-xs px-2.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#4a5462] placeholder:text-gray-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
