export interface EffectiveSchoolItem {
  id: string;
  name: string;
  address?: string;
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
  fallbackTitle = 'Primary School / Institution'
): EffectiveSchoolItem[] {
  if (Array.isArray(schools) && schools.length > 0) {
    return schools.map((s, idx) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || `School Branch #${idx + 1}`,
      address: s.address || '',
    }));
  }

  const fromAllForm =
    allFormData?.orderRequirement?.schoolInformation?.schools || allFormData?.schools;
  if (Array.isArray(fromAllForm) && fromAllForm.length > 0) {
    return fromAllForm.map((s: any, idx: number) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || `School Branch #${idx + 1}`,
      address: s.address || '',
    }));
  }

  if (Array.isArray(value?.schools) && value.schools.length > 0) {
    return value.schools.map((s: any, idx: number) => ({
      id: s.id || `school-${idx + 1}`,
      name: s.schoolName || s.name || `School Branch #${idx + 1}`,
      address: s.address || '',
    }));
  }

  const fallbackName =
    allFormData?.schoolName ||
    allFormData?.orderRequirement?.schoolInformation?.schoolName ||
    value?.schoolName ||
    fallbackTitle;

  return [{ id: 'school-1', name: fallbackName, address: allFormData?.address || '' }];
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
