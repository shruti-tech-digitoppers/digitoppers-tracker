export type InstallationStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type TrainingStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ISchoolHardwareItem {
  hardwareId: {
    _id: string;
    key?: string;
    label?: string;
    name?: string;
    category?: string;
    unit?: string;
    modelNumber?: string;
  } | string;
  allocatedQuantity: number;
  deliveredQuantity?: number;
  isReceived?: boolean;
  damagedNotes?: string;
  readyForInstallation?: 'YES' | 'NO' | 'PENDING' | null;
  serialNumbers?: string[];
}

export interface ISchoolSolutionItem {
  solutionId: {
    _id: string;
    key?: string;
    label?: string;
    name?: string;
    icon?: string;
  } | string;
  customLabName?: string;
  quantity?: number;
}

export interface ISchoolInstallation {
  status: InstallationStatus;
  assignedEngineerId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | string | null;
  scheduledDate?: string | null;
  completedDate?: string | null;
  completionPhotos?: string[];
  signedChallanUrl?: string;
  remarks?: string;
}

export interface ISchoolTraining {
  status: TrainingStatus;
  assignedTrainerId?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  } | string | null;
  trainerName?: string;
  trainerPhone?: string;
  planOutDate?: string;
  trainingDate?: string | null;
  trainingMode?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  teachersTrainedCount?: number;
  deliveryConfirmationSheetUrl?: string;
  appreciationLetterUrl?: string;
  workCompletionLetterUrl?: string;
  teachersDetailsDocUrl?: string;
  checklist?: Record<string, boolean>;
  attendanceSheetUrl?: string;
  feedbackRating?: number | null;
  issuesNoted?: string;
  onGroundFeedback?: string;
  remarks?: string;
}

export interface ISchool {
  _id: string;
  projectId: string | { _id: string; projectName: string; projectId: string };
  name: string;
  district?: string;
  state?: string;
  address?: string;
  contactPerson?: {
    name?: string;
    phone?: string;
    email?: string;
    designation?: string;
  };
  solutions: ISchoolSolutionItem[];
  hardware: ISchoolHardwareItem[];
  installation: ISchoolInstallation;
  training: ISchoolTraining;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ISchoolProgressSummary {
  totalSchools: number;
  installationCompleted: number;
  installationInProgress: number;
  installationScheduled: number;
  installationPending: number;
  trainingCompleted: number;
  trainingScheduled: number;
  trainingPending: number;
  totalTeachersTrained: number;
}
