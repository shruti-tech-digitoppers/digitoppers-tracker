'use client';

import React from 'react';
import { DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { IUser } from '../../../types/auth';
import { 
  PackageCheck, 
  ShoppingCart, 
  Info, 
  AlertTriangle, 
  GitFork, 
  User, 
  Check, 
  Layers
} from 'lucide-react';

interface HardwareStockCheckProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
  employees?: IUser[];
}

export type StockMode = 'IN_STOCK' | 'PURCHASE_REQUIRED' | 'SPLIT';

export function HardwareStockCheck({
  value,
  onChange,
  disabled = false,
  allFormData = {},
  employees = [],
}: HardwareStockCheckProps) {
  const currentItems: Record<string, any> = typeof value?.items === 'object' && value?.items !== null 
    ? value.items 
    : (typeof value === 'object' && value !== null && !value.items ? value : {});

  // Extract products from Stage 03 Hardware Requirements if available
  const stage3Items = allFormData?.stage3HardwareItems || allFormData?.hardwareRequirements?.items || allFormData?.hardware?.items || {};

  const activeEntries: [string, any][] = Object.entries(currentItems).length > 0
    ? Object.entries(currentItems)
    : Object.entries(stage3Items).length > 0
    ? Object.entries(stage3Items).map(([k, v]: [string, any]) => [
        k,
        {
          selected: true,
          itemName: v.itemName || k,
          quantity: Number(v.quantity) || 1,
          specNotes: v.specNotes || '',
          stockDecision: 'IN_STOCK',
          inStockQty: Number(v.quantity) || 1,
          purchaseQty: 0,
          inStockAssignedTo: '',
          purchaseAssignedTo: '',
          inStockNotes: '',
          purchaseNotes: ''
        }
      ])
    : (DEFAULT_HARDWARE_ITEMS.slice(0, 3).map((item) => [
        item.key,
        { 
          selected: true, 
          itemName: item.label, 
          quantity: 2, 
          stockDecision: 'IN_STOCK',
          inStockQty: 2, 
          purchaseQty: 0, 
          specNotes: '',
          inStockAssignedTo: '',
          purchaseAssignedTo: '',
          inStockNotes: '',
          purchaseNotes: ''
        }
      ]) as [string, any][]);

  const handleModeChange = (itemKey: string, newMode: StockMode, totalQty: number, itemInfo: any) => {
    const existing = currentItems[itemKey] || itemInfo || {};
    let nextInStock = totalQty;
    let nextPurchase = 0;

    if (newMode === 'IN_STOCK') {
      nextInStock = totalQty;
      nextPurchase = 0;
    } else if (newMode === 'PURCHASE_REQUIRED') {
      nextInStock = 0;
      nextPurchase = totalQty;
    } else if (newMode === 'SPLIT') {
      nextInStock = Math.max(1, Math.floor(totalQty / 2));
      nextPurchase = totalQty - nextInStock;
    }

    const nextItems = {
      ...currentItems,
      [itemKey]: {
        ...existing,
        selected: true,
        itemName: existing.itemName || itemInfo.itemName,
        specNotes: existing.specNotes || itemInfo.specNotes,
        quantity: totalQty,
        stockDecision: newMode,
        inStockQty: nextInStock,
        purchaseQty: nextPurchase,
      }
    };

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  const handleInStockQtyChange = (itemKey: string, newInStock: number, totalQty: number, itemInfo: any) => {
    const safeInStock = Math.min(totalQty, Math.max(0, newInStock || 0));
    const autoPurchase = Math.max(0, totalQty - safeInStock);
    const existing = currentItems[itemKey] || itemInfo || {};

    const nextItems = {
      ...currentItems,
      [itemKey]: {
        ...existing,
        selected: true,
        itemName: existing.itemName || itemInfo.itemName,
        specNotes: existing.specNotes || itemInfo.specNotes,
        quantity: totalQty,
        stockDecision: 'SPLIT',
        inStockQty: safeInStock,
        purchaseQty: autoPurchase
      }
    };

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      items: nextItems
    });
  };

  const updateItemField = (itemKey: string, subField: string, subVal: any, itemInfo: any) => {
    const existing = currentItems[itemKey] || itemInfo || {};
    const nextItems = {
      ...currentItems,
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

  const totalRequiredUnits = activeEntries.reduce((acc, [_, v]) => acc + (Number(v?.quantity) || 1), 0);
  
  const totalInStockUnits = activeEntries.reduce((acc, [_, v]) => {
    const mode = v.stockDecision || 'IN_STOCK';
    if (mode === 'SPLIT') return acc + (Number(v.inStockQty) || 0);
    if (mode === 'PURCHASE_REQUIRED') return acc;
    return acc + (Number(v.quantity) || 1);
  }, 0);

  const totalPurchaseUnits = activeEntries.reduce((acc, [_, v]) => {
    const mode = v.stockDecision || 'IN_STOCK';
    if (mode === 'SPLIT') return acc + (Number(v.purchaseQty) || 0);
    if (mode === 'PURCHASE_REQUIRED') return acc + (Number(v.quantity) || 1);
    return acc;
  }, 0);

  const assignedPeopleCount = activeEntries.reduce((acc, [_, v]) => {
    let count = 0;
    if (v.stockDecision === 'SPLIT') {
      if (v.inStockAssignedTo) count++;
      if (v.purchaseAssignedTo && v.purchaseAssignedTo !== v.inStockAssignedTo) count++;
    } else if (v.inStockAssignedTo || v.purchaseAssignedTo || v.assignedTo) {
      count++;
    }
    return acc + count;
  }, 0);

  return (
    <div className="space-y-3.5 font-sans">
      {/* Individual Products Stock & Assignment Cards */}
      <div className="space-y-3">
        {activeEntries.map(([itemKey, itemData]: [string, any]) => {
          const totalQty = Number(itemData.quantity) || 1;
          const mode: StockMode = itemData.stockDecision || 'IN_STOCK';
          const inStockQty = itemData.inStockQty !== undefined ? Number(itemData.inStockQty) : (mode === 'IN_STOCK' ? totalQty : 0);
          const purchaseQty = itemData.purchaseQty !== undefined ? Number(itemData.purchaseQty) : (mode === 'PURCHASE_REQUIRED' ? totalQty : 0);
          const inStockAssignee = itemData.inStockAssignedTo || itemData.assignedTo || '';
          const purchaseAssignee = itemData.purchaseAssignedTo || (mode === 'PURCHASE_REQUIRED' ? itemData.assignedTo : '') || '';

          return (
            <div
              key={itemKey}
              className="p-3.5 rounded-2xl border border-[#51a8b1]/40 bg-white space-y-3 shadow-xs"
            >
              {/* Product Header Row */}
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#333333] font-heading flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                    {itemData.itemName || itemKey}
                  </h4>
                  {itemData.specNotes && (
                    <p className="text-[10.5px] text-[#4a5462] truncate mt-0.5">
                      <strong>Spec:</strong> {itemData.specNotes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <span className="text-[10.5px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4]">
                    Total Required: {totalQty} Units
                  </span>
                </div>
              </div>

              {/* Stock Mode Selection */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#3a7d84] uppercase tracking-wider font-heading">
                  Stock Status &amp; Fulfillment Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  {/* 100% In Stock */}
                  <label className={`
                    flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition
                    ${mode === 'IN_STOCK' 
                      ? 'border-[#a8cf45] bg-[#f7fbe9] text-[#465b1c] font-bold shadow-2xs' 
                      : 'border-[#b9c0cb]/40 bg-[#f8fafb] text-[#4a5462] hover:bg-white'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  `}>
                    <input
                      type="radio"
                      name={`${itemKey}_stock_mode`}
                      disabled={disabled}
                      checked={mode === 'IN_STOCK'}
                      onChange={() => handleModeChange(itemKey, 'IN_STOCK', totalQty, itemData)}
                      className="text-[#51a8b1] focus:ring-[#51a8b1]"
                    />
                    <PackageCheck className="w-3.5 h-3.5 text-[#759724] flex-shrink-0" />
                    <span className="truncate">100% In Stock</span>
                  </label>

                  {/* 100% Purchase */}
                  <label className={`
                    flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition
                    ${mode === 'PURCHASE_REQUIRED' 
                      ? 'border-[#51a8b1] bg-[#f0f8f9] text-[#3a7d84] font-bold shadow-2xs' 
                      : 'border-[#b9c0cb]/40 bg-[#f8fafb] text-[#4a5462] hover:bg-white'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  `}>
                    <input
                      type="radio"
                      name={`${itemKey}_stock_mode`}
                      disabled={disabled}
                      checked={mode === 'PURCHASE_REQUIRED'}
                      onChange={() => handleModeChange(itemKey, 'PURCHASE_REQUIRED', totalQty, itemData)}
                      className="text-[#51a8b1] focus:ring-[#51a8b1]"
                    />
                    <ShoppingCart className="w-3.5 h-3.5 text-[#51a8b1] flex-shrink-0" />
                    <span className="truncate">100% Purchase</span>
                  </label>

                  {/* Split (Both) */}
                  <label className={`
                    flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition
                    ${mode === 'SPLIT' 
                      ? 'border-purple-400 bg-purple-50/70 text-purple-800 font-bold shadow-2xs' 
                      : 'border-[#b9c0cb]/40 bg-[#f8fafb] text-[#4a5462] hover:bg-white'}
                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                  `}>
                    <input
                      type="radio"
                      name={`${itemKey}_stock_mode`}
                      disabled={disabled}
                      checked={mode === 'SPLIT'}
                      onChange={() => handleModeChange(itemKey, 'SPLIT', totalQty, itemData)}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <GitFork className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="truncate">Split (Both)</span>
                  </label>
                </div>
              </div>

              {/* Mode Specific Allocation & Assignment */}
              {mode === 'SPLIT' ? (
                /* SPLIT MODE: Dual Quantity Input + Dual Assignee Selectors */
                <div className="p-3 bg-gradient-to-r from-[#f7fbe9]/50 via-white to-[#f0f8f9]/50 border border-purple-200 rounded-xl space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* In-Stock Quantity */}
                    <div className="p-2 rounded-lg bg-white border border-[#dfefa6] space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#465b1c] flex items-center gap-1">
                          <PackageCheck className="w-3 h-3 text-[#759724]" />
                          In Warehouse Stock (Qty)
                        </label>
                        <span className="text-[9px] font-bold text-[#759724] bg-[#eff8d0] px-1 py-0.2 rounded">
                          Dispatch
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={totalQty}
                        disabled={disabled}
                        value={inStockQty}
                        onChange={(e) => handleInStockQtyChange(itemKey, Number(e.target.value), totalQty, itemData)}
                        className="w-full border border-[#dfefa6] rounded-md px-2 py-1 text-xs bg-[#f7fbe9]/30 text-[#465b1c] font-bold focus:outline-none focus:ring-1 focus:ring-[#759724]"
                        placeholder="0"
                      />
                    </div>

                    {/* Purchase Quantity */}
                    <div className="p-2 rounded-lg bg-white border border-[#b6e0e4] space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#3a7d84] flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3 text-[#51a8b1]" />
                          Remaining to Purchase (Qty)
                        </label>
                        <span className="text-[9px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-1 py-0.2 rounded">
                          Auto
                        </span>
                      </div>
                      <div className="w-full border border-[#b6e0e4] rounded-md px-2 py-1 text-xs bg-[#f0f8f9] text-[#3a7d84] font-black flex items-center justify-between">
                        <span>{purchaseQty} Units</span>
                        <span className="text-[9px] font-mono text-[#51a8b1]">({totalQty} - {inStockQty})</span>
                      </div>
                    </div>
                  </div>

                  {/* Dual Assignee Dropdowns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-purple-100">
                    {/* Warehouse Dispatch Assignee */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-[#465b1c] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#759724]" />
                          Warehouse In-charge ({inStockQty} units)
                        </span>
                        {inStockAssignee && <span className="text-[8.5px] text-[#759724]">● Alert Set</span>}
                      </label>
                      <select
                        disabled={disabled}
                        value={inStockAssignee}
                        onChange={(e) => updateItemField(itemKey, 'inStockAssignedTo', e.target.value, itemData)}
                        className="w-full border border-[#dfefa6] rounded-lg px-2 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#759724] cursor-pointer"
                      >
                        <option value="">👤 Select Warehouse In-charge</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Procurement Purchase Assignee */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-[#3a7d84] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-[#51a8b1]" />
                          Purchase In-charge ({purchaseQty} units)
                        </span>
                        {purchaseAssignee && <span className="text-[8.5px] text-[#3a7d84]">● Alert Set</span>}
                      </label>
                      <select
                        disabled={disabled}
                        value={purchaseAssignee}
                        onChange={(e) => updateItemField(itemKey, 'purchaseAssignedTo', e.target.value, itemData)}
                        className="w-full border border-[#b6e0e4] rounded-lg px-2 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] cursor-pointer"
                      >
                        <option value="">👤 Select Purchase In-charge</option>
                        {employees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* SINGLE MODE: 100% In-Stock OR 100% Purchase */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-[#f1f3f6]">
                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-[#3a7d84] flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-[#51a8b1]" />
                        Assigned {mode === 'IN_STOCK' ? `Warehouse Dispatch (${totalQty} units)` : `Procurement (${totalQty} units)`}
                      </span>
                      {(inStockAssignee || purchaseAssignee) && (
                        <span className="text-[8.5px] text-[#759724]">● Alert Set</span>
                      )}
                    </label>
                    <select
                      disabled={disabled}
                      value={mode === 'IN_STOCK' ? inStockAssignee : purchaseAssignee}
                      onChange={(e) => {
                        const empId = e.target.value;
                        if (mode === 'IN_STOCK') {
                          updateItemField(itemKey, 'inStockAssignedTo', empId, itemData);
                          updateItemField(itemKey, 'assignedTo', empId, itemData);
                        } else {
                          updateItemField(itemKey, 'purchaseAssignedTo', empId, itemData);
                          updateItemField(itemKey, 'assignedTo', empId, itemData);
                        }
                      }}
                      className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
                    >
                      <option value="">👤 Select Member</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({(emp as any).globalRole || 'Employee'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9.5px] font-bold text-[#4a5462]">
                      {mode === 'IN_STOCK' ? 'Warehouse Dispatch Note' : 'Vendor & Procurement Note'}
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={mode === 'IN_STOCK' ? (itemData?.inStockNotes ?? '') : (itemData?.purchaseNotes ?? '')}
                      onChange={(e) => {
                        const noteField = mode === 'IN_STOCK' ? 'inStockNotes' : 'purchaseNotes';
                        updateItemField(itemKey, noteField, e.target.value, itemData);
                      }}
                      className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                      placeholder={mode === 'IN_STOCK' ? 'e.g. Stock in Central Warehouse Rack B-12' : 'e.g. Recommended Vendor ABC Systems'}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Metrics Bar at Bottom */}
      <div className="p-3 bg-white border border-[#b6e0e4] rounded-2xl shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#3a7d84] font-heading">
          <span>Execution Stock Verification Summary</span>
          <span>Total Units: <strong>{totalRequiredUnits}</strong></span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4]">
            <span className="text-[10px] text-[#4a5462] block">Total Products</span>
            <span className="font-bold text-[#3a7d84] text-sm">{activeEntries.length} Items</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f7fbe9] border border-[#dfefa6]">
            <span className="text-[10px] text-[#58731f] block">In Stock (Units)</span>
            <span className="font-bold text-[#465b1c] text-sm">{totalInStockUnits} Units</span>
          </div>
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200">
            <span className="text-[10px] text-amber-700 block">To Purchase (Units)</span>
            <span className="font-bold text-amber-800 text-sm">{totalPurchaseUnits} Units</span>
          </div>
          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-200">
            <span className="text-[10px] text-purple-700 block">Assigned In-charges</span>
            <span className="font-bold text-purple-800 text-sm">{assignedPeopleCount} Assigned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
