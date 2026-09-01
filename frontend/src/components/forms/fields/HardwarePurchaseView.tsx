'use client';

import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';

interface HardwarePurchaseViewProps {
  value?: any;
  allFormData?: Record<string, any>;
}

export function HardwarePurchaseView({ value, allFormData = {} }: HardwarePurchaseViewProps) {
  const stockItems = allFormData?.stage4StockItems || value?.items || {};
  
  const purchaseItems: any[] = Array.isArray(value?.purchaseList) 
    ? value.purchaseList 
    : Object.values(stockItems).filter((item: any) => Number(item.purchaseQty) > 0);

  return (
    <div className="p-3 bg-[#f0f8f9] border border-[#b6e0e4] rounded-xl space-y-2 font-sans">
      <div className="flex items-center justify-between text-xs font-bold text-[#3a7d84]">
        <span className="flex items-center gap-1.5 font-heading">
          <ShoppingCart className="w-3.5 h-3.5 text-[#51a8b1]" />
          Products Requiring Procurement (From Stock Check)
        </span>
        <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-[#b6e0e4]">
          {purchaseItems.length > 0 ? `${purchaseItems.length} Products` : 'All Stock Items Available'}
        </span>
      </div>

      {purchaseItems.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          {purchaseItems.map((item: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-white rounded-lg border border-[#b6e0e4]/60 text-xs"
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-[#4a5462]" />
                <span className="font-semibold text-[#333333]">{item.itemName || item.label || 'Hardware Item'}</span>
                {item.specNotes && <span className="text-[10px] text-[#4a5462]">({item.specNotes})</span>}
              </div>
              <span className="font-bold text-[#51a8b1] bg-[#f0f8f9] px-2 py-0.5 rounded border border-[#b6e0e4]">
                Qty: {item.purchaseQty || item.quantity || 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-[#4a5462] bg-white p-2 rounded-lg border border-[#b6e0e4]/40">
          Upload Vendor Purchase Order (PO) and Proforma Invoice (PI) documents below for official procurement tracking.
        </p>
      )}
    </div>
  );
}
