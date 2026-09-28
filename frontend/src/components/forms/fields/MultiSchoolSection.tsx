'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
  Cpu,
  Search,
  AlertTriangle,
  X,
  Check,
  Sparkles,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

export interface ISchoolSurveyData {
  id?: string;
  // ── 1. School Information ──────────────────────────────────────────
  schoolName: string;
  addressContact?: string;
  schoolCategory?: string[] | string; // Multi-select support
  classes?: string[]; // Classes 1 to 12
  streams?: string[]; // Science, Commerce, Arts, etc.
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


// Exact LMS Backend Grade Schema Definition
export interface ILmsGrade {
  name: string; // 'Nursery', 'LKG', 'UKG', '1', '2', ... '12'
  id: string; // 'nursery', 'lkg', 'ukg', 'c1', ... 'c12'
  label: string;
  category: 'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SR_SECONDARY';
}

export const LMS_GRADES: ILmsGrade[] = [
  { name: 'Nursery', id: 'nursery', label: 'Nursery', category: 'PRE_PRIMARY' },
  { name: 'LKG', id: 'lkg', label: 'LKG', category: 'PRE_PRIMARY' },
  { name: 'UKG', id: 'ukg', label: 'UKG', category: 'PRE_PRIMARY' },
  { name: '1', id: 'c1', label: 'Grade 1', category: 'PRIMARY' },
  { name: '2', id: 'c2', label: 'Grade 2', category: 'PRIMARY' },
  { name: '3', id: 'c3', label: 'Grade 3', category: 'PRIMARY' },
  { name: '4', id: 'c4', label: 'Grade 4', category: 'PRIMARY' },
  { name: '5', id: 'c5', label: 'Grade 5', category: 'PRIMARY' },
  { name: '6', id: 'c6', label: 'Grade 6', category: 'MIDDLE' },
  { name: '7', id: 'c7', label: 'Grade 7', category: 'MIDDLE' },
  { name: '8', id: 'c8', label: 'Grade 8', category: 'MIDDLE' },
  { name: '9', id: 'c9', label: 'Grade 9', category: 'SECONDARY' },
  { name: '10', id: 'c10', label: 'Grade 10', category: 'SECONDARY' },
  { name: '11', id: 'c11', label: 'Grade 11', category: 'SR_SECONDARY' },
  { name: '12', id: 'c12', label: 'Grade 12', category: 'SR_SECONDARY' }
];

// Exact LMS Backend GradeStream Schema Definition
export const LMS_GRADE_STREAMS = [
  { name: 'Science', id: 'science', label: 'Science', icon: '🧪', color: '#0ea5e9' },
  { name: 'Commerce', id: 'commerce', label: 'Commerce', icon: '💼', color: '#10b981' },
  { name: 'Arts and Humanities', id: 'arts', label: 'Arts & Humanities', icon: '🎨', color: '#ec4899' }
];

export interface ILmsClassOption {
  id: string;
  name: string; // The saved value, e.g. 'Nursery', '1', '11 Science', '11 Commerce', '11 Arts', etc.
  label: string; // Display label
  pillColor?: string;
}

export const LMS_CLASS_OPTIONS: ILmsClassOption[] = [
  { id: 'nursery', name: 'Nursery', label: 'Nursery', pillColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'lkg', name: 'LKG', label: 'LKG', pillColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'ukg', name: 'UKG', label: 'UKG', pillColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'c1', name: '1', label: 'Class 1', pillColor: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'c2', name: '2', label: 'Class 2', pillColor: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'c3', name: '3', label: 'Class 3', pillColor: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'c4', name: '4', label: 'Class 4', pillColor: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'c5', name: '5', label: 'Class 5', pillColor: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'c6', name: '6', label: 'Class 6', pillColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'c7', name: '7', label: 'Class 7', pillColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'c8', name: '8', label: 'Class 8', pillColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'c9', name: '9', label: 'Class 9', pillColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'c10', name: '10', label: 'Class 10', pillColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { id: 'c11-sci', name: '11 Science', label: '11 Science', pillColor: 'bg-teal-50 text-teal-900 border-teal-300' },
  { id: 'c11-comm', name: '11 Commerce', label: '11 Commerce', pillColor: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  { id: 'c11-arts', name: '11 Arts', label: '11 Arts', pillColor: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300' },
  { id: 'c12-sci', name: '12 Science', label: '12 Science', pillColor: 'bg-teal-50 text-teal-900 border-teal-300' },
  { id: 'c12-comm', name: '12 Commerce', label: '12 Commerce', pillColor: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
  { id: 'c12-arts', name: '12 Arts', label: '12 Arts', pillColor: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300' },
];

export function isClassOptionSelected(selectedClasses: string[] | string | undefined, option: ILmsClassOption): boolean {
  const arr = toArray(selectedClasses);
  return arr.some(item => {
    const itemLow = String(item).toLowerCase().trim();
    const nameLow = option.name.toLowerCase().trim();
    const labelLow = option.label.toLowerCase().trim();
    return itemLow === nameLow || 
           itemLow === labelLow || 
           itemLow === `class ${nameLow}` || 
           itemLow === `grade ${nameLow}`;
  });
}

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
  const [schoolSearchQuery, setSchoolSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [schoolToDelete, setSchoolToDelete] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'add' | 'delete'; msg: string } | null>(null);

  // Class / Stream combination dropdown states
  const [classDropdownOpen, setClassDropdownOpen] = useState<boolean>(false);
  const [classSearchQuery, setClassSearchQuery] = useState<string>('');
  const classDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showFeedback = useCallback((type: 'add' | 'delete', msg: string) => {
    setActionFeedback({ type, msg });
    setTimeout(() => {
      setActionFeedback((prev) => (prev?.msg === msg ? null : prev));
    }, 3000);
  }, []);

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

  // Filtered schools for search dropdown
  const filteredSchools = useMemo(() => {
    if (!schoolSearchQuery.trim()) {
      return schoolsList.map((school, index) => ({ school, originalIndex: index }));
    }
    const q = schoolSearchQuery.toLowerCase();
    return schoolsList
      .map((school, index) => ({ school, originalIndex: index }))
      .filter(({ school, originalIndex }) =>
        (school.schoolName || '').toLowerCase().includes(q) ||
        (school.addressContact || '').toLowerCase().includes(q) ||
        (school.principalName || '').toLowerCase().includes(q) ||
        (school.pocName || '').toLowerCase().includes(q) ||
        `school #${originalIndex + 1}`.toLowerCase().includes(q) ||
        `branch #${originalIndex + 1}`.toLowerCase().includes(q)
      );
  }, [schoolsList, schoolSearchQuery]);

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
    const nextNum = schoolsList.length + 1;
    const nextId = `school-${Date.now()}`;
    const newSchoolName = `School Branch #${nextNum}`;
    const newSchool: ISchoolSurveyData = {
      id: nextId,
      schoolName: newSchoolName,
      schoolCategory: [],
      classes: [],
      streams: [],
      classroomCondition: [],
      parentIncomeGroup: [],
      parentProfessions: [],
      parentEducationLevel: [],
    };
    const nextList = [...schoolsList, newSchool];
    setActiveSchoolIndex(nextList.length - 1);
    setIsDropdownOpen(false);
    showFeedback('add', `"${newSchoolName}" added successfully`);

    onChange({
      ...value,
      schools: nextList,
      schoolName: nextList.map(s => s.schoolName).filter(Boolean).join('; '),
    });
  };

  const handleRemoveSchool = (idxToRemove: number) => {
    if (schoolsList.length <= 1) return;
    const deletedName = schoolsList[idxToRemove]?.schoolName || `School #${idxToRemove + 1}`;
    const nextList = schoolsList.filter((_, idx) => idx !== idxToRemove);
    const nextActive = activeSchoolIndex >= nextList.length ? nextList.length - 1 : activeSchoolIndex;
    setActiveSchoolIndex(nextActive);
    showFeedback('delete', `"${deletedName}" removed`);

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
    <div className="space-y-4 font-sans">
      
      {/* ── Professional Multi-School Selector & Search Bar ─────────────────────── */}
      <div className="bg-white p-3 rounded-2xl border border-[#b6e0e4] shadow-2xs space-y-2.5">
        
        {/* Main Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Left: Searchable Dropdown Trigger */}
          <div className="relative flex-1 min-w-0 max-w-lg">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#f0f8f9] hover:bg-[#e4f3f5] border border-[#b6e0e4] text-[#2d6b73] text-xs font-bold transition shadow-2xs cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <School className="w-4 h-4 text-[#3a7d84] shrink-0" />
                <span className="truncate font-heading">
                  {currentSchool.schoolName || `School Branch #${activeSchoolIndex + 1}`}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-white border border-[#b6e0e4] text-[#3a7d84] shrink-0">
                  #{activeSchoolIndex + 1} of {schoolsList.length}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 text-[#3a7d84]">
                <Search className="w-3.5 h-3.5 opacity-60" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)} 
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-[#b6e0e4] shadow-xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Search Input inside Dropdown */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      value={schoolSearchQuery}
                      onChange={(e) => setSchoolSearchQuery(e.target.value)}
                      placeholder="Search school by name, code or city..."
                      className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] font-medium"
                    />
                    {schoolSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSchoolSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* School List */}
                  <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                    {filteredSchools.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 font-medium">
                        No schools found matching &ldquo;{schoolSearchQuery}&rdquo;
                      </div>
                    ) : (
                      filteredSchools.map(({ school, originalIndex }) => {
                        const isSelected = originalIndex === activeSchoolIndex;
                        return (
                          <div
                            key={school.id || originalIndex}
                            onClick={() => {
                              setActiveSchoolIndex(originalIndex);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl text-xs transition cursor-pointer select-none ${
                              isSelected
                                ? 'bg-[#f0f8f9] text-[#2d6b73] font-bold border border-[#b6e0e4]'
                                : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-5 h-5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#3a7d84] text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {originalIndex + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold">
                                  {school.schoolName || `School Branch #${originalIndex + 1}`}
                                </p>
                                {school.pocName && (
                                  <p className="text-[10px] text-slate-400 truncate">
                                    POC: {school.pocName}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#3a7d84]" />}
                              {schoolsList.length > 1 && !disabled && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSchoolToDelete(originalIndex);
                                    setIsDropdownOpen(false);
                                  }}
                                  className="p-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                                  title="Delete this school"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer Action */}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={handleAddSchool}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#3a7d84] hover:bg-[#2c5f64] text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New School Branch</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Actions: School count badge + Add & Delete buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2.5 py-1.5 rounded-xl">
              Total: <strong>{schoolsList.length}</strong> {schoolsList.length === 1 ? 'School' : 'Schools'}
            </span>

            {!disabled && (
              <button
                type="button"
                onClick={handleAddSchool}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3a7d84] hover:bg-[#2c5f64] active:scale-95 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add School</span>
              </button>
            )}

            {schoolsList.length > 1 && !disabled && (
              <button
                type="button"
                onClick={() => setSchoolToDelete(activeSchoolIndex)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition cursor-pointer"
                title="Delete current school"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Tabs Row (Horizontal scrollable pills for direct switching) */}
        <div className="bg-slate-50/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-thin border border-slate-200/80 mt-2">
          {schoolsList.map((school, idx) => {
            const isActive = idx === activeSchoolIndex;
            return (
              <div
                key={school.id || idx}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer shrink-0 select-none border ${
                  isActive
                    ? 'bg-white text-[#2d6b73] border-[#51a8b1]/60 shadow-sm ring-2 ring-[#51a8b1]/20 font-bold'
                    : 'bg-transparent hover:bg-white/80 text-slate-600 border-transparent hover:border-slate-200 font-medium'
                }`}
                onClick={() => setActiveSchoolIndex(idx)}
              >
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  isActive ? 'bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  #{idx + 1}
                </span>
                <span className="max-w-[280px] sm:max-w-[380px] truncate text-slate-800" title={school.schoolName || `School #${idx + 1}`}>
                  {school.schoolName || `School #${idx + 1}`}
                </span>
                {schoolsList.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSchoolToDelete(idx);
                    }}
                    className="p-0.5 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all ml-0.5 cursor-pointer"
                    title="Delete School"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Action Feedback Notification Toast */}
        {actionFeedback && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-top-1 duration-200 border transition-all"
            style={{
              backgroundColor: actionFeedback.type === 'add' ? '#f0f8f9' : '#fff1f2',
              borderColor: actionFeedback.type === 'add' ? '#b6e0e4' : '#fecdd3',
              color: actionFeedback.type === 'add' ? '#2d6b73' : '#be123c',
            }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {actionFeedback.type === 'add' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3a7d84] shrink-0" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span className="truncate">{actionFeedback.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="p-0.5 rounded hover:opacity-75 transition cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* ── Delete School Confirmation Modal ─────────────────────── */}
      {schoolToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 animate-in bounce-in duration-300">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Delete School Information?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-900 font-semibold">{schoolsList[schoolToDelete]?.schoolName || `School #${schoolToDelete + 1}`}</strong>? All survey details for this school will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemoveSchool(schoolToDelete);
                  setSchoolToDelete(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active School Survey Form Container (Smooth Cross-fade Transition) ─────────────────── */}
      <div 
        key={currentSchool.id || `school-form-${activeSchoolIndex}`}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 transition-all"
      >

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

              {/* 1.3 Classes & Stream Combinations Dropdown Selection */}
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-heading">
                    <BookOpen className="w-4 h-4 text-[#51a8b1]" />
                    1.3 Offered Classes &amp; Streams Selection
                  </label>
                  {!disabled && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateCurrentSchool({ classes: LMS_CLASS_OPTIONS.map(opt => opt.name) })}
                        className="text-[11px] font-bold text-[#3a7d84] bg-[#f0f8f9] hover:bg-[#e0f3f5] border border-[#b6e0e4] px-2.5 py-0.5 rounded-lg transition cursor-pointer"
                      >
                        Select All
                      </button>
                      {toArray(currentSchool.classes).length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleUpdateCurrentSchool({ classes: [] })}
                          className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-[#3a7d84] bg-white px-2 py-0.5 rounded-md border border-[#b6e0e4]">
                        {toArray(currentSchool.classes).length} selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Compact Dropdown Trigger */}
                <div className="relative" ref={classDropdownRef}>
                  <div
                    onClick={() => {
                      if (!disabled) setClassDropdownOpen((prev) => !prev);
                    }}
                    className={`min-h-[42px] w-full p-2 bg-slate-50 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                      classDropdownOpen 
                        ? 'bg-white border-[#51a8b1] ring-2 ring-[#51a8b1]/20' 
                        : 'border-slate-200 hover:border-[#51a8b1] hover:bg-white'
                    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {/* Selected Tags inside the input or placeholder */}
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                      {toArray(currentSchool.classes).length === 0 ? (
                        <span className="text-xs text-slate-400 font-normal pl-1">
                          Click to select classes &amp; stream combinations...
                        </span>
                      ) : (
                        toArray(currentSchool.classes).map((cls) => {
                          const matchingOpt = LMS_CLASS_OPTIONS.find(
                            opt => opt.name.toLowerCase() === String(cls).toLowerCase() || opt.label.toLowerCase() === String(cls).toLowerCase()
                          );
                          return (
                            <span
                              key={String(cls)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border shadow-2xs ${
                                matchingOpt?.pillColor || 'bg-[#e8f6f8] text-[#3a7d84] border-[#b6e0e4]'
                              }`}
                            >
                              <span>{matchingOpt?.label || cls}</span>
                              {!disabled && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const nextClasses = toArray(currentSchool.classes).filter(
                                      c => c.toLowerCase() !== String(cls).toLowerCase() && c.toLowerCase() !== matchingOpt?.name.toLowerCase()
                                    );
                                    handleUpdateCurrentSchool({ classes: nextClasses });
                                  }}
                                  className="w-3.5 h-3.5 rounded hover:bg-black/10 flex items-center justify-center transition cursor-pointer text-slate-500 hover:text-slate-800"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </span>
                          );
                        })
                      )}
                    </div>

                    {/* Right side dropdown toggle icon */}
                    <div className="flex items-center gap-1 text-slate-400 shrink-0 pr-1">
                      {classDropdownOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#51a8b1]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Absolute Floating Dropdown Menu */}
                  {classDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl border border-[#b6e0e4] shadow-xl p-3 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      {/* Search bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={classSearchQuery}
                          onChange={(e) => setClassSearchQuery(e.target.value)}
                          placeholder="Filter classes (e.g. 11 Science, Nursery, Class 5, 12 Arts...)"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#51a8b1]/30 focus:border-[#51a8b1] transition font-medium"
                          autoFocus
                        />
                        {classSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setClassSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Scrollable Class Options List */}
                      <div className="max-h-64 overflow-y-auto pr-1 space-y-2">
                        {classSearchQuery.trim() ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {LMS_CLASS_OPTIONS.filter(opt => 
                              opt.label.toLowerCase().includes(classSearchQuery.toLowerCase()) || 
                              opt.name.toLowerCase().includes(classSearchQuery.toLowerCase())
                            ).map((opt) => {
                              const isSelected = isClassOptionSelected(currentSchool.classes, opt);
                              return (
                                <button
                                  type="button"
                                  key={opt.id}
                                  onClick={() => {
                                    const currentArr = toArray(currentSchool.classes);
                                    const isSel = isClassOptionSelected(currentArr, opt);
                                    const nextArr = isSel
                                      ? currentArr.filter(c => c.toLowerCase() !== opt.name.toLowerCase() && c.toLowerCase() !== opt.label.toLowerCase())
                                      : [...currentArr, opt.name];
                                    handleUpdateCurrentSchool({ classes: nextArr });
                                  }}
                                  className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer select-none text-left shadow-2xs ${
                                    isSelected
                                      ? 'bg-[#3a7d84] text-white border-[#3a7d84] ring-1 ring-[#51a8b1]'
                                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#51a8b1] hover:bg-[#f0f8f9]'
                                  }`}
                                >
                                  <span className="truncate">{opt.label}</span>
                                  {isSelected ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            {/* Regular Nursery to Class 10 */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                              {LMS_CLASS_OPTIONS.filter(opt => !opt.id.startsWith('c11') && !opt.id.startsWith('c12')).map((opt) => {
                                const isSelected = isClassOptionSelected(currentSchool.classes, opt);
                                return (
                                  <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => {
                                      const currentArr = toArray(currentSchool.classes);
                                      const isSel = isClassOptionSelected(currentArr, opt);
                                      const nextArr = isSel
                                        ? currentArr.filter(c => c.toLowerCase() !== opt.name.toLowerCase() && c.toLowerCase() !== opt.label.toLowerCase())
                                        : [...currentArr, opt.name];
                                      handleUpdateCurrentSchool({ classes: nextArr });
                                    }}
                                    className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer select-none text-left shadow-2xs ${
                                      isSelected
                                        ? 'bg-[#3a7d84] text-white border-[#3a7d84] ring-1 ring-[#51a8b1]'
                                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#51a8b1] hover:bg-[#f0f8f9]'
                                    }`}
                                  >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                    ) : (
                                      <div className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Class 11 Row (Dedicated Next Line) */}
                            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between px-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Class 11 Streams
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {LMS_CLASS_OPTIONS.filter(opt => opt.id.startsWith('c11')).map((opt) => {
                                  const isSelected = isClassOptionSelected(currentSchool.classes, opt);
                                  return (
                                    <button
                                      type="button"
                                      key={opt.id}
                                      onClick={() => {
                                        const currentArr = toArray(currentSchool.classes);
                                        const isSel = isClassOptionSelected(currentArr, opt);
                                        const nextArr = isSel
                                          ? currentArr.filter(c => c.toLowerCase() !== opt.name.toLowerCase() && c.toLowerCase() !== opt.label.toLowerCase())
                                          : [...currentArr, opt.name];
                                        handleUpdateCurrentSchool({ classes: nextArr });
                                      }}
                                      className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer select-none text-left shadow-2xs ${
                                        isSelected
                                          ? 'bg-[#3a7d84] text-white border-[#3a7d84] ring-1 ring-[#51a8b1]'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#51a8b1] hover:bg-[#f0f8f9]'
                                      }`}
                                    >
                                      <span className="truncate">{opt.label}</span>
                                      {isSelected ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Class 12 Row (Dedicated Next Line) */}
                            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                              <div className="flex items-center justify-between px-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Class 12 Streams
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {LMS_CLASS_OPTIONS.filter(opt => opt.id.startsWith('c12')).map((opt) => {
                                  const isSelected = isClassOptionSelected(currentSchool.classes, opt);
                                  return (
                                    <button
                                      type="button"
                                      key={opt.id}
                                      onClick={() => {
                                        const currentArr = toArray(currentSchool.classes);
                                        const isSel = isClassOptionSelected(currentArr, opt);
                                        const nextArr = isSel
                                          ? currentArr.filter(c => c.toLowerCase() !== opt.name.toLowerCase() && c.toLowerCase() !== opt.label.toLowerCase())
                                          : [...currentArr, opt.name];
                                        handleUpdateCurrentSchool({ classes: nextArr });
                                      }}
                                      className={`flex items-center justify-between gap-1.5 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer select-none text-left shadow-2xs ${
                                        isSelected
                                          ? 'bg-[#3a7d84] text-white border-[#3a7d84] ring-1 ring-[#51a8b1]'
                                          : 'bg-white text-slate-700 border-slate-200 hover:border-[#51a8b1] hover:bg-[#f0f8f9]'
                                      }`}
                                    >
                                      <span className="truncate">{opt.label}</span>
                                      {isSelected ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-md border border-slate-300 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Dropdown Footer with Done button */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {toArray(currentSchool.classes).length} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setClassDropdownOpen(false)}
                          className="text-xs font-bold text-white bg-[#3a7d84] hover:bg-[#2d6268] px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
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
