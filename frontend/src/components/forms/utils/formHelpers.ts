export * from '@/constants/platforms.constants';

export interface EffectiveSchoolItem {
  id: string;
  _id?: string;
  schoolId?: string;
  name: string;
  address?: string;
  district?: string;
  state?: string;
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
  email?: string;
  block?: string;
  city?: string;
  numberOfStudents?: number;
  numberOfTeachers?: number;
  coordinatorId?: string;
  rawSchool?: any;
  pocType?: string;
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

    const rawPocStr = typeof s.pocContact === 'string' ? s.pocContact : '';
    const rawPrincStr = typeof s.principalDetails === 'string' ? s.principalDetails : '';
    const fullContactContext = `${rawPocStr} ${rawPrincStr} ${typeof s.contactPerson === 'string' ? s.contactPerson : ''}`;

    // ── Checkpoint: Strict Phone Extraction (ONLY pure phone digits) ──
    const phoneCandidate =
      s.phone ||
      s.contactPhone ||
      s.pocContactPhone ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.phone : '') ||
      sSurvey.phone ||
      '';
    const phoneLabeled = `${phoneCandidate} ${fullContactContext}`.match(/(?:Mobile|Phone|Tel|Cell|Contact)[\s:|-]*(\+?\d[\d\s-]{8,14}\d)/i);
    let cleanPhone = '';
    if (phoneLabeled && phoneLabeled[1]) {
      const digits = phoneLabeled[1].replace(/\D/g, '');
      cleanPhone = digits.length > 10 && digits.startsWith('91') ? digits.slice(2) : (digits.length >= 10 ? digits.slice(-10) : digits);
    } else {
      const phoneDigitsMatch = `${phoneCandidate} ${fullContactContext}`.match(/(?:\+91[\s-]?)?([6-9]\d{4}[\s-]?\d{5})/);
      if (phoneDigitsMatch && phoneDigitsMatch[1]) {
        cleanPhone = phoneDigitsMatch[1].replace(/\D/g, '');
      }
    }
    const phone = cleanPhone; // Strictly numbers only, never metadata or names

    const desig =
      s.pocDesignation ||
      sSurvey.pocDesignation ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.designation : '') ||
      (principalName ? 'Principal' : '');

    const contactPersonStr = typeof s.contactPerson === 'object' ? s.contactPerson?.name : (s.contactPerson || poc);
    const contactPhoneStr = typeof s.contactPerson === 'object' ? s.contactPerson?.phone : (s.contactPhone || phone);

    // ── Checkpoint: Strict Email Extraction (ONLY valid email) ──
    const emailCandidate =
      s.email ||
      s.contactEmail ||
      (typeof s.contactPerson === 'object' ? s.contactPerson?.email : '') ||
      sSurvey.email ||
      '';
    const emailMatch = `${emailCandidate} ${fullContactContext}`.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const email = emailMatch ? emailMatch[1].toLowerCase().trim() : '';

    // ── Checkpoint: Strict Block Extraction ──
    let block = '';
    if (s.block && typeof s.block === 'string' && s.block.trim().length <= 35 && !s.block.includes('@') && !s.block.includes('|')) {
      block = s.block.trim();
    } else if (s.blockName && typeof s.blockName === 'string' && s.blockName.trim().length <= 35) {
      block = s.blockName.trim();
    } else {
      const fullAddr = s.address || s.addressContact || sSurvey.address || '';
      const blockMatch = fullAddr.match(/(Sector\s*\d+[A-Za-z]?|Knowledge\s*Park(?:\s*[IVXLCDM]+)?|Block\s*[A-Za-z0-9]+)/i);
      if (blockMatch) {
        block = blockMatch[1].trim();
      } else if (s.district && s.district.length <= 30 && !s.district.includes('@')) {
        block = s.district.trim();
      }
    }

    // ── Checkpoint: Strict City Extraction ──
    let city = '';
    if (s.city && typeof s.city === 'string' && s.city.trim().length <= 30 && !s.city.includes('@') && !s.city.includes('|')) {
      city = s.city.trim();
    } else {
      const fullAddr = (s.address || s.addressContact || sSurvey.address || '').toLowerCase();
      if (fullAddr.includes('greater noida')) city = 'Greater Noida';
      else if (fullAddr.includes('noida')) city = 'Noida';
      else if (fullAddr.includes('jaipur')) city = 'Jaipur';
      else if (fullAddr.includes('delhi')) city = 'Delhi';
      else if (fullAddr.includes('gurugram') || fullAddr.includes('gurgaon')) city = 'Gurugram';
      else if (s.district && s.district.length <= 30 && !s.district.includes('@')) city = s.district.trim();
    }

    // ── Checkpoint: Numbers only ──
    const numberOfStudents = Math.max(0, parseInt(String(
      s.numberOfStudents || s.studentCount || s.totalStudents || sSurvey.numberOfStudents || sSurvey.totalStudents || 0
    ).replace(/\D/g, ''), 10) || 0);

    const numberOfTeachers = Math.max(0, parseInt(String(
      s.numberOfTeachers || s.teacherCount || s.totalTeachers || sSurvey.numberOfTeachers || sSurvey.totalTeachers || 0
    ).replace(/\D/g, ''), 10) || 0);

    // ── Checkpoint: Coordinator ID only ──
    let coordinatorId = '';
    const rawCoord = s.coordinatorId || s.coordinator || sSurvey.coordinatorId || s.schoolId || s.schoolCode || s.code || '';
    if (rawCoord && typeof rawCoord === 'string' && rawCoord.trim().length <= 30 && !rawCoord.includes('@') && !rawCoord.includes(' ')) {
      coordinatorId = rawCoord.trim();
    } else {
      coordinatorId = `COORD-${idx + 1}`;
    }

    return {
      id: resolvedId,
      _id: s._id ? String(s._id) : undefined,
      schoolId: s.schoolId ? String(s.schoolId) : undefined,
      name: s.schoolName || s.name || (totalLen > 1 ? `School ${idx + 1}` : 'School'),
      address: s.address || s.addressContact || sSurvey.address || '',
      district: s.district || sSurvey.district || '',
      state: s.state || sSurvey.state || '',
      classes: s.classes || sSurvey.classes || [],
      principalName,
      principalDetails: s.principalDetails || sSurvey.principalDetails || '',
      pocName: poc,
      pocDesignation: desig,
      pocType: desig || (poc ? 'School Coordinator' : 'Coordinator'),
      contactPerson: contactPersonStr,
      schoolCode: schoolCode,
      pocContact: phone,
      contactPhone: contactPhoneStr,
      phone: phone,
      email,
      block,
      city,
      numberOfStudents,
      numberOfTeachers,
      coordinatorId,
      rawSchool: s,
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

  // 7. allFormData nested school objects (stage3SchoolData, schoolOnboardingInformation, schoolInformation)
  const nestedSchools =
    allFormData?.stage3SchoolData?.schools ||
    allFormData?.schoolOnboardingInformation?.schools ||
    allFormData?.schoolInformation?.schools;
  if (Array.isArray(nestedSchools) && nestedSchools.length > 0) {
    return nestedSchools.map((s: any, idx: number) => mapSchool(s, idx, nestedSchools.length));
  }

  // Return empty list if no genuine schools exist in DB/props (Strictly NO fake/synthesized fallbacks)
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
          const name = hwVal?.itemName || hwVal?.name || hwVal?.label || hwKey;
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
            const name = hwVal?.itemName || hwVal?.name || hwVal?.label || hwKey;
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
      result[k] = {
        itemName: v?.itemName || v?.name || v?.label || k,
        quantity: Number(v?.quantity) || 1,
        specNotes: v?.specNotes || '',
        schoolBreakdown: v?.schoolBreakdown || []
      };
    });
    return result;
  }

  // 3. Fallback: Auto-derive recommended hardware items from selected solutions (Stage 03 Solution Selection)
  const rawSchoolWiseSol =
    allFormData?.stage3SchoolWiseSolutions ||
    allFormData?.stage3SolutionsData?.schoolWiseSolutions ||
    allFormData?.stage3SolutionsData?.solutions?.schoolWiseSolutions ||
    allFormData?.solutions?.schoolWiseSolutions ||
    allFormData?.solutionSelection?.schoolWiseSolutions ||
    allFormData?.solutionSelection?.solutions?.schoolWiseSolutions ||
    allFormData?.orderRequirement?.solutionSelection?.schoolWiseSolutions ||
    allFormData?.orderRequirement?.solutionSelection?.solutions?.schoolWiseSolutions ||
    project?.orderRequirement?.solutionSelection?.schoolWiseSolutions ||
    project?.orderRequirement?.solutions?.schoolWiseSolutions ||
    value?.schoolWiseSolutions;

  const defaultHwSpecs: Record<string, { name: string; specs: string }> = {
    IFP_75: { name: '75" 4K UHD Interactive Flat Panel', specs: '75" 4K UHD Anti-Glare, 400 nits, Android 13, Dual Stylus' },
    IFP: { name: '75" 4K UHD Interactive Flat Panel', specs: '75" 4K UHD Anti-Glare, 400 nits, Android 13, Dual Stylus' },
    OPS_I5: { name: 'OPS Intel Core i5 PC Module', specs: 'OPS Intel Core i5 11th Gen, 8GB DDR4, 256GB NVMe SSD, Win 11 Pro' },
    OPS: { name: 'OPS Intel Core i5 PC Module', specs: 'OPS Intel Core i5 11th Gen, 8GB DDR4, 256GB NVMe SSD, Win 11 Pro' },
    WALL_MOUNT: { name: 'Heavy-Duty 75" IFP Fixed Wall Mount', specs: 'Cold-Rolled Steel Heavy-Duty Fixed Wall Mount (VESA 800x400)' },
    PENDRIVE: { name: '64GB Offline Curriculum USB Key', specs: '64GB USB 3.2 Gen 1 Metal Key, 150MB/s Read, Hardware Encrypted' },
    PENDRIVE_64: { name: '64GB Offline Curriculum USB Key', specs: '64GB USB 3.2 Gen 1 Metal Key, 150MB/s Read, Hardware Encrypted' },
    TABLET_10: { name: '10" Touch Student Tablet', specs: '10" FHD Octa-Core, 4GB RAM, 64GB, Rugged Bumper Case' },
    TABLET: { name: '10" Touch Student Tablet', specs: '10" FHD Octa-Core, 4GB RAM, 64GB, Rugged Bumper Case' },
    CHARGING_TROLLEY: { name: 'Smart Device Mobile Charging Trolley', specs: 'Mobile Charging Trolley for 30 Devices with Surge Protection' },
    ROBOTICS_KIT: { name: 'Modular Robotics & AI STEM Kit', specs: 'Modular STEM Kit with Micro-controllers, Sensors & Mechanics' },
    STEM_KIT: { name: 'Modular Robotics & AI STEM Kit', specs: 'Modular STEM Kit with Micro-controllers, Sensors & Mechanics' },
    ANDROID_LAPTOP: { name: 'Android Smart Educational Laptop', specs: '11.6" HD display, Octa-Core, 4GB RAM, 64GB eMMC' },
    COMPUTER_SYSTEM: { name: 'Desktop Computer System', specs: 'Desktop PC Core i5, 8GB RAM, 512GB SSD, 21.5" Monitor' },
    AR_VR: { name: 'AR/VR Educational Headset Kit', specs: 'Standalone 6DOF VR Headset with Educational Content' },
    CAMERA: { name: 'Full HD Classroom Conference Camera', specs: '1080p 60fps Wide Angle PTZ Auto-Tracking Camera' },
    PODIUM: { name: 'Digital Interactive Smart Podium', specs: 'Metallic Smart Podium with Built-in Touch Screen and Audio Amp' },
    SCHOOL_BELL_PRO: { name: 'Automated Smart School Bell System', specs: 'Programmable Digital School Bell with PA Integration' },
    WIRELESS_KEYBOARD_MOUSE: { name: 'Wireless Multimedia Keyboard & Mouse Combo', specs: '2.4GHz Wireless USB Dongle with Spill-Resistant Keys' },
    UPS: { name: 'Line Interactive 1KVA UPS', specs: '1KVA / 600W Line Interactive UPS with 15-20 Min Power Backup' }
  };

  const solutionHwMap: Record<string, string[]> = {
    SMART_SHAALA: ['IFP', 'OPS', 'WALL_MOUNT', 'PENDRIVE'],
    SMART_SHALA: ['IFP', 'OPS', 'WALL_MOUNT', 'PENDRIVE'],
    EPATHSHALA: ['TABLET', 'CHARGING_TROLLEY', 'PENDRIVE'],
    EPATHSHALA_LAB: ['TABLET', 'CHARGING_TROLLEY', 'PENDRIVE'],
    STEM_LAB: ['ROBOTICS_KIT', 'TABLET', 'CHARGING_TROLLEY'],
    ROBOTICS: ['ROBOTICS_KIT', 'TABLET'],
    ASTRONOMY: ['AR_VR', 'IFP'],
    LANGUAGE: ['TABLET', 'CHARGING_TROLLEY'],
    SCIENCE_LEARNING: ['STEM_KIT', 'IFP']
  };

  if (rawSchoolWiseSol && typeof rawSchoolWiseSol === 'object') {
    Object.entries(rawSchoolWiseSol).forEach(([schId, solVal]: [string, any]) => {
      const schName = schoolNameMap.get(schId) || schId;
      const activeSolutions: Array<{ key: string; quantity: number }> = [];

      if (Array.isArray(solVal)) {
        solVal.forEach((item: any) => {
          if (typeof item === 'string') {
            activeSolutions.push({ key: item, quantity: 1 });
          } else if (item && typeof item === 'object') {
            const sKey = item.solutionKey || item.key || item.name;
            if (sKey) {
              activeSolutions.push({ key: sKey, quantity: Number(item.quantity || item.qty) || 1 });
            }
          }
        });
      } else if (typeof solVal === 'object' && solVal !== null) {
        Object.entries(solVal).forEach(([sKey, sItem]: [string, any]) => {
          if (sItem && typeof sItem === 'object') {
            activeSolutions.push({ key: sKey, quantity: Number(sItem.quantity || sItem.qty) || 1 });
          } else if (sItem === true || typeof sItem === 'number') {
            activeSolutions.push({ key: sKey, quantity: typeof sItem === 'number' ? sItem : 1 });
          }
        });
      }

      activeSolutions.forEach(({ key: rawSolKey, quantity: solQty }) => {
        const normKey = String(rawSolKey).toUpperCase().trim().replace(/[-\s]/g, '_');
        const hwKeys = solutionHwMap[normKey] || solutionHwMap[normKey.replace(/_LAB|_SUITE|_4K/g, '')] || ['IFP', 'OPS'];
        hwKeys.forEach((hwKey) => {
          const specObj = defaultHwSpecs[hwKey] || { name: hwKey.replace(/_/g, ' '), specs: '' };
          const itemQty = solQty || 1;
          if (!result[hwKey]) {
            result[hwKey] = { itemName: specObj.name, quantity: 0, specNotes: specObj.specs, schoolBreakdown: [] };
          }
          result[hwKey].quantity += itemQty;
          result[hwKey].schoolBreakdown?.push({
            schoolId: schId,
            schoolName: schName,
            quantity: itemQty,
            specs: specObj.specs,
            serialNotes: '',
            solutionName: rawSolKey
          });
        });
      });
    });

    if (Object.keys(result).length > 0) return result;
  }

  const selectedSolutionsArray =
    allFormData?.stage3SolutionsData?.selectedSolutions ||
    allFormData?.solutions?.selectedSolutions ||
    (Array.isArray(allFormData?.selectedSolutions) ? allFormData.selectedSolutions : null);

  if (Array.isArray(selectedSolutionsArray) && selectedSolutionsArray.length > 0) {
    const numSchools = Math.max(1, effectiveSchools.length);
    selectedSolutionsArray.forEach((rawSolKey: string) => {
      const normKey = String(rawSolKey).toUpperCase().trim().replace(/[-\s]/g, '_');
      const hwKeys = solutionHwMap[normKey] || solutionHwMap[normKey.replace(/_LAB|_SUITE|_4K/g, '')] || ['IFP', 'OPS'];
      hwKeys.forEach((hwKey) => {
        const specObj = defaultHwSpecs[hwKey] || { name: hwKey.replace(/_/g, ' '), specs: '' };
        if (!result[hwKey]) {
          result[hwKey] = {
            itemName: specObj.name,
            quantity: numSchools,
            specNotes: specObj.specs,
            schoolBreakdown: effectiveSchools.map((s) => ({
              schoolId: s.id,
              schoolName: s.name,
              quantity: 1,
              specs: specObj.specs,
              serialNotes: '',
              solutionName: rawSolKey
            }))
          };
        }
      });
    });
    if (Object.keys(result).length > 0) return result;
  }

  return {};
}

/**
 * Check if a form field is a contact number / phone number field
 */
export function isContactNumberField(
  field?: { key?: string; name?: string; label?: string; type?: string } | null,
  fieldName?: string
): boolean {
  if (!field && !fieldName) return false;
  const key = (field?.key || field?.name || fieldName || '').toLowerCase();
  const label = (field?.label || '').toLowerCase();
  const type = (field?.type || '').toLowerCase();

  // If explicitly person name or address, don't treat as numeric contact
  if (
    key.includes('person') ||
    key.includes('address') ||
    label.includes('person') ||
    label.includes('address') ||
    label.includes('name')
  ) {
    return false;
  }

  if (type === 'tel' || type === 'phone') {
    return true;
  }

  // Common contact keys: phone, phonenumber, contactno, contactnumber, contact, poccontact, etc.
  const contactKeyPatterns = [
    'phone',
    'contactno',
    'contact_no',
    'contactnumber',
    'contact_number',
    'contactphone',
    'contact_phone',
    'mobile',
    'mobileno',
    'mobile_no',
    'telephone',
    'poccontact',
    'supportingorgcontact',
    'receivingpersonphone'
  ];

  if (contactKeyPatterns.some((pat) => key.includes(pat))) {
    return true;
  }

  if (/\b(phone|mobile|contact\s*no|contact\s*number)\b/i.test(label)) {
    return true;
  }

  return false;
}

/**
 * Sanitize contact number so that ONLY numeric digits are allowed (no alphabets or symbols)
 */
export function sanitizeContactNumber(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[^0-9]/g, '');
}

