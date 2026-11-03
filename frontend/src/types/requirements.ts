export interface IHardwareRequirementItem {
  _id?: string;
  hardware?: {
    _id: string;
    key: string;
    name?: string;
    label?: string;
    unit?: string;
    description?: string;
  } | string | null;
  hardwareKey: string;
  itemName: string;
  hardwareName?: string;
  quantity: number;
  qty?: number;
  unit?: string;
  specNotes?: string;
  specs?: string;
  serialNotes?: string;
  solution?: string | null;
  solutionKey?: string;
  solutionName?: string;
  stockCheck?: {
    requiredQty?: number;
    inStockQty?: number;
    purchaseQty?: number;
    stockStatus?: 'IN_STOCK' | 'PARTIALLY_AVAILABLE' | 'NOT_IN_STOCK' | null;
    verifiedAt?: string;
    remarks?: string;
  };
  poAndPi?: Record<string, any>;
  consignmentTracking?: Record<string, any>;
  hardwareReady?: {
    received?: boolean;
    receivedQty?: number;
    damagedItems?: string;
    readyForInstallation?: 'YES' | 'NO' | 'PENDING' | null;
    deliveryDate?: string;
    remarks?: string;
  };
}

export interface IContentRequirementItem {
  _id?: string;
  content?: {
    _id: string;
    reqKey?: string;
    title?: string;
    board?: string;
  } | string | null;
  contentKey?: string;
  reqKey?: string;
  title?: string;
  name?: string;
  category?: any;
  categoryName?: string;
  language?: any;
  languageName?: string;
  grade?: any;
  gradeName?: string;
  board?: string;
  stream?: string;
  driveLink?: string;
  sheetUrl?: string;
  solution?: string | null;
  solutionKey?: string;
  status?: string;
  remarks?: string;
}

export interface ISolutionRequirementItem {
  _id?: string;
  solution: {
    _id: string;
    key: string;
    name?: string;
    label?: string;
    description?: string;
  } | string;
  solutionKey: string;
  solutionName: string;
  label?: string;
  quantity: number;
  description?: string;
  remarks?: string;
  hardware: IHardwareRequirementItem[];
  content: IContentRequirementItem[];
}

export interface ISchoolRequirement {
  _id?: string;
  school: {
    _id: string;
    name: string;
    schoolBranch?: string;
    schoolId?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
  } | string;
  schoolBranch?: string;
  schoolBranchId?: string;
  schoolId?: string;
  schoolName: string;
  order?: number;
  address?: string;
  contactPerson?: string;
  phone?: string;
  board?: string;
  isConfigured?: boolean;
  solutions: ISolutionRequirementItem[];
  hardware?: IHardwareRequirementItem[];
  content?: IContentRequirementItem[];
  readyForInstallation?: string;
  allHardwareReceived?: string;
  deliveryDate?: string | null;
  remarks?: string;
}

export interface IProjectSchoolRequirementsBreakdown {
  projectId: string;
  project?: {
    _id: string;
    projectName: string;
    projectId: string;
    title?: string;
  } | null;
  totalSchools: number;
  summary: {
    totalSchools: number;
    configuredSchoolsCount: number;
    totalSolutionsAllocated: number;
    totalHardwareUnitsRequired: number;
    totalContentPackagesRequired: number;
  };
  schools: ISchoolRequirement[];
}

