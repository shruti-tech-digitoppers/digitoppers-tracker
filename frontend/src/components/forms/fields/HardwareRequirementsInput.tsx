'use client';

import React from 'react';
import { DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { Check, Info } from 'lucide-react';

interface HardwareRequirementsInputProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function HardwareRequirementsInput({
  value,
  onChange,
  disabled = false,
}: HardwareRequirementsInputProps) {
  const currentItems: Record<string, any> = typeof value?.items === 'object' && value?.items !== null 
    ? value.items 
    : (typeof value === 'object' && value !== null && !value.items ? value : {});

  const toggleItem = (itemKey: string, itemLabel: string) => {
    const isSelected = Boolean(currentItems[itemKey] && currentItems[itemKey].selected !== false);
    const nextItems = { ...currentItems };
    if (isSelected) {
      delete nextItems[itemKey];
    } else {
      nextItems[itemKey] = {
        selected: true,
        itemName: itemLabel,
        quantity: 1,
        specNotes: '',
      };
    }
    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  const updateField = (itemKey: string, itemLabel: string, subField: string, subVal: any) => {
    const nextItems = { ...currentItems };
    nextItems[itemKey] = {
      ...(nextItems[itemKey] || { 
        selected: true, 
        itemName: itemLabel, 
        quantity: 1,
        specNotes: ''
      }),
      [subField]: subVal
    };
    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  const selectedList = Object.entries(currentItems).filter(([_, v]: [string, any]) => v && v.selected !== false);
  const totalUnits = selectedList.reduce((acc, [_, v]: [string, any]) => acc + (Number(v.quantity) || 1), 0);

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#333333] font-heading">
          Select Hardware Equipment
        </span>
        <span className="font-bold text-[#51a8b1] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4] text-[11px]">
          {selectedList.length} Selected ({totalUnits} Units)
        </span>
      </div>

      <div className="space-y-2">
        {DEFAULT_HARDWARE_ITEMS.map((item) => {
          const itemConfig = currentItems[item.key] || null;
          const isSelected = Boolean(itemConfig && itemConfig.selected !== false);

          return (
            <div
              key={item.key}
              className={`rounded-xl border transition-all ${
                isSelected 
                  ? 'border-[#51a8b1] bg-[#f0f8f9]/20 shadow-2xs' 
                  : 'border-[#b9c0cb]/30 bg-white hover:border-[#51a8b1]/40'
              }`}
            >
              {/* Product Header Toggle */}
              <div
                onClick={() => !disabled && toggleItem(item.key, item.label)}
                className="flex items-center justify-between p-2.5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                    isSelected ? 'bg-[#51a8b1] border-[#51a8b1] text-white' : 'border-[#b9c0cb] bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-base leading-none">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#333333] leading-tight truncate">{item.label}</p>
                    <p className="text-[10px] text-[#4a5462] leading-tight truncate">{item.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-bold text-[#3a7d84] bg-white px-2 py-0.5 rounded-full border border-[#b6e0e4]">
                    Qty: {itemConfig?.quantity || 1}
                  </span>
                )}
              </div>

              {/* Quantity & Spec Inputs */}
              {isSelected && (
                <div className="px-3 pb-3 pt-2 border-t border-[#b6e0e4]/50 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9.5px] font-bold text-[#4a5462] mb-0.5">
                      Required Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={disabled}
                      value={itemConfig?.quantity ?? 1}
                      onChange={(e) => updateField(item.key, item.label, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-[#f8fafb] text-[#333333] font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                      placeholder="1"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9.5px] font-bold text-[#4a5462] mb-0.5">
                      Model / Brand / Specification
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={itemConfig?.specNotes ?? ''}
                      onChange={(e) => updateField(item.key, item.label, 'specNotes', e.target.value)}
                      className="w-full border border-[#b9c0cb]/60 rounded-lg px-2 py-1 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                      placeholder="e.g. 75-inch UHD, Maxhub, 4GB RAM"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
