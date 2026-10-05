'use client';

import React, { useState } from 'react';
import { extractEffectiveHardwareItems, extractEffectiveSchools, DEFAULT_HARDWARE_ITEMS } from '../utils/formHelpers';
import { IUser } from '../../../types/auth';
import {
  PackageCheck,
  ShoppingCart,
  User,
  Layers,
  Building2,
  MapPin,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Hash,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface HardwareStockSplit {
  id: string;
  quantity: number;
  mode: 'IN_STOCK' | 'PURCHASE_REQUIRED';
  assignedTo?: string;
  notes?: string;
}

export interface StockPOItem {
  id: string;
  poNumber: string;
  poDate?: string;
  vendor?: string;
  remarks?: string;
}

export interface StockPIItem {
  id: string;
  piNumber: string;
  piDate?: string;
  amount?: string;
  remarks?: string;
}

interface HardwareStockCheckProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  allFormData?: Record<string, any>;
  employees?: IUser[];
  project?: any;
}

export type StockMode = 'IN_STOCK' | 'PURCHASE_REQUIRED' | 'SPLIT';

const NON_HARDWARE_KEYS = new Set([
  'checked',
  'stockStatus',
  'stockSummary',
  'remarks',
  'purchaseAssignedTo',
  'inStockAssignedTo',
  'submittedBy',
  'submittedAt',
  'status',
  '_id',
  'id',
  'procurements',
  'procurement',
  'items',
  'stockCheck'
]);

// Helper to aggregate data from splits array
function aggregateSplitsData(splits: HardwareStockSplit[], totalRequired: number, baseItem: any, chosenMode?: StockMode) {
  const inStockSplits = splits.filter((s) => s.mode === 'IN_STOCK');
  const purchaseSplits = splits.filter((s) => s.mode === 'PURCHASE_REQUIRED');

  const inStockQty = inStockSplits.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const purchaseQty = purchaseSplits.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  let mode: StockMode = chosenMode || 'IN_STOCK';
  if (!chosenMode) {
    if (splits.length > 1 || (inStockQty > 0 && purchaseQty > 0)) {
      mode = 'SPLIT';
    } else if (purchaseQty > 0 && inStockQty === 0) {
      mode = 'PURCHASE_REQUIRED';
    } else {
      mode = 'IN_STOCK';
    }
  }

  const primaryInStockAssignee = inStockSplits.find((s) => s.assignedTo)?.assignedTo || '';
  const primaryPurchaseAssignee = purchaseSplits.find((s) => s.assignedTo)?.assignedTo || '';
  const primaryAssignee = primaryInStockAssignee || primaryPurchaseAssignee || baseItem.assignedTo || '';

  const inStockNotes = inStockSplits.map((s) => s.notes).filter(Boolean).join('; ');
  const purchaseNotes = purchaseSplits.map((s) => s.notes).filter(Boolean).join('; ');

  return {
    ...baseItem,
    selected: true,
    quantity: totalRequired,
    stockDecision: mode,
    inStockQty,
    purchaseQty,
    inStockAssignedTo: primaryInStockAssignee,
    purchaseAssignedTo: primaryPurchaseAssignee,
    assignedTo: primaryAssignee,
    inStockNotes: inStockNotes || baseItem.inStockNotes || '',
    purchaseNotes: purchaseNotes || baseItem.purchaseNotes || '',
    splits,
    purchaseOrders: baseItem.purchaseOrders || baseItem.po || [],
    proformaInvoices: baseItem.proformaInvoices || baseItem.pi || [],
    po: baseItem.purchaseOrders || baseItem.po || [],
    pi: baseItem.proformaInvoices || baseItem.pi || []
  };
}

export function HardwareStockCheck({
  value,
  onChange,
  disabled = false,
  allFormData = {},
  employees = [],
  project = null,
}: HardwareStockCheckProps) {
  // Extract saved items
  const savedItems: Record<string, any> = React.useMemo(() => {
    if (!value || typeof value !== 'object') return {};
    if (value.stockCheck?.items && typeof value.stockCheck.items === 'object') {
      return value.stockCheck.items;
    }
    if (value.items && typeof value.items === 'object') {
      return value.items;
    }
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (!NON_HARDWARE_KEYS.has(k) && typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = v;
      }
    }
    return clean;
  }, [value]);

  // Extract products from Stage 03 School-wise Hardware Requirements collection
  const resolvedHardware = React.useMemo(() => {
    return extractEffectiveHardwareItems(allFormData, value, project);
  }, [allFormData, value, project]);

  // Extract effective schools with addresses
  const effectiveSchools = React.useMemo(() => {
    return extractEffectiveSchools(
      project?.schools || allFormData?.stage3Schools || allFormData?.schools,
      allFormData,
      value
    );
  }, [project, allFormData, value]);

  // Build active items list
  const activeEntries: [string, any][] = React.useMemo(() => {
    const entriesMap: Record<string, any> = {};

    const resolveItem = (existing: any, totalQty: number, itemKey: string, base: any) => {
      let splits: HardwareStockSplit[] = [];
      const mode: StockMode = existing.stockDecision || (value?.stockStatus === 'NOT_IN_STOCK' ? 'PURCHASE_REQUIRED' : 'IN_STOCK');

      if (Array.isArray(existing.splits) && existing.splits.length > 0) {
        splits = existing.splits.map((s: any, idx: number) => ({
          id: s.id || `alloc_${itemKey}_${idx}_${Date.now()}`,
          quantity: Number(s.quantity) >= 0 ? Number(s.quantity) : 0,
          mode: s.mode === 'PURCHASE_REQUIRED' ? 'PURCHASE_REQUIRED' : 'IN_STOCK',
          assignedTo: s.assignedTo || '',
          notes: s.notes || ''
        }));
      } else if (mode === 'SPLIT') {
        const inQty = existing.inStockQty !== undefined ? Number(existing.inStockQty) : 0;
        const purQty = existing.purchaseQty !== undefined ? Number(existing.purchaseQty) : 0;
        splits = [
          {
            id: `alloc_${itemKey}_stock_1`,
            quantity: inQty,
            mode: 'IN_STOCK',
            assignedTo: existing.inStockAssignedTo || existing.assignedTo || '',
            notes: existing.inStockNotes || ''
          },
          {
            id: `alloc_${itemKey}_purchase_1`,
            quantity: purQty,
            mode: 'PURCHASE_REQUIRED',
            assignedTo: existing.purchaseAssignedTo || '',
            notes: existing.purchaseNotes || ''
          }
        ];
      } else if (mode === 'PURCHASE_REQUIRED') {
        splits = [
          {
            id: `alloc_${itemKey}_purchase_1`,
            quantity: existing.purchaseQty !== undefined ? Number(existing.purchaseQty) : totalQty,
            mode: 'PURCHASE_REQUIRED',
            assignedTo: existing.purchaseAssignedTo || existing.assignedTo || '',
            notes: existing.purchaseNotes || ''
          }
        ];
      } else {
        splits = [
          {
            id: `alloc_${itemKey}_stock_1`,
            quantity: existing.inStockQty !== undefined ? Number(existing.inStockQty) : totalQty,
            mode: 'IN_STOCK',
            assignedTo: existing.inStockAssignedTo || existing.assignedTo || '',
            notes: existing.inStockNotes || ''
          }
        ];
      }

      return aggregateSplitsData(splits, totalQty, { ...base, ...existing }, mode);
    };

    // 1. Items from resolvedHardware (from Stage 03 schoolwise hardware)
    if (Object.keys(resolvedHardware).length > 0) {
      Object.entries(resolvedHardware).forEach(([k, v]) => {
        if (NON_HARDWARE_KEYS.has(k)) return;
        const totalQty = Number(v.quantity) || 1;
        const existing = savedItems[k] || {};
        const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === k || d.label === k);
        entriesMap[k] = resolveItem(existing, totalQty, k, {
          itemName: defObj?.label || k,
          specNotes: existing.specNotes !== undefined ? existing.specNotes : (v.specNotes || ''),
          schoolBreakdown: v.schoolBreakdown || existing.schoolBreakdown || []
        });
      });
    }

    // 2. Also include any saved items not in resolvedHardware
    Object.entries(savedItems).forEach(([k, v]) => {
      if (NON_HARDWARE_KEYS.has(k) || entriesMap[k]) return;
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return;
      const totalQty = Number(v.quantity) || 1;
      const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === k || d.label === k);
      entriesMap[k] = resolveItem(v, totalQty, k, {
        itemName: defObj?.label || k,
        specNotes: v.specNotes || '',
        schoolBreakdown: v.schoolBreakdown || []
      });
    });

    return Object.entries(entriesMap);
  }, [resolvedHardware, savedItems, value?.stockStatus]);

  const emitChanges = (nextItems: Record<string, any>) => {
    const itemValues = Object.values(nextItems);
    const totalRequired = itemValues.reduce((acc, i: any) => acc + (Number(i.quantity) || 1), 0);
    const totalInStock = itemValues.reduce((acc, i: any) => acc + (Number(i.inStockQty) || 0), 0);
    const totalPurchase = itemValues.reduce((acc, i: any) => acc + (Number(i.purchaseQty) || 0), 0);

    const allInStock = totalPurchase === 0;
    const allPurchase = totalInStock === 0;
    const overallStockStatus = allInStock ? 'IN_STOCK' : (allPurchase ? 'NOT_IN_STOCK' : 'PARTIALLY_AVAILABLE');

    onChange({
      ...(typeof value === 'object' && value !== null ? value : {}),
      stockCheck: {
        items: nextItems,
        totalRequired,
        totalInStock,
        totalPurchase
      },
      items: nextItems,
      checked: true,
      stockStatus: overallStockStatus,
      stockSummary: `Central warehouse stock check: ${totalInStock} in-stock, ${totalPurchase} to purchase across ${itemValues.length} hardware items.`
    });
  };

  // Dropdown Mode Change: IN_STOCK | PURCHASE_REQUIRED | SPLIT
  const handleModeChange = (itemKey: string, newMode: StockMode, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    let nextSplits: HardwareStockSplit[] = [];

    if (newMode === 'IN_STOCK') {
      nextSplits = [
        {
          id: `alloc_${itemKey}_stock_${Date.now()}`,
          quantity: totalQty,
          mode: 'IN_STOCK',
          assignedTo: existing.inStockAssignedTo || existing.assignedTo || '',
          notes: existing.inStockNotes || ''
        }
      ];
    } else if (newMode === 'PURCHASE_REQUIRED') {
      nextSplits = [
        {
          id: `alloc_${itemKey}_purchase_${Date.now()}`,
          quantity: totalQty,
          mode: 'PURCHASE_REQUIRED',
          assignedTo: existing.purchaseAssignedTo || existing.assignedTo || '',
          notes: existing.purchaseNotes || ''
        }
      ];
    } else {
      if (Array.isArray(existing.splits) && existing.splits.length > 1) {
        nextSplits = existing.splits;
      } else {
        nextSplits = [
          {
            id: `alloc_${itemKey}_stock_${Date.now()}`,
            quantity: 0,
            mode: 'IN_STOCK',
            assignedTo: existing.inStockAssignedTo || existing.assignedTo || '',
            notes: existing.inStockNotes || ''
          },
          {
            id: `alloc_${itemKey}_purchase_${Date.now() + 1}`,
            quantity: 0,
            mode: 'PURCHASE_REQUIRED',
            assignedTo: existing.purchaseAssignedTo || '',
            notes: existing.purchaseNotes || ''
          }
        ];
      }
    }

    const nextItem = aggregateSplitsData(nextSplits, totalQty, existing, newMode);
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // Update a specific allocation row's field
  const updateSplitField = (itemKey: string, splitIndex: number, field: keyof HardwareStockSplit, val: any, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    const splits: HardwareStockSplit[] = [...(existing.splits || [])];

    if (!splits[splitIndex]) return;

    splits[splitIndex] = {
      ...splits[splitIndex],
      [field]: field === 'quantity' ? (val === '' ? 0 : Math.max(0, Number(val) || 0)) : val
    };

    const nextItem = aggregateSplitsData(splits, totalQty, existing, existing.stockDecision || 'SPLIT');
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // Add a new allocation entry
  const addSplitEntry = (itemKey: string, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    const splits: HardwareStockSplit[] = [...(existing.splits || [])];

    const newSplit: HardwareStockSplit = {
      id: `alloc_${itemKey}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quantity: 0,
      mode: splits.length > 0 && splits[splits.length - 1].mode === 'IN_STOCK' ? 'PURCHASE_REQUIRED' : 'IN_STOCK',
      assignedTo: '',
      notes: ''
    };

    splits.push(newSplit);
    const nextItem = aggregateSplitsData(splits, totalQty, existing, 'SPLIT');
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // Remove an allocation entry
  const removeSplitEntry = (itemKey: string, splitIndex: number, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    let splits: HardwareStockSplit[] = [...(existing.splits || [])];

    splits.splice(splitIndex, 1);
    if (splits.length === 0) {
      splits = [
        {
          id: `alloc_${itemKey}_reset_${Date.now()}`,
          quantity: totalQty,
          mode: 'IN_STOCK',
          assignedTo: '',
          notes: ''
        }
      ];
    }

    const nextItem = aggregateSplitsData(splits, totalQty, existing, splits.length > 1 ? 'SPLIT' : splits[0].mode);
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // Single mode assignee / note updater
  const updateSingleField = (itemKey: string, field: string, val: any, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    const splits: HardwareStockSplit[] = [...(existing.splits || [])];

    if (splits.length > 0) {
      if (field === 'inStockAssignedTo' || field === 'purchaseAssignedTo' || field === 'assignedTo') {
        splits[0].assignedTo = val;
      }
      if (field === 'inStockNotes' || field === 'purchaseNotes') {
        splits[0].notes = val;
      }
    }

    const nextItem = {
      ...existing,
      [field]: val,
      splits
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // Spec input change handler
  const updateSpecNotes = (itemKey: string, val: string, totalQty: number, itemInfo: any) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || itemInfo || {};
    const nextItem = {
      ...existing,
      specNotes: val
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // PO (Purchase Order) Array Handlers
  const addPoEntry = (itemKey: string) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPOItem[] = Array.isArray(existing.purchaseOrders) ? [...existing.purchaseOrders] : [];
    list.push({
      id: `po_${itemKey}_${Date.now()}`,
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      vendor: '',
      remarks: ''
    });
    const nextItem = {
      ...existing,
      purchaseOrders: list,
      po: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  const updatePoEntry = (itemKey: string, poIdx: number, field: keyof StockPOItem, val: string) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPOItem[] = Array.isArray(existing.purchaseOrders) ? [...existing.purchaseOrders] : [];
    if (!list[poIdx]) return;
    list[poIdx] = { ...list[poIdx], [field]: val };
    const nextItem = {
      ...existing,
      purchaseOrders: list,
      po: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  const removePoEntry = (itemKey: string, poIdx: number) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPOItem[] = Array.isArray(existing.purchaseOrders) ? [...existing.purchaseOrders] : [];
    list.splice(poIdx, 1);
    const nextItem = {
      ...existing,
      purchaseOrders: list,
      po: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  // PI (Proforma Invoice) Array Handlers
  const addPiEntry = (itemKey: string) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPIItem[] = Array.isArray(existing.proformaInvoices) ? [...existing.proformaInvoices] : [];
    list.push({
      id: `pi_${itemKey}_${Date.now()}`,
      piNumber: '',
      piDate: new Date().toISOString().split('T')[0],
      amount: '',
      remarks: ''
    });
    const nextItem = {
      ...existing,
      proformaInvoices: list,
      pi: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  const updatePiEntry = (itemKey: string, piIdx: number, field: keyof StockPIItem, val: string) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPIItem[] = Array.isArray(existing.proformaInvoices) ? [...existing.proformaInvoices] : [];
    if (!list[piIdx]) return;
    list[piIdx] = { ...list[piIdx], [field]: val };
    const nextItem = {
      ...existing,
      proformaInvoices: list,
      pi: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  const removePiEntry = (itemKey: string, piIdx: number) => {
    const currentMap = Object.fromEntries(activeEntries);
    const existing = currentMap[itemKey] || {};
    const list: StockPIItem[] = Array.isArray(existing.proformaInvoices) ? [...existing.proformaInvoices] : [];
    list.splice(piIdx, 1);
    const nextItem = {
      ...existing,
      proformaInvoices: list,
      pi: list
    };
    emitChanges({ ...currentMap, [itemKey]: nextItem });
  };

  const totalRequiredUnits = activeEntries.reduce((acc, [_, v]) => acc + (Number(v?.quantity) || 1), 0);
  const totalInStockUnits = activeEntries.reduce((acc, [_, v]) => acc + (Number(v?.inStockQty) || 0), 0);
  const totalPurchaseUnits = activeEntries.reduce((acc, [_, v]) => acc + (Number(v?.purchaseQty) || 0), 0);

  const assignedPeopleCount = activeEntries.reduce((acc, [_, v]) => {
    const splits: HardwareStockSplit[] = v?.splits || [];
    const unique = new Set(splits.map((s) => s.assignedTo).filter(Boolean));
    return acc + unique.size;
  }, 0);

  if (activeEntries.length === 0) {
    return (
      <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-2 font-sans">
        <PackageCheck className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="text-xs font-bold text-slate-800">No Hardware Requirements Configured</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          Please configure school-wise hardware in Stage 03 (Hardware Requirements) first.
        </p>
      </div>
    );
  }

  // Renders the PO and PI arrays section when item status is PURCHASE_REQUIRED or SPLIT
  const renderPoAndPiSection = (itemKey: string, itemData: any) => {
    const poList: StockPOItem[] = Array.isArray(itemData.purchaseOrders) ? itemData.purchaseOrders : (itemData.po || []);
    const piList: StockPIItem[] = Array.isArray(itemData.proformaInvoices) ? itemData.proformaInvoices : (itemData.pi || []);

    return (
      <div className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-amber-700" />
            Procurement Documents: Purchase Orders (PO) & Proforma Invoices (PI)
          </span>
          <span className="text-[10px] text-amber-800 font-semibold">
            {poList.length} POs • {piList.length} PIs linked
          </span>
        </div>

        {/* PO Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#51a8b1]" /> Purchase Orders (PO Array)
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addPoEntry(itemKey)}
              className="text-[10px] font-bold text-[#3a7d84] hover:text-[#28585d] flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#b6e0e4] cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" /> Add PO
            </button>
          </div>

          {poList.length === 0 ? (
            <div className="text-[10px] text-slate-400 italic py-1">No Purchase Orders added yet. Click &quot;Add PO&quot; if procurement has issued one.</div>
          ) : (
            <div className="space-y-1.5">
              {poList.map((po, poIdx) => (
                <div key={po.id || poIdx} className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 min-w-[130px] flex-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      disabled={disabled}
                      value={po.poNumber || ''}
                      onChange={(e) => updatePoEntry(itemKey, poIdx, 'poNumber', e.target.value)}
                      placeholder="PO Number (e.g. PO-2026-089)"
                      className="w-full text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-32">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <input
                      type="date"
                      disabled={disabled}
                      value={po.poDate || ''}
                      onChange={(e) => updatePoEntry(itemKey, poIdx, 'poDate', e.target.value)}
                      className="w-full text-[11px] text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                    <input
                      type="text"
                      disabled={disabled}
                      value={po.vendor || ''}
                      onChange={(e) => updatePoEntry(itemKey, poIdx, 'vendor', e.target.value)}
                      placeholder="Vendor / Supplier"
                      className="w-full text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removePoEntry(itemKey, poIdx)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PI Section */}
        <div className="space-y-1.5 pt-1 border-t border-amber-200/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-purple-600" /> Proforma Invoices (PI Array)
            </span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addPiEntry(itemKey)}
              className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-purple-200 cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" /> Add PI
            </button>
          </div>

          {piList.length === 0 ? (
            <div className="text-[10px] text-slate-400 italic py-1">No Proforma Invoices added yet. Click &quot;Add PI&quot; to link quotation invoices.</div>
          ) : (
            <div className="space-y-1.5">
              {piList.map((pi, piIdx) => (
                <div key={pi.id || piIdx} className="flex flex-wrap items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-xs">
                  <div className="flex items-center gap-1 min-w-[130px] flex-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <input
                      type="text"
                      disabled={disabled}
                      value={pi.piNumber || ''}
                      onChange={(e) => updatePiEntry(itemKey, piIdx, 'piNumber', e.target.value)}
                      placeholder="PI Number (e.g. PI-7741)"
                      className="w-full text-xs font-semibold text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 w-32">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <input
                      type="date"
                      disabled={disabled}
                      value={pi.piDate || ''}
                      onChange={(e) => updatePiEntry(itemKey, piIdx, 'piDate', e.target.value)}
                      className="w-full text-[11px] text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                    <input
                      type="text"
                      disabled={disabled}
                      value={pi.amount || ''}
                      onChange={(e) => updatePiEntry(itemKey, piIdx, 'amount', e.target.value)}
                      placeholder="Amount / Remarks"
                      className="w-full text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => removePiEntry(itemKey, piIdx)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="space-y-3">
          {activeEntries.map(([itemKey, itemData]: [string, any]) => {
            const totalQty = Number(itemData.quantity) || 1;
            const mode: StockMode = itemData.stockDecision || 'IN_STOCK';
            const splits: HardwareStockSplit[] = itemData.splits || [];

            const currentInStock = splits
              .filter((s) => s.mode === 'IN_STOCK')
              .reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
            const currentPurchase = splits
              .filter((s) => s.mode === 'PURCHASE_REQUIRED')
              .reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
            const totalAllocated = currentInStock + currentPurchase;

            return (
              <div
                key={itemKey}
                className="p-3.5 rounded-2xl border border-[#51a8b1]/35 bg-white space-y-3 shadow-xs"
              >
                {/* Product Header Row with Clean Dropdown on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-[13px] font-bold text-[#333333] font-heading flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                      {DEFAULT_HARDWARE_ITEMS.find((d) => d.key === itemKey || d.label === itemKey)?.label || itemKey}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 max-w-xl">
                      <span className="text-[10.5px] font-bold text-[#556987] shrink-0">Spec:</span>
                      <input
                        type="text"
                        disabled={disabled}
                        value={itemData.specNotes || ''}
                        onChange={(e) => updateSpecNotes(itemKey, e.target.value, totalQty, itemData)}
                        placeholder="Enter item specifications..."
                        className="w-full text-[11px] text-[#333333] bg-[#f8fafb] hover:bg-white focus:bg-white border border-[#b9c0cb]/60 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:border-[#51a8b1] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </div>
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
                            {sb.serialNotes && <span className="text-slate-500 italic">({sb.serialNotes})</span>}
                            {sb.solutionName && (
                              <span className="text-purple-700 bg-purple-50 px-1 py-0.2 rounded text-[8.5px] font-semibold border border-purple-200/50">
                                {sb.solutionName}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Total Units Badge + Clean Dropdown */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                    <span className="text-[10.5px] font-bold text-[#3a7d84] bg-[#f0f8f9] px-2.5 py-1.5 rounded-xl border border-[#b6e0e4]">
                      Required: {totalQty} Units
                    </span>

                    <select
                      disabled={disabled}
                      value={mode}
                      onChange={(e) => handleModeChange(itemKey, e.target.value as StockMode, totalQty, itemData)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer focus:outline-none focus:ring-1 ${
                        mode === 'IN_STOCK'
                          ? 'border-[#a8cf45] bg-[#f7fbe9] text-[#465b1c] focus:ring-[#759724]'
                          : mode === 'PURCHASE_REQUIRED'
                          ? 'border-[#51a8b1] bg-[#f0f8f9] text-[#3a7d84] focus:ring-[#51a8b1]'
                          : 'border-purple-300 bg-purple-50/80 text-purple-800 focus:ring-purple-400'
                      }`}
                    >
                      <option value="IN_STOCK">📦 100% In Stock</option>
                      <option value="PURCHASE_REQUIRED">🛒 100% Purchase</option>
                      <option value="SPLIT">🔀 Split (Both)</option>
                    </select>
                  </div>
                </div>

                {/* Form Content: SPLIT vs SINGLE */}
                {mode === 'SPLIT' ? (
                  <div className="space-y-2.5 pt-1">
                    {splits.map((split: HardwareStockSplit, splitIdx: number) => {
                      const isStock = split.mode === 'IN_STOCK';
                      return (
                        <div
                          key={split.id || splitIdx}
                          className={`p-2.5 rounded-xl border transition ${
                            isStock
                              ? 'border-[#dfefa6] bg-[#f7fbe9]/30'
                              : 'border-[#b6e0e4] bg-[#f0f8f9]/30'
                          } space-y-2`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <select
                                disabled={disabled}
                                value={split.mode}
                                onChange={(e) =>
                                  updateSplitField(
                                    itemKey,
                                    splitIdx,
                                    'mode',
                                    e.target.value as 'IN_STOCK' | 'PURCHASE_REQUIRED',
                                    totalQty,
                                    itemData
                                  )
                                }
                                className={`text-xs font-bold px-2 py-1 rounded-lg border bg-white cursor-pointer ${
                                  isStock
                                    ? 'border-[#a8cf45] text-[#465b1c]'
                                    : 'border-[#51a8b1] text-[#3a7d84]'
                                }`}
                              >
                                <option value="IN_STOCK">📦 In Stock</option>
                                <option value="PURCHASE_REQUIRED">🛒 To Purchase</option>
                              </select>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10.5px] font-bold text-slate-600">Qty:</span>
                                <input
                                  type="number"
                                  min="0"
                                  disabled={disabled}
                                  value={split.quantity === 0 ? '' : split.quantity}
                                  placeholder="0"
                                  onChange={(e) =>
                                    updateSplitField(
                                      itemKey,
                                      splitIdx,
                                      'quantity',
                                      e.target.value,
                                      totalQty,
                                      itemData
                                    )
                                  }
                                  className="w-18 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                                />
                                <span className="text-[10px] text-slate-500 font-medium">units</span>
                              </div>
                            </div>

                            {splits.length > 1 && (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => removeSplitEntry(itemKey, splitIdx, totalQty, itemData)}
                                title="Remove this entry"
                                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              disabled={disabled}
                              value={split.assignedTo || ''}
                              onChange={(e) =>
                                updateSplitField(itemKey, splitIdx, 'assignedTo', e.target.value, totalQty, itemData)
                              }
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] cursor-pointer"
                            >
                              <option value="">👤 Select Member to Assign</option>
                              {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                  {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              disabled={disabled}
                              value={split.notes || ''}
                              onChange={(e) =>
                                updateSplitField(itemKey, splitIdx, 'notes', e.target.value, totalQty, itemData)
                              }
                              placeholder={
                                isStock
                                  ? 'Warehouse location / serial notes'
                                  : 'Vendor quote / purchase notes'
                              }
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => addSplitEntry(itemKey, totalQty, itemData)}
                        className="text-xs font-bold text-[#3a7d84] hover:text-[#2d6268] flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-[#51a8b1]/50 bg-[#f0f8f9]/60 hover:bg-[#f0f8f9] transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Allocation
                      </button>

                      <div className="text-[10.5px] font-medium text-slate-600">
                        Total Allocated:{' '}
                        <strong className="text-[#465b1c]">{currentInStock} In Stock</strong> +{' '}
                        <strong className="text-[#3a7d84]">{currentPurchase} To Purchase</strong> ={' '}
                        <strong>{totalAllocated}</strong> / {totalQty} Units
                        {totalAllocated === totalQty ? (
                          <span className="text-emerald-700 font-bold ml-1.5">✓ Matched</span>
                        ) : totalAllocated < totalQty ? (
                          <span className="text-amber-700 font-bold ml-1.5">
                            ({totalQty - totalAllocated} remaining)
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold ml-1.5">
                            (+{totalAllocated - totalQty} extra)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-[#3a7d84]">
                        Assigned {mode === 'IN_STOCK' ? `Warehouse Dispatch (${totalQty} units)` : `Procurement (${totalQty} units)`}
                      </label>
                      <select
                        disabled={disabled}
                        value={mode === 'IN_STOCK' ? (itemData.inStockAssignedTo || itemData.assignedTo || '') : (itemData.purchaseAssignedTo || itemData.assignedTo || '')}
                        onChange={(e) => {
                          const empId = e.target.value;
                          if (mode === 'IN_STOCK') {
                            updateSingleField(itemKey, 'inStockAssignedTo', empId, totalQty, itemData);
                          } else {
                            updateSingleField(itemKey, 'purchaseAssignedTo', empId, totalQty, itemData);
                          }
                        }}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
                      >
                        <option value="">👤 Select Member to Assign</option>
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
                          updateSingleField(itemKey, noteField, e.target.value, totalQty, itemData);
                        }}
                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
                        placeholder={mode === 'IN_STOCK' ? 'e.g. Stock in Central Warehouse Rack B-12' : 'e.g. Recommended Vendor ABC Systems'}
                      />
                    </div>
                  </div>
                )}

                {/* If purchase or split, render PO and PI arrays */}
                {(mode === 'PURCHASE_REQUIRED' || mode === 'SPLIT') && renderPoAndPiSection(itemKey, itemData)}
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
