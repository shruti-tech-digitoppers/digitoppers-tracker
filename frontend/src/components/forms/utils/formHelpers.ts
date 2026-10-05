export interface EffectiveSchoolItem {
  id: string;
  name: string;
  address?: string;
  classes?: string[];
  pocName?: string;
  contactPerson?: string;
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

export const FOUNDATIONAL_CLASSES = [
  'Pre-Primary',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5'
];

export const MIDDLE_CLASSES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10'
];

export const CLASS_11_STREAMS = [
  'Class 11 (Science - PCM)',
  'Class 11 (Science - PCB)',
  'Class 11 (Commerce)',
  'Class 11 (Humanities/Arts)',
  'Class 11 (Vocational/IT)'
];

export const CLASS_12_STREAMS = [
  'Class 12 (Science - PCM)',
  'Class 12 (Science - PCB)',
  'Class 12 (Commerce)',
  'Class 12 (Humanities/Arts)',
  'Class 12 (Vocational/IT)'
];

export const ALL_CLASSES = [
  ...FOUNDATIONAL_CLASSES,
  ...MIDDLE_CLASSES,
  ...CLASS_11_STREAMS,
  ...CLASS_12_STREAMS
];

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
      return ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
    case 'MIDDLE':
      return ['Class 6', 'Class 7', 'Class 8'];
    case 'SECONDARY':
      return ['Class 9', 'Class 10'];
    case 'SCIENCE_11_12':
      return [
        'Class 11 (Science - PCM)',
        'Class 11 (Science - PCB)',
        'Class 12 (Science - PCM)',
        'Class 12 (Science - PCB)',
      ];
    case 'COMMERCE_11_12':
      return ['Class 11 (Commerce)', 'Class 12 (Commerce)'];
    case 'HUMANITIES_11_12':
      return ['Class 11 (Humanities/Arts)', 'Class 12 (Humanities/Arts)'];
    case 'SR_SECONDARY':
      return [...CLASS_11_STREAMS, ...CLASS_12_STREAMS];
    case 'ALL':
      return ALL_CLASSES;
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
  // 1. Direct schools array prop
  if (Array.isArray(schools) && schools.length > 0) {
    return schools.map((s, idx) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || (schools.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School'),
      address: s.address || s.addressContact || '',
      classes: s.classes || [],
      pocName: s.pocName || s.contactPerson || '',
    }));
  }

  // 2. allFormData?.stage3Schools
  if (Array.isArray(allFormData?.stage3Schools) && allFormData.stage3Schools.length > 0) {
    return allFormData.stage3Schools.map((s: any, idx: number) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || (allFormData.stage3Schools.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School'),
      address: s.address || s.addressContact || '',
      classes: s.classes || [],
      pocName: s.pocName || s.contactPerson || '',
    }));
  }

  // 3. allFormData?.schools or orderRequirement.schoolInformation.schools
  const fromAllForm =
    allFormData?.schools ||
    allFormData?.orderRequirement?.schoolInformation?.schools ||
    allFormData?.project?.orderRequirement?.schoolInformation?.schools;
  if (Array.isArray(fromAllForm) && fromAllForm.length > 0) {
    return fromAllForm.map((s: any, idx: number) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || (fromAllForm.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School'),
      address: s.address || s.addressContact || '',
      classes: s.classes || [],
      pocName: s.pocName || s.contactPerson || '',
    }));
  }

  // 4. value?.schools
  if (Array.isArray(value?.schools) && value.schools.length > 0) {
    return value.schools.map((s: any, idx: number) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || (value.schools.length > 1 ? `Untitled School ${idx + 1}` : 'Untitled School'),
      address: s.address || s.addressContact || '',
      classes: s.classes || [],
      pocName: s.pocName || s.contactPerson || '',
    }));
  }

  const fallbackName =
    allFormData?.schoolName ||
    allFormData?.orderRequirement?.schoolInformation?.schoolName ||
    allFormData?.project?.orderRequirement?.schoolInformation?.schoolName ||
    value?.schoolName ||
    fallbackTitle;

  return [{ 
    id: 'school-1', 
    name: fallbackName, 
    address: allFormData?.address || allFormData?.addressContact || '',
    classes: allFormData?.classes || [],
    pocName: allFormData?.pocName || allFormData?.contactPerson || '',
  }];
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
