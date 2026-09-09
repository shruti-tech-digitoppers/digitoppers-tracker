'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  GraduationCap, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Users, 
  Wifi, 
  Layers, 
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';

export interface ISchoolBranchData {
  id?: string;
  schoolName: string;
  schoolCode?: string;
  address?: string;
  deploymentLocations?: string;
  principalName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  totalStudents?: number | string;
  labAvailable?: string;
  internetAvailable?: string;
  remarks?: string;
}

interface MultiSchoolSectionProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function MultiSchoolSection({
  value,
  onChange,
  disabled = false,
}: MultiSchoolSectionProps) {
  // Normalize incoming value into an array of schools
  const schoolsList: ISchoolBranchData[] = useMemo(() => {
    if (value && Array.isArray(value.schools) && value.schools.length > 0) {
      return value.schools;
    }
    if (value && Array.isArray(value) && value.length > 0) {
      return value;
    }
    
    // Check if flat/single school keys exist
    if (value && (value.schoolName || value.schoolCode || value.address || value.contactPerson || value.totalStudents)) {
      // Split multiple school names if delimited by ';'
      const names = String(value.schoolName || '').split(';').map(s => s.trim()).filter(Boolean);
      if (names.length > 1) {
        return names.map((name, idx) => ({
          id: `school-${idx + 1}`,
          schoolName: name,
          schoolCode: idx === 0 ? value.schoolCode || '' : '',
          address: idx === 0 ? value.address || '' : '',
          deploymentLocations: value.deploymentLocations || '',
          principalName: value.principalName || '',
          contactPerson: value.contactPerson || '',
          phone: value.phone || '',
          email: value.email || '',
          totalStudents: idx === 0 ? value.totalStudents : '',
          labAvailable: value.labAvailable || 'Yes',
          internetAvailable: value.internetAvailable || 'Yes',
          remarks: value.remarks || ''
        }));
      }

      return [{
        id: 'school-1',
        schoolName: value.schoolName || '',
        schoolCode: value.schoolCode || '',
        address: value.address || '',
        deploymentLocations: value.deploymentLocations || '',
        principalName: value.principalName || '',
        contactPerson: value.contactPerson || '',
        phone: value.phone || '',
        email: value.email || '',
        totalStudents: value.totalStudents || '',
        labAvailable: value.labAvailable || 'Yes',
        internetAvailable: value.internetAvailable || 'Yes',
        remarks: value.remarks || ''
      }];
    }

    // Default 1 empty school
    return [{
      id: 'school-1',
      schoolName: '',
      schoolCode: '',
      address: '',
      deploymentLocations: '',
      principalName: '',
      contactPerson: '',
      phone: '',
      email: '',
      totalStudents: '',
      labAvailable: 'Yes',
      internetAvailable: 'Yes',
      remarks: ''
    }];
  }, [value]);

  const [activeTab, setActiveTab] = useState<number>(0);

  // Keep activeTab within bounds
  const currentTabIndex = Math.min(activeTab, Math.max(0, schoolsList.length - 1));
  const activeSchool = schoolsList[currentTabIndex] || schoolsList[0];

  // Emit updated data maintaining both array and top-level summary values
  const emitUpdate = (updatedSchools: ISchoolBranchData[]) => {
    const totalAggregatedStudents = updatedSchools.reduce((acc, s) => acc + (Number(s.totalStudents) || 0), 0);
    const combinedSchoolNames = updatedSchools.map(s => s.schoolName).filter(Boolean).join('; ');
    const primary = updatedSchools[0] || {};

    const nextValue = {
      ...(typeof value === 'object' && value !== null ? value : {}),
      schools: updatedSchools,
      // Backward compatibility top-level keys
      schoolName: combinedSchoolNames || primary.schoolName || '',
      schoolCode: primary.schoolCode || '',
      address: updatedSchools.map(s => s.address ? `${s.schoolName || 'School'}: ${s.address}` : '').filter(Boolean).join(' | ') || primary.address || '',
      deploymentLocations: primary.deploymentLocations || '',
      principalName: primary.principalName || '',
      contactPerson: primary.contactPerson || '',
      phone: primary.phone || '',
      email: primary.email || '',
      totalStudents: totalAggregatedStudents || primary.totalStudents || 0,
      labAvailable: primary.labAvailable || 'Yes',
      internetAvailable: primary.internetAvailable || 'Yes',
      remarks: primary.remarks || ''
    };

    onChange(nextValue);
  };

  const handleUpdateActiveField = (fieldName: keyof ISchoolBranchData, fieldValue: any) => {
    const updated = [...schoolsList];
    updated[currentTabIndex] = {
      ...updated[currentTabIndex],
      [fieldName]: fieldValue
    };
    emitUpdate(updated);
  };

  const handleAddSchool = () => {
    const newSchool: ISchoolBranchData = {
      id: `school-${Date.now()}`,
      schoolName: `School / Branch ${schoolsList.length + 1}`,
      schoolCode: '',
      address: '',
      deploymentLocations: 'STEM Lab Room 101',
      principalName: '',
      contactPerson: '',
      phone: '',
      email: '',
      totalStudents: '',
      labAvailable: 'Yes',
      internetAvailable: 'Yes',
      remarks: ''
    };
    const updated = [...schoolsList, newSchool];
    emitUpdate(updated);
    setActiveTab(updated.length - 1);
  };

  const handleDeleteSchool = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (schoolsList.length <= 1) return;
    const updated = schoolsList.filter((_, idx) => idx !== indexToDelete);
    emitUpdate(updated);
    if (currentTabIndex >= updated.length) {
      setActiveTab(Math.max(0, updated.length - 1));
    }
  };

  const totalStudentsCount = schoolsList.reduce((acc, s) => acc + (Number(s.totalStudents) || 0), 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner with Multi-School Summary Stats */}
      <div className="p-3.5 bg-gradient-to-r from-[#f0f8f9] via-white to-[#f7fbe9] border border-[#b6e0e4] rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#51a8b1] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#333333] font-heading flex items-center gap-2">
              <span>Multi-School &amp; Branch Hub</span>
              <span className="px-2 py-0.5 rounded-full bg-[#51a8b1]/15 text-[#3a7d84] text-[10px] font-bold border border-[#b6e0e4]">
                {schoolsList.length} {schoolsList.length === 1 ? 'School Site' : 'School Sites'}
              </span>
            </h4>
            <p className="text-[11px] text-[#4a5462]">
              Configure separate onboarding details, coordinators, and infrastructure for each affiliated school.
            </p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1 bg-white border border-[#b9c0cb]/40 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-[#51a8b1]" />
            <span className="text-[11px] text-[#4a5462]">Total Students:</span>
            <span className="text-xs font-bold text-[#333333]">
              {totalStudentsCount > 0 ? totalStudentsCount.toLocaleString() : '—'}
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleAddSchool}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#51a8b1] text-white text-xs font-bold hover:bg-[#3a7d84] active:scale-95 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add School / Branch</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#b9c0cb]/30 no-scrollbar">
        {schoolsList.map((school, index) => {
          const isActive = index === currentTabIndex;
          const label = school.schoolName?.trim() || `School ${index + 1}`;

          return (
            <div
              key={school.id || `tab-${index}`}
              onClick={() => setActiveTab(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none border shrink-0 ${
                isActive
                  ? 'bg-[#51a8b1] text-white border-[#51a8b1] shadow-xs'
                  : 'bg-white text-[#4a5462] border-[#b9c0cb]/50 hover:border-[#51a8b1]/60 hover:bg-[#f8fafb]'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#51a8b1]'}`} />
              <span className="truncate max-w-[180px] sm:max-w-[240px]">
                {index + 1}. {label}
              </span>

              {school.totalStudents ? (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]'
                }`}>
                  {school.totalStudents} std
                </span>
              ) : null}

              {schoolsList.length > 1 && !disabled && (
                <button
                  type="button"
                  title="Remove this school"
                  onClick={(e) => handleDeleteSchool(index, e)}
                  className={`w-4 h-4 rounded-md flex items-center justify-center transition hover:bg-rose-500 hover:text-white ${
                    isActive ? 'text-white/70' : 'text-[#b9c0cb] hover:text-white'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active School Form Fields Card */}
      <div className="p-4 sm:p-5 bg-white border border-[#b9c0cb]/50 rounded-2xl shadow-2xs space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f6]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center text-xs font-bold">
              {currentTabIndex + 1}
            </span>
            <div>
              <h5 className="text-xs font-bold text-[#333333] font-heading">
                {activeSchool.schoolName || `School Branch #${currentTabIndex + 1}`}
              </h5>
              <p className="text-[10px] text-[#4a5462]">
                School ID: {activeSchool.schoolCode || 'Not Assigned Yet'}
              </p>
            </div>
          </div>

          <span className="text-[10.5px] font-medium text-[#51a8b1] bg-[#f0f8f9] px-2.5 py-0.5 rounded-full border border-[#b6e0e4]">
            Branch {currentTabIndex + 1} of {schoolsList.length}
          </span>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* School Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84]">
              School / Institution / Branch Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.schoolName || ''}
              onChange={(e) => handleUpdateActiveField('schoolName', e.target.value)}
              placeholder="e.g. Sarvodaya Kanya Vidyalaya No. 1"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* School Code / UDISE */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84]">
              School Code / UDISE / Branch ID
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.schoolCode || ''}
              onChange={(e) => handleUpdateActiveField('schoolCode', e.target.value)}
              placeholder="e.g. SCH-DEL-0101"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white font-mono"
            />
          </div>

          {/* School Address */}
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#51a8b1]" />
              School Address &amp; Location
            </label>
            <textarea
              rows={2}
              disabled={disabled}
              value={activeSchool.address || ''}
              onChange={(e) => handleUpdateActiveField('address', e.target.value)}
              placeholder="Enter full campus address, sector, district, pin code"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Implementation Sites / Rooms */}
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
              Implementation Sites / Lab Rooms / Floor
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.deploymentLocations || ''}
              onChange={(e) => handleUpdateActiveField('deploymentLocations', e.target.value)}
              placeholder="e.g. 2nd Floor STEM Lab Room 204, Ground Floor Robotics Room"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Principal Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#51a8b1]" />
              Principal / Head of Institution
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.principalName || ''}
              onChange={(e) => handleUpdateActiveField('principalName', e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Coordinator / Contact Person */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-[#51a8b1]" />
              Coordinator / Incharge Contact Person
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.contactPerson || ''}
              onChange={(e) => handleUpdateActiveField('contactPerson', e.target.value)}
              placeholder="e.g. Mrs. Sunita Sharma"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-[#51a8b1]" />
              Contact Phone Number
            </label>
            <input
              type="text"
              disabled={disabled}
              value={activeSchool.phone || ''}
              onChange={(e) => handleUpdateActiveField('phone', e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white font-mono"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-[#51a8b1]" />
              Contact Email Address
            </label>
            <input
              type="email"
              disabled={disabled}
              value={activeSchool.email || ''}
              onChange={(e) => handleUpdateActiveField('email', e.target.value)}
              placeholder="school.branch@domain.edu.in"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Total Students */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#51a8b1]" />
              Total Students in this Branch
            </label>
            <input
              type="number"
              min="0"
              disabled={disabled}
              value={activeSchool.totalStudents ?? ''}
              onChange={(e) => handleUpdateActiveField('totalStudents', e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 850"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] font-bold focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>

          {/* Lab & Internet Availability */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#3a7d84]">
                Dedicated Lab Room?
              </label>
              <select
                disabled={disabled}
                value={activeSchool.labAvailable || 'Yes'}
                onChange={(e) => handleUpdateActiveField('labAvailable', e.target.value)}
                className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#3a7d84] flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-[#51a8b1]" />
                Internet / Wi-Fi?
              </label>
              <select
                disabled={disabled}
                value={activeSchool.internetAvailable || 'Yes'}
                onChange={(e) => handleUpdateActiveField('internetAvailable', e.target.value)}
                className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          {/* Infrastructure Remarks */}
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-xs font-bold text-[#3a7d84]">
              Site / Infrastructure Remarks
            </label>
            <textarea
              rows={2}
              disabled={disabled}
              value={activeSchool.remarks || ''}
              onChange={(e) => handleUpdateActiveField('remarks', e.target.value)}
              placeholder="Power backup details, earthing status, network ports, special instructions"
              className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
