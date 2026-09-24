'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  School,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  BookOpen,
  Camera,
  Upload,
  Info,
  DollarSign,
  HeartHandshake,
  Lock,
  Cpu
} from 'lucide-react';

export interface ISchoolSurveyData {
  id?: string;
  // ── 1. School Information ──────────────────────────────────────────
  schoolName: string;
  addressContact?: string;
  schoolCategory?: string[] | string; // Multi-select support
  principalName?: string;
  principalDetails?: string;
  pocName?: string;
  pocDesignation?: string;
  pocContact?: string;

  // ── 2. School Demographics ─────────────────────────────────────────
  totalTeachers?: number | string;
  subjectWiseTeachers?: string;
  classWiseSubjects?: string;
  triSystemType?: string;
  totalStudents?: number | string;
  regularStudentsRatio?: string;
  studentCommittee?: string;
  villagesCount?: string;
  parentsOccupation?: string;
  studentAttendance?: string;
  overallResult?: string;

  // ── 3. School Infrastructure ───────────────────────────────────────
  totalClassrooms?: number | string;
  classroomCondition?: string[] | string; // Multi-select support: Pucca, Semi-Pucca, Kutcha, Tent
  additionalRooms?: string; // Music/Computer/Sports/Library
  spareRooms?: string;
  electricityInternetAvailability?: string;
  drinkingWaterAvailability?: string;
  washroomAvailability?: string;

  // ── 4. Digital Initiatives and Facilities ─────────────────────────
  ictLabAvailable?: string; // Yes / No
  ictSetupDate?: string;
  ictHardwareComponents?: string;
  digitalContentProvided?: string;
  digitalContentClasses?: string;
  ictLabFunctional?: string; // Yes / No
  ictWeeklyUsage?: string;
  ictStudentCount?: string;
  computerTeacherAvailable?: string;
  internetFacilityType?: string;
  libraryCornerAvailable?: string;
  govtBooksCount?: string;
  fullTimeLibrarian?: string;
  newspaperSubscription?: string;

  // ── 5. Additional Notes and Stakeholders ───────────────────────────
  additionalNotes?: string;
  otherStakeholders?: string; // SMC chairman, DEO, BEEO, etc.
  supportingOrgName?: string;
  supportingOrgContactPerson?: string;
  supportingOrgDesignation?: string;
  supportingOrgContact?: string;
  supportingOrgEmail?: string;
  smartClassRoomIdentification?: string;
  smartClassRoomCondition?: string; // Seating / Furniture / Ventilation / Security
  photoFrontView?: string;
  photoSmartRoom?: string;

  // ── 6. Socio-Economic Background ──────────────────────────────────
  parentIncomeGroup?: string[] | string; // Multi-select support: BPL, LIG, MIG, HIG
  parentProfessions?: string[]; // Multi-select checkboxes
  parentProfessionOther?: string;
  parentEducationLevel?: string[] | string; // Multi-select support
  firstGenerationLearner?: string;

  // ── 7. Security and Handling ──────────────────────────────────────
  securityGuard?: string;
  ictSecurityMeasures?: string;
  deviceStorage?: string;
  lostDeviceProtocol?: string;
  dataBackupPlan?: string;
  responsibleUseTraining?: string;
  usageTrackingMechanism?: string;
  cybersecurityPolicies?: string;
  breachHistory?: string;
  digitoppersSecurityCooperation?: string;
  safetyHazardsMitigation?: string;
}

interface MultiSchoolSectionProps {
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

const SCHOOL_CATEGORIES = [
  'Primary only with grade 1 to 5',
  'Upper Primary with grade 1 to 8',
  'Higher secondary with grade 1 to 12',
  'Middle School only with grade 6 to 8',
  'Higher secondary with grade 6 to 12',
];

const CLASSROOM_CONDITIONS = [
  'Pucca (पक्का)',
  'Semi-Pucca (आंशिक रूप से पक्का)',
  'Kutcha (कच्चा)',
  'Tent (तंबू)',
];

const INCOME_GROUPS = [
  'Below Poverty Line (BPL)',
  'Lower Income Group (LIG)',
  'Middle Income Group (MIG)',
  'High Income Group (HIG)',
];

const PARENT_PROFESSIONS = [
  'Government Employee',
  'Private Sector Employee',
  'Self-Employed / Business Owner',
  'Daily Wage Worker',
  'Farmer / Agricultural Worker',
  'Homemaker',
  'Other',
];

const PARENT_EDUCATION_LEVELS = [
  'No Formal Education',
  'Primary Education (Up to Class 5)',
  'Secondary Education (Class 6–10)',
  'Higher Secondary Education (Class 11–12)',
  'Graduate',
  'Postgraduate or Above',
];

const FIRST_GEN_OPTIONS = [
  'Yes, the child is the first in the family to receive formal education',
  'No, other family members have received formal education',
];

// Helper to normalize any string or array value into a string array
function toArray(val: string[] | string | undefined | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    return val.split(';').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function MultiSchoolSection({
  value,
  onChange,
  disabled = false,
}: MultiSchoolSectionProps) {
  // Normalize incoming value into an array of schools
  const schoolsList: ISchoolSurveyData[] = useMemo(() => {
    if (value && Array.isArray(value.schools) && value.schools.length > 0) {
      return value.schools.map((s: any, idx: number) => ({
        id: s.id || `school-${idx + 1}`,
        schoolName: s.schoolName || s.name || '',
        ...s,
        schoolCategory: toArray(s.schoolCategory),
        classroomCondition: toArray(s.classroomCondition),
        parentIncomeGroup: toArray(s.parentIncomeGroup),
        parentProfessions: toArray(s.parentProfessions),
        parentEducationLevel: toArray(s.parentEducationLevel),
      }));
    }

    if (value && Array.isArray(value) && value.length > 0) {
      return value.map((s: any, idx: number) => ({
        id: s.id || `school-${idx + 1}`,
        schoolName: s.schoolName || s.name || '',
        ...s,
        schoolCategory: toArray(s.schoolCategory),
        classroomCondition: toArray(s.classroomCondition),
        parentIncomeGroup: toArray(s.parentIncomeGroup),
        parentProfessions: toArray(s.parentProfessions),
        parentEducationLevel: toArray(s.parentEducationLevel),
      }));
    }

    // Flat single school fallback
    if (value && (value.schoolName || value.addressContact || value.principalName)) {
      return [{
        id: 'school-1',
        schoolName: value.schoolName || '',
        ...value,
        schoolCategory: toArray(value.schoolCategory),
        classroomCondition: toArray(value.classroomCondition),
        parentIncomeGroup: toArray(value.parentIncomeGroup),
        parentProfessions: toArray(value.parentProfessions),
        parentEducationLevel: toArray(value.parentEducationLevel),
      }];
    }

    return [{
      id: 'school-1',
      schoolName: '',
      schoolCategory: [],
      classroomCondition: [],
      parentIncomeGroup: [],
      parentProfessions: [],
      parentEducationLevel: [],
    }];
  }, [value]);

  const [activeSchoolIndex, setActiveSchoolIndex] = useState<number>(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sec1: true,
    sec2: true,
    sec3: true,
    sec4: true,
    sec5: true,
    sec6: true,
    sec7: true,
  });

  const toggleSection = (secKey: string) => {
    setOpenSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  const currentSchool = schoolsList[activeSchoolIndex] || schoolsList[0] || { schoolName: '', id: 'school-1' };

  // Update a single school in the list and propagate change
  const handleUpdateCurrentSchool = useCallback((updatedFields: Partial<ISchoolSurveyData>) => {
    const nextList = [...schoolsList];
    const current = nextList[activeSchoolIndex] || { id: `school-${activeSchoolIndex + 1}`, schoolName: '' };
    nextList[activeSchoolIndex] = { ...current, ...updatedFields };

    onChange({
      ...value,
      schools: nextList,
      schoolName: nextList.map(s => s.schoolName).filter(Boolean).join('; '),
      totalStudents: nextList.reduce((acc, curr) => acc + (Number(curr.totalStudents) || 0), 0) || '',
      principalName: nextList[0]?.principalName || '',
      contactPerson: nextList[0]?.pocName || '',
      phone: nextList[0]?.pocContact || '',
    });
  }, [schoolsList, activeSchoolIndex, onChange, value]);

  const handleAddSchool = () => {
    const nextId = `school-${schoolsList.length + 1}`;
    const newSchool: ISchoolSurveyData = {
      id: nextId,
      schoolName: `School Unit #${schoolsList.length + 1}`,
      schoolCategory: [],
      classroomCondition: [],
      parentIncomeGroup: [],
      parentProfessions: [],
      parentEducationLevel: [],
    };
    const nextList = [...schoolsList, newSchool];
    setActiveSchoolIndex(nextList.length - 1);

    onChange({
      ...value,
      schools: nextList,
      schoolName: nextList.map(s => s.schoolName).filter(Boolean).join('; '),
    });
  };

  const handleRemoveSchool = (idxToRemove: number) => {
    if (schoolsList.length <= 1) return;
    const nextList = schoolsList.filter((_, idx) => idx !== idxToRemove);
    const nextActive = activeSchoolIndex >= nextList.length ? nextList.length - 1 : activeSchoolIndex;
    setActiveSchoolIndex(nextActive);

    onChange({
      ...value,
      schools: nextList,
      schoolName: nextList.map(s => s.schoolName).filter(Boolean).join('; '),
    });
  };

  // Generalized multi-select toggle handler
  const handleToggleArrayItem = (field: keyof ISchoolSurveyData, item: string) => {
    const currentArr = toArray(currentSchool[field] as any);
    const exists = currentArr.includes(item);
    const nextArr = exists ? currentArr.filter(i => i !== item) : [...currentArr, item];
    handleUpdateCurrentSchool({ [field]: nextArr });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── Top Multi-School Navigation Tabs ─────────────────────── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#2d6b73]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-slate-900">
                School Information & Survey Form
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Official 7-Section DigiToppers Baseline Survey ({schoolsList.length} {schoolsList.length === 1 ? 'School' : 'Schools'} Configured)
              </p>
            </div>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={handleAddSchool}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2d6b73] hover:bg-[#235359] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add School / Branch</span>
            </button>
          )}
        </div>

        {/* School Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-thin">
          {schoolsList.map((school, idx) => {
            const isActive = idx === activeSchoolIndex;
            return (
              <div
                key={school.id || idx}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#e8f6f8] text-[#2c6870] border-[#9ed6dc] shadow-2xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
                onClick={() => setActiveSchoolIndex(idx)}
              >
                <School className="w-3.5 h-3.5" />
                <span className="max-w-[140px] truncate">
                  {school.schoolName || `School #${idx + 1}`}
                </span>
                {schoolsList.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSchool(idx);
                    }}
                    className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition ml-1"
                    title="Remove School"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active School Survey Form Container ─────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1: SCHOOL INFORMATION
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec1')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                1
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                1. School Information
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 1.1 Name of the School */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.1 Name of the School <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Government Higher Secondary School, Rampur"
                  value={currentSchool.schoolName || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ schoolName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 1.2 Contact Details */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.2 Contact Details (Address with PIN code and Mobile number)
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="Full school address, village/city, PIN code, contact phone numbers..."
                  value={currentSchool.addressContact || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ addressContact: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 1.3 School Category (Multi-Select Checkboxes) */}
              <div className="md:col-span-2 space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#2d6b73]" />
                    1.3 School Category (Multiple Selection Allowed)
                  </label>
                  <span className="text-[10px] text-[#2d6b73] font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {toArray(currentSchool.schoolCategory).length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SCHOOL_CATEGORIES.map((cat) => {
                    const isChecked = toArray(currentSchool.schoolCategory).includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-teal-50/90 border-[#51a8b1] text-[#2d6b73] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => handleToggleArrayItem('schoolCategory', cat)}
                          className="rounded text-[#2d6b73] focus:ring-[#51a8b1]"
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 1.4 & 1.5 Principal Details */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.4 Name of the Principal / Head contact
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Principal's Full Name"
                  value={currentSchool.principalName || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ principalName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.5 Principal Details / Phone / Email
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Principal phone number & email address"
                  value={currentSchool.principalDetails || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ principalDetails: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 1.6, 1.7, 1.8 POC Details */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.6 Name of the contact person (POC)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Contact Person Name"
                  value={currentSchool.pocName || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ pocName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.7 Designation
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Vice Principal / ICT In-charge"
                  value={currentSchool.pocDesignation || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ pocDesignation: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  1.8 Contact Details (POC Phone / Email)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="POC Mobile Number & Email"
                  value={currentSchool.pocContact || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ pocContact: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: SCHOOL DEMOGRAPHICS
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec2')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                2
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                2. School Demographics
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 2.1 Number of teachers */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.1 Number of teachers
                </label>
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="Total count"
                  value={currentSchool.totalTeachers || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ totalTeachers: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 2.2 Subject-wise bifurcation */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.2 Subject-wise bifurcation of teacher
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Science: 4, Math: 3, English: 3, Social: 2"
                  value={currentSchool.subjectWiseTeachers || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ subjectWiseTeachers: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 2.3 Class-wise details */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.3 Class-wise details of subjects
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="Details of subjects taught class by class..."
                  value={currentSchool.classWiseSubjects || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ classWiseSubjects: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 2.4 Single Tri or Multi Tri system */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.4 Does the school has single Tri system or multi trisystem for different subject
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Single Tri / Multi Tri system details..."
                  value={currentSchool.triSystemType || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ triSystemType: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 2.5 Total Students & 2.5.1 Attendance */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.5 Total Number of students
                </label>
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="Total students enrolled"
                  value={currentSchool.totalStudents || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ totalStudents: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.5.1 Number / percentage of student coming regularly
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 85% or 450 students"
                  value={currentSchool.regularStudentsRatio || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ regularStudentsRatio: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 2.6 Student committee & 2.7 Villages */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.6 Is there a student committee in school?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Yes / No & details"
                  value={currentSchool.studentCommittee || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ studentCommittee: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.7 From how many villages students are coming to your school
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Number / Names of villages"
                  value={currentSchool.villagesCount || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ villagesCount: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 2.8, 2.9, 3.0 */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.8 Basic occupation of the parents
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Agriculture, Labour, Business, Service"
                  value={currentSchool.parentsOccupation || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ parentsOccupation: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  2.9 Student Attendance
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Average 80%"
                  value={currentSchool.studentAttendance || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ studentAttendance: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.0 Overall School Result
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 92% pass rate in board exams"
                  value={currentSchool.overallResult || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ overallResult: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: SCHOOL INFRASTRUCTURE
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec3')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                3
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                3. School Infrastructure
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 3.1 Classrooms count */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.1 Total number of classroom in the school
                </label>
                <input
                  type="number"
                  disabled={disabled}
                  placeholder="Total rooms"
                  value={currentSchool.totalClassrooms || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ totalClassrooms: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 3.2 Condition of classroom (Multi-Select Checkboxes) */}
              <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    3.2 Condition of classroom (Select all that apply)
                  </label>
                  <span className="text-[10px] text-[#2d6b73] font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {toArray(currentSchool.classroomCondition).length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CLASSROOM_CONDITIONS.map((cond) => {
                    const isChecked = toArray(currentSchool.classroomCondition).includes(cond);
                    return (
                      <label
                        key={cond}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-teal-50/90 border-[#51a8b1] text-[#2d6b73] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => handleToggleArrayItem('classroomCondition', cond)}
                          className="rounded text-[#2d6b73] focus:ring-[#51a8b1]"
                        />
                        <span>{cond}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3.3 Additional rooms */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.3 Additional rooms (Music/Computer lab/Sports room/Library)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 1 Library, 1 Science Lab, 1 Staff Room"
                  value={currentSchool.additionalRooms || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ additionalRooms: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 3.4 Any spare rooms */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.4 Any spare rooms for classes
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Yes / No & count"
                  value={currentSchool.spareRooms || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ spareRooms: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 3.5 Electricity / Internet */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.5 Availability of electricity / Internet
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Regular 24x7 electricity, Fiber internet available"
                  value={currentSchool.electricityInternetAvailability || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ electricityInternetAvailability: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 3.6 Drinking water */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.6 Availability of drinking water facilities
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. RO Drinking water / Handpump / Tap water"
                  value={currentSchool.drinkingWaterAvailability || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ drinkingWaterAvailability: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 3.7 Washroom */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  3.7 Availability of washroom facilities
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Separate functional washrooms for boys & girls"
                  value={currentSchool.washroomAvailability || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ washroomAvailability: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: DIGITAL INITIATIVES AND FACILITIES
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec4')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                4
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                4. Digital Initiatives and Facilities
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 4.1 ICT Lab available & 4.2 Setup Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.1 Is the ICT Lab available in the school?
                </label>
                <select
                  disabled={disabled}
                  value={currentSchool.ictLabAvailable || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictLabAvailable: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium cursor-pointer"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.2 When was it set up?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. July 2023 or Year"
                  value={currentSchool.ictSetupDate || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictSetupDate: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 4.3 Hardware components */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.3 What are the hardware components of this ICT Lab?
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="e.g. 10 Desktops, 1 Interactive Flat Panel (IFP), 1 UPS, Projector..."
                  value={currentSchool.ictHardwareComponents || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictHardwareComponents: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 4.4 & 4.5 Digital Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.4 Any kind of digital content is provided?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. DigiToppers Smart Curriculum, DIKSHA..."
                  value={currentSchool.digitalContentProvided || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ digitalContentProvided: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.5 What classes and subjects does it cover
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Class 1 to 10: Science, Math, Social Science"
                  value={currentSchool.digitalContentClasses || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ digitalContentClasses: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 4.6, 4.7, 4.8 ICT Usage */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.6 Is the ICT Lab functional?
                </label>
                <select
                  disabled={disabled}
                  value={currentSchool.ictLabFunctional || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictLabFunctional: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium cursor-pointer"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.7 If yes, how many times a week do you use it?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 5 days / week"
                  value={currentSchool.ictWeeklyUsage || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictWeeklyUsage: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.8 How many students are accessing the ICT Lab?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 350 students"
                  value={currentSchool.ictStudentCount || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictStudentCount: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.9 Is there a Computer teacher in your school?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Yes / No & Name"
                  value={currentSchool.computerTeacherAvailable || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ computerTeacherAvailable: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 4.10 Internet & 4.11 Library */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.10 Internet Facility & Type
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Fiber / Broadband / Dongle / Wi-Fi"
                  value={currentSchool.internetFacilityType || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ internetFacilityType: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.11 Whether the school have a Library/Reading Corner?
                </label>
                <select
                  disabled={disabled}
                  value={currentSchool.libraryCornerAvailable || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ libraryCornerAvailable: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium cursor-pointer"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* 4.12, 4.13, 4.14 Books & Librarian */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.12 Total books from NCERT, NBT, or Govt publisher
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 1200 books"
                  value={currentSchool.govtBooksCount || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ govtBooksCount: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.13 Does the school have a full-time librarian?
                </label>
                <select
                  disabled={disabled}
                  value={currentSchool.fullTimeLibrarian || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ fullTimeLibrarian: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium cursor-pointer"
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  4.14 Does the school subscribe to newspaper / magazines
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Yes, 2 daily newspapers & 3 magazines"
                  value={currentSchool.newspaperSubscription || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ newspaperSubscription: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 5: ADDITIONAL NOTES AND STAKEHOLDERS
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec5')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                5
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                5. Additional Notes and Stakeholders
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec5 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 5.1 Additional notes */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  5.1 Additional notes / Points of observation
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="General notes, site observation points..."
                  value={currentSchool.additionalNotes || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ additionalNotes: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 5.2 Details of other stake holder */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  5.2 Details of other stakeholder (SMC chairman, Local community leader, DEO, BEEO, Any other)
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="Names, designations, and contact numbers of key community stakeholders..."
                  value={currentSchool.otherStakeholders || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ otherStakeholders: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 5.3 Supporting Org / NGO */}
              <div className="md:col-span-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-3">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-[#2d6b73]" />
                  5.3 Any other organization / NGO / Individual supporting the school?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">5.3.1 Name of the organisation</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="NGO / Trust Name"
                      value={currentSchool.supportingOrgName || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ supportingOrgName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">5.3.2 Contact Person</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Representative Name"
                      value={currentSchool.supportingOrgContactPerson || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ supportingOrgContactPerson: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">5.3.3 Designation</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Designation"
                      value={currentSchool.supportingOrgDesignation || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ supportingOrgDesignation: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">5.3.4 Contact</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Phone Number"
                      value={currentSchool.supportingOrgContact || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ supportingOrgContact: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-600">5.3.5 Email</label>
                    <input
                      type="email"
                      disabled={disabled}
                      placeholder="Email Address"
                      value={currentSchool.supportingOrgEmail || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ supportingOrgEmail: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                </div>
              </div>

              {/* 5.4 & 5.5 Smart Classroom Setup */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  5.4 Identification of room for smart classroom setup
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Room No. 104 (1st Floor) or Lab A"
                  value={currentSchool.smartClassRoomIdentification || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ smartClassRoomIdentification: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  5.5 Seating arrangement / furniture / ventilation / Security
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. 40 Benches, 4 ceiling fans, iron grilled windows & lock"
                  value={currentSchool.smartClassRoomCondition || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ smartClassRoomCondition: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 5.6 Photographs */}
              <div className="md:col-span-2 space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#2d6b73]" />
                  5.6 Photograph of the school (front view) and smart classroom setup room
                </label>
                <p className="text-[11px] text-slate-500">
                  Provide image links or upload photos (with school name & code clearly noted)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">School Front View Photo URL</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="https://... or photo url"
                      value={currentSchool.photoFrontView || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ photoFrontView: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Smart Classroom Room Photo URL</label>
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="https://... or photo url"
                      value={currentSchool.photoSmartRoom || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ photoSmartRoom: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 6: SOCIO-ECONOMIC BACKGROUND OF PARENTS / STUDENTS
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec6')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                6
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                6. Socio-Economic Background of Parents / Students
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec6 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec6 && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
              {/* 6.1 Income Group (Multi-Select Checkboxes) */}
              <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#2d6b73]" />
                    6.1 Income group of parents (Select all that apply)
                  </label>
                  <span className="text-[10px] text-[#2d6b73] font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {toArray(currentSchool.parentIncomeGroup).length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {INCOME_GROUPS.map((grp) => {
                    const isChecked = toArray(currentSchool.parentIncomeGroup).includes(grp);
                    return (
                      <label
                        key={grp}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-teal-50/90 border-[#51a8b1] text-[#2d6b73] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => handleToggleArrayItem('parentIncomeGroup', grp)}
                          className="rounded text-[#2d6b73] focus:ring-[#51a8b1]"
                        />
                        <span>{grp}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 6.2 Profession of Parents (Multi-Select Checkboxes) */}
              <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    6.2 Profession of the Parents (Select all that apply)
                  </label>
                  <span className="text-[10px] text-[#2d6b73] font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {toArray(currentSchool.parentProfessions).length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PARENT_PROFESSIONS.map((prof) => {
                    const isChecked = toArray(currentSchool.parentProfessions).includes(prof);
                    return (
                      <label
                        key={prof}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-teal-50/90 border-[#51a8b1] text-[#2d6b73] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => handleToggleArrayItem('parentProfessions', prof)}
                          className="rounded text-[#2d6b73] focus:ring-[#51a8b1]"
                        />
                        <span>{prof}</span>
                      </label>
                    );
                  })}
                </div>
                {toArray(currentSchool.parentProfessions).includes('Other') && (
                  <div className="pt-2">
                    <input
                      type="text"
                      disabled={disabled}
                      placeholder="Please specify other profession details..."
                      value={currentSchool.parentProfessionOther || ''}
                      onChange={(e) => handleUpdateCurrentSchool({ parentProfessionOther: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:ring-1 focus:ring-[#51a8b1]"
                    />
                  </div>
                )}
              </div>

              {/* 6.3 Educational Level of Parents (Multi-Select Checkboxes) */}
              <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#2d6b73]" />
                    6.3 Educational Level of Parents (Select all that apply)
                  </label>
                  <span className="text-[10px] text-[#2d6b73] font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {toArray(currentSchool.parentEducationLevel).length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PARENT_EDUCATION_LEVELS.map((edu) => {
                    const isChecked = toArray(currentSchool.parentEducationLevel).includes(edu);
                    return (
                      <label
                        key={edu}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-teal-50/90 border-[#51a8b1] text-[#2d6b73] font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={isChecked}
                          onChange={() => handleToggleArrayItem('parentEducationLevel', edu)}
                          className="rounded text-[#2d6b73] focus:ring-[#51a8b1]"
                        />
                        <span>{edu}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 6.4 First Generation Learner */}
              <div className="space-y-2 p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                <label className="text-xs font-bold text-slate-800">
                  6.4 Are Children's first-generation learner?
                </label>
                <div className="space-y-2">
                  {FIRST_GEN_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                        currentSchool.firstGenerationLearner === opt
                          ? 'bg-teal-50/80 border-[#51a8b1] text-[#2d6b73] font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`firstGen-${currentSchool.id}`}
                        disabled={disabled}
                        checked={currentSchool.firstGenerationLearner === opt}
                        onChange={() => handleUpdateCurrentSchool({ firstGenerationLearner: opt })}
                        className="text-[#2d6b73] focus:ring-[#51a8b1]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 7: SECURITY AND HANDLING
        ══════════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5 space-y-4">
          <div
            onClick={() => toggleSection('sec7')}
            className="flex items-center justify-between cursor-pointer select-none group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#2d6b73] text-white text-xs font-black flex items-center justify-center">
                7
              </span>
              <h4 className="font-heading text-sm font-bold text-slate-900 group-hover:text-[#2d6b73] transition">
                7. Security and Handling
              </h4>
            </div>
            <button type="button" className="text-slate-400 group-hover:text-slate-600">
              {openSections.sec7 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {openSections.sec7 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
              {/* 7.1 Security guard */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.1 Are there a security guard or personnel on the school premises?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="Yes / No & shift timings"
                  value={currentSchool.securityGuard || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ securityGuard: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.2 ICT Security measures */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.2 Security measures in place for ICT Lab (CCTV, locks, access control)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. CCTV installed, double locking door, key register"
                  value={currentSchool.ictSecurityMeasures || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ ictSecurityMeasures: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.3 Device Storage */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.3 How will the digital devices (Tablets, Notebooks, Laptops) be stored when not in use?
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="e.g. Locked in charging cart / secure almirah inside the Principal room..."
                  value={currentSchool.deviceStorage || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ deviceStorage: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>

              {/* 7.4 Lost device protocol & 7.5 Backup plan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.4 Protocol for reporting lost or damaged devices
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Immediate report to POC & Digitoppers helpline"
                  value={currentSchool.lostDeviceProtocol || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ lostDeviceProtocol: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.5 Backup and data recovery plan in case of system failures
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Weekly cloud sync & external hard drive backup"
                  value={currentSchool.dataBackupPlan || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ dataBackupPlan: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.6 Responsible use training & 7.7 Usage tracking */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.6 Guidelines / training on responsible and secure use
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Orientation conducted for teachers and students"
                  value={currentSchool.responsibleUseTraining || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ responsibleUseTraining: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.7 Mechanism for tracking & monitoring usage of digital content
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. DigiToppers Portal Analytics & Lab Log Register"
                  value={currentSchool.usageTrackingMechanism || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ usageTrackingMechanism: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.8 Cybersecurity & 7.9 Past breaches */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.8 Specific policies for cybersecurity and data protection
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Restricted admin access, firewall enabled"
                  value={currentSchool.cybersecurityPolicies || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ cybersecurityPolicies: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.9 Evidence of previous breaches / misuse & resolution
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. No previous breaches reported"
                  value={currentSchool.breachHistory || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ breachHistory: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.10 DigiToppers Cooperation */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.10 Willingness to cooperate in implementing security measures recommended by Digitoppers Edutech Pvt. Ltd?
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  placeholder="e.g. Yes, fully willing to implement recommended guidelines"
                  value={currentSchool.digitoppersSecurityCooperation || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ digitoppersSecurityCooperation: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                />
              </div>

              {/* 7.11 Potential hazards & mitigation */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  7.11 Potential safety hazards or concerns regarding implementation, and mitigation
                </label>
                <textarea
                  rows={2}
                  disabled={disabled}
                  placeholder="e.g. Electrical earthing to be checked, power surge protector to be installed..."
                  value={currentSchool.safetyHazardsMitigation || ''}
                  onChange={(e) => handleUpdateCurrentSchool({ safetyHazardsMitigation: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium resize-y"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
