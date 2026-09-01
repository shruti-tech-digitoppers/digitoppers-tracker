'use client';

import React from 'react';
import { DEFAULT_SOLUTIONS } from '../utils/formHelpers';
import { Check, AlertCircle } from 'lucide-react';

interface SolutionsConfigTableProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function SolutionsConfigTable({
  value,
  onChange,
  disabled = false,
}: SolutionsConfigTableProps) {
  const currentSolutions: Record<string, any> = typeof value === 'object' && value !== null ? value : {};

  const toggleSolution = (solKey: string, solLabel: string) => {
    const isSelected = Boolean(currentSolutions[solKey] && currentSolutions[solKey].selected !== false);
    const next = { ...currentSolutions };
    if (isSelected) {
      delete next[solKey];
    } else {
      next[solKey] = {
        selected: true,
        solutionName: solLabel,
        quantity: 1,
        targetClasses: '',
        deploymentLocation: '',
        notes: ''
      };
    }
    onChange(next);
  };

  const updateSolField = (solKey: string, solLabel: string, subField: string, subVal: any) => {
    const next = { ...currentSolutions };
    next[solKey] = {
      ...(next[solKey] || { selected: true, solutionName: solLabel, quantity: 1 }),
      [subField]: subVal
    };
    onChange(next);
  };

  const selectedList = Object.entries(currentSolutions).filter(([_, v]) => v && v.selected !== false);
  const totalQty = selectedList.reduce((acc, [_, v]) => acc + (Number(v.quantity) || 1), 0);

  return (
    <div className="space-y-2 pt-1">
      <div className="space-y-2">
        {DEFAULT_SOLUTIONS.map((sol) => {
          const solConfig = currentSolutions[sol.key] || null;
          const isSelected = Boolean(solConfig && solConfig.selected !== false);

          return (
            <div
              key={sol.key}
              className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                isSelected 
                  ? 'border-[#51a8b1] bg-[#f0f8f9]/50 shadow-xs ring-1 ring-[#51a8b1]/30' 
                  : 'border-[#b9c0cb]/40 bg-white hover:border-[#51a8b1]/50'
              }`}
            >
              {/* Solution toggle row */}
              <div
                onClick={() => !disabled && toggleSolution(sol.key, sol.label)}
                className="flex items-center justify-between p-2.5 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] transition-colors ${
                    isSelected ? 'bg-[#51a8b1] border-[#51a8b1] text-white' : 'border-[#b9c0cb] bg-white'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-base leading-none">{sol.icon}</span>
                  <div>
                    <h5 className="font-heading text-xs font-bold text-[#333333] leading-tight">{sol.label}</h5>
                    <p className="text-[10px] text-[#4a5462] leading-tight">{sol.desc}</p>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-bold text-[#465b1c] bg-[#eff8d0] px-2 py-0.5 rounded-full border border-[#dfefa6]">
                    Qty: {solConfig?.quantity || 1}
                  </span>
                )}
              </div>

              {/* Expanded fields when selected */}
              {isSelected && (
                <div className="px-3 pb-3 pt-2 border-t border-[#b6e0e4]/60 bg-white/80 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#4a5462] mb-0.5">
                      Quantity / Labs Count <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={disabled}
                      value={solConfig?.quantity ?? 1}
                      onChange={(e) => updateSolField(sol.key, sol.label, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                      className="w-full border border-[#b9c0cb]/60 rounded-lg px-2.5 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                      placeholder="e.g. 1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#4a5462] mb-0.5">
                      Target Classes
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={solConfig?.targetClasses ?? ''}
                      onChange={(e) => updateSolField(sol.key, sol.label, 'targetClasses', e.target.value)}
                      className="w-full border border-[#b9c0cb]/60 rounded-lg px-2.5 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                      placeholder="e.g. Class 6 to 10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-[#4a5462] mb-0.5">
                      Implementation Location / Room
                    </label>
                    <input
                      type="text"
                      disabled={disabled}
                      value={solConfig?.deploymentLocation ?? ''}
                      onChange={(e) => updateSolField(sol.key, sol.label, 'deploymentLocation', e.target.value)}
                      className="w-full border border-[#b9c0cb]/60 rounded-lg px-2.5 py-1 text-xs bg-white text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1]"
                      placeholder="e.g. Block B Room 204"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary counter */}
      {selectedList.length === 0 ? (
        <p className="text-[11px] text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] rounded-lg p-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#51a8b1]" />
          <span>Please check at least one solution to configure its quantity and implementation details.</span>
        </p>
      ) : (
        <div className="flex items-center justify-between text-xs bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] rounded-lg px-3 py-1.5 font-semibold">
          <span>Selected Solutions: {selectedList.length}</span>
          <span>Total Deployable Units / Labs: {totalQty}</span>
        </div>
      )}
    </div>
  );
}
