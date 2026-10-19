import { ITimelineNode } from '../../../types/timeline';
import { IProject } from '../../../types/project';

export interface Stage3ExtractedData {
  hasData: boolean;
  schoolInfo: {
    schoolName: string;
    addressContact: string;
    schoolCategory: string;
    principalName: string;
    principalDetails: string;
    pocName: string;
    pocDesignation: string;
    pocContact: string;
    totalTeachers: number | string;
    subjectWiseTeachers: string;
    totalStudents: number | string;
    totalClassrooms: number | string;
    classroomCondition: string;
    spareRooms: string;
    electricityInternetAvailability: string;
    drinkingWaterAvailability: string;
    washroomAvailability: string;
    ictLabAvailable: string;
    ictSetupDate: string;
    ictHardwareComponents: string;
    digitalContentProvided: string;
    digitalContentClasses: string;
    libraryCornerAvailable: string;
    smartClassRoomIdentification: string;
    smartClassRoomCondition: string;
    additionalNotes: string;
    securityGuard: string;
    ictSecurityMeasures: string;
    deviceStorage: string;
    schools: Array<{
      id: string;
      schoolName: string;
      schoolCode?: string;
      address?: string;
      pocName?: string;
      phone?: string;
      totalStudents?: number | string;
      classes?: string[];
      [key: string]: any;
    }>;
    raw: Record<string, any>;
  };
  solutionSelection: {
    solutionsList: Array<{
      key: string;
      name: string;
      quantity: number;
      targetClasses?: string[];
      board?: string;
      notes?: string;
    }>;
    selectedSolutions: string[];
    overallNotes: string;
    remarks: string;
    approvalStatus: string;
    assignedTechLead?: string;
    assignedContentLead?: string;
    schoolWiseSolutions: Record<string, any>;
    raw: Record<string, any>;
  };
  hardwareRequirement: {
    itemsList: Array<{
      key: string;
      name: string;
      quantity: number;
      specNotes: string;
      serialNotes?: string;
      solutionName?: string;
      category?: string;
      schoolAllocations?: Record<string, number>;
    }>;
    selectedHardware: string[];
    assignedHardwareManager: string;
    allocationStatus: string;
    hardwareNotes: string;
    remarks: string;
    schoolWiseHardware: Record<string, any>;
    raw: Record<string, any>;
  };
  contentConfiguration: {
    boards: string[];
    languages: string[];
    grades: string[];
    subjects: string[];
    categories: string[];
    curriculumBoard: string;
    gradesConfigured: string;
    subjectsConfigured: string;
    configuredBy: string;
    remarks: string;
    contentSets: any;
    raw: Record<string, any>;
  };
  projectMeta: {
    projectId: string;
    projectName: string;
    organization: string;
    status: string;
    projectManagerName: string;
    numberOfSchools: number;
    numberOfLicenses: number;
  };
}

const findNodeRecursive = (list: ITimelineNode[], targetKey: string): ITimelineNode | null => {
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    const k = (item.key || '').toUpperCase();
    const target = targetKey.toUpperCase();
    if (
      k === target ||
      k.includes(target) ||
      (target === 'SCHOOL_ONBOARDING_INFORMATION' &&
        (k.includes('SCHOOL') || (item.name || '').toLowerCase().includes('school')))
    ) {
      return item;
    }
    if (item.children && item.children.length > 0) {
      const found = findNodeRecursive(item.children, targetKey);
      if (found) return found;
    }
  }
  return null;
};

export function extractStage3OrderRequirementData(
  allNodes: ITimelineNode[] = [],
  project: IProject | null = null,
  contextFormData: Record<string, any> = {}
): Stage3ExtractedData {
  const schoolNode = findNodeRecursive(allNodes, 'SCHOOL_ONBOARDING_INFORMATION');
  const solNode = findNodeRecursive(allNodes, 'SOLUTION_SELECTION');
  const hwNode = findNodeRecursive(allNodes, 'HARDWARE_REQUIREMENT');
  const contentNode = findNodeRecursive(allNodes, 'CONTENT_CONFIGURATION');

  const pOrderReq = (project as any)?.orderRequirement || {};

  // 1. School Information
  const sData: Record<string, any> = {
    ...(pOrderReq.schoolInformation || {}),
    ...(schoolNode?.formData || {}),
    ...(contextFormData?.stage3Schools ? { schools: contextFormData.stage3Schools } : {}),
  };

  const rawSchools: any[] =
    (Array.isArray(sData.schools) && sData.schools.length > 0 && sData.schools) ||
    (Array.isArray((project as any)?.schools) && (project as any).schools.length > 0 && (project as any).schools) ||
    (Array.isArray(contextFormData?.schools) && contextFormData.schools.length > 0 && contextFormData.schools) ||
    [];

  const normalizedSchools = rawSchools.map((s, idx) => ({
    id: s.id || s._id || `sch-${idx + 1}`,
    schoolName: s.schoolName || s.name || `School #${idx + 1}`,
    schoolCode: s.schoolCode || '',
    address: s.address || s.addressContact || '',
    pocName: s.pocName || s.contactPerson?.name || s.contactPerson || '',
    phone: s.phone || s.pocContact || s.contactPerson?.phone || '',
    totalStudents: s.totalStudents || s.studentsCount || '',
    classes: s.classes || [],
    ...s,
  }));

  const primarySchoolName =
    sData.schoolName ||
    normalizedSchools.map((s) => s.schoolName).filter(Boolean).join('; ') ||
    project?.organization ||
    project?.projectName ||
    'School Onboarding Location';

  // Canonical catalog maps matching exact MongoDB seeded collections
  const CANONICAL_HARDWARE_NAMES: Record<string, string> = {
    IFP_75: '75" 4K UHD Interactive Flat Panel',
    OPS_I5: 'OPS Windows 11 Pro i5 16GB/512GB PC',
    WALL_MOUNT: 'Heavy Duty IFP Wall Mount Bracket',
    PENDRIVE_64: 'Offline Curriculum USB 3.2 64GB',
    IFP: '75" 4K UHD Interactive Flat Panel',
    OPS: 'OPS Windows 11 Pro i5 16GB/512GB PC',
    TABLET: 'Android 10" Learning Tablet with Stylus',
    STUDENT_TABLETS: 'Android 10" Learning Tablet with Stylus',
    ROBOTICS: 'AI & Robotics STEM Sensor Kit',
    STEM_KIT: 'Hands-on Experimental STEM Science Kit',
    AR_VR: 'Immersive AR/VR Headset & Interactive Models',
    CAMERA: 'Full HD AI PTZ Camera with Audio Tracking',
    SCHOOL_BELL_PRO: 'Automated Smart School Bell System',
    PODIUM: 'Digital Multimedia Smart Podium',
    WIRELESS_KEYBOARD_MOUSE: 'Wireless RF Keyboard & Mouse Combo',
    UPS: '5 kVA Pure Sine Wave Online UPS with Battery Bank',
  };

  const CANONICAL_SOLUTION_NAMES: Record<string, string> = {
    SMART_SHAALA: 'Smart Shaala Classroom',
    STEM_LAB: 'STEM Innovation Lab',
    ROBOTICS: 'AI & Robotics Modular Lab',
    LANGUAGE: 'Digital English Language Lab',
    ASTRONOMY: 'Astronomy & Space Science Center',
    EPATHSHALA: 'ePathshala Digital LMS',
  };

  // 1. Solution Selection
  const solData: Record<string, any> = {
    ...(pOrderReq.solutionSelection || {}),
    ...(solNode?.formData || {}),
    ...(contextFormData?.stage3SolutionsData || {}),
  };

  const schoolWiseSol = solData.schoolWiseSolutions || contextFormData?.stage3SchoolWiseSolutions || {};
  const solutionsMap = solData.solutions || {};

  const solutionsList: Array<{
    key: string;
    name: string;
    quantity: number;
    targetClasses?: string[];
    board?: string;
    notes?: string;
  }> = [];

  const seenSolKeys = new Set<string>();

  // If backend pre-enriched solutionsList array exists
  if (Array.isArray(solData.solutionsList)) {
    solData.solutionsList.forEach((sItem: any) => {
      if (!sItem || !sItem.key || seenSolKeys.has(sItem.key)) return;
      seenSolKeys.add(sItem.key);
      solutionsList.push({
        key: sItem.key,
        name: sItem.name || sItem.solutionName || CANONICAL_SOLUTION_NAMES[sItem.key] || sItem.key.replace(/_/g, ' '),
        quantity: Number(sItem.quantity || 1),
        targetClasses: Array.isArray(sItem.targetClasses) ? sItem.targetClasses : [],
        board: sItem.board || '',
        notes: sItem.notes || solData.solutionNotes || '',
      });
    });
  }

  // Extract from schoolWiseSolutions
  Object.values(schoolWiseSol).forEach((schMap: any) => {
    if (schMap && typeof schMap === 'object') {
      Object.entries(schMap).forEach(([solKey, val]: [string, any]) => {
        if (!val) return;
        const sName = val.solutionName || val.name || CANONICAL_SOLUTION_NAMES[solKey] || solKey.replace(/_/g, ' ');
        const sQty = Number(val.quantity || val.qty || 1);
        const existing = solutionsList.find((s) => s.key === solKey);
        if (existing) {
          existing.quantity += sQty;
        } else {
          seenSolKeys.add(solKey);
          solutionsList.push({
            key: solKey,
            name: sName,
            quantity: sQty,
            targetClasses: Array.isArray(val.targetClasses) ? val.targetClasses : [],
            board: val.board || '',
            notes: val.notes || '',
          });
        }
      });
    }
  });

  // Extract from flat solutions object
  if (solutionsMap && typeof solutionsMap === 'object') {
    Object.entries(solutionsMap).forEach(([solKey, val]: [string, any]) => {
      if (!val || seenSolKeys.has(solKey)) return;
      const sName =
        (typeof val === 'object' && (val.solutionName || val.name)) ||
        CANONICAL_SOLUTION_NAMES[solKey] ||
        solKey.replace(/_/g, ' ');
      const sQty = Number((typeof val === 'object' && (val.quantity || val.qty)) || 1);
      seenSolKeys.add(solKey);
      solutionsList.push({
        key: solKey,
        name: sName,
        quantity: sQty,
        targetClasses: typeof val === 'object' && Array.isArray(val.targetClasses) ? val.targetClasses : [],
        board: typeof val === 'object' ? val.board || '' : '',
        notes: typeof val === 'object' ? val.notes || '' : '',
      });
    });
  }

  // Extract from selectedSolutions array (seed/legacy structure from MongoDB)
  const legacySelectedSolutions: string[] = Array.isArray(solData.selectedSolutions)
    ? solData.selectedSolutions
    : Array.isArray(solData.activeSolutionKeys)
    ? solData.activeSolutionKeys
    : [];

  const numSchools = Number(project?.numberOfSchools || normalizedSchools.length || 1);

  legacySelectedSolutions.forEach((sKey) => {
    if (!seenSolKeys.has(sKey)) {
      seenSolKeys.add(sKey);
      solutionsList.push({
        key: sKey,
        name: CANONICAL_SOLUTION_NAMES[sKey] || sKey.replace(/_/g, ' '),
        quantity: numSchools,
        notes: solData.solutionNotes || '',
      });
    }
  });

  // 2. Hardware Requirement
  const hwData: Record<string, any> = {
    ...(pOrderReq.hardwareRequirement || {}),
    ...(hwNode?.formData || {}),
    ...(contextFormData?.stage3HardwareData || {}),
  };

  const schoolWiseHw = hwData.schoolWiseHardware || contextFormData?.stage3SchoolWiseHardware || {};
  const hwItemsMap = hwData.hardwareRequirements?.items || hwData.items || contextFormData?.stage3HardwareItems || {};

  const hardwareItemsList: Array<{
    key: string;
    name: string;
    quantity: number;
    specNotes: string;
    serialNotes?: string;
    solutionName?: string;
    category?: string;
    schoolAllocations?: Record<string, number>;
  }> = [];

  const seenHwKeys = new Set<string>();

  // If backend pre-enriched items array exists
  if (Array.isArray(hwData.itemsList)) {
    hwData.itemsList.forEach((hItem: any) => {
      if (!hItem || !hItem.key || seenHwKeys.has(hItem.key)) return;
      seenHwKeys.add(hItem.key);
      hardwareItemsList.push({
        key: hItem.key,
        name: hItem.name || hItem.itemName || CANONICAL_HARDWARE_NAMES[hItem.key] || hItem.key.replace(/_/g, ' '),
        quantity: Number(hItem.quantity || 1),
        specNotes: hItem.specNotes || hwData.hardwareNotes || '',
        category: hItem.category || '',
        solutionName: hItem.solutionName || '',
      });
    });
  }

  // Extract from schoolWiseHardware
  Object.entries(schoolWiseHw).forEach(([schId, itemsObj]: [string, any]) => {
    if (itemsObj && typeof itemsObj === 'object') {
      Object.entries(itemsObj).forEach(([itemKey, itemVal]: [string, any]) => {
        if (!itemVal) return;
        const itmName = itemVal.itemName || itemVal.name || CANONICAL_HARDWARE_NAMES[itemKey] || itemKey.replace(/_/g, ' ');
        const itmQty = Number(itemVal.quantity || itemVal.qty || 1);
        const existing = hardwareItemsList.find((h) => h.key === itemKey);
        if (existing) {
          existing.quantity += itmQty;
          if (!existing.schoolAllocations) existing.schoolAllocations = {};
          existing.schoolAllocations[schId] = (existing.schoolAllocations[schId] || 0) + itmQty;
        } else {
          seenHwKeys.add(itemKey);
          hardwareItemsList.push({
            key: itemKey,
            name: itmName,
            quantity: itmQty,
            specNotes: itemVal.specNotes || itemVal.spec || '',
            serialNotes: itemVal.serialNotes || '',
            solutionName: itemVal.solutionName || '',
            schoolAllocations: { [schId]: itmQty },
          });
        }
      });
    }
  });

  // Extract from hardwareRequirements items map
  if (hwItemsMap && typeof hwItemsMap === 'object') {
    Object.entries(hwItemsMap).forEach(([itemKey, itemVal]: [string, any]) => {
      if (!itemVal || seenHwKeys.has(itemKey)) return;
      const itmName =
        (typeof itemVal === 'object' && (itemVal.itemName || itemVal.name)) ||
        CANONICAL_HARDWARE_NAMES[itemKey] ||
        itemKey.replace(/_/g, ' ');
      const itmQty = Number((typeof itemVal === 'object' && (itemVal.quantity || itemVal.qty)) || numSchools);
      seenHwKeys.add(itemKey);
      hardwareItemsList.push({
        key: itemKey,
        name: itmName,
        quantity: itmQty,
        specNotes: typeof itemVal === 'object' ? itemVal.specNotes || itemVal.spec || hwData.hardwareNotes || '' : '',
        serialNotes: typeof itemVal === 'object' ? itemVal.serialNotes || '' : '',
      });
    });
  }

  // Extract from selectedHardware array (seed/legacy structure from MongoDB)
  const legacySelectedHardware: string[] = Array.isArray(hwData.selectedHardware)
    ? hwData.selectedHardware
    : Array.isArray(hwData.activeHardwareKeys)
    ? hwData.activeHardwareKeys
    : [];

  legacySelectedHardware.forEach((hKey) => {
    if (!seenHwKeys.has(hKey)) {
      seenHwKeys.add(hKey);
      const exactBomQty =
        hwData.overallHardwareBOM?.[hKey] ||
        pOrderReq.overallHardwareBOM?.[hKey] ||
        (contextFormData?.overallHardwareBOM?.[hKey]);
      hardwareItemsList.push({
        key: hKey,
        name: CANONICAL_HARDWARE_NAMES[hKey] || hKey.replace(/_/g, ' '),
        quantity: exactBomQty !== undefined ? Number(exactBomQty) : numSchools,
        specNotes: hwData.hardwareNotes || '',
      });
    }
  });

  // 3. Content Configuration
  const cData: Record<string, any> = {
    ...(pOrderReq.contentConfiguration || {}),
    ...(contentNode?.formData || {}),
    ...(contextFormData?.stage3ContentData || {}),
  };

  const contentSets = cData.contentSets || cData;
  const boardsSet = new Set<string>();
  const mediumsSet = new Set<string>();
  const gradesSet = new Set<string>();
  const subjectsSet = new Set<string>();
  const categoriesSet = new Set<string>();

  if (Array.isArray(contentSets)) {
    contentSets.forEach((c: any) => {
      if (c.board) boardsSet.add(c.board);
      if (c.medium) mediumsSet.add(c.medium);
      if (Array.isArray(c.classes)) c.classes.forEach((cl: string) => gradesSet.add(cl));
      if (Array.isArray(c.subjects)) c.subjects.forEach((sb: string) => subjectsSet.add(sb));
      if (c.category) categoriesSet.add(c.category);
    });
  } else if (typeof contentSets === 'object' && contentSets !== null) {
    if (contentSets.board) boardsSet.add(contentSets.board);
    if (contentSets.curriculumBoard) boardsSet.add(contentSets.curriculumBoard);
    if (contentSets.medium) mediumsSet.add(contentSets.medium);
    if (Array.isArray(contentSets.languages)) contentSets.languages.forEach((l: string) => mediumsSet.add(l));
    if (contentSets.gradesConfigured) gradesSet.add(contentSets.gradesConfigured);
    if (Array.isArray(contentSets.classes)) contentSets.classes.forEach((cl: string) => gradesSet.add(cl));
    if (contentSets.subjectsConfigured) subjectsSet.add(contentSets.subjectsConfigured);
    if (Array.isArray(contentSets.subjects)) contentSets.subjects.forEach((sb: string) => subjectsSet.add(sb));
  }

  if (cData.curriculumBoard) boardsSet.add(cData.curriculumBoard);
  if (cData.gradesConfigured) gradesSet.add(cData.gradesConfigured);
  if (cData.subjectsConfigured) subjectsSet.add(cData.subjectsConfigured);

  const pmName =
    (typeof project?.projectManager === 'object' && (project?.projectManager as any)?.name) ||
    (typeof (project as any)?.assignedTo === 'object' && ((project as any)?.assignedTo as any)?.name) ||
    'Project Manager';

  const hasData =
    Boolean(sData.schoolName || sData.addressContact || normalizedSchools.length > 0) ||
    solutionsList.length > 0 ||
    hardwareItemsList.length > 0 ||
    boardsSet.size > 0 ||
    Boolean(cData.curriculumBoard || cData.gradesConfigured);

  return {
    hasData,
    schoolInfo: {
      schoolName: primarySchoolName,
      addressContact: sData.addressContact || sData.address || '',
      schoolCategory: sData.schoolCategory || '',
      principalName: sData.principalName || '',
      principalDetails: sData.principalDetails || '',
      pocName: sData.pocName || '',
      pocDesignation: sData.pocDesignation || '',
      pocContact: sData.pocContact || sData.phone || '',
      totalTeachers: sData.totalTeachers || '',
      subjectWiseTeachers: sData.subjectWiseTeachers || '',
      totalStudents: sData.totalStudents || '',
      totalClassrooms: sData.totalClassrooms || '',
      classroomCondition: sData.classroomCondition || '',
      spareRooms: sData.spareRooms || '',
      electricityInternetAvailability: sData.electricityInternetAvailability || '',
      drinkingWaterAvailability: sData.drinkingWaterAvailability || '',
      washroomAvailability: sData.washroomAvailability || '',
      ictLabAvailable: sData.ictLabAvailable || '',
      ictSetupDate: sData.ictSetupDate || '',
      ictHardwareComponents: sData.ictHardwareComponents || '',
      digitalContentProvided: sData.digitalContentProvided || '',
      digitalContentClasses: sData.digitalContentClasses || '',
      libraryCornerAvailable: sData.libraryCornerAvailable || '',
      smartClassRoomIdentification: sData.smartClassRoomIdentification || '',
      smartClassRoomCondition: sData.smartClassRoomCondition || '',
      additionalNotes: sData.additionalNotes || sData.remarks || '',
      securityGuard: sData.securityGuard || '',
      ictSecurityMeasures: sData.ictSecurityMeasures || '',
      deviceStorage: sData.deviceStorage || '',
      schools: normalizedSchools,
      raw: sData,
    },
    solutionSelection: {
      solutionsList,
      selectedSolutions: Array.from(seenSolKeys),
      overallNotes: solData.overallNotes || solData.solutionNotes || '',
      remarks: solData.remarks || '',
      approvalStatus: solData.approvalStatus || 'APPROVED',
      assignedTechLead: solData.assignedTechLead || '',
      assignedContentLead: solData.assignedContentLead || '',
      schoolWiseSolutions: schoolWiseSol,
      raw: solData,
    },
    hardwareRequirement: {
      itemsList: hardwareItemsList,
      selectedHardware: Array.from(seenHwKeys),
      assignedHardwareManager: hwData.assignedHardwareManager || '',
      allocationStatus: hwData.allocationStatus || 'CONFIRMED',
      hardwareNotes: hwData.hardwareNotes || '',
      remarks: hwData.remarks || '',
      schoolWiseHardware: schoolWiseHw,
      raw: hwData,
    },
    contentConfiguration: {
      boards: Array.from(boardsSet),
      languages: Array.from(mediumsSet),
      grades: Array.from(gradesSet),
      subjects: Array.from(subjectsSet),
      categories: Array.from(categoriesSet),
      curriculumBoard: cData.curriculumBoard || (boardsSet.size > 0 ? Array.from(boardsSet).join(', ') : ''),
      gradesConfigured: cData.gradesConfigured || (gradesSet.size > 0 ? Array.from(gradesSet).join(', ') : ''),
      subjectsConfigured: cData.subjectsConfigured || (subjectsSet.size > 0 ? Array.from(subjectsSet).join(', ') : ''),
      configuredBy: cData.configuredBy || '',
      remarks: cData.remarks || '',
      contentSets,
      raw: cData,
    },
    projectMeta: {
      projectId: project?.projectId || 'PRJ-2026',
      projectName: project?.projectName || project?.title || 'DigiToppers Operations Project',
      organization: project?.organization || (project as any)?.client || 'DigiToppers Network',
      status: project?.status || 'ACTIVE',
      projectManagerName: pmName,
      numberOfSchools: numSchools,
      numberOfLicenses: Number((project as any)?.numberOfLicenses || 0),
    },
  };
}
