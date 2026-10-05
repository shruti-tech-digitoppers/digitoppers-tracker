'use client';

import React from 'react';
import { extractEffectiveHardwareItems, DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { ShoppingCart, Layers, Building2, FileCheck, ExternalLink, CreditCard, Truck } from 'lucide-react';

interface HardwarePurchaseViewProps {
  value?: any;
  allFormData?: Record<string, any>;
}

export function HardwarePurchaseView({ value, allFormData = {} }: HardwarePurchaseViewProps) {
  const saved: Record<string, any> =
    typeof value?.items === 'object' && value?.items !== null
      ? value.items
      : typeof value === 'object' && value !== null && !value.items
      ? value
      : {};

  const rawStockData: Record<string, any> =
    allFormData?.stage4StockItems ||
    allFormData?.stage4StockNodeFormData?.stockCheck?.items ||
    allFormData?.stockCheck?.items ||
    allFormData?.stage3HardwareItems ||
    {};

  const resolvedHardware = extractEffectiveHardwareItems(allFormData, value);

  const hwMap: Record<string, any> = {};

  const nonHwKeys = new Set(['checked', 'stockStatus', 'stockSummary', 'remarks', 'purchaseAssignedTo', 'inStockAssignedTo', 'submittedBy', 'submittedAt', 'status', '_id', 'id', 'procurements', 'procurement', 'items', 'stockCheck']);

  Object.entries(resolvedHardware).forEach(([k, v]: [string, any]) => {
    if (!nonHwKeys.has(k)) {
      hwMap[k] = { itemName: v.itemName || v.name || k, purchaseQty: Number(v.quantity) || 1, specNotes: v.specNotes || '', ...v };
    }
  });

  Object.entries(rawStockData).forEach(([k, v]: [string, any]) => {
    if (!nonHwKeys.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
      const existing = hwMap[k] || {};
      hwMap[k] = { ...existing, ...v, itemName: v.itemName || existing.itemName || k, specNotes: v.specNotes || existing.specNotes || '' };
    }
  });

  Object.entries(saved).forEach(([k, v]: [string, any]) => {
    if (k !== 'procurements' && k !== 'procurement' && typeof v === 'object' && v !== null) {
      const existing = hwMap[k] || {};
      hwMap[k] = { ...existing, ...v, itemName: v.itemName || existing.itemName || k, specNotes: v.specNotes || existing.specNotes || '' };
    }
  });

  const entries = Object.entries(hwMap);

  if (entries.length === 0) {
    return (
      <div className="p-4 bg-[#f0f8f9] border border-[#b6e0e4] rounded-xl text-xs text-[#3a7d84] font-medium flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-[#51a8b1]" />
        <span>No hardware procurement records saved yet.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between text-xs font-bold text-[#3a7d84] pb-1 border-b border-[#b6e0e4]">
        <span className="flex items-center gap-1.5 font-heading">
          <ShoppingCart className="w-4 h-4 text-[#51a8b1]" />
          Hardware Procurement Summary ({entries.length} Items)
        </span>
      </div>

      <div className="space-y-3">
        {entries.map(([itemKey, data]: [string, any]) => {
          const pos = Array.isArray(data.purchaseOrders)
            ? data.purchaseOrders
            : (data.poNumber || data.poDocumentUrl)
            ? [{ poNumber: data.poNumber, poDate: data.poDate, poDocumentUrl: data.poDocumentUrl, poFileName: data.poFileName }]
            : [];

          const pis = Array.isArray(data.proformaInvoices)
            ? data.proformaInvoices
            : (data.piNumber || data.piDocumentUrl)
            ? [{ piNumber: data.piNumber, piDate: data.piDate, piDocumentUrl: data.piDocumentUrl, piFileName: data.piFileName, paymentStatus: data.paymentStatus }]
            : [];

          return (
            <div key={itemKey} className="p-3.5 bg-white rounded-2xl border border-[#b6e0e4] space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between font-semibold text-[#2b303b]">
                <span className="flex items-center gap-1.5 font-heading text-[#333]">
                  <Layers className="w-4 h-4 text-[#51a8b1]" />
                  {DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.label === itemKey)?.label || itemKey}
                </span>
                {data.vendorName && (
                  <span className="text-[10.5px] font-medium text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#51a8b1]" />
                    {data.vendorName}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-[#3a7d84] uppercase tracking-wider block font-heading">
                    Purchase Orders (PO) ({pos.length})
                  </span>
                  {pos.length > 0 ? (
                    pos.map((po: any, idx: number) => (
                      <div key={idx} className="p-2 bg-[#f8fafb] rounded-xl border border-[#b6e0e4] space-y-1 text-[11px]">
                        <div className="font-semibold text-[#333]">PO #{idx + 1}: {po.poNumber || '—'}</div>
                        {po.poDate && <div className="text-[10px] text-[#4a5462]">Date: {po.poDate}</div>}
                        {po.poDocumentUrl && (
                          <a
                            href={po.poDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#465b1c] font-medium hover:underline text-[10.5px] pt-0.5"
                          >
                            <FileCheck className="w-3 h-3 text-[#759724]" /> {po.poFileName || 'View Document'}
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-slate-50 text-[10.5px] text-slate-400 rounded-lg border border-dashed">
                      No PO attached
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-[#465b1c] uppercase tracking-wider block font-heading">
                    Proforma Invoices (PI) ({pis.length})
                  </span>
                  {pis.length > 0 ? (
                    pis.map((pi: any, idx: number) => (
                      <div key={idx} className="p-2 bg-[#f7fbe9]/40 rounded-xl border border-[#dfefa6] space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#333]">PI #{idx + 1}: {pi.piNumber || '—'}</span>
                          {pi.paymentStatus && (
                            <span className="text-[9.5px] font-bold bg-[#eff8d0] text-[#465b1c] px-1.5 py-0.2 rounded border border-[#dfefa6]">
                              {pi.paymentStatus}
                            </span>
                          )}
                        </div>
                        {pi.piDate && <div className="text-[10px] text-[#4a5462]">Date: {pi.piDate}</div>}
                        {pi.piDocumentUrl && (
                          <a
                            href={pi.piDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#465b1c] font-medium hover:underline text-[10.5px] pt-0.5"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-[#759724]" /> {pi.piFileName || 'View Document'}
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-slate-50 text-[10.5px] text-slate-400 rounded-lg border border-dashed">
                      No PI attached
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
