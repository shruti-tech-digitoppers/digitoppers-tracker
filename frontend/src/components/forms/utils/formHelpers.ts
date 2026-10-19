export interface EffectiveSchoolItem {
  id: string;
  _id?: string;
  schoolId?: string;
  name: string;
  address?: string;
  district?: string;
  classes?: string[];
  pocName?: string;
  contactPerson?: string;
  principalName?: string;
  principalDetails?: string;
  pocDesignation?: string;
  schoolCode?: string;
  pocContact?: string;
  contactPhone?: string;
  phone?: string;
  survey?: any;
  school?: any;
  training?: any;
  installation?: any;
  trainers?: any[];
  technicalPersonName?: string;
  technicalPersonId?: string;
  contactNumber?: string;
  planOutDate?: string;
}

export const DEFAULT_SOLUTIONS = [
  { key: 'STEM_LAB', label: 'STEM Lab', icon: '🔬', desc: 'Hands-on STEM and science innovation models' },
  { key: 'ASTRONOMY', label: 'Astronomy Lab', icon: '🔭', desc: 'Telescopes, planetarium & space learning kits' },
  { key: 'LANGUAGE', label: 'Language Lab', icon: '🗣️', desc: 'Digital English & multilingual audio-visual lab' },
  { key: 'SCIENCE_LEARNING', label: 'Science Learning Kit', icon: '🧪', desc: 'Curriculum-mapped hands-on science experiments' },
  { key: 'EPATHSHALA', label: 'ePathshala', icon: '💻', desc: 'Digital LMS, interactive smart curriculum & content' },
  { key: 'ROBOTICS', label: 'Robotics Lab', icon: '🤖', desc: 'Coding, AI, IoT and robotics modular kits' },
  { key: 'SMART_SHAALA', label: 'Smart Shaala', icon: '🏫', desc: 'Interactive smart class flat panels & devices' },
];

export const DEFAULT_HARDWARE_ITEMS = [
  { key: 'IFP', label: 'IFP', icon: '🖥️', desc: 'Interactive Flat Panel Touch Display' },
  { key: 'OPS', label: 'OPS', icon: '💻', desc: 'Open Pluggable Specification PC Module' },
  { key: 'PENDRIVE', label: 'Pendrive', icon: '💾', desc: 'USB Flash Storage Drive' },
  { key: 'SD_CARD', label: 'Sd Card', icon: '🎴', desc: 'Micro SD / Memory Card' },
  { key: 'CHARGING_TROLLEY', label: 'Charging Trolley', icon: '🔋', desc: 'Lockable Smart Device Charging Trolley' },
  { key: 'ANDROID_LAPTOP', label: 'Android laptop', icon: '💻', desc: 'Android OS Laptop Device' },
  { key: 'TABLET', label: 'Tablet', icon: '📱', desc: 'Digital Learning Touch Tablet' },
  { key: 'SCHOOL_BELL_PRO', label: 'School Bell Pro', icon: '🔔', desc: 'Automated Smart School Bell System' },
  { key: 'AR_VR', label: 'AR VR', icon: '🥽', desc: 'Augmented & Virtual Reality Headsets / Kit' },
  { key: 'STEM_KIT', label: 'Stem Kit', icon: '🔬', desc: 'Hands-on STEM Innovation & Experiment Kit' },
  { key: 'ASTRONOMY_KIT', label: 'Astronomy Kit', icon: '🔭', desc: 'Telescope & Space Observation Kit' },
  { key: 'COMPUTER_SYSTEM', label: 'Computer System', icon: '🖥️', desc: 'Desktop CPU & Monitor Setup' },
  { key: 'CAMERA', label: 'Camera', icon: '📷', desc: 'Classroom Recording & Streaming Camera' },
  { key: 'WIRELESS_KEYBOARD_MOUSE', label: 'Wireless Keyboard Mouse', icon: '⌨️', desc: 'Wireless Keyboard & Mouse Combo' },
  { key: 'PODIUM', label: 'Podium', icon: '🎙️', desc: 'Digital Smart Teacher Presentation Podium' },
  { key: 'UPS', label: 'UPS', icon: '⚡', desc: 'Uninterruptible Power Supply Backup Unit' },
  { key: 'AIO', label: 'AIO', icon: '🖥️', desc: 'All-in-One Touch Desktop PC' },
  { key: 'INVERTOR', label: 'Invertor', icon: '🔌', desc: 'Power Backup Inverter Unit' },
  { key: 'BATTERY', label: 'Battery', icon: '🔋', desc: 'Power Backup Storage Battery' },
];

import {
  MASTER_GRADES,
  ALL_GRADE_NAMES,
  PRIMARY_GRADE_NAMES,
  MIDDLE_GRADE_NAMES,
  SECONDARY_GRADE_NAMES,
  CLASS_11_GRADE_NAMES,
  CLASS_12_GRADE_NAMES,
  SR_SECONDARY_GRADE_NAMES,
} from '@/types/grade';

export const FOUNDATIONAL_CLASSES = PRIMARY_GRADE_NAMES; // ['1', '2', '3', '4', '5']
export const MIDDLE_CLASSES = [...MIDDLE_GRADE_NAMES, ...SECONDARY_GRADE_NAMES]; // ['6', '7', '8', '9', '10']
export const CLASS_11_STREAMS = CLASS_11_GRADE_NAMES; // ['11 Science', '11 Commerce', '11 Arts']
export const CLASS_12_STREAMS = CLASS_12_GRADE_NAMES; // ['12 Science', '12 Commerce', '12 Arts']
export const ALL_CLASSES = ALL_GRADE_NAMES; // 16 Grades matching DB model

export const BOARD_OPTIONS = [
  'CBSE',
  'ICSE / ISC',
  'State Board',
  'Cambridge (IGCSE)',
  'IB (International Baccalaureate)',
  'Other / Custom'
];

export function getClassPreset(presetType: string): string[] {
  switch (presetType) {
    case 'PRIMARY':
      return PRIMARY_GRADE_NAMES;
    case 'MIDDLE':
      return MIDDLE_GRADE_NAMES;
    case 'SECONDARY':
      return SECONDARY_GRADE_NAMES;
    case 'SCIENCE_11_12':
      return ['11 Science', '12 Science'];
    case 'COMMERCE_11_12':
      return ['11 Commerce', '12 Commerce'];
    case 'HUMANITIES_11_12':
      return ['11 Arts', '12 Arts'];
    case 'SR_SECONDARY':
      return SR_SECONDARY_GRADE_NAMES;
    case 'ALL':
      return ALL_GRADE_NAMES;
    case 'CLEAR':
      return [];
    default:
      return [];
  }
}

/**
 * Standard utility to extract normalized list of schools with ID, Name, and Address
 * from various form structures across the project tracker.
 */
export function extractEffectiveSchools(
  schools?: any[],
  allFormData?: Record<string, any>,
  value?: any,
  fallbackTitle = 'Untitled School'
): EffectiveSchoolItem[] {
  // Helper to extract fields from a raw school object
  const mapSchool = (s: any, idx: number, totalLen: number): EffectiveSchoolItem => {
    // If s is a ProjectSchools deployment unit, s.school is the primary School reference
    const schoolRefId = s.school?._id || s.school;
    const resolvedId = String(schoolRefId || s.id || s._id || s.schoolId || `school-${idx + 1}`);

    const sSurvey = s.survey || {};
    const principalName =
      s.principalName ||
      sSurvey.principalName ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.name : '') ||
      '';

    const schoolCode = s.schoolCode || s.code || '';

    const poc =
      s.pocName ||
      sSurvey.pocName ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.name : (typeof s.contactPerson === 'string' ? s.contactPerson : '')) ||
      principalName ||
      '';

    const phone =
      s.pocContact ||
      s.contactPhone ||
      s.phone ||
      sSurvey.pocContact ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.phone : '') ||
      '';

    const desig =
      s.pocDesignation ||
      sSurvey.pocDesignation ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.designation : '') ||
      (principalName ? 'Principal' : '');

    const contactPersonStr = typeof s.contactPerson === 'object' ? s.contactPerson?.name : (s.contactPerson || poc);
    const contactPhoneStr = typeof s.contactPerson === 'object' ? s.contactPerson?.phone : (s.contactPhone || phone);

    return {
      id: resolvedId,
      _id: s._id ? String(s._id) : undefined,
      schoolId: s.schoolId ? String(s.schoolId) : undefined,
      name: s.schoolName || s.name || (totalLen > 1 ? `School ${idx + 1}` : 'School'),
      address: s.address || s.addressContact || sSurvey.address || '',
      classes: s.classes || sSurvey.classes || [],
      principalName,
      principalDetails: s.principalDetails || sSurvey.principalDetails || '',
      pocName: poc,
      pocDesignation: desig,
      contactPerson: contactPersonStr,
      schoolCode: schoolCode,
      pocContact: phone,
      contactPhone: contactPhoneStr,
      phone: phone,
      survey: sSurvey,
      school: s.school,
      training: s.training,
      installation: s.installation,
      trainers: s.trainers || s.training?.trainers,
      technicalPersonName: s.technicalPersonName || s.training?.trainerName || s.installation?.assignedEngineerName,
      technicalPersonId: s.technicalPersonId || s.training?.trainer || s.training?.assignedTrainerId || s.installation?.assignedEngineer,
      contactNumber: s.contactNumber || s.training?.trainerPhone,
      planOutDate: s.planOutDate || s.training?.planOutDate || s.training?.trainingDate,
    };
  };

  // 1. Direct schools array prop
  if (Array.isArray(schools) && schools.length > 0) {
    return schools.map((s, idx) => mapSchool(s, idx, schools.length));
  }

  // 2. allFormData?.stage3Schools
  if (Array.isArray(allFormData?.stage3Schools) && allFormData.stage3Schools.length > 0) {
    return allFormData.stage3Schools.map((s: any, idx: number) => mapSchool(s, idx, allFormData.stage3Schools.length));
  }

  // 3. allFormData?.schools
  if (Array.isArray(allFormData?.schools) && allFormData.schools.length > 0) {
    return allFormData.schools.map((s: any, idx: number) => mapSchool(s, idx, allFormData.schools.length));
  }

  // 4. allFormData?.projectSchools
  if (Array.isArray(allFormData?.projectSchools) && allFormData.projectSchools.length > 0) {
    return allFormData.projectSchools.map((s: any, idx: number) => mapSchool(s, idx, allFormData.projectSchools.length));
  }

  // 5. allFormData?.orderRequirement?.schoolInformation?.schools
  const fromAllForm =
    allFormData?.orderRequirement?.schoolInformation?.schools ||
    allFormData?.project?.orderRequirement?.schoolInformation?.schools ||
    allFormData?.project?.schools;
  if (Array.isArray(fromAllForm) && fromAllForm.length > 0) {
    return fromAllForm.map((s: any, idx: number) => mapSchool(s, idx, fromAllForm.length));
  }

  // 6. value?.schools
  if (Array.isArray(value?.schools) && value.schools.length > 0) {
    return value.schools.map((s: any, idx: number) => mapSchool(s, idx, value.schools.length));
  }

  // Return empty list if no schools exist in DB/props (no fake random data)
  return [];
}

export function normalizeOption(opt: any): { value: string; label: string } {
  if (typeof opt === 'string') return { value: opt, label: opt };
  if (typeof opt === 'object' && opt !== null) {
    return {
      value: String(opt.value ?? opt.key ?? opt),
      label: String(opt.label ?? opt.name ?? opt.value ?? opt),
    };
  }
  return { value: String(opt), label: String(opt) };
}

const NON_HARDWARE_FIELD_KEYS = new Set([
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
  'stockCheck'
]);

export function extractEffectiveHardwareItems(
  allFormData: Record<string, any> = {},
  value?: any,
  project?: any
): Record<string, { itemName: string; quantity: number; specNotes: string; schoolBreakdown?: any[] }> {
  // 1. First priority: schoolWiseHardware (from project / stage3 / orderRequirement)
  const rawSchoolWise =
    allFormData?.schoolWiseHardware ||
    allFormData?.hardwareRequirements?.schoolWiseHardware ||
    allFormData?.stage3SchoolWiseHardware ||
    allFormData?.stage3HardwareData?.schoolWiseHardware ||
    allFormData?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
    project?.orderRequirement?.hardwareRequirement?.schoolWiseHardware ||
    project?.orderRequirement?.schoolWiseHardware ||
    value?.schoolWiseHardware;

  const result: Record<string, { itemName: string; quantity: number; specNotes: string; schoolBreakdown?: any[] }> = {};

  // Build a lookup map of schoolId -> friendly schoolName
  const effectiveSchools = extractEffectiveSchools(undefined, allFormData, value, project?.projectName || project?.title);
  const schoolNameMap = new Map<string, string>();
  effectiveSchools.forEach((s) => {
    if (s.id) schoolNameMap.set(s.id, s.name);
  });

  if (rawSchoolWise) {
    if (Array.isArray(rawSchoolWise)) {
      rawSchoolWise.forEach((schObj: any) => {
        const schId = schObj.id || schObj.schoolId || '';
        const schName = schObj.schoolName || schObj.name || (schId ? schoolNameMap.get(schId) : '') || 'School';
        const hwMap = schObj.hardware || schObj.items || {};
        Object.entries(hwMap).forEach(([hwKey, hwVal]: [string, any]) => {
          if (NON_HARDWARE_FIELD_KEYS.has(hwKey)) return;
          const qty = Number(hwVal?.quantity || hwVal?.qty || 1);
          const spec = hwVal?.specs || hwVal?.specNotes || hwVal?.specifications || '';
          const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === hwKey || d.label === hwKey);
          const name = defObj?.label || hwKey;
          if (!result[hwKey]) {
            result[hwKey] = { itemName: name, quantity: 0, specNotes: spec, schoolBreakdown: [] };
          }
          result[hwKey].quantity += qty;
          if (spec && !result[hwKey].specNotes) result[hwKey].specNotes = spec;
          result[hwKey].schoolBreakdown?.push({
            schoolId: schId,
            schoolName: schName,
            quantity: qty,
            specs: spec,
            serialNotes: hwVal?.serialNotes || '',
            solutionName: hwVal?.solutionName || hwVal?.solutionKey || ''
          });
        });
      });
    } else if (typeof rawSchoolWise === 'object') {
      Object.entries(rawSchoolWise).forEach(([schoolId, hwMap]: [string, any]) => {
        if (hwMap && typeof hwMap === 'object') {
          const schName = schoolNameMap.get(schoolId) || (schoolId.startsWith('SCH-') && effectiveSchools[0] ? effectiveSchools[0].name : schoolId);
          Object.entries(hwMap).forEach(([hwKey, hwVal]: [string, any]) => {
            if (NON_HARDWARE_FIELD_KEYS.has(hwKey)) return;
            const qty = Number(hwVal?.quantity || hwVal?.qty || 1);
            const spec = hwVal?.specNotes || hwVal?.specs || hwVal?.specifications || '';
            const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === hwKey || d.label === hwKey);
            const name = defObj?.label || hwKey;
            if (!result[hwKey]) {
              result[hwKey] = { itemName: name, quantity: 0, specNotes: spec, schoolBreakdown: [] };
            }
            result[hwKey].quantity += qty;
            if (spec && !result[hwKey].specNotes) result[hwKey].specNotes = spec;
            result[hwKey].schoolBreakdown?.push({
              schoolId,
              schoolName: schName,
              quantity: qty,
              specs: spec,
              serialNotes: hwVal?.serialNotes || '',
              solutionName: hwVal?.solutionName || hwVal?.solutionKey || ''
            });
          });
        }
      });
    }
    if (Object.keys(result).length > 0) return result;
  }

  // 2. Fallback: items map from hardwareRequirements (excluding non-hardware fields)
  const flatItems =
    allFormData?.stage3HardwareItems ||
    allFormData?.hardwareRequirements?.items ||
    allFormData?.hardware?.items ||
    (value?.stockCheck?.items && typeof value.stockCheck.items === 'object' ? value.stockCheck.items : null) ||
    (value?.items && typeof value.items === 'object' ? value.items : null);

  if (flatItems && typeof flatItems === 'object' && Object.keys(flatItems).length > 0) {
    Object.entries(flatItems).forEach(([k, v]: [string, any]) => {
      if (NON_HARDWARE_FIELD_KEYS.has(k)) return;
      if (typeof v !== 'object' || v === null || Array.isArray(v)) return;
      const defObj = DEFAULT_HARDWARE_ITEMS.find((d) => d.key === k || d.label === k);
      result[k] = {
        itemName: defObj?.label || k,
        quantity: Number(v?.quantity) || 1,
        specNotes: v?.specNotes || '',
        schoolBreakdown: v?.schoolBreakdown || []
      };
    });
    return result;
  }

  return {};
}
