'use client';

import React, { useState } from 'react';
import { extractEffectiveHardwareItems, DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import {
  ShoppingCart,
  Upload,
  FileCheck,
  Loader2,
  X,
  FileText,
  Building2,
  Layers,
  CheckCircle2,
  Calendar,
  Hash,
  Truck,
  CreditCard,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';

interface HardwarePurchaseSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
}

export interface POItem {
  id: string;
  poNumber: string;
  poDate: string;
  poDocumentUrl: string;
  poFileName: string;
  remarks: string;
}

export interface PIItem {
  id: string;
  piNumber: string;
  piDate: string;
  piDocumentUrl: string;
  piFileName: string;
  ewayBillNumber: string;
  paymentStatus: string;
  remarks: string;
}

export interface ItemData {
  vendorName: string;
  purchaseOrders: POItem[];
  proformaInvoices: PIItem[];
}

export function HardwarePurchaseSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
}: HardwarePurchaseSectionProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // ── Saved data normalization ───────────────────────────────────────────
  const saved: Record<string, any> = React.useMemo(() => {
    if (!value || typeof value !== 'object') return {};
    if (value.items && typeof value.items === 'object') return value.items;
    const nonHwKeys = new Set([
      'overallProcurementRemarks',
      'submittedBy',
      'submittedAt',
      'remarks',
      'status',
      '_id',
      'id',
      'items',
      'procurements',
      'procurement',
      'checked',
      'stockStatus',
      'stockSummary'
    ]);
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (!nonHwKeys.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = v;
      }
    }
    return clean;
  }, [value]);

  // ── Extract effective hardware items from Stage 03 / Stage 04 ──────────
  const rawStockData: Record<string, any> =
    allFormData?.stage4StockItems ||
    allFormData?.stage4StockNodeFormData?.stockCheck?.items ||
    allFormData?.stockCheck?.items ||
    allFormData?.stage3HardwareItems ||
    {};

  const resolvedHardware = extractEffectiveHardwareItems(allFormData, value);

  // Unified hardware map excluding dummy legacy 'procurements' key
  const hwMap: Record<string, any> = {};

  // 1. Seed from Stage 03 Hardware Requirements
  Object.entries(resolvedHardware).forEach(([k, v]: [string, any]) => {
    if (k !== 'procurements' && k !== 'procurement') {
      hwMap[k] = {
        itemName: v.itemName || v.name || k,
        purchaseQty: Number(v.quantity) || 1,
        specNotes: v.specNotes || '',
        ...v,
      };
    }
  });

  // 2. Overlay Stage 04 Stock Check decisions
  Object.entries(rawStockData).forEach(([k, v]: [string, any]) => {
    if (k !== 'procurements' && k !== 'procurement') {
      const existing = hwMap[k] || {};
      const calculatedPurchaseQty =
        v.purchaseQty !== undefined
          ? Number(v.purchaseQty)
          : v.stockDecision === 'PURCHASE_REQUIRED'
          ? Number(v.quantity || existing.quantity || 1)
          : v.stockDecision === 'SPLIT'
          ? Number(v.purchaseQty || 1)
          : Number(existing.quantity || v.quantity || 1);

      hwMap[k] = {
        ...existing,
        ...v,
        itemName: v.itemName || existing.itemName || k,
        purchaseQty: calculatedPurchaseQty,
        specNotes: v.specNotes || existing.specNotes || '',
      };
    }
  });

  // 3. Overlay saved items
  Object.entries(saved).forEach(([k, v]: [string, any]) => {
    if (k !== 'procurements' && k !== 'procurement' && typeof v === 'object' && v !== null) {
      const existing = hwMap[k] || {};
      hwMap[k] = {
        ...existing,
        ...v,
        itemName: v.itemName || existing.itemName || k,
        specNotes: v.specNotes || existing.specNotes || '',
      };
    }
  });

  const entries = Object.entries(hwMap);

  // ── Data Normalizer for a specific hardware item ──────────────────────
  const getItemData = (key: string): ItemData => {
    const raw = saved[key] || hwMap[key] || {};
    let pos: POItem[] = Array.isArray(raw.purchaseOrders) ? [...raw.purchaseOrders] : [];
    let pis: PIItem[] = Array.isArray(raw.proformaInvoices) ? [...raw.proformaInvoices] : [];

    // Migrate legacy single PO fields
    if (pos.length === 0 && (raw.poNumber || raw.poDocumentUrl)) {
      pos.push({
        id: `po-${Date.now()}-0`,
        poNumber: raw.poNumber || '',
        poDate: raw.poDate || '',
        poDocumentUrl: raw.poDocumentUrl || '',
        poFileName: raw.poFileName || '',
        remarks: raw.poRemarks || '',
      });
    }
    if (pos.length === 0) {
      pos.push({ id: `po-${Date.now()}-0`, poNumber: '', poDate: '', poDocumentUrl: '', poFileName: '', remarks: '' });
    }

    // Migrate legacy single PI fields
    if (pis.length === 0 && (raw.piNumber || raw.piDocumentUrl)) {
      pis.push({
        id: `pi-${Date.now()}-0`,
        piNumber: raw.piNumber || '',
        piDate: raw.piDate || '',
        piDocumentUrl: raw.piDocumentUrl || '',
        piFileName: raw.piFileName || '',
        ewayBillNumber: raw.ewayBillNumber || '',
        paymentStatus: raw.paymentStatus || 'PENDING',
        remarks: raw.piRemarks || '',
      });
    }
    if (pis.length === 0) {
      pis.push({
        id: `pi-${Date.now()}-0`,
        piNumber: '',
        piDate: '',
        piDocumentUrl: '',
        piFileName: '',
        ewayBillNumber: '',
        paymentStatus: 'PENDING',
        remarks: '',
      });
    }

    return {
      vendorName: raw.vendorName || '',
      purchaseOrders: pos,
      proformaInvoices: pis,
    };
  };

  const patch = (itemKey: string, fields: Partial<ItemData>) => {
    const current = getItemData(itemKey);
    const updated = { ...current, ...fields };
    const next = { ...saved, [itemKey]: updated };
    onChange({ ...(typeof value === 'object' && value !== null ? value : {}), items: next });
  };

  // ── File Upload Handler ───────────────────────────────────────────────
  const handleFileUpload = async (
    itemKey: string,
    docType: 'po' | 'pi',
    index: number,
    file: File
  ) => {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) {
      alert('Invalid file format. Please upload PDF, Word document, or image (PNG/JPG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert(`File size exceeds 2MB limit. (Selected file: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }
    const uploadKey = `${itemKey}_${docType}_${index}`;
    try {
      setUploading((p) => ({ ...p, [uploadKey]: true }));
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const fd = new FormData();
      fd.append('file', file);
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${base}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
      const url = data.data?.url || data.url;

      const current = getItemData(itemKey);
      if (docType === 'po') {
        const nextPOs = [...current.purchaseOrders];
        nextPOs[index] = { ...nextPOs[index], poDocumentUrl: url, poFileName: file.name };
        patch(itemKey, { purchaseOrders: nextPOs });
      } else {
        const nextPIs = [...current.proformaInvoices];
        nextPIs[index] = { ...nextPIs[index], piDocumentUrl: url, piFileName: file.name };
        patch(itemKey, { proformaInvoices: nextPIs });
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading((p) => ({ ...p, [uploadKey]: false }));
    }
  };

  // ── PO Helpers ──
  const addPO = (itemKey: string) => {
    const current = getItemData(itemKey);
    const newPO: POItem = {
      id: `po-${Date.now()}-${current.purchaseOrders.length}`,
      poNumber: '',
      poDate: '',
      poDocumentUrl: '',
      poFileName: '',
      remarks: '',
    };
    patch(itemKey, { purchaseOrders: [...current.purchaseOrders, newPO] });
  };

  const updatePO = (itemKey: string, index: number, fields: Partial<POItem>) => {
    const current = getItemData(itemKey);
    const nextPOs = [...current.purchaseOrders];
    nextPOs[index] = { ...nextPOs[index], ...fields };
    patch(itemKey, { purchaseOrders: nextPOs });
  };

  const removePO = (itemKey: string, index: number) => {
    const current = getItemData(itemKey);
    if (current.purchaseOrders.length <= 1) {
      updatePO(itemKey, 0, { poNumber: '', poDate: '', poDocumentUrl: '', poFileName: '', remarks: '' });
      return;
    }
    const nextPOs = current.purchaseOrders.filter((_, i) => i !== index);
    patch(itemKey, { purchaseOrders: nextPOs });
  };

  // ── PI Helpers ──
  const addPI = (itemKey: string) => {
    const current = getItemData(itemKey);
    const newPI: PIItem = {
      id: `pi-${Date.now()}-${current.proformaInvoices.length}`,
      piNumber: '',
      piDate: '',
      piDocumentUrl: '',
      piFileName: '',
      ewayBillNumber: '',
      paymentStatus: 'PENDING',
      remarks: '',
    };
    patch(itemKey, { proformaInvoices: [...current.proformaInvoices, newPI] });
  };

  const updatePI = (itemKey: string, index: number, fields: Partial<PIItem>) => {
    const current = getItemData(itemKey);
    const nextPIs = [...current.proformaInvoices];
    nextPIs[index] = { ...nextPIs[index], ...fields };
    patch(itemKey, { proformaInvoices: nextPIs });
  };

  const removePI = (itemKey: string, index: number) => {
    const current = getItemData(itemKey);
    if (current.proformaInvoices.length <= 1) {
      updatePI(itemKey, 0, {
        piNumber: '',
        piDate: '',
        piDocumentUrl: '',
        piFileName: '',
        ewayBillNumber: '',
        paymentStatus: 'PENDING',
        remarks: '',
      });
      return;
    }
    const nextPIs = current.proformaInvoices.filter((_, i) => i !== index);
    patch(itemKey, { proformaInvoices: nextPIs });
  };

  // ── Empty State ──
  if (entries.length === 0) {
    return (
      <div className="p-6 bg-[#f0f8f9] border border-dashed border-[#b6e0e4] rounded-2xl text-center space-y-2 font-sans">
        <div className="w-10 h-10 rounded-full bg-[#d9eef0] flex items-center justify-center mx-auto text-[#51a8b1]">
          <ShoppingCart className="w-5 h-5" />
        </div>
        <p className="font-bold text-sm text-[#3a7d84]">No Hardware Items Found</p>
        <p className="text-xs text-[#4a5462]">
          Hardware items from Stage 03 Requirements or Stage 04 Stock Check will appear here automatically.
        </p>
      </div>
    );
  }

  // ── Main Render: One Card Per Hardware Item ────────────────────────────
  return (
    <div className="space-y-4 font-sans">
      {entries.map(([itemKey, rawData]: [string, any]) => {
        const item = getItemData(itemKey);
        const purchaseQty = rawData?.purchaseQty ?? rawData?.quantity ?? 1;
        const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.label === itemKey);
        const itemName = defObj?.label || itemKey;
        const specNotes = rawData?.specNotes || '';

        return (
          <div
            key={itemKey}
            className="rounded-2xl border border-[#51a8b1]/40 bg-white shadow-xs overflow-hidden"
          >
            {/* ── Hardware Card Header ── */}
            <div className="bg-[#f0f8f9] p-3.5 border-b border-[#b6e0e4] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="w-4 h-4 text-[#51a8b1] flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#333333] font-heading truncate">
                    {itemName}
                  </div>
                  {specNotes && (
                    <p className="text-[10.5px] text-[#4a5462] truncate mt-0.5">
                      <strong>Spec:</strong> {specNotes}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10.5px] font-bold text-[#3a7d84] bg-white px-2.5 py-1 rounded-full border border-[#b6e0e4] flex-shrink-0 ml-2 shadow-2xs">
                To Purchase: {purchaseQty} Units
              </span>
            </div>

            {/* ── Card Body ── */}
            <div className="p-3.5 space-y-4">
              {/* ── Vendor Name Input ── */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#51a8b1]" />
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={item.vendorName}
                  onChange={(e) => patch(itemKey, { vendorName: e.target.value })}
                  className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white transition"
                  placeholder={`e.g. Supplier for ${itemName}`}
                />
              </div>

              {/* ── PO & PI Section ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ── LEFT COLUMN: Purchase Orders (POs) ── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#b6e0e4]">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#51a8b1]" />
                      <span className="text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                        Purchase Orders (PO) — {itemName}
                      </span>
                    </div>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => addPO(itemKey)}
                        className="text-[10px] font-bold text-[#51a8b1] bg-[#f0f8f9] hover:bg-[#d9eef0] px-2 py-0.5 rounded-md border border-[#b6e0e4] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add PO
                      </button>
                    )}
                  </div>

                  {item.purchaseOrders.map((po, poIdx) => {
                    const isUploading = !!uploading[`${itemKey}_po_${poIdx}`];
                    return (
                      <div
                        key={po.id || poIdx}
                        className="p-3 rounded-xl bg-[#f8fafb] border border-[#b6e0e4] space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-[#3a7d84]">
                            PO #{poIdx + 1}
                          </span>
                          {item.purchaseOrders.length > 1 && !disabled && (
                            <button
                              type="button"
                              onClick={() => removePO(itemKey, poIdx)}
                              className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              title="Delete PO"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* PO File Upload */}
                        {po.poDocumentUrl ? (
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#dfefa6] text-xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCheck className="w-3.5 h-3.5 text-[#759724] flex-shrink-0" />
                              <a
                                href={po.poDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[#465b1c] font-medium text-[11px] hover:underline"
                              >
                                {po.poFileName || 'PO_Document.pdf'}
                              </a>
                            </div>
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => updatePO(itemKey, poIdx, { poDocumentUrl: '', poFileName: '' })}
                                className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer flex-shrink-0 ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-xl cursor-pointer bg-white transition
                            ${isUploading ? 'opacity-60 cursor-not-allowed border-[#51a8b1]' : 'border-[#b6e0e4] hover:border-[#51a8b1] hover:bg-[#f0f8f9]/40'}`}>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              disabled={disabled || isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(itemKey, 'po', poIdx, f);
                              }}
                              className="hidden"
                            />
                            {isUploading ? (
                              <span className="flex items-center gap-1.5 text-xs text-[#51a8b1] font-semibold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-[#3a7d84] font-medium">
                                <Upload className="w-3.5 h-3.5 text-[#51a8b1]" /> Upload PO Document
                              </span>
                            )}
                          </label>
                        )}

                        {/* PO Details */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5 text-[#51a8b1]" /> PO Number
                            </label>
                            <input
                              type="text"
                              disabled={disabled}
                              value={po.poNumber}
                              onChange={(e) => updatePO(itemKey, poIdx, { poNumber: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                              placeholder="PO-2026-001"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-[#51a8b1]" /> PO Date
                            </label>
                            <input
                              type="date"
                              disabled={disabled}
                              value={po.poDate}
                              onChange={(e) => updatePO(itemKey, poIdx, { poDate: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          disabled={disabled}
                          value={po.remarks}
                          onChange={(e) => updatePO(itemKey, poIdx, { remarks: e.target.value })}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#4a5462] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                          placeholder="PO remarks"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ── RIGHT COLUMN: Proforma Invoices (PIs) ── */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#dfefa6]">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#759724]" />
                      <span className="text-[10px] font-bold text-[#465b1c] uppercase tracking-wider font-heading">
                        Proforma Invoices (PI) — {itemName}
                      </span>
                    </div>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => addPI(itemKey)}
                        className="text-[10px] font-bold text-[#465b1c] bg-[#f7fbe9] hover:bg-[#eff8d0] px-2 py-0.5 rounded-md border border-[#dfefa6] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add PI
                      </button>
                    )}
                  </div>

                  {item.proformaInvoices.map((pi, piIdx) => {
                    const isUploading = !!uploading[`${itemKey}_pi_${piIdx}`];
                    return (
                      <div
                        key={pi.id || piIdx}
                        className="p-3 rounded-xl bg-[#f7fbe9]/40 border border-[#dfefa6] space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9.5px] font-bold text-[#465b1c]">
                            PI #{piIdx + 1}
                          </span>
                          {item.proformaInvoices.length > 1 && !disabled && (
                            <button
                              type="button"
                              onClick={() => removePI(itemKey, piIdx)}
                              className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                              title="Delete PI"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* PI File Upload */}
                        {pi.piDocumentUrl ? (
                          <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#dfefa6] text-xs">
                            <div className="flex items-center gap-1.5 truncate">
                              <FileCheck className="w-3.5 h-3.5 text-[#759724] flex-shrink-0" />
                              <a
                                href={pi.piDocumentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate text-[#465b1c] font-medium text-[11px] hover:underline"
                              >
                                {pi.piFileName || 'PI_Document.pdf'}
                              </a>
                            </div>
                            {!disabled && (
                              <button
                                type="button"
                                onClick={() => updatePI(itemKey, piIdx, { piDocumentUrl: '', piFileName: '' })}
                                className="text-rose-400 hover:text-rose-600 p-0.5 rounded cursor-pointer flex-shrink-0 ml-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center gap-2 p-2 border-2 border-dashed rounded-xl cursor-pointer bg-white transition
                            ${isUploading ? 'opacity-60 cursor-not-allowed border-[#759724]' : 'border-[#dfefa6] hover:border-[#759724] hover:bg-[#f7fbe9]'}`}>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                              disabled={disabled || isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(itemKey, 'pi', piIdx, f);
                              }}
                              className="hidden"
                            />
                            {isUploading ? (
                              <span className="flex items-center gap-1.5 text-xs text-[#759724] font-semibold">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-xs text-[#465b1c] font-medium">
                                <Upload className="w-3.5 h-3.5 text-[#759724]" /> Upload PI Document
                              </span>
                            )}
                          </label>
                        )}

                        {/* PI Details */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <Hash className="w-2.5 h-2.5 text-[#759724]" /> PI Number
                            </label>
                            <input
                              type="text"
                              disabled={disabled}
                              value={pi.piNumber}
                              onChange={(e) => updatePI(itemKey, piIdx, { piNumber: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#759724]"
                              placeholder="PI-2026-001"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5 text-[#759724]" /> PI Date
                            </label>
                            <input
                              type="date"
                              disabled={disabled}
                              value={pi.piDate}
                              onChange={(e) => updatePI(itemKey, piIdx, { piDate: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#759724]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <Truck className="w-2.5 h-2.5 text-[#759724]" /> E-Way Bill No.
                            </label>
                            <input
                              type="text"
                              disabled={disabled}
                              value={pi.ewayBillNumber}
                              onChange={(e) => updatePI(itemKey, piIdx, { ewayBillNumber: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#759724]"
                              placeholder="EWB-XXXX"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5 flex items-center gap-1">
                              <CreditCard className="w-2.5 h-2.5 text-[#759724]" /> Payment Status
                            </label>
                            <select
                              disabled={disabled}
                              value={pi.paymentStatus}
                              onChange={(e) => updatePI(itemKey, piIdx, { paymentStatus: e.target.value })}
                              className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#759724]"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="PARTIALLY_PAID">Partially Paid</option>
                              <option value="PAID">Paid</option>
                              <option value="UNPAID">Unpaid</option>
                            </select>
                          </div>
                        </div>
                        <input
                          type="text"
                          disabled={disabled}
                          value={pi.remarks}
                          onChange={(e) => updatePI(itemKey, piIdx, { remarks: e.target.value })}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#4a5462] focus:outline-none focus:ring-1 focus:ring-[#759724]"
                          placeholder="PI remarks"
                        />
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
