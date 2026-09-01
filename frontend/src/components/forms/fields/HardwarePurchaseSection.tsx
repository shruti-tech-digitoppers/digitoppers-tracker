'use client';

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Upload, 
  FileCheck, 
  Loader2, 
  X, 
  FileText, 
  Building2, 
  Calendar, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface HardwarePurchaseSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
}

export function HardwarePurchaseSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
}: HardwarePurchaseSectionProps) {
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const currentProcurements: Record<string, any> = typeof value?.items === 'object' && value?.items !== null 
    ? value.items 
    : (typeof value === 'object' && value !== null && !value.items ? value : {});

  // Extract products needing purchase from Stage 04 Stock Check (or fallback to Stage 03 items)
  const stage4StockItems = allFormData?.stage4StockItems || allFormData?.stockCheck?.items || {};
  const stage3Items = allFormData?.stage3HardwareItems || allFormData?.hardwareRequirements?.items || {};

  // Filter items where purchaseQty > 0 or mode is PURCHASE_REQUIRED / SPLIT
  let purchaseEntries: [string, any][] = Object.entries(stage4StockItems).filter(
    ([_, v]: [string, any]) => Number(v?.purchaseQty) > 0 || v?.stockDecision === 'PURCHASE_REQUIRED'
  );

  // If no stage 4 stock check items exist yet, check stage 3 items
  if (purchaseEntries.length === 0 && Object.keys(currentProcurements).length > 0) {
    purchaseEntries = Object.entries(currentProcurements);
  } else if (purchaseEntries.length === 0 && Object.keys(stage3Items).length > 0) {
    purchaseEntries = Object.entries(stage3Items).map(([k, v]: [string, any]) => [
      k,
      {
        itemName: v.itemName || k,
        quantity: Number(v.quantity) || 1,
        purchaseQty: Number(v.quantity) || 1,
        specNotes: v.specNotes || ''
      }
    ]);
  }

  const updateProductField = (itemKey: string, subField: string, subVal: any, itemInfo: any) => {
    const existing = currentProcurements[itemKey] || {
      itemName: itemInfo.itemName,
      purchaseQty: itemInfo.purchaseQty || itemInfo.quantity || 1,
      specNotes: itemInfo.specNotes || ''
    };

    const nextItems = {
      ...currentProcurements,
      [itemKey]: {
        ...existing,
        [subField]: subVal
      }
    };

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  const handleFileUpload = async (itemKey: string, docType: 'po' | 'pi', file: File, itemInfo: any) => {
    const uploadKey = `${itemKey}_${docType}`;
    try {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));
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
      const urlField = docType === 'po' ? 'poDocumentUrl' : 'piDocumentUrl';
      const nameField = docType === 'po' ? 'poFileName' : 'piFileName';

      const existing = currentProcurements[itemKey] || {
        itemName: itemInfo.itemName,
        purchaseQty: itemInfo.purchaseQty || itemInfo.quantity || 1,
        specNotes: itemInfo.specNotes || ''
      };

      const nextItems = {
        ...currentProcurements,
        [itemKey]: {
          ...existing,
          [urlField]: uploadedUrl,
          [nameField]: file.name
        }
      };

      onChange({
        ...(typeof value === 'object' && value !== null ? value : {}),
        items: nextItems
      });
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Error uploading document'}`);
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
    }
  };

  return (
    <div className="space-y-4 font-sans">

      {purchaseEntries.length === 0 ? (
        <div className="p-4 bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl text-center text-xs text-[#4a5462] space-y-1">
          <p className="font-bold text-[#333333]">All Hardware Items in Warehouse Stock</p>
          <p>No products were marked as requiring purchase in the Stock Check task.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchaseEntries.map(([itemKey, itemData]: [string, any]) => {
            const itemPurchaseQty = itemData.purchaseQty || itemData.quantity || 1;
            const procData = currentProcurements[itemKey] || {};

            const isPoUploading = uploadingState[`${itemKey}_po`];
            const isPiUploading = uploadingState[`${itemKey}_pi`];

            return (
              <div
                key={itemKey}
                className="p-4 rounded-2xl border border-[#51a8b1]/50 bg-white space-y-3.5 shadow-xs ring-1 ring-[#51a8b1]/10"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between border-b border-[#f1f3f6] pb-2.5">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#333333] font-heading flex items-center gap-1.5 truncate">
                      <Package className="w-4 h-4 text-[#51a8b1]" />
                      {itemData.itemName || itemKey}
                    </h4>
                    {itemData.specNotes && (
                      <p className="text-[10.5px] text-[#4a5462] mt-0.5 truncate">
                        <strong>Spec:</strong> {itemData.specNotes}
                      </p>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-3 py-1 rounded-full border border-[#b6e0e4] flex-shrink-0">
                    To Purchase: <strong>{itemPurchaseQty} Units</strong>
                  </span>
                </div>

                {/* Vendor / Supplier Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading mb-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#51a8b1]" />
                    Vendor / Supplier Name for {itemData.itemName || itemKey}
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={procData.vendorName ?? ''}
                    onChange={(e) => updateProductField(itemKey, 'vendorName', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                    placeholder="e.g. Maxhub Technologies Pvt Ltd / Lenovo Commercial Solutions"
                  />
                </div>

                {/* 2-Column PO and PI Upload Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Column 1: Vendor PO Upload */}
                  <div className="p-3 rounded-xl bg-[#f8fafb] border border-[#b6e0e4] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#3a7d84] font-heading flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#51a8b1]" />
                        Vendor Purchase Order (PO)
                      </span>
                      {procData.poDocumentUrl && (
                        <span className="text-[9.5px] font-bold text-[#465b1c] bg-[#f7fbe9] px-2 py-0.5 rounded border border-[#dfefa6]">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>

                    {/* PO File Upload Box */}
                    {procData.poDocumentUrl ? (
                      <div className="p-2 bg-white rounded-lg border border-[#dfefa6] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-[#759724] flex-shrink-0" />
                          <span className="truncate text-[#465b1c] font-medium text-[11px]">
                            {procData.poFileName || 'Vendor_PO_Document.pdf'}
                          </span>
                        </div>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => {
                              updateProductField(itemKey, 'poDocumentUrl', '', itemData);
                              updateProductField(itemKey, 'poFileName', '', itemData);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`
                        flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl cursor-pointer bg-white transition
                        ${isPoUploading ? 'opacity-60 cursor-not-allowed border-[#51a8b1]' : 'border-[#b6e0e4] hover:border-[#51a8b1] hover:bg-[#f0f8f9]/40'}
                      `}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          disabled={disabled || isPoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(itemKey, 'po', file, itemData);
                          }}
                          className="hidden"
                        />
                        {isPoUploading ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#51a8b1] font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading PO...
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#3a7d84] font-medium">
                            <Upload className="w-3.5 h-3.5 text-[#51a8b1]" />
                            <span>Upload Vendor PO (PDF)</span>
                          </div>
                        )}
                      </label>
                    )}

                    {/* PO Number & PO Date Inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5">PO Number</label>
                        <input
                          type="text"
                          disabled={disabled}
                          value={procData.poNumber ?? ''}
                          onChange={(e) => updateProductField(itemKey, 'poNumber', e.target.value, itemData)}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                          placeholder="PO-2026-001"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5">PO Date</label>
                        <input
                          type="date"
                          disabled={disabled}
                          value={procData.poDate ?? ''}
                          onChange={(e) => updateProductField(itemKey, 'poDate', e.target.value, itemData)}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Vendor PI Upload */}
                  <div className="p-3 rounded-xl bg-[#f8fafb] border border-purple-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-800 font-heading flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        Vendor Proforma Invoice (PI)
                      </span>
                      {procData.piDocumentUrl && (
                        <span className="text-[9.5px] font-bold text-[#465b1c] bg-[#f7fbe9] px-2 py-0.5 rounded border border-[#dfefa6]">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>

                    {/* PI File Upload Box */}
                    {procData.piDocumentUrl ? (
                      <div className="p-2 bg-white rounded-lg border border-[#dfefa6] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-[#759724] flex-shrink-0" />
                          <span className="truncate text-[#465b1c] font-medium text-[11px]">
                            {procData.piFileName || 'Vendor_PI_Document.pdf'}
                          </span>
                        </div>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => {
                              updateProductField(itemKey, 'piDocumentUrl', '', itemData);
                              updateProductField(itemKey, 'piFileName', '', itemData);
                            }}
                            className="text-rose-500 hover:text-rose-700 p-0.5 rounded hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <label className={`
                        flex flex-col items-center justify-center p-3 border-2 border-dashed rounded-xl cursor-pointer bg-white transition
                        ${isPiUploading ? 'opacity-60 cursor-not-allowed border-purple-400' : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50/40'}
                      `}>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                          disabled={disabled || isPiUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(itemKey, 'pi', file, itemData);
                          }}
                          className="hidden"
                        />
                        {isPiUploading ? (
                          <div className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" /> Uploading PI...
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-purple-700 font-medium">
                            <Upload className="w-3.5 h-3.5 text-purple-600" />
                            <span>Upload Vendor PI (PDF)</span>
                          </div>
                        )}
                      </label>
                    )}

                    {/* PI Number & PI Date Inputs */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5">PI Number</label>
                        <input
                          type="text"
                          disabled={disabled}
                          value={procData.piNumber ?? ''}
                          onChange={(e) => updateProductField(itemKey, 'piNumber', e.target.value, itemData)}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="PI-2026-987"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[#4a5462] mb-0.5">PI Date</label>
                        <input
                          type="date"
                          disabled={disabled}
                          value={procData.piDate ?? ''}
                          onChange={(e) => updateProductField(itemKey, 'piDate', e.target.value, itemData)}
                          className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Procurement Notes */}
                <div>
                  <input
                    type="text"
                    disabled={disabled}
                    value={procData.remarks ?? ''}
                    onChange={(e) => updateProductField(itemKey, 'remarks', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                    placeholder="Procurement & dispatch timeline remarks (e.g. Vendor committed delivery in 4 days)"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
