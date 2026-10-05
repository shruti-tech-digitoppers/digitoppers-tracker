'use client';

import React, { useState } from 'react';
import { extractEffectiveSchools, extractEffectiveHardwareItems, EffectiveSchoolItem, DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import {
  PackageCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  Check,
  X,
  MessageSquare,
  Truck,
  Sparkles,
} from 'lucide-react';

interface HardwareReadySectionProps {
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
}

export interface SchoolVerificationItem {
  deliveryDate?: string;
  deliveryStatus?: string;
  items?: Record<
    string,
    {
      checked: boolean;
      deliveryDate?: string;
      remarks?: string;
      qty?: number;
    }
  >;
  schoolRemarks?: string;
}

export function HardwareReadySection({
  value,
  onChange,
  disabled = false,
  allFormData = {},
}: HardwareReadySectionProps) {
  // Extract normalized school list using institutional school helper
  const schoolList: EffectiveSchoolItem[] = extractEffectiveSchools(
    undefined,
    allFormData,
    value,
    'Main Institution'
  );

  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0);
  const currentSchool =
    schoolList[Math.min(activeSchoolIndex, schoolList.length - 1)] || schoolList[0];

  // Extract overall hardware & school breakdown
  const resolvedHardware = extractEffectiveHardwareItems(allFormData, value);

  // Extract raw school breakdown from Stage 03 / Order Requirement
  const rawSchoolWise =
    allFormData?.schoolWiseHardware ||
    allFormData?.hardwareRequirements?.schoolWiseHardware ||
    allFormData?.stage3SchoolWiseHardware ||
    allFormData?.stage3HardwareData?.schoolWiseHardware ||
    value?.schoolWiseHardware;

  // Extract saved data structure
  const savedVerification: Record<string, SchoolVerificationItem> =
    typeof value?.schoolWiseVerification === 'object' && value?.schoolWiseVerification !== null
      ? value.schoolWiseVerification
      : typeof value?.items === 'object' && value?.items !== null
      ? value.items
      : {};

  const overallDate = value?.deliveryDate || '';
  const readyForInstallation = value?.readyForInstallation || 'YES';
  const allHardwareReceived = value?.allHardwareReceived || 'YES';
  const damagedItems = value?.damagedItems || '';
  const overallRemarks = value?.remarks || '';

  // ── Build hardware allocation for current active school ────────────────
  const activeSchoolKey = currentSchool.name || currentSchool.id;
  const activeSchoolSaved = savedVerification[activeSchoolKey] || {};
  const activeSchoolDate = activeSchoolSaved.deliveryDate || overallDate || '';
  const activeSchoolStatus = activeSchoolSaved.deliveryStatus || 'DELIVERED';
  const savedItems = activeSchoolSaved.items || {};

  // Resolve hardware items specifically allocated to this school or overall project
  const currentSchoolHardware: Record<string, { itemName: string; quantity: number; specNotes: string }> = {};

  if (rawSchoolWise) {
    if (Array.isArray(rawSchoolWise)) {
      const matchObj = rawSchoolWise.find(
        (sch: any) =>
          (sch.schoolName || sch.name || sch.schoolId) === activeSchoolKey ||
          (sch.schoolName || sch.name || sch.schoolId) === currentSchool.id
      );
      const hwObj = matchObj?.hardware || matchObj?.items || {};
      Object.entries(hwObj).forEach(([k, v]: [string, any]) => {
        currentSchoolHardware[k] = {
          itemName: v.itemName || v.name || k,
          quantity: Number(v.quantity || v.qty) || 1,
          specNotes: v.specNotes || v.specs || '',
        };
      });
    } else if (typeof rawSchoolWise === 'object') {
      const hwObj = rawSchoolWise[activeSchoolKey] || rawSchoolWise[currentSchool.id] || {};
      if (hwObj && typeof hwObj === 'object') {
        Object.entries(hwObj).forEach(([k, v]: [string, any]) => {
          currentSchoolHardware[k] = {
            itemName: v.itemName || v.name || k,
            quantity: Number(v.quantity || v.qty) || 1,
            specNotes: v.specNotes || v.specs || '',
          };
        });
      }
    }
  }

  // Fallback: If no school-specific hardware breakdown, show all project hardware
  if (Object.keys(currentSchoolHardware).length === 0) {
    Object.entries(resolvedHardware).forEach(([k, v]: [string, any]) => {
      currentSchoolHardware[k] = {
        itemName: v.itemName || k,
        quantity: Number(v.quantity) || 1,
        specNotes: v.specNotes || '',
      };
    });
  }

  const currentHwList = Object.entries(currentSchoolHardware);

  // ── Helper to patch root state ─────────────────────────────────────────
  const updateRoot = (fields: Record<string, any>) => {
    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      ...fields,
    });
  };

  // Helper to patch active school's verification record
  const patchSchool = (schoolKey: string, fields: Partial<SchoolVerificationItem>) => {
    const existingSchool = savedVerification[schoolKey] || {
      deliveryDate: overallDate || '',
      deliveryStatus: 'DELIVERED',
      items: {},
    };

    const nextVerification = {
      ...savedVerification,
      [schoolKey]: {
        ...existingSchool,
        ...fields,
      },
    };

    updateRoot({ schoolWiseVerification: nextVerification });
  };

  // Helper to patch a single hardware item inside active school (including its own deliveryDate)
  const patchItem = (
    schoolKey: string,
    itemKey: string,
    itemFields: Partial<{ checked: boolean; deliveryDate: string; remarks: string; qty: number }>
  ) => {
    const schoolData = savedVerification[schoolKey] || {
      deliveryDate: overallDate || '',
      deliveryStatus: 'DELIVERED',
      items: {},
    };

    const currentItems = schoolData.items || {};
    const currentItem = currentItems[itemKey] || {
      checked: true,
      deliveryDate: activeSchoolDate || '',
      remarks: '',
    };

    const updatedItems = {
      ...currentItems,
      [itemKey]: {
        ...currentItem,
        ...itemFields,
      },
    };

    patchSchool(schoolKey, { items: updatedItems });
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ── 1. Institutional School Tab Selector & Dropdown Component ── */}
      <InstitutionalSchoolSelector
        schools={schoolList}
        activeIndex={activeSchoolIndex}
        onSelectIndex={(index) => setActiveSchoolIndex(index)}
        activeItemCount={currentHwList.length}
        itemTypeLabel="Hardware Models"
        totalAcrossSchoolsText={`${schoolList.length} Total Schools / Institutions`}
        disabled={disabled}
      />

      {/* ── 2. Active School Verification Card ── */}
      <div className="rounded-2xl border border-[#b6e0e4] bg-white shadow-xs overflow-hidden">
        {/* Active School Delivery Header */}
        <div className="bg-gradient-to-r from-[#f0f8f9] via-white to-[#f0f8f9] p-4 border-b border-[#b6e0e4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4.5 h-4.5 text-[#51a8b1] flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#333333] font-heading truncate">
                {currentSchool.name} — Hardware Delivery &amp; Verification
              </h4>
              <p className="text-[10.5px] text-[#4a5462] truncate">
                {currentHwList.length} Hardware Model(s) Allocated to this Location
              </p>
            </div>
          </div>

          {/* School Level Overall Delivery Date & Status Inputs */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#b6e0e4] shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-[#51a8b1]" />
              <span className="text-[10px] font-bold text-[#3a7d84]">School Delivery Date:</span>
              <input
                type="date"
                disabled={disabled}
                value={activeSchoolDate}
                onChange={(e) => patchSchool(activeSchoolKey, { deliveryDate: e.target.value })}
                className="text-xs border-none bg-transparent focus:outline-none text-[#333333] font-semibold cursor-pointer"
              />
            </div>

            <select
              disabled={disabled}
              value={activeSchoolStatus}
              onChange={(e) => patchSchool(activeSchoolKey, { deliveryStatus: e.target.value })}
              className="text-xs border border-[#b6e0e4] rounded-xl px-3 py-1.5 bg-white text-[#333333] font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] shadow-2xs cursor-pointer"
            >
              <option value="DELIVERED">✅ Delivered</option>
              <option value="PARTIALLY_DELIVERED">🌗 Partially Delivered</option>
              <option value="PENDING">⏳ In Transit / Pending</option>
            </select>
          </div>
        </div>

        {/* Hardware Items Checklist with Individual Per-Hardware Delivery Date */}
        <div className="p-4 space-y-3">
          <div className="text-[10.5px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1.5 pb-1 border-b border-[#f0f8f9]">
            <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
            Hardware Verification Checklist ({currentHwList.length} Models)
          </div>

          <div className="space-y-2.5">
            {currentHwList.map(([itemKey, hwItem]: [string, any]) => {
              const itemData = savedItems[itemKey] || {};
              const isChecked = itemData.checked !== undefined ? itemData.checked : true;
              const itemDeliveryDate = itemData.deliveryDate || activeSchoolDate || '';
              const itemRemarks = itemData.remarks || '';
              const qty = hwItem.quantity || 1;

              return (
                <div
                  key={itemKey}
                  className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isChecked
                      ? 'border-[#dfefa6] bg-[#f7fbe9]/60'
                      : 'border-[#b9c0cb]/40 bg-[#f8fafb]'
                  }`}
                >
                  {/* Left: Checkbox + Item Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={isChecked}
                        onChange={(e) =>
                          patchItem(activeSchoolKey, itemKey, { checked: e.target.checked, qty })
                        }
                        className="w-4 h-4 text-[#759724] border-[#dfefa6] rounded focus:ring-[#759724] cursor-pointer"
                      />
                    </label>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#333333] font-heading">
                          {DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.label === itemKey)?.label || itemKey}
                        </span>
                        <span className="text-[10px] font-bold text-[#465b1c] bg-[#eff8d0] px-2.5 py-0.5 rounded-full border border-[#dfefa6]">
                          Allocated Qty: {qty}
                        </span>
                      </div>
                      {hwItem.specNotes && (
                        <p className="text-[10.5px] text-[#4a5462] truncate mt-0.5">
                          <strong>Spec:</strong> {hwItem.specNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Per-Hardware Delivery Date Input + Condition/Remarks Input */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 sm:w-auto w-full flex-wrap sm:flex-nowrap">
                    {/* Per-Hardware Delivery Date Input */}
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-[#b9c0cb]/60 sm:w-52 w-full">
                      <Calendar className="w-3.5 h-3.5 text-[#51a8b1] flex-shrink-0" />
                      <span className="text-[10px] font-bold text-[#3a7d84] whitespace-nowrap">Delivered:</span>
                      <input
                        type="date"
                        disabled={disabled}
                        value={itemDeliveryDate}
                        onChange={(e) =>
                          patchItem(activeSchoolKey, itemKey, { deliveryDate: e.target.value })
                        }
                        className="w-full text-xs border-none bg-transparent focus:outline-none text-[#333333] font-medium cursor-pointer min-w-0"
                        title="Delivery date for this specific hardware item"
                      />
                    </div>

                    {/* Condition / Verification Notes */}
                    <div className="sm:w-56 w-full">
                      <input
                        type="text"
                        disabled={disabled}
                        value={itemRemarks}
                        onChange={(e) =>
                          patchItem(activeSchoolKey, itemKey, { remarks: e.target.value })
                        }
                        className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                        placeholder="Condition / Notes (e.g. Received)"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Overall Readiness Sign-Off Section ── */}
      <div className="p-4 rounded-2xl border border-[#51a8b1]/40 bg-white space-y-3.5 shadow-xs">
        <h4 className="text-xs font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center gap-1.5 border-b border-[#b6e0e4] pb-2">
          <CheckCircle2 className="w-4 h-4 text-[#51a8b1]" />
          Overall Installation Readiness Sign-Off
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* All Hardware Received */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#4a5462]">
              All Hardware Received across Locations?
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#465b1c] cursor-pointer">
                <input
                  type="radio"
                  name="allHardwareReceived"
                  disabled={disabled}
                  checked={allHardwareReceived === 'YES'}
                  onChange={() => updateRoot({ allHardwareReceived: 'YES' })}
                  className="text-[#759724] focus:ring-[#759724]"
                />
                YES — All Received
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 cursor-pointer">
                <input
                  type="radio"
                  name="allHardwareReceived"
                  disabled={disabled}
                  checked={allHardwareReceived === 'NO'}
                  onChange={() => updateRoot({ allHardwareReceived: 'NO' })}
                  className="text-rose-600 focus:ring-rose-500"
                />
                NO — Pending / Missing
              </label>
            </div>
          </div>

          {/* Ready for Installation */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-[#4a5462]">
              Ready for On-Site Field Installation?
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-[#3a7d84] cursor-pointer">
                <input
                  type="radio"
                  name="readyForInstallation"
                  disabled={disabled}
                  checked={readyForInstallation === 'YES'}
                  onChange={() => updateRoot({ readyForInstallation: 'YES' })}
                  className="text-[#51a8b1] focus:ring-[#51a8b1]"
                />
                YES — Ready for Field Team
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 cursor-pointer">
                <input
                  type="radio"
                  name="readyForInstallation"
                  disabled={disabled}
                  checked={readyForInstallation === 'NO'}
                  onChange={() => updateRoot({ readyForInstallation: 'NO' })}
                  className="text-amber-600 focus:ring-amber-500"
                />
                NO — Hold
              </label>
            </div>
          </div>
        </div>

        {/* Damaged items & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5462] mb-1">
              Damaged or Defective Items Notes (If Any)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={damagedItems}
              onChange={(e) => updateRoot({ damagedItems: e.target.value })}
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
              placeholder="e.g. None / 1 Cable box torn"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5462] mb-1">
              Overall Hardware Handover Remarks
            </label>
            <input
              type="text"
              disabled={disabled}
              value={overallRemarks}
              onChange={(e) => updateRoot({ remarks: e.target.value })}
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
              placeholder="Handover remarks for installation team"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
