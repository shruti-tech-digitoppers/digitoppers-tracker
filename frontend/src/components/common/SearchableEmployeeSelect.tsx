'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { User, Search, Check, ChevronDown, X, UserX, Sparkles } from 'lucide-react';
import { IUser } from '../../types/auth';

export interface SearchableEmployeeSelectProps {
  value: string; // employee _id or ''
  employees: IUser[];
  onChange: (employeeId: string, employee?: IUser | null) => void;
  currentUser?: IUser | null;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  required?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
}

export function SearchableEmployeeSelect({
  value,
  employees = [],
  onChange,
  currentUser = null,
  disabled = false,
  placeholder = 'Unassigned',
  className = '',
  align = 'right',
  allowClear = true,
  clearLabel,
}: SearchableEmployeeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve current logged in user (from prop or localStorage)
  const effectiveCurrentUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored) as IUser;
      } catch (_) {}
    }
    return null;
  }, [currentUser]);

  // Check if an employee is the currently logged in user
  const isMe = useCallback(
    (emp: IUser | { id?: string; _id?: string; name?: string; employeeCode?: string; email?: string }) => {
      if (!effectiveCurrentUser) return false;
      const myId = String(effectiveCurrentUser._id || (effectiveCurrentUser as any).id || '').toLowerCase().trim();
      const myEmail = (effectiveCurrentUser.email || '').toLowerCase().trim();
      const myCode = (effectiveCurrentUser.employeeCode || '').toLowerCase().trim();
      const myName = (effectiveCurrentUser.name || '').toLowerCase().trim();

      const empId = String((emp as any)._id || (emp as any).id || '').toLowerCase().trim();
      const empEmail = ((emp as any).email || '').toLowerCase().trim();
      const empCode = ((emp as any).employeeCode || '').toLowerCase().trim();
      const empName = (emp.name || '').toLowerCase().trim();

      if (myId && empId && myId === empId) return true;
      if (myEmail && empEmail && myEmail === empEmail) return true;
      if (myCode && empCode && myCode === empCode) return true;
      if (myName && empName && myName === empName) return true;
      return false;
    },
    [effectiveCurrentUser]
  );

  // Match current selected employee object safely
  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    const vStr = String(value).trim().toLowerCase();
    return (
      employees.find((e) => {
        const id = String(e._id || (e as any).id || '').toLowerCase();
        const code = String(e.employeeCode || '').toLowerCase();
        const name = String(e.name || '').toLowerCase();
        return id === vStr || (code && code === vStr) || name === vStr;
      }) || null
    );
  }, [employees, value]);

  // Real-time search filter matching Name, Code, Email, or Designation
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const name = (emp.name || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const role = (emp.designation || (emp as any).role || emp.globalRole || '').toLowerCase();
      const isMeMatch = q === 'me' && isMe(emp);
      return name.includes(q) || code.includes(q) || email.includes(q) || role.includes(q) || isMeMatch;
    });
  }, [employees, searchQuery, isMe]);

  // Combine options: (1) Unassigned (2) Logged in user "Me" at the top (3) Other employees
  const selectableOptions = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      employeeCode?: string;
      designation?: string;
      isUnassigned?: boolean;
      isMe?: boolean;
      employee?: IUser;
    }> = [];

    const q = searchQuery.toLowerCase().trim();
    if (allowClear) {
      if (!q || 'unassigned'.includes(q) || 'none'.includes(q) || 'clear'.includes(q)) {
        list.push({
          id: '',
          name: clearLabel || placeholder || 'Unassigned',
          isUnassigned: true,
          isMe: false,
        });
      }
    }

    // Separate "Me" from others so "Me" always sits at the very top
    const meEmployees: IUser[] = [];
    const otherEmployees: IUser[] = [];

    filteredEmployees.forEach((emp) => {
      if (isMe(emp)) {
        meEmployees.push(emp);
      } else {
        otherEmployees.push(emp);
      }
    });

    // 1. "Me" (Logged in user) first!
    meEmployees.forEach((emp) => {
      list.push({
        id: String(emp._id || (emp as any).id || ''),
        name: emp.name,
        employeeCode: emp.employeeCode,
        designation: emp.designation || (emp as any).role || emp.globalRole,
        isUnassigned: false,
        isMe: true,
        employee: emp,
      });
    });

    // 2. All other employees follow
    otherEmployees.forEach((emp) => {
      list.push({
        id: String(emp._id || (emp as any).id || ''),
        name: emp.name,
        employeeCode: emp.employeeCode,
        designation: emp.designation || (emp as any).role || emp.globalRole,
        isUnassigned: false,
        isMe: false,
        employee: emp,
      });
    });

    return list;
  }, [searchQuery, placeholder, clearLabel, allowClear, filteredEmployees, isMe]);

  // Reset & focus search on popover open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      const currentIndex = selectableOptions.findIndex((opt) =>
        opt.isUnassigned ? !value : opt.id === value
      );
      setHighlightIndex(currentIndex >= 0 ? currentIndex : 0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectOption = (opt: { id: string; employee?: IUser }) => {
    onChange(opt.id, opt.employee || null);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < selectableOptions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : selectableOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetOption = selectableOptions[highlightIndex] || selectableOptions[0];
      if (targetOption) {
        selectOption(targetOption);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const isSelectedMe = selectedEmployee ? isMe(selectedEmployee) : false;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-1.5 border border-[#b6e0e4] bg-[#f0f8f9] hover:bg-[#e6f4f6] text-[#3a7d84] rounded-xl px-2.5 py-1.5 text-xs font-bold transition shadow-2xs hover:border-[#51a8b1] cursor-pointer select-none ${
          isOpen ? 'ring-2 ring-[#51a8b1] border-[#51a8b1] bg-[#e6f4f6]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title="Click to search and select employee"
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <User className={`w-3.5 h-3.5 shrink-0 ${selectedEmployee ? 'text-[#3a7d84]' : 'text-[#94a3b8]'}`} />
          {selectedEmployee ? (
            <span className="truncate flex items-center gap-1">
              <span className="truncate">{selectedEmployee.name}</span>
              {isSelectedMe && (
                <span className="px-1.5 py-0.2 rounded-md bg-[#51a8b1]/20 text-[#3a7d84] font-black text-[9px] uppercase tracking-wide">
                  Me
                </span>
              )}
              {selectedEmployee.employeeCode ? (
                <span className="text-[10px] font-mono opacity-75">[{selectedEmployee.employeeCode}]</span>
              ) : null}
            </span>
          ) : (
            <span className="text-[#94a3b8] font-medium">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-[#3a7d84] opacity-70 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown with Search Bar */}
      {isOpen && (
        <div
          className={`absolute ${align === 'left' ? 'left-0' : 'right-0'} top-full mt-1.5 w-72 sm:w-80 bg-white border border-[#b6e0e4] rounded-2xl shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Search Input Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type employee name or code..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#f8fafb] border border-[#b6e0e4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] text-[#1e293b] font-medium placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setHighlightIndex(0);
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 space-y-0.5">
            {selectableOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">
                No employee found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              selectableOptions.map((opt, idx) => {
                const isSelected = opt.isUnassigned ? !value : value === opt.id;
                const isHighlighted = highlightIndex === idx;

                return (
                  <div
                    key={opt.id || 'unassigned'}
                    onClick={() => selectOption(opt)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition select-none ${
                      isHighlighted ? 'bg-[#f0f8f9] text-[#3a7d84]' : 'text-slate-700 hover:bg-[#f8fafb]'
                    } ${isSelected ? 'font-bold bg-[#e6f4f6]/80 text-[#3a7d84]' : ''} ${
                      opt.isMe ? 'bg-[#f0f8f9]/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.isUnassigned ? (
                        <UserX className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      ) : (
                        <User
                          className={`w-3.5 h-3.5 shrink-0 ${
                            opt.isMe ? 'text-[#3a7d84]' : isSelected ? 'text-[#3a7d84]' : 'text-slate-400'
                          }`}
                        />
                      )}
                      <div className="min-w-0 truncate">
                        <div className="truncate flex items-center gap-1.5">
                          <span className="truncate">{opt.name}</span>
                          {opt.isMe && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#51a8b1]/20 text-[#3a7d84] font-black text-[9px] uppercase tracking-wide border border-[#51a8b1]/30">
                              Me
                            </span>
                          )}
                          {opt.employeeCode && (
                            <span className="text-[10px] font-mono text-slate-500 font-normal">
                              [{opt.employeeCode}]
                            </span>
                          )}
                        </div>
                        {opt.designation && (
                          <div className="text-[10px] text-slate-400 truncate font-normal">
                            {opt.designation}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#3a7d84]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
