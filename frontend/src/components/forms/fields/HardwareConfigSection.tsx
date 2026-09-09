'use client';

import React from 'react';
import { DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { IUser } from '../../../types/auth';
import { Check, Info, User } from 'lucide-react';

interface HardwareConfigSectionProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  employees?: IUser[];
}

export function HardwareConfigSection({
  value,
  onChange,
  disabled = false,
  employees = [],
}: HardwareConfigSectionProps) {
  const currentItems: Record<string, any> = typeof value?.items === 'object' && value?.items !== null 
    ? value.items 
    : (typeof value === 'object' && value !== null && !value.items ? value : {});

  const assignedHardwareManager = value?.assignedHardwareManager || '';

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
      items: nextItems,
      assignedHardwareManager
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
      items: nextItems,
      assignedHardwareManager
    });
  };

  const setHardwareManager = (empId: string) => {
    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: currentItems,
      assignedHardwareManager: empId
    });
  };

  const selectedList = Object.entries(currentItems).filter(([_, v]: [string, any]) => v && v.selected !== false);
  const totalUnits = selectedList.reduce((acc, [_, v]: [string, any]) => acc + (Number(v.quantity) || 1), 0);

  return (
    <div className="space-y-3.5 font-sans">
      {/* Hardware Manager Assignee Selector */}
      {employees.length > 0 && (
        <div className="p-3 bg-white border border-[#b9c0cb]/40 rounded-2xl space-y-1.5 shadow-2xs">
          <label className="block text-xs font-bold text-[#3a7d84] uppercase tracking-wider font-heading flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#51a8b1]" />
              Assign Hardware Lead (Responsible for Stage 04 Stock Check)
            </span>
            {assignedHardwareManager && (
              <span className="text-[10px] text-[#759724] font-semibold">● Alert Enabled</span>
            )}
          </label>
          <select
            disabled={disabled}
            value={assignedHardwareManager}
            onChange={(e) => setHardwareManager(e.target.value)}
            className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
          >
            <option value="">👤 Select Hardware Lead / Member</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({(emp as any).globalRole || 'Employee'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hardware Products Catalog */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-[#333333] font-heading">
            Select Hardware Equipment ({DEFAULT_HARDWARE_ITEMS.length} Catalog Items)
          </p>
          <span className="text-[10px] font-bold text-[#51a8b1] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4]">
            {selectedList.length} Selected ({totalUnits} Units)
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {DEFAULT_HARDWARE_ITEMS.map((item) => {
            const itemConfig = currentItems[item.key] || null;
            const isSelected = Boolean(itemConfig && itemConfig.selected !== false);

            return (
              <div
                key={item.key}
                className={`rounded-2xl border transition-all ${
                  isSelected 
                    ? 'border-[#51a8b1] bg-[#f0f8f9]/20 shadow-xs ring-1 ring-[#51a8b1]/20' 
                    : 'border-[#b9c0cb]/40 bg-white hover:border-[#51a8b1]/40'
                }`}
              >
                {/* Product Header Row */}
                <div
                  onClick={() => !disabled && toggleItem(item.key, item.label)}
                  className="flex items-center justify-between p-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] ${
                      isSelected ? 'bg-[#51a8b1] border-[#51a8b1] text-white' : 'border-[#b9c0cb] bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-lg leading-none">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#333333] leading-tight truncate">{item.label}</p>
                      <p className="text-[10.5px] text-[#4a5462] leading-tight truncate">{item.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10.5px] font-bold text-[#3a7d84] bg-white px-2.5 py-0.5 rounded-full border border-[#b6e0e4] shadow-2xs">
                      Qty: {itemConfig?.quantity || 1}
                    </span>
                  )}
                </div>

                {/* Only Quantity & Model / Specification Input */}
                {isSelected && (
                  <div className="px-3.5 pb-3.5 pt-2.5 border-t border-[#b6e0e4]/50 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5462] mb-1">
                        Total Quantity Required <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        disabled={disabled}
                        value={itemConfig?.quantity ?? 1}
                        onChange={(e) => updateField(item.key, item.label, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                        className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                        placeholder="1"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-[#4a5462] mb-1">
                        Specification / Model / Brand
                      </label>
                      <input
                        type="text"
                        disabled={disabled}
                        value={itemConfig?.specNotes ?? ''}
                        onChange={(e) => updateField(item.key, item.label, 'specNotes', e.target.value)}
                        className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                        placeholder="e.g. 75-inch 4K UHD, Maxhub, 4GB RAM + 32GB Storage"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
