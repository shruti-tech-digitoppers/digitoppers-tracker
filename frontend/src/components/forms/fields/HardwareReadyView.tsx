'use client';

import React, { useState } from 'react';
import { extractEffectiveSchools, EffectiveSchoolItem } from '../utils/formHelpers';
import { InstitutionalSchoolSelector } from '../common/InstitutionalSchoolSelector';
import { PackageCheck, Building2, Layers, Check, X, Calendar } from 'lucide-react';

interface HardwareReadyViewProps {
  value?: any;
  allFormData?: Record<string, any>;
}

export function HardwareReadyView({ value, allFormData = {} }: HardwareReadyViewProps) {
  const schoolList: EffectiveSchoolItem[] = extractEffectiveSchools(
    undefined,
    allFormData,
    value,
    'Main Institution'
  );

  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0);
  const currentSchool =
    schoolList[Math.min(activeSchoolIndex, schoolList.length - 1)] || schoolList[0];

  const savedVerification = value?.schoolWiseVerification || value?.items || {};
  const activeSchoolKey = currentSchool.name || currentSchool.id;
  const schData = savedVerification[activeSchoolKey] || {};
  const itemsList = Object.entries(schData?.items || {});

  const readyForInstallation = value?.readyForInstallation || 'YES';
  const damagedItems = value?.damagedItems || '';
  const remarks = value?.remarks || '';

  return (
    <div className="space-y-3 font-sans">
      <InstitutionalSchoolSelector
        schools={schoolList}
        activeIndex={activeSchoolIndex}
        onSelectIndex={(index) => setActiveSchoolIndex(index)}
        activeItemCount={itemsList.length}
        itemTypeLabel="Hardware Items Verified"
        totalAcrossSchoolsText={`${schoolList.length} Total Schools / Institutions`}
      />

      <div className="p-3.5 bg-white rounded-2xl border border-[#b6e0e4] space-y-2.5 text-xs shadow-2xs">
        <div className="flex items-center justify-between font-semibold text-[#2b303b]">
          <span className="flex items-center gap-1.5 font-heading text-[#333]">
            <Building2 className="w-4 h-4 text-[#51a8b1]" />
            {currentSchool.name}
          </span>
          {schData?.deliveryDate && (
            <span className="text-[10.5px] font-medium text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#51a8b1]" />
              Delivered: {schData.deliveryDate}
            </span>
          )}
        </div>

        {itemsList.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            {itemsList.map(([itemKey, itemVal]: [string, any]) => (
              <div key={itemKey} className="flex items-center justify-between p-2.5 bg-[#f8fafb] rounded-xl border border-[#b6e0e4]/60 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {itemVal.checked !== false ? (
                    <Check className="w-4 h-4 text-[#759724]" />
                  ) : (
                    <X className="w-4 h-4 text-rose-500" />
                  )}
                  <span className="font-bold text-[#333]">{itemKey}</span>
                  {itemVal.qty && <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#b6e0e4] font-semibold">Qty: {itemVal.qty}</span>}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {itemVal.deliveryDate && (
                    <span className="text-[10.5px] font-medium text-[#3a7d84] bg-[#f0f8f9] px-2 py-0.5 rounded-lg border border-[#b6e0e4] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#51a8b1]" />
                      Delivered: {itemVal.deliveryDate}
                    </span>
                  )}
                  {itemVal.remarks && (
                    <span className="text-[10.5px] text-[#4a5462] italic">
                      {itemVal.remarks}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-[#f0f8f9] text-[11px] text-[#3a7d84] rounded-xl border border-[#b6e0e4]">
            Hardware items verified for {currentSchool.name}.
          </div>
        )}
      </div>

      {(damagedItems || remarks) && (
        <div className="p-3 bg-[#f7fbe9]/60 rounded-xl border border-[#dfefa6] text-xs space-y-1 text-[#465b1c]">
          {damagedItems && <div><strong>Damaged / Missing Notes:</strong> {damagedItems}</div>}
          {remarks && <div><strong>Handover Remarks:</strong> {remarks}</div>}
        </div>
      )}
    </div>
  );
}
