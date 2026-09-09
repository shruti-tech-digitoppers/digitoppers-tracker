'use client';

import React from 'react';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock,
  Navigation
} from 'lucide-react';

interface HardwareConsignmentSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
}

export type ConsignmentStatus = 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

const COURIER_SUGGESTIONS = [
  'Delhivery Logistics',
  'BlueDart Express',
  'Safexpress Supply Chain',
  'V-Trans Cargo',
  'DTDC Logistics',
  'TCI Freight',
  'Trackon Couriers',
  'Company Dedicated Vehicle'
];

export function HardwareConsignmentSection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
}: HardwareConsignmentSectionProps) {
  const currentConsignments: Record<string, any> = typeof value?.items === 'object' && value?.items !== null 
    ? value.items 
    : (typeof value === 'object' && value !== null && !value.items ? value : {});

  // Extract products from Stage 04 stock check or Stage 03 requirements
  const stage4StockItems = allFormData?.stage4StockItems || allFormData?.stockCheck?.items || {};
  const stage3Items = allFormData?.stage3HardwareItems || allFormData?.hardwareRequirements?.items || {};

  // Extract school address if available from Stage 03 School Info
  const schoolAddressFallback = allFormData?.schoolInfo?.address || allFormData?.deliveryAddress || '';

  let consignmentEntries: [string, any][] = Object.entries(stage4StockItems).length > 0
    ? Object.entries(stage4StockItems)
    : Object.entries(stage3Items).length > 0
    ? Object.entries(stage3Items)
    : Object.entries(currentConsignments);

  if (consignmentEntries.length === 0) {
    consignmentEntries = [
      ['smart_panel', { itemName: 'Interactive Flat Panel (75 Inch)', quantity: 2, specNotes: '4K UHD, Maxhub' }],
      ['student_tablets', { itemName: 'Student Tablets (10.1 Inch)', quantity: 20, specNotes: 'Lenovo Tab M10' }],
      ['charging_cart', { itemName: 'Smart Tablet Charging Cart', quantity: 1, specNotes: '32-Bay Mobile Cart' }]
    ];
  }

  const updateItemField = (itemKey: string, subField: string, subVal: any, itemInfo: any) => {
    const existing = currentConsignments[itemKey] || {
      itemName: itemInfo.itemName || itemKey,
      quantity: itemInfo.quantity || 1,
      specNotes: itemInfo.specNotes || '',
      status: 'DISPATCHED',
      deliveryAddress: schoolAddressFallback
    };

    const nextItems = {
      ...currentConsignments,
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

  return (
    <div className="space-y-3.5 font-sans">
      <div className="space-y-3.5">
        {consignmentEntries.map(([itemKey, itemData]: [string, any]) => {
          const totalQty = Number(itemData.quantity) || 1;
          const trackingData = currentConsignments[itemKey] || {};
          const currentStatus: ConsignmentStatus = trackingData.status || 'DISPATCHED';

          return (
            <div
              key={itemKey}
              className="p-4 rounded-2xl border border-[#51a8b1]/40 bg-white space-y-3 shadow-xs"
            >
              {/* Card Header: Product & Status */}
              <div className="flex items-start justify-between border-b border-[#f1f3f6] pb-2.5 gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#333333] font-heading flex items-center gap-1.5 truncate">
                    <Truck className="w-4 h-4 text-[#51a8b1]" />
                    {itemData.itemName || itemKey}
                  </h4>
                  {itemData.specNotes && (
                    <p className="text-[10.5px] text-[#4a5462] truncate mt-0.5">
                      <strong>Spec:</strong> {itemData.specNotes}
                    </p>
                  )}
                </div>

                <span className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-3 py-1 rounded-full border border-[#b6e0e4] flex-shrink-0">
                  Total Units: <strong>{totalQty} Units</strong>
                </span>
              </div>

              {/* Status Segmented Pill Selector */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                  Transit Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { val: 'DISPATCHED', label: 'Dispatched', color: 'border-[#51a8b1] bg-[#f0f8f9] text-[#3a7d84]' },
                    { val: 'IN_TRANSIT', label: 'In Transit', color: 'border-amber-400 bg-amber-50 text-amber-800' },
                    { val: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'border-purple-400 bg-purple-50 text-purple-800' },
                    { val: 'DELIVERED', label: 'Delivered', color: 'border-[#a8cf45] bg-[#f7fbe9] text-[#465b1c]' }
                  ].map((st) => (
                    <button
                      type="button"
                      key={st.val}
                      disabled={disabled}
                      onClick={() => updateItemField(itemKey, 'status', st.val, itemData)}
                      className={`
                        py-1.5 px-2 rounded-xl text-xs font-bold border transition text-center select-none cursor-pointer
                        ${currentStatus === st.val 
                          ? `${st.color} shadow-2xs ring-1 ring-black/5` 
                          : 'border-[#b9c0cb]/40 bg-[#f8fafb] text-[#4a5462] hover:bg-white'}
                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                      `}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2-Column: Consignment Tracking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Consignment ID / Docket Number */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-[#51a8b1]" />
                    Consignment / Docket / Tracking ID
                  </label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={trackingData.trackingNumber ?? ''}
                    onChange={(e) => updateItemField(itemKey, 'trackingNumber', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-1.5 text-xs bg-[#f8fafb] text-[#333333] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                    placeholder="e.g. DLV-987216440IN / TRK-554201"
                  />
                </div>

                {/* Courier / Logistics Partner */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                    <Truck className="w-3 h-3 text-[#51a8b1]" />
                    Courier / Logistics Partner
                  </label>
                  <input
                    type="text"
                    list={`courier_list_${itemKey}`}
                    disabled={disabled}
                    value={trackingData.courierName ?? ''}
                    onChange={(e) => updateItemField(itemKey, 'courierName', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                    placeholder="e.g. Delhivery / Safexpress / BlueDart"
                  />
                  <datalist id={`courier_list_${itemKey}`}>
                    {COURIER_SUGGESTIONS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Dispatch Date */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#51a8b1]" />
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    disabled={disabled}
                    value={trackingData.dispatchDate ?? ''}
                    onChange={(e) => updateItemField(itemKey, 'dispatchDate', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                  />
                </div>

                {/* Estimated Delivery Date */}
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5462] mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#51a8b1]" />
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    disabled={disabled}
                    value={trackingData.expectedDeliveryDate ?? ''}
                    onChange={(e) => updateItemField(itemKey, 'expectedDeliveryDate', e.target.value, itemData)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                  />
                </div>
              </div>

              {/* Destination Delivery Address */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#51a8b1]" />
                  Destination Delivery Address &amp; Site Contact
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  value={trackingData.deliveryAddress ?? schoolAddressFallback}
                  onChange={(e) => updateItemField(itemKey, 'deliveryAddress', e.target.value, itemData)}
                  className="w-full border border-[#b9c0cb]/60 rounded-xl p-2.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white resize-none"
                  placeholder="Enter delivery address, landmark, and site contact person for this consignment..."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
