'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  Receipt,
  UploadCloud,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  X,
  CreditCard
} from 'lucide-react';

export interface IInvoiceItem {
  id?: string;
  number: string;
  date?: string;
  uploadDate?: string;
  ewayBillNumber?: string;
  paymentStatus?: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' | string;
  documentUrl?: string;
  paymentTerms?: string;
  remarks?: string;
}

interface MultiPiInvoiceSectionProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  project?: any;
  allFormData?: Record<string, any>;
}

export function MultiPiInvoiceSection({
  value,
  onChange,
  disabled = false,
  project = null,
  allFormData = {},
}: MultiPiInvoiceSectionProps) {
  const today = new Date().toISOString().split('T')[0];

  const [uploadingPiIndex, setUploadingPiIndex] = useState<number | null>(null);
  const [piErrorIndex, setPiErrorIndex] = useState<{ index: number; msg: string } | null>(null);

  const [uploadingTaxIndex, setUploadingTaxIndex] = useState<number | null>(null);
  const [taxErrorIndex, setTaxErrorIndex] = useState<{ index: number; msg: string } | null>(null);

  // Common Organization / School Name
  const organizationName = useMemo(() => {
    return (
      value?.organizationName ||
      project?.organization ||
      project?.projectName ||
      project?.title ||
      allFormData?.organizationName ||
      allFormData?.schoolName ||
      allFormData?.schoolInformation?.schoolName ||
      'DigiToppers Partner Institution'
    );
  }, [value, project, allFormData]);

  const projectId = project?.projectId || '';

  // 1. Proforma Invoices List
  const piList: IInvoiceItem[] = useMemo(() => {
    if (value && Array.isArray(value.proformaInvoices) && value.proformaInvoices.length > 0) {
      return value.proformaInvoices.map((item: any, i: number) => ({
        id: item.id || `pi-${i}`,
        number: item.piNumber || item.number || '',
        date: item.piDate ? String(item.piDate).split('T')[0] : (item.date ? String(item.date).split('T')[0] : ''),
        uploadDate: item.uploadDate ? String(item.uploadDate).split('T')[0] : (item.submittedAt ? String(item.submittedAt).split('T')[0] : (item.piUploadDate ? String(item.piUploadDate).split('T')[0] : today)),
        ewayBillNumber: item.ewayBillNumber || '',
        paymentStatus: item.paymentStatus || 'PENDING',
        documentUrl: item.piDocumentUrl || item.documentUrl || '',
        paymentTerms: item.paymentTerms || '',
        remarks: item.remarks || ''
      }));
    }
    if (value?.piNumber || value?.piDocumentUrl) {
      return [{
        id: 'pi-1',
        number: value.piNumber || '',
        date: value.piDate ? String(value.piDate).split('T')[0] : '',
        uploadDate: value.piUploadDate ? String(value.piUploadDate).split('T')[0] : (value.uploadDate ? String(value.uploadDate).split('T')[0] : today),
        ewayBillNumber: value.ewayBillNumber || '',
        paymentStatus: value.paymentStatus || 'PENDING',
        documentUrl: value.piDocumentUrl || '',
        paymentTerms: value.paymentTerms || '',
        remarks: value.remarks || ''
      }];
    }
    return [{
      id: 'pi-1',
      number: '',
      date: '',
      uploadDate: today,
      ewayBillNumber: '',
      paymentStatus: 'PENDING',
      documentUrl: '',
      paymentTerms: '',
      remarks: ''
    }];
  }, [value, today]);

  // 2. Tax Invoices List
  const taxInvoiceList: IInvoiceItem[] = useMemo(() => {
    if (value && Array.isArray(value.taxInvoices) && value.taxInvoices.length > 0) {
      return value.taxInvoices.map((item: any, i: number) => ({
        id: item.id || `tax-${i}`,
        number: item.invoiceNumber || item.number || '',
        date: item.invoiceDate ? String(item.invoiceDate).split('T')[0] : (item.date ? String(item.date).split('T')[0] : ''),
        uploadDate: item.uploadDate ? String(item.uploadDate).split('T')[0] : (item.submittedAt ? String(item.submittedAt).split('T')[0] : (item.invoiceUploadDate ? String(item.invoiceUploadDate).split('T')[0] : today)),
        ewayBillNumber: item.ewayBillNumber || '',
        paymentStatus: item.paymentStatus || 'PENDING',
        documentUrl: item.invoiceDocumentUrl || item.documentUrl || '',
        paymentTerms: item.paymentTerms || '',
        remarks: item.remarks || ''
      }));
    }
    if (value?.invoiceNumber || value?.invoiceDocumentUrl) {
      return [{
        id: 'tax-1',
        number: value.invoiceNumber || '',
        date: value.invoiceDate ? String(value.invoiceDate).split('T')[0] : '',
        uploadDate: value.invoiceUploadDate ? String(value.invoiceUploadDate).split('T')[0] : (value.uploadDate ? String(value.uploadDate).split('T')[0] : today),
        ewayBillNumber: value.ewayBillNumber || '',
        paymentStatus: value.paymentStatus || 'PENDING',
        documentUrl: value.invoiceDocumentUrl || '',
        paymentTerms: value.paymentTerms || '',
        remarks: value.remarks || ''
      }];
    }
    return [{
      id: 'tax-1',
      number: '',
      date: '',
      uploadDate: today,
      ewayBillNumber: '',
      paymentStatus: 'PENDING',
      documentUrl: '',
      paymentTerms: '',
      remarks: ''
    }];
  }, [value, today]);

  const updateState = (updatedPis: IInvoiceItem[], updatedTaxes: IInvoiceItem[], customOrg?: string) => {
    const firstPi = updatedPis[0] || { number: '', date: '', uploadDate: '', ewayBillNumber: '', paymentStatus: 'PENDING', documentUrl: '', paymentTerms: '', remarks: '' };
    const firstTax = updatedTaxes[0] || { number: '', date: '', uploadDate: '', ewayBillNumber: '', paymentStatus: 'PENDING', documentUrl: '', paymentTerms: '', remarks: '' };

    const formattedPis = updatedPis.map(p => ({
      piNumber: p.number,
      piDate: p.date,
      uploadDate: p.uploadDate,
      piUploadDate: p.uploadDate,
      ewayBillNumber: p.ewayBillNumber,
      paymentStatus: p.paymentStatus || 'PENDING',
      piDocumentUrl: p.documentUrl,
      paymentTerms: p.paymentTerms,
      remarks: p.remarks
    }));

    const formattedTaxes = updatedTaxes.map(t => ({
      invoiceNumber: t.number,
      invoiceDate: t.date,
      uploadDate: t.uploadDate,
      invoiceUploadDate: t.uploadDate,
      ewayBillNumber: t.ewayBillNumber,
      paymentStatus: t.paymentStatus || 'PENDING',
      invoiceDocumentUrl: t.documentUrl,
      paymentTerms: t.paymentTerms,
      remarks: t.remarks
    }));

    onChange({
      ...(typeof value === 'object' && !Array.isArray(value) ? value : {}),
      organizationName: customOrg !== undefined ? customOrg : (value?.organizationName || organizationName),
      proformaInvoices: formattedPis,
      taxInvoices: formattedTaxes,
      // Top-level fallbacks
      piNumber: firstPi.number,
      piDate: firstPi.date,
      piUploadDate: firstPi.uploadDate,
      piDocumentUrl: firstPi.documentUrl,
      invoiceNumber: firstTax.number,
      invoiceDate: firstTax.date,
      invoiceUploadDate: firstTax.uploadDate,
      invoiceDocumentUrl: firstTax.documentUrl,
      ewayBillNumber: firstTax.ewayBillNumber || firstPi.ewayBillNumber || '',
      paymentStatus: firstTax.paymentStatus || firstPi.paymentStatus || 'PENDING',
      uploadDate: firstPi.uploadDate || firstTax.uploadDate,
      paymentTerms: firstPi.paymentTerms || firstTax.paymentTerms,
      remarks: firstPi.remarks || firstTax.remarks
    });
  };

  // --- PI Handlers ---
  const handleAddPi = () => {
    const newItem: IInvoiceItem = {
      id: `pi-${Date.now()}`,
      number: '',
      date: today,
      uploadDate: today,
      ewayBillNumber: '',
      paymentStatus: 'PENDING',
      documentUrl: '',
      paymentTerms: '',
      remarks: ''
    };
    updateState([...piList, newItem], taxInvoiceList);
  };

  const handleRemovePi = (index: number) => {
    if (piList.length <= 1) {
      updateState([{ id: 'pi-1', number: '', date: '', uploadDate: today, ewayBillNumber: '', paymentStatus: 'PENDING', documentUrl: '', paymentTerms: '', remarks: '' }], taxInvoiceList);
      return;
    }
    updateState(piList.filter((_, i) => i !== index), taxInvoiceList);
  };

  const handlePiChange = (index: number, field: keyof IInvoiceItem, val: string) => {
    const updated = [...piList];
    updated[index] = { ...updated[index], [field]: val };
    updateState(updated, taxInvoiceList);
  };

  const handlePiPdfUpload = async (index: number, file: File) => {
    setPiErrorIndex(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPiErrorIndex({ index, msg: 'Only PDF format (.pdf) is allowed.' });
      return;
    }

    try {
      setUploadingPiIndex(index);
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
      handlePiChange(index, 'documentUrl', uploadedUrl);
    } catch (err: any) {
      setPiErrorIndex({ index, msg: err.message || 'Failed to upload PI PDF.' });
    } finally {
      setUploadingPiIndex(null);
    }
  };

  // --- Tax Invoice Handlers ---
  const handleAddTax = () => {
    const newItem: IInvoiceItem = {
      id: `tax-${Date.now()}`,
      number: '',
      date: today,
      uploadDate: today,
      ewayBillNumber: '',
      paymentStatus: 'PENDING',
      documentUrl: '',
      paymentTerms: '',
      remarks: ''
    };
    updateState(piList, [...taxInvoiceList, newItem]);
  };

  const handleRemoveTax = (index: number) => {
    if (taxInvoiceList.length <= 1) {
      updateState(piList, [{ id: 'tax-1', number: '', date: '', uploadDate: today, ewayBillNumber: '', paymentStatus: 'PENDING', documentUrl: '', paymentTerms: '', remarks: '' }]);
      return;
    }
    updateState(piList, taxInvoiceList.filter((_, i) => i !== index));
  };

  const handleTaxChange = (index: number, field: keyof IInvoiceItem, val: string) => {
    const updated = [...taxInvoiceList];
    updated[index] = { ...updated[index], [field]: val };
    updateState(piList, updated);
  };

  const handleTaxPdfUpload = async (index: number, file: File) => {
    setTaxErrorIndex(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setTaxErrorIndex({ index, msg: 'Only PDF format (.pdf) is allowed.' });
      return;
    }

    try {
      setUploadingTaxIndex(index);
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
      handleTaxChange(index, 'documentUrl', uploadedUrl);
    } catch (err: any) {
      setTaxErrorIndex({ index, msg: err.message || 'Failed to upload Tax Invoice PDF.' });
    } finally {
      setUploadingTaxIndex(null);
    }
  };

  // Aggregated Stats
  const paidCount = useMemo(() => {
    const pCount = piList.filter(p => p.paymentStatus === 'PAID').length;
    const tCount = taxInvoiceList.filter(t => t.paymentStatus === 'PAID').length;
    return pCount + tCount;
  }, [piList, taxInvoiceList]);

  return (
    <div className="space-y-4">
      {/* ── TOP COMMON ORGANIZATION & PROJECT HEADER ── */}
      <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#fdfaf6] border border-[#51a8b1]/30 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-2xs shrink-0">
              <Building2 className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a7d84]">
                  Client / Billing Organization
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
              <FileText className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span>PIs: <strong>{piList.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d97706]/10 border border-[#d97706]/25 text-xs text-[#b45309] font-semibold">
              <Receipt className="w-3.5 h-3.5 text-[#d97706]" />
              <span>Invoices: <strong>{taxInvoiceList.length}</strong></span>
            </div>
            {paidCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid ({paidCount})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2-COLUMN SPLIT LAYOUT (SIDE-BY-SIDE ON DESKTOP) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        
        {/* ══════════════ LEFT COLUMN: PROFORMA INVOICES (PI) ══════════════ */}
        <div className="space-y-3 bg-[#f8fafb] border border-[#51a8b1]/30 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#51a8b1]/20 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3a7d84]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] font-heading">
                1. Proforma Invoices ({piList.length})
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                .pdf
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleAddPi}
                className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#3a7d84] hover:bg-[#2c5f64] active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add PI</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {piList.map((pi, index) => (
              <div
                key={pi.id || index}
                className="bg-white border border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 rounded-xl p-3 shadow-2xs space-y-2.5 transition-all text-xs"
              >
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#51a8b1]/15 text-[#3a7d84]">
                    Proforma Invoice #{index + 1}
                  </span>
                  {!disabled && piList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePi(index)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                      title="Remove this PI"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2-Column Grid: PI Number & PI Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                      PI Number
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={pi.number || ''}
                      onChange={(e) => handlePiChange(index, 'number', e.target.value)}
                      placeholder="e.g. PI-2026-001"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                      PI Date
                    </label>
                    <input
                      type="date"
                      disabled={disabled}
                      value={pi.date || ''}
                      onChange={(e) => handlePiChange(index, 'date', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                    />
                  </div>
                </div>

                {/* 2-Column Grid: PI Upload Date & E-Way Bill Number */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#51a8b1]" />
                      <span>Upload Date</span>
                    </label>
                    <input
                      type="date"
                      disabled={disabled}
                      value={pi.uploadDate || ''}
                      onChange={(e) => handlePiChange(index, 'uploadDate', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#51a8b1]/40 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-[#f0f8f9]/50 text-[#1f2937]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#51a8b1]" />
                      <span>E-Way Bill No.</span>
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={pi.ewayBillNumber || ''}
                      onChange={(e) => handlePiChange(index, 'ewayBillNumber', e.target.value)}
                      placeholder="e.g. EWB-2026-001"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                    />
                  </div>
                </div>

                {/* 3 Clickable Payment Status Pills for PI */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#51a8b1]" />
                      <span>Payment Status</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#3a7d84]">
                      {pi.paymentStatus || 'PENDING'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handlePiChange(index, 'paymentStatus', 'PAID')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        pi.paymentStatus === 'PAID'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PAID</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handlePiChange(index, 'paymentStatus', 'PARTIALLY_PAID')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        pi.paymentStatus === 'PARTIALLY_PAID' || pi.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                          : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>PARTIAL</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handlePiChange(index, 'paymentStatus', 'PENDING')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        !pi.paymentStatus || pi.paymentStatus === 'PENDING' || pi.paymentStatus === 'UNPAID'
                          ? 'bg-rose-500 border-rose-500 text-white shadow-2xs'
                          : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>PENDING</span>
                    </button>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                    Payment Terms / Notes
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={pi.paymentTerms || ''}
                    onChange={(e) => handlePiChange(index, 'paymentTerms', e.target.value)}
                    placeholder="e.g. 50% Advance, 50% on Delivery"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                  />
                </div>

                {/* PI PDF Upload & Link */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#4a5462] flex items-center gap-1">
                      <span>PI Document</span>
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.1 rounded border border-rose-200">
                        PDF
                      </span>
                    </label>
                    {piErrorIndex?.index === index && (
                      <span className="text-[10px] text-rose-600 flex items-center gap-0.5 font-medium">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {piErrorIndex.msg}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!disabled && (
                      <label className={`
                        flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition border shrink-0
                        ${uploadingPiIndex === index
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-[#f0f8f9] hover:bg-[#51a8b1]/20 border-[#b6e0e4] text-[#3a7d84]'
                        }
                      `}>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={disabled || uploadingPiIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePiPdfUpload(index, file);
                          }}
                          className="hidden"
                        />
                        {uploadingPiIndex === index ? (
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
                      value={pi.documentUrl || ''}
                      onChange={(e) => handlePiChange(index, 'documentUrl', e.target.value)}
                      placeholder="Upload or paste PDF URL..."
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#1f2937]"
                    />

                    {pi.documentUrl && (
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={pi.documentUrl.startsWith('http') ? pi.documentUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${pi.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 rounded-lg bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6] hover:bg-[#a8cf45]/20 transition flex items-center gap-1 text-[11px] font-bold"
                          title="View PI PDF"
                        >
                          <ExternalLink className="w-3 h-3 text-[#759724]" />
                          <span>View</span>
                        </a>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handlePiChange(index, 'documentUrl', '')}
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
                    value={pi.remarks || ''}
                    onChange={(e) => handlePiChange(index, 'remarks', e.target.value)}
                    placeholder="Optional PI remarks..."
                    className="w-full text-xs px-2.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#51a8b1] bg-white text-[#4a5462] placeholder:text-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════ RIGHT COLUMN: TAX INVOICES & E-WAY BILLS ══════════════ */}
        <div className="space-y-3 bg-[#fdfaf6] border border-[#d97706]/30 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#d97706]/20 pb-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#b45309]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#b45309] font-heading">
                2. Tax Invoices & E-Way ({taxInvoiceList.length})
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                .pdf
              </span>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleAddTax}
                className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#b45309] hover:bg-[#92400e] active:scale-95 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                <span>Add Tax Invoice</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {taxInvoiceList.map((tax, index) => (
              <div
                key={tax.id || index}
                className="bg-white border border-[#fed7aa] hover:border-[#d97706]/60 rounded-xl p-3 shadow-2xs space-y-2.5 transition-all text-xs"
              >
                {/* Header row */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#fed7aa]/50 text-[#b45309]">
                    Tax Invoice #{index + 1}
                  </span>
                  {!disabled && taxInvoiceList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTax(index)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                      title="Remove this Tax Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* 2-Column Grid: Tax Invoice Number & Date */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={tax.number || ''}
                      onChange={(e) => handleTaxChange(index, 'number', e.target.value)}
                      placeholder="e.g. INV-2026-901"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#1f2937]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      disabled={disabled}
                      value={tax.date || ''}
                      onChange={(e) => handleTaxChange(index, 'date', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#1f2937]"
                    />
                  </div>
                </div>

                {/* 2-Column Grid: Invoice Upload Date & E-Way Bill Number */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#d97706]" />
                      <span>Upload Date</span>
                    </label>
                    <input
                      type="date"
                      disabled={disabled}
                      value={tax.uploadDate || ''}
                      onChange={(e) => handleTaxChange(index, 'uploadDate', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#fed7aa] focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-[#fdfaf6]/60 text-[#1f2937]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                      <Truck className="w-3 h-3 text-[#d97706]" />
                      <span>E-Way Bill No.</span>
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={tax.ewayBillNumber || ''}
                      onChange={(e) => handleTaxChange(index, 'ewayBillNumber', e.target.value)}
                      placeholder="e.g. EWB-2026-001"
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#1f2937]"
                    />
                  </div>
                </div>

                {/* 3 Clickable Payment Status Pills for Tax Invoice */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#d97706]" />
                      <span>Payment Status</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#b45309]">
                      {tax.paymentStatus || 'PENDING'}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTaxChange(index, 'paymentStatus', 'PAID')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        tax.paymentStatus === 'PAID'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PAID</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTaxChange(index, 'paymentStatus', 'PARTIALLY_PAID')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        tax.paymentStatus === 'PARTIALLY_PAID' || tax.paymentStatus === 'PARTIAL'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-2xs'
                          : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>PARTIAL</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTaxChange(index, 'paymentStatus', 'PENDING')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        !tax.paymentStatus || tax.paymentStatus === 'PENDING' || tax.paymentStatus === 'UNPAID'
                          ? 'bg-rose-500 border-rose-500 text-white shadow-2xs'
                          : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>PENDING</span>
                    </button>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-0.5">
                    Payment Terms / Remarks
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={tax.paymentTerms || ''}
                    onChange={(e) => handleTaxChange(index, 'paymentTerms', e.target.value)}
                    placeholder="e.g. Paid in Full / 30 Days Credit"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#1f2937]"
                  />
                </div>

                {/* Tax Invoice PDF Upload & Link */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#4a5462] flex items-center gap-1">
                      <span>Invoice Document</span>
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.1 rounded border border-rose-200">
                        PDF
                      </span>
                    </label>
                    {taxErrorIndex?.index === index && (
                      <span className="text-[10px] text-rose-600 flex items-center gap-0.5 font-medium">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {taxErrorIndex.msg}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!disabled && (
                      <label className={`
                        flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition border shrink-0
                        ${uploadingTaxIndex === index
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                          : 'bg-[#fdfaf6] hover:bg-[#d97706]/15 border-[#fed7aa] text-[#b45309]'
                        }
                      `}>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          disabled={disabled || uploadingTaxIndex === index}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleTaxPdfUpload(index, file);
                          }}
                          className="hidden"
                        />
                        {uploadingTaxIndex === index ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-[#b45309]" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3 text-[#d97706]" />
                            <span>Upload PDF</span>
                          </>
                        )}
                      </label>
                    )}

                    <input
                      type="text"
                      disabled={disabled}
                      value={tax.documentUrl || ''}
                      onChange={(e) => handleTaxChange(index, 'documentUrl', e.target.value)}
                      placeholder="Upload or paste PDF URL..."
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#1f2937]"
                    />

                    {tax.documentUrl && (
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={tax.documentUrl.startsWith('http') ? tax.documentUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${tax.documentUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 rounded-lg bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6] hover:bg-[#a8cf45]/20 transition flex items-center gap-1 text-[11px] font-bold"
                          title="View Invoice PDF"
                        >
                          <ExternalLink className="w-3 h-3 text-[#759724]" />
                          <span>View</span>
                        </a>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => handleTaxChange(index, 'documentUrl', '')}
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
                    value={tax.remarks || ''}
                    onChange={(e) => handleTaxChange(index, 'remarks', e.target.value)}
                    placeholder="Optional invoice remarks..."
                    className="w-full text-xs px-2.5 py-1 rounded-lg border border-gray-200 focus:outline-none focus:ring-1.5 focus:ring-[#d97706] bg-white text-[#4a5462] placeholder:text-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
