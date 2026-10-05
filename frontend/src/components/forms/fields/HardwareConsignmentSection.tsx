'use client';

import React, { useState } from 'react';
import { extractEffectiveHardwareItems, extractEffectiveSchools, DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { 
  Truck, 
  MapPin, 
  Calendar, 
  Clock,
  Navigation,
  Plus,
  Trash2,
  Layers,
  Building2,
  User,
  CheckCircle2
} from 'lucide-react';

export type ConsignmentStatus = 'DISPATCHED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface ConsignmentEntry {
  id: string;
  quantity: number;
  status: ConsignmentStatus;
  trackingNumber?: string;
  courierName?: string;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
}

interface HardwareConsignmentSectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
  project?: any;
}

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
  project = null
}: HardwareConsignmentSectionProps) {
  const saved: Record<string, any> = React.useMemo(() => {
    if (!value || typeof value !== 'object') return {};
    if (value.items && typeof value.items === 'object') return value.items;
    const nonHwKeys = new Set([
      'trackingNumber',
      'courierName',
      'dispatchDate',
      'expectedDeliveryDate',
      'remarks',
      'submittedBy',
      'submittedAt',
      'status',
      '_id',
      'id',
      'items',
      'consignments',
      'consignment',
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

  // Extract products from Stage 04 stock check or Stage 03 School-wise requirements
  const stage4StockItems = allFormData?.stage4StockItems || allFormData?.stage4StockNodeFormData?.stockCheck?.items || allFormData?.stockCheck?.items || {};
  const resolvedHardware = extractEffectiveHardwareItems(allFormData, value, project);

  // Extract effective schools with addresses
  const effectiveSchools = React.useMemo(() => {
    return extractEffectiveSchools(
      project?.schools || allFormData?.stage3Schools || allFormData?.schools,
      allFormData,
      value
    );
  }, [project, allFormData, value]);

  // Extract school address fallback
  const schoolAddressFallback =
    allFormData?.schoolInfo?.address ||
    allFormData?.deliveryAddress ||
    allFormData?.projectReviewer?.projectCreated?.address ||
    effectiveSchools[0]?.address ||
    '';

  // Build unified hardware dictionary, excluding dummy legacy key 'consignments'
  const hwMap: Record<string, any> = {};

  // 1. Seed from Stage 03 Hardware Requirements
  Object.entries(resolvedHardware).forEach(([k, v]: [string, any]) => {
    if (k !== 'consignments' && k !== 'consignment') {
      hwMap[k] = {
        itemName: v.itemName || v.name || k,
        quantity: Number(v.quantity) || 1,
        specNotes: v.specNotes || '',
        schoolBreakdown: v.schoolBreakdown || [],
        ...v,
      };
    }
  });

  // 2. Overlay Stage 04 Stock Check
  Object.entries(stage4StockItems).forEach(([k, v]: [string, any]) => {
    if (k !== 'consignments' && k !== 'consignment') {
      const existing = hwMap[k] || {};
      hwMap[k] = {
        ...existing,
        ...v,
        itemName: v.itemName || existing.itemName || k,
        quantity: Number(v.purchaseQty || v.quantity || existing.quantity || 1),
        specNotes: v.specNotes || existing.specNotes || '',
        schoolBreakdown: v.schoolBreakdown || existing.schoolBreakdown || []
      };
    }
  });

  // 3. Overlay saved items
  Object.entries(saved).forEach(([k, v]: [string, any]) => {
    if (k !== 'consignments' && k !== 'consignment' && typeof v === 'object' && v !== null) {
      const existing = hwMap[k] || {};
      hwMap[k] = {
        ...existing,
        ...v,
        itemName: v.itemName || existing.itemName || k,
        specNotes: v.specNotes || existing.specNotes || '',
        schoolBreakdown: v.schoolBreakdown || existing.schoolBreakdown || []
      };
    }
  });

  const consignmentEntries = Object.entries(hwMap);

  // Helper to normalize and retrieve consignments list for an item
  const getItemConsignments = (itemKey: string, totalQty: number, customDefaultAddress?: string): ConsignmentEntry[] => {
    const existing = saved[itemKey] || hwMap[itemKey] || {};
    const defaultAddr = customDefaultAddress || existing.deliveryAddress || schoolAddressFallback;

    if (Array.isArray(existing.consignments) && existing.consignments.length > 0) {
      return existing.consignments.map((c: any, idx: number) => ({
        id: c.id || `cs_${itemKey}_${idx}_${Date.now()}`,
        quantity: Number(c.quantity) >= 0 ? Number(c.quantity) : 0,
        status: (c.status || existing.status || 'DISPATCHED') as ConsignmentStatus,
        trackingNumber: c.trackingNumber ?? existing.trackingNumber ?? '',
        courierName: c.courierName ?? existing.courierName ?? '',
        dispatchDate: c.dispatchDate ?? existing.dispatchDate ?? '',
        expectedDeliveryDate: c.expectedDeliveryDate ?? existing.expectedDeliveryDate ?? '',
        deliveryAddress: c.deliveryAddress ?? defaultAddr
      }));
    }

    return [
      {
        id: `cs_${itemKey}_1`,
        quantity: existing.quantity !== undefined ? Number(existing.quantity) : totalQty,
        status: (existing.status || 'DISPATCHED') as ConsignmentStatus,
        trackingNumber: existing.trackingNumber ?? '',
        courierName: existing.courierName ?? '',
        dispatchDate: existing.dispatchDate ?? '',
        expectedDeliveryDate: existing.expectedDeliveryDate ?? '',
        deliveryAddress: existing.deliveryAddress ?? defaultAddr
      }
    ];
  };

  const emitChanges = (nextItems: Record<string, any>) => {
    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  // Update a specific consignment entry's field
  const updateConsignmentField = (
    itemKey: string,
    consignmentIndex: number,
    field: keyof ConsignmentEntry,
    val: any,
    totalQty: number,
    itemInfo: any,
    defaultAddr?: string
  ) => {
    const currentConsignments = getItemConsignments(itemKey, totalQty, defaultAddr);
    if (!currentConsignments[consignmentIndex]) return;

    let parsedVal = val;
    if (field === 'quantity') {
      parsedVal = val === '' ? 0 : Math.max(0, Number(val) || 0);
    }

    currentConsignments[consignmentIndex] = {
      ...currentConsignments[consignmentIndex],
      [field]: parsedVal
    };

    const first = currentConsignments[0] || {};
    const totalConsigned = currentConsignments.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);

    const nextItems = {
      ...saved,
      [itemKey]: {
        ...(saved[itemKey] || itemInfo || {}),
        itemName: itemInfo.itemName || itemKey,
        specNotes: itemInfo.specNotes || '',
        quantity: totalQty,
        totalConsigned,
        consignments: currentConsignments,
        status: first.status || 'DISPATCHED',
        trackingNumber: first.trackingNumber || '',
        courierName: first.courierName || '',
        dispatchDate: first.dispatchDate || '',
        expectedDeliveryDate: first.expectedDeliveryDate || '',
        deliveryAddress: first.deliveryAddress || defaultAddr || schoolAddressFallback
      }
    };

    emitChanges(nextItems);
  };

  // Add a new consignment / dispatch entry
  const addConsignmentEntry = (itemKey: string, totalQty: number, itemInfo: any, defaultAddr?: string) => {
    const currentConsignments = getItemConsignments(itemKey, totalQty, defaultAddr);
    const newEntry: ConsignmentEntry = {
      id: `cs_${itemKey}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quantity: 0,
      status: 'DISPATCHED',
      trackingNumber: '',
      courierName: '',
      dispatchDate: '',
      expectedDeliveryDate: '',
      deliveryAddress: defaultAddr || schoolAddressFallback
    };

    const nextConsignments = [...currentConsignments, newEntry];
    const first = nextConsignments[0] || {};
    const totalConsigned = nextConsignments.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);

    const nextItems = {
      ...saved,
      [itemKey]: {
        ...(saved[itemKey] || itemInfo || {}),
        itemName: itemInfo.itemName || itemKey,
        specNotes: itemInfo.specNotes || '',
        quantity: totalQty,
        totalConsigned,
        consignments: nextConsignments,
        status: first.status || 'DISPATCHED',
        trackingNumber: first.trackingNumber || '',
        courierName: first.courierName || '',
        dispatchDate: first.dispatchDate || '',
        expectedDeliveryDate: first.expectedDeliveryDate || '',
        deliveryAddress: first.deliveryAddress || defaultAddr || schoolAddressFallback
      }
    };

    emitChanges(nextItems);
  };

  // Remove a consignment / dispatch entry
  const removeConsignmentEntry = (itemKey: string, consignmentIndex: number, totalQty: number, itemInfo: any) => {
    const currentConsignments = getItemConsignments(itemKey, totalQty);
    let nextConsignments = [...currentConsignments];
    nextConsignments.splice(consignmentIndex, 1);

    if (nextConsignments.length === 0) {
      nextConsignments = [
        {
          id: `cs_${itemKey}_reset_${Date.now()}`,
          quantity: totalQty,
          status: 'DISPATCHED',
          trackingNumber: '',
          courierName: '',
          dispatchDate: '',
          expectedDeliveryDate: '',
          deliveryAddress: schoolAddressFallback
        }
      ];
    }

    const first = nextConsignments[0] || {};
    const totalConsigned = nextConsignments.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);

    const nextItems = {
      ...saved,
      [itemKey]: {
        ...(saved[itemKey] || itemInfo || {}),
        itemName: itemInfo.itemName || itemKey,
        specNotes: itemInfo.specNotes || '',
        quantity: totalQty,
        totalConsigned,
        consignments: nextConsignments,
        status: first.status || 'DISPATCHED',
        trackingNumber: first.trackingNumber || '',
        courierName: first.courierName || '',
        dispatchDate: first.dispatchDate || '',
        expectedDeliveryDate: first.expectedDeliveryDate || '',
        deliveryAddress: first.deliveryAddress || schoolAddressFallback
      }
    };

    emitChanges(nextItems);
  };

  // Overall consignment summary metrics
  const totalUnits = consignmentEntries.reduce((acc, [_, item]) => acc + (Number(item.quantity) || 1), 0);
  const totalDispatched = consignmentEntries.reduce((acc, [k, item]) => {
    const list = getItemConsignments(k, Number(item.quantity) || 1);
    return acc + list.reduce((cAcc, c) => cAcc + (Number(c.quantity) || 0), 0);
  }, 0);

  if (consignmentEntries.length === 0) {
    return (
      <div className="p-6 bg-[#f0f8f9] border border-dashed border-[#b6e0e4] rounded-2xl text-center space-y-2 font-sans">
        <div className="w-10 h-10 rounded-full bg-[#d9eef0] flex items-center justify-center mx-auto text-[#51a8b1]">
          <Truck className="w-5 h-5" />
        </div>
        <p className="font-bold text-sm text-[#3a7d84]">No Hardware Items Found for Tracking</p>
        <p className="text-xs text-[#4a5462]">
          Hardware items from Stage 03 Requirements or Stage 04 Stock Check will appear here automatically.
        </p>
      </div>
    );
  }

  // Render individual consignment entry row
  const renderConsignmentEntry = (
    itemKey: string,
    consignment: ConsignmentEntry,
    cIdx: number,
    totalQty: number,
    itemData: any,
    canDelete: boolean,
    defaultAddr?: string
  ) => {
    const currentStatus = consignment.status || 'DISPATCHED';

    return (
      <div
        key={consignment.id || cIdx}
        className="p-3 rounded-xl border border-slate-200 bg-[#fbfcfd] space-y-3 transition"
      >
        {/* Entry Top Row: Tag, Quantity, Status Dropdown & Delete */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
              Consignment #{cIdx + 1}
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[10.5px] font-bold text-slate-600">Qty:</span>
              <input
                type="number"
                min="0"
                disabled={disabled}
                value={consignment.quantity === 0 ? '' : consignment.quantity}
                placeholder="0"
                onChange={(e) =>
                  updateConsignmentField(itemKey, cIdx, 'quantity', e.target.value, totalQty, itemData, defaultAddr)
                }
                className="w-18 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
              />
              <span className="text-[10px] text-slate-500 font-medium">units</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Transit Status Dropdown */}
            <select
              disabled={disabled}
              value={currentStatus}
              onChange={(e) =>
                updateConsignmentField(itemKey, cIdx, 'status', e.target.value as ConsignmentStatus, totalQty, itemData, defaultAddr)
              }
              className={`border rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] cursor-pointer shadow-2xs transition-all ${
                currentStatus === 'DELIVERED'
                  ? 'border-[#a8cf45] bg-[#f7fbe9] text-[#465b1c]'
                  : currentStatus === 'OUT_FOR_DELIVERY'
                  ? 'border-purple-300 bg-purple-50/60 text-purple-900'
                  : currentStatus === 'IN_TRANSIT'
                  ? 'border-amber-300 bg-amber-50/60 text-amber-900'
                  : 'border-[#b6e0e4] bg-[#f0f8f9] text-[#3a7d84]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <option value="DISPATCHED">📦 Dispatched</option>
              <option value="IN_TRANSIT">🚚 In Transit</option>
              <option value="OUT_FOR_DELIVERY">🏃 Out for Delivery</option>
              <option value="DELIVERED">✅ Delivered</option>
            </select>

            {/* Delete Consignment Button (if > 1) */}
            {canDelete && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => removeConsignmentEntry(itemKey, cIdx, totalQty, itemData)}
                title="Delete this consignment"
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Middle: Docket ID & Courier Partner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
              <Navigation className="w-3 h-3 text-[#51a8b1]" />
              Consignment / Docket / Tracking ID
            </label>
            <input
              type="text"
              disabled={disabled}
              value={consignment.trackingNumber ?? ''}
              onChange={(e) =>
                updateConsignmentField(itemKey, cIdx, 'trackingNumber', e.target.value, totalQty, itemData, defaultAddr)
              }
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
              placeholder="e.g. DLV-987216440IN / TRK-554201"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#51a8b1]" />
              Courier / Logistics Partner
            </label>
            <input
              type="text"
              list={`courier_list_${itemKey}_${cIdx}`}
              disabled={disabled}
              value={consignment.courierName ?? ''}
              onChange={(e) =>
                updateConsignmentField(itemKey, cIdx, 'courierName', e.target.value, totalQty, itemData, defaultAddr)
              }
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
              placeholder="e.g. Delhivery / Safexpress / BlueDart"
            />
            <datalist id={`courier_list_${itemKey}_${cIdx}`}>
              {COURIER_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Dates: Dispatch Date & Expected Delivery Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#4a5462] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#51a8b1]" />
              Dispatch Date
            </label>
            <input
              type="date"
              disabled={disabled}
              value={consignment.dispatchDate ?? ''}
              onChange={(e) =>
                updateConsignmentField(itemKey, cIdx, 'dispatchDate', e.target.value, totalQty, itemData, defaultAddr)
              }
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#4a5462] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#51a8b1]" />
              Expected Delivery Date
            </label>
            <input
              type="date"
              disabled={disabled}
              value={consignment.expectedDeliveryDate ?? ''}
              onChange={(e) =>
                updateConsignmentField(itemKey, cIdx, 'expectedDeliveryDate', e.target.value, totalQty, itemData, defaultAddr)
              }
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
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
            value={consignment.deliveryAddress ?? defaultAddr ?? schoolAddressFallback}
            onChange={(e) =>
              updateConsignmentField(itemKey, cIdx, 'deliveryAddress', e.target.value, totalQty, itemData, defaultAddr)
            }
            className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] resize-none"
            placeholder="Enter delivery address, landmark, and site contact person for this consignment..."
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="space-y-4">
          {consignmentEntries.map(([itemKey, itemData]: [string, any]) => {
            const totalQty = Number(itemData.quantity) || 1;
            const consignments = getItemConsignments(itemKey, totalQty);
            const totalConsigned = consignments.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0);

            return (
              <div
                key={itemKey}
                className="p-3.5 sm:p-4 rounded-2xl border border-[#51a8b1]/35 bg-white space-y-3.5 shadow-xs"
              >
                {/* Product Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2.5">
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-bold text-[#333333] font-heading flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#51a8b1] flex-shrink-0" />
                      {DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.label === itemKey)?.label || itemKey}
                    </h4>
                    {itemData.specNotes && (
                      <p className="text-[10.5px] text-[#4a5462] truncate mt-0.5">
                        <strong>Spec:</strong> {itemData.specNotes}
                      </p>
                    )}
                    {itemData.schoolBreakdown && itemData.schoolBreakdown.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[9.5px] font-bold text-[#556987] flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#51a8b1]" /> School Allocation:
                        </span>
                        {itemData.schoolBreakdown.map((sb: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[9.5px] font-medium px-2 py-0.5 rounded-md bg-[#f8fafb] border border-[#b9c0cb]/40 text-[#333333]"
                          >
                            <span className="font-bold text-[#1e293b]">{sb.schoolName || sb.schoolId}:</span>
                            <strong className="text-[#3a7d84]">{sb.quantity} Units</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                    <span className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-1 rounded-xl border border-[#b6e0e4]">
                      Total Required: {totalQty} Units
                    </span>

                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => addConsignmentEntry(itemKey, totalQty, itemData)}
                      className="text-xs font-bold text-[#3a7d84] hover:text-[#2d6268] flex items-center gap-1 px-2.5 py-1 rounded-xl border border-dashed border-[#51a8b1]/60 bg-[#f0f8f9]/70 hover:bg-[#f0f8f9] transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Consignment
                    </button>
                  </div>
                </div>

                {/* Consignment Entries List */}
                <div className="space-y-3">
                  {consignments.map((consignment: ConsignmentEntry, cIdx: number) =>
                    renderConsignmentEntry(
                      itemKey,
                      consignment,
                      cIdx,
                      totalQty,
                      itemData,
                      consignments.length > 1
                    )
                  )}

                  {/* Bottom Allocation Metric */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10.5px]">
                    <div className="text-slate-600 font-medium">
                      Total Dispatched: <strong>{totalConsigned}</strong> / {totalQty} Units
                      {totalConsigned === totalQty ? (
                        <span className="text-emerald-700 font-bold ml-1.5">✓ All {totalQty} Units Accounted</span>
                      ) : totalConsigned < totalQty ? (
                        <span className="text-amber-700 font-bold ml-1.5">
                          ({totalQty - totalConsigned} Units Pending Dispatch)
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold ml-1.5">
                          (+{totalConsigned - totalQty} Extra Units)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      {/* Summary Metrics Bar at Bottom */}
      <div className="p-3 bg-white border border-[#b6e0e4] rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#3a7d84] font-heading">
          <span>Consignment Tracking Overview</span>
          <span>Total Units: <strong>{totalUnits}</strong></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4]">
            <span className="text-[10px] text-[#4a5462] block">Total Hardware Types</span>
            <span className="font-bold text-[#3a7d84] text-sm">{consignmentEntries.length} Items</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f7fbe9] border border-[#dfefa6]">
            <span className="text-[10px] text-[#58731f] block">Destination Schools</span>
            <span className="font-bold text-[#465b1c] text-sm">{effectiveSchools.length} Locations</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] text-purple-700 block">Total Units Dispatched</span>
            <span className="font-bold text-purple-800 text-sm">{totalDispatched} Units</span>
          </div>
        </div>
      </div>
    </div>
  );
}
