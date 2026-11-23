'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FormSchemaType, IFormFieldSchema, TimelineNodeStatus } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { IProject } from '../../types/project';
import { FormFieldInput } from './fields/FormFieldInput';
import { FormFieldSelect } from './fields/FormFieldSelect';
import { FormFieldRadio } from './fields/FormFieldRadio';
import { FormFieldTextarea } from './fields/FormFieldTextarea';
import { FormFieldUpload } from './fields/FormFieldUpload';
import { SolutionsConfigTable } from './fields/SolutionsConfigTable';
import { HardwareRequirementsInput } from './fields/HardwareRequirementsInput';
import { HardwareStockCheck } from './fields/HardwareStockCheck';
import { HardwarePurchaseSection } from './fields/HardwarePurchaseSection';
import { HardwareConsignmentSection } from './fields/HardwareConsignmentSection';
import { HardwareReadySection } from './fields/HardwareReadySection';
import { ContentConfigSection } from './fields/ContentConfigSection';
import { SheetReadinessSection } from './fields/SheetReadinessSection';
import { AppFileDownloadSection } from './fields/AppFileDownloadSection';
import { IntegrationTestingSection } from './fields/IntegrationTestingSection';
import { MultiSchoolSection } from './fields/MultiSchoolSection';
import { ProjectReviewSection } from './fields/ProjectReviewSection';
import { MultiPoSection } from './fields/MultiPoSection';
import { MultiPiInvoiceSection } from './fields/MultiPiInvoiceSection';
import { InstallationSection } from './fields/InstallationSection';
import { TrainingExecutionSection } from './fields/TrainingExecutionSection';
import { TrainingCompletedSection } from './fields/TrainingCompletedSection';
import { InstallationPlanningSection, TrainingPlanningSection } from './fields/InstallationPlanningSection';
import { SchoolLicenseListSection } from './fields/SchoolLicenseListSection';
import { SchoolAndLicenseCreationSection } from './fields/SchoolAndLicenseCreationSection';
import { AppBuildUploadSection } from './fields/AppBuildUploadSection';
import { TechProjectConfigSection } from './fields/TechProjectConfigSection';
import { FileText, Save, Check, AlertCircle, Loader2, User, Building2 } from 'lucide-react';
import { showReadOnlyToast } from '../shell/ReadOnlyToast';
import { isContactNumberField, sanitizeContactNumber } from './utils/formHelpers';

interface DynamicFormRendererProps {
  schema: FormSchemaType;
  initialData: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
  project?: IProject | null;
  currentUser?: IUser | null;
  onStatusChange?: (status: TimelineNodeStatus) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  formRef?: React.MutableRefObject<{
    submitForm: () => Promise<void>;
    validateForm?: () => { isValid: boolean; errors: Record<string, string>; missingFields: string[] };
    isDirty: () => boolean;
    getFormData: () => Record<string, any>;
  } | null>;
  hideFooter?: boolean;
  nodeStatus?: string;
}

export function DynamicFormRenderer({
  schema,
  initialData,
  onSubmit,
  disabled = false,
  employees = [],
  allFormData = {},
  project = null,
  currentUser = null,
  onStatusChange,
  onDirtyChange,
  formRef,
  hideFooter = false,
  nodeStatus,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');
  const lastLoadedSnapshotRef = useRef<string>('');

  useEffect(() => {
    let currentInitialStr = '';
    try {
      currentInitialStr = JSON.stringify(initialData || {});
    } catch {
      currentInitialStr = '';
    }

    // If initialData content hasn't actually changed, don't wipe out user's active in-flight formData!
    if (lastLoadedSnapshotRef.current && lastLoadedSnapshotRef.current === currentInitialStr) {
      return;
    }
    lastLoadedSnapshotRef.current = currentInitialStr;

    const updated = { ...(initialData || {}) };
    if (project && (!updated.projectName || !updated.projectTitle)) {
      if (project.title || (project as any).projectName) {
        updated.projectName = project.title || (project as any).projectName;
      }
    }
    setFormData(updated);
    setLastSavedSnapshot(JSON.stringify(updated));
    setError(null);
    setSuccessMsg(null);
  }, [initialData, schema, project]);

  const effectiveProjectSchools = useMemo(() => {
    return (
      allFormData?.stage3Schools ||
      allFormData?.schools ||
      formData?.schools ||
      (project as any)?.schools ||
      (project as any)?.orderRequirement?.schoolInformation?.schools ||
      allFormData?.orderRequirement?.schoolInformation?.schools ||
      []
    );
  }, [allFormData, formData, project]);

  const fieldsArray: IFormFieldSchema[] = useMemo(() => {
    if (!schema) return [];
    let list: IFormFieldSchema[] = [];
    if (Array.isArray(schema)) {
      list = schema;
    } else if (typeof schema === 'object' && schema !== null) {
      if (Array.isArray((schema as any).fields)) {
        list = (schema as any).fields;
      } else if ((schema as any).fields && typeof (schema as any).fields === 'object') {
        list = Object.entries((schema as any).fields).map(([k, v]: [string, any]) => ({
          key: k,
          name: k,
          ...(typeof v === 'object' ? v : { label: k, type: 'text' })
        }));
      } else {
        list = Object.entries(schema).map(([k, v]: [string, any]) => ({
          key: k,
          name: k,
          ...(typeof v === 'object' ? v : { label: k, type: 'text' })
        }));
      }
    }

    const isSchoolAndLicenseForm =
      (schema as any)?.code === 'SCHOOL_AND_LICENSE_CREATION' ||
      (schema as any)?.id === 'SCHOOL_AND_LICENSE_CREATION' ||
      (schema as any)?.nodeId === 'SCHOOL_AND_LICENSE_CREATION' ||
      list.some(
        (f) =>
          f &&
          (f.type === 'schoolAndLicenseSection' ||
            f.type === 'schoolAndLicenseCreationSection' ||
            f.key === 'schoolAndLicenseSection' ||
            f.type === 'schoolLicenseSection' ||
            f.key === 'schoolLicenseSection' ||
            f.name === 'schoolAndLicenseSection')
      );

    return list.filter((f) => {
      if (!f) return false;
      const k = f.key || f.name;
      if (k === 'assignedTechLead' || k === 'assignedContentLead') {
        return false;
      }
      if (isSchoolAndLicenseForm) {
        if (
          k === 'licenseStatus' ||
          k === 'creationDate' ||
          k === 'licenseCreationDate' ||
          k === 'remarks' ||
          k === 'licenseRemarks' ||
          k === 'licenseNotes'
        ) {
          return false;
        }
      }
      return true;
    });
  }, [schema]);

  const isProjectReviewForm = useMemo(() => {
    return fieldsArray.some(f => (f.key === 'organizationName' || f.name === 'organizationName' || f.key === 'projectName' || f.key === 'projectReviewSection')) &&
      fieldsArray.some(f => (f.key === 'confirmed' || f.name === 'confirmed' || f.key === 'projectReviewed' || f.key === 'projectCreated' || f.key === 'leadSource' || f.key === 'expectedProjectValue' || f.key === 'pmReviewStatus'));
  }, [fieldsArray]);

  const isSchoolOnboardingForm = useMemo(() => {
    return fieldsArray.some(f => (
      f.key === 'schoolName' ||
      f.name === 'schoolName' ||
      f.key === 'multiSchoolSection' ||
      f.type === 'multiSchoolSection'
    )) && fieldsArray.some(f => (
      f.key === 'schoolCategory' ||
      f.key === 'addressContact' ||
      f.key === 'principalName' ||
      f.name === 'principalName' ||
      f.key === 'schoolCode' ||
      f.name === 'schoolCode' ||
      f.key === 'totalStudents'
    ));
  }, [fieldsArray]);

  const isPoUploadForm = useMemo(() => {
    return fieldsArray.some(f => f.type === 'multiPoSection' || f.key === 'multiPoSection' || f.key === 'poNumber');
  }, [fieldsArray]);

  const isPiInvoiceUploadForm = useMemo(() => {
    return fieldsArray.some(f => f.type === 'multiPiInvoiceSection' || f.key === 'multiPiInvoiceSection' || f.key === 'piNumber' || f.key === 'invoiceNumber');
  }, [fieldsArray]);

  const isHardwareStockCheckForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'REQ_AND_STOCK_CHECK') return true;
    return fieldsArray.some(
      (f) => f.type === 'hardwareStockCheck' || f.key === 'stockCheck'
    );
  }, [schema, fieldsArray]);

  const isHardwarePurchaseForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'PURCHASE_IF_NEEDED') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'hardwarePurchaseSection' ||
        f.type === 'hardwarePurchaseView' ||
        f.key === 'productProcurements'
    );
  }, [schema, fieldsArray]);

  const isHardwareConsignmentForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'CONSIGNMENT_TRACKING') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'hardwareConsignmentSection' ||
        f.key === 'productConsignments' ||
        f.key === 'trackingNumber' ||
        f.key === 'courierName'
    );
  }, [schema, fieldsArray]);

  const isHardwareReadyForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'HARDWARE_READY') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'hardwareReadySection' ||
        f.type === 'hardwareReady' ||
        f.type === 'hardwareReadyView' ||
        f.key === 'schoolHardwareReady' ||
        f.key === 'allHardwareReceived'
    );
  }, [schema, fieldsArray]);

  const isTrainingPlanningForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'TRAINING_PLANNING') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'trainingPlanningSection' ||
        f.type === 'trainingPlanning' ||
        f.key === 'trainingPlanning'
    );
  }, [schema, fieldsArray]);

  const isInstallationPlanningForm = useMemo(() => {
    return fieldsArray.some(
      (f) =>
        f.type === 'installationPlanningSection' ||
        f.type === 'installationPlanning' ||
        f.key === 'installationPlanning'
    );
  }, [fieldsArray]);

  const isTrainingExecutionForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'TRAINING_EXECUTION') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'trainingExecutionSection' ||
        f.type === 'trainingSection' ||
        f.key === 'trainingExecutionSection'
    );
  }, [schema, fieldsArray]);

  const isTrainingCompletedForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey;
    if (schemaKey === 'TRAINING_COMPLETED') return true;
    return fieldsArray.some(
      (f) =>
        f.type === 'trainingCompletedSection' ||
        f.type === 'trainingCompleted' ||
        f.key === 'trainingCompletedSection' ||
        f.key === 'schoolWiseTrainingCompletion'
    );
  }, [schema, fieldsArray]);

  const isTechConfigForm = useMemo(() => {
    const schemaKey = (schema as any)?.key || (schema as any)?.nodeKey || (schema as any)?.code || (schema as any)?.id;
    if (schemaKey === 'PROJECT_CONFIG_AND_IMPLEMENTATION') return true;
    return (
      fieldsArray.some((f) => f.key === 'licenseCreation' || f.name === 'licenseCreation') &&
      fieldsArray.some((f) => f.key === 'apkFileUrl' || f.name === 'apkFileUrl' || f.key === 'appFileUrl')
    );
  }, [schema, fieldsArray]);


  // Validation function: checks compulsory fields & contact numbers (digits only, no alphabets)
  const validateForm = (dataToValidate: Record<string, any>): {
    isValid: boolean;
    errors: Record<string, string>;
    missingFields: string[];
  } => {
    const errors: Record<string, string> = {};
    const missingFields: string[] = [];

    for (const field of fieldsArray) {
      const fieldKey = field.name || field.key;
      if (!fieldKey) continue;

      // Project title / headline virtual check
      if (fieldKey === 'projectName' || fieldKey === 'projectTitle' || fieldKey === 'projectCreation') {
        if (field.required && !project?.projectName && !project?.title && !dataToValidate[fieldKey]) {
          errors[fieldKey] = `${field.label || fieldKey} is compulsory.`;
          missingFields.push(field.label || fieldKey);
        }
        continue;
      }

      const val = dataToValidate[fieldKey];
      const isContact = isContactNumberField(field, fieldKey);

      // 1. Mandatory / Compulsory fields validation
      if (field.required) {
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === 'string' && val.trim() === '') ||
          (Array.isArray(val) && val.length === 0);

        if (isEmpty) {
          errors[fieldKey] = `${field.label || fieldKey} is compulsory to fill.`;
          missingFields.push(field.label || fieldKey);
          continue;
        }
      }

      // 2. Contact / Phone Number validation: only numbers, strictly NO alphabets
      if (isContact && val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val).trim();
        if (/[a-zA-Z]/.test(strVal)) {
          errors[fieldKey] = `${field.label || fieldKey} must contain only numbers, no alphabets.`;
          missingFields.push(`${field.label || fieldKey} (Numbers only)`);
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFields
    };
  };

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== lastSavedSnapshot;
  }, [formData, lastSavedSnapshot]);

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (formRef) {
      formRef.current = {
        submitForm: async () => {
          // Validate before saving
          const validation = validateForm(formData);
          const phoneErrors = Object.entries(validation.errors).filter(([_, msg]) => msg.includes('numbers'));
          if (phoneErrors.length > 0) {
            setFieldErrors(validation.errors);
            const msg = phoneErrors.map(([_, msg]) => msg).join(' ');
            setError(msg);
            throw new Error(msg);
          }
          await onSubmit(formData);
          setLastSavedSnapshot(JSON.stringify(formData));
          setJustSaved(true);
          setFieldErrors({});
          if (onDirtyChange) onDirtyChange(false);
          setTimeout(() => setJustSaved(false), 3000);
        },
        validateForm: () => validateForm(formData),
        isDirty: () => JSON.stringify(formData) !== lastSavedSnapshot,
        getFormData: () => formData
      };
    }
  }, [formRef, formData, lastSavedSnapshot, onSubmit, onDirtyChange, fieldsArray, project]);

  const handleChange = (fieldName: string, value: any) => {
    if (disabled) {
      showReadOnlyToast('🔒 Read-only access — you are not assigned to this task. Forms cannot be edited.');
      return;
    }

    // If this is a contact number field, sanitize on the fly: only numbers (no alphabets)
    const matchingField = fieldsArray.find((f) => f.key === fieldName || f.name === fieldName);
    let finalVal = value;
    if (matchingField && isContactNumberField(matchingField, fieldName)) {
      finalVal = sanitizeContactNumber(value);
    }

    setFormData((prev) => ({ ...prev, [fieldName]: finalVal }));
    setSuccessMsg(null);
    setError(null);

    // Clear error for this field if it is now valid
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) {
      showReadOnlyToast('🔒 Read-only access — you are not assigned to this task. Forms cannot be saved.');
      return;
    }
    if (submitting) return;

    // Validate form fields
    const validation = validateForm(formData);

    // Only strictly block save if invalid phone number formats (alphabets in phone)
    const phoneErrors = Object.entries(validation.errors).filter(([_, msg]) => msg.includes('numbers'));
    if (phoneErrors.length > 0) {
      setFieldErrors(validation.errors);
      setError(phoneErrors.map(([_, msg]) => msg).join(' '));
      return;
    }

    const currentSnapshot = JSON.stringify(formData);
    // If the data hasn't changed since last save and a success message is already showing or was just saved
    if (currentSnapshot === lastSavedSnapshot && successMsg) {
      setSuccessMsg('Stage information is already saved & up to date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setFieldErrors({});
      setSuccessMsg(null);
      await onSubmit(formData);
      setLastSavedSnapshot(currentSnapshot);
      setJustSaved(true);
      if (onDirtyChange) onDirtyChange(false);
      if (validation.missingFields.length > 0) {
        setSuccessMsg(`Draft saved. Status remains In Progress (${validation.missingFields.length} required field(s) pending: ${validation.missingFields.join(', ')}).`);
      } else {
        setSuccessMsg('Stage data saved successfully. All required fields are filled.');
      }
      setTimeout(() => {
        setJustSaved(false);
      }, 4000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save stage form data.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const isFullWidth = (field: IFormFieldSchema) => {
    const type = field.type;
    const key = field.key || field.name;
    return (
      key === 'projectName' ||
      key === 'projectTitle' ||
      key === 'apkFileUrl' ||
      key === 'appFileUrl' ||
      type === 'schoolLicenseSection' ||
      type === 'schoolAndLicenseSection' ||
      type === 'schoolAndLicenseCreationSection' ||
      key === 'schoolAndLicenseSection' ||
      type === 'projectConfigSection' ||
      type === 'multiPoSection' ||
      type === 'multiPiInvoiceSection' ||
      type === 'multiSchoolSection' ||
      type === 'multiSchoolInfo' ||
      type === 'solutionsConfig' ||
      type === 'hardwareConfig' ||
      type === 'hardwareRequirementsInput' ||
      type === 'hardwareStockCheck' ||
      type === 'hardwarePurchaseSection' ||
      type === 'hardwarePurchaseView' ||
      type === 'hardwareConsignmentSection' ||
      type === 'contentConfigSection' ||
      type === 'sheetReadinessSection' ||
      type === 'appFileDownloadSection' ||
      type === 'appDownloadSection' ||
      type === 'appDownloadView' ||
      type === 'integrationTestingSection' ||
      type === 'testingResultsSection' ||
      type === 'installationSection' ||
      type === 'schoolInstallationSection' ||
      type === 'installationConfigSection' ||
      type === 'installationPlanningSection' ||
      type === 'trainingExecutionSection' ||
      type === 'trainingSection' ||
      type === 'trainingPlanningSection' ||
      type === 'trainingPlanning' ||
      type === 'radio' ||
      type === 'multiselect' ||
      type === 'file'
    );
  };

  if (fieldsArray.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#4a5462] italic py-3">
        <FileText className="w-3.5 h-3.5 text-[#b9c0cb]" />
        <span>No specific form fields configured for this stage.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Alert Messages */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-[#f7fbe9] border border-[#dfefa6] rounded-xl text-xs text-[#465b1c] flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-[#759724] flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* If this is the Project Reviewer Stage (Stage 01), render the ProjectReviewSection */}
      {isProjectReviewForm ? (
        <ProjectReviewSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          project={project}
          currentUser={currentUser}
          onSubmitAndComplete={async (data) => {
            try {
              setSubmitting(true);
              setError(null);
              setSuccessMsg(null);
              await onSubmit(data);
              if (onStatusChange) {
                await onStatusChange('COMPLETED');
              }
              setSuccessMsg('Stage 01 (01 â€” PROJECT REVIEWER) approved & completed successfully!');
            } catch (err: any) {
              setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to complete stage.');
            } finally {
              setSubmitting(false);
            }
          }}
          onSubmitAndReject={async (data) => {
            try {
              setSubmitting(true);
              setError(null);
              setSuccessMsg(null);
              await onSubmit(data);
              if (onStatusChange) {
                await onStatusChange('ON_HOLD');
              }
              setSuccessMsg('Stage 01 marked as Rejected / On Hold.');
            } catch (err: any) {
              setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to update stage.');
            } finally {
              setSubmitting(false);
            }
          }}
        />
      ) : isSchoolOnboardingForm ? (
        <MultiSchoolSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
        />
      ) : isPoUploadForm ? (
        <MultiPoSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          project={project}
          allFormData={allFormData}
        />
      ) : isPiInvoiceUploadForm ? (
        <MultiPiInvoiceSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          project={project}
          allFormData={allFormData}
        />
      ) : isHardwareStockCheckForm ? (
        <HardwareStockCheck
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          allFormData={allFormData}
          employees={employees}
          project={project}
        />
      ) : isHardwarePurchaseForm ? (
        <HardwarePurchaseSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          allFormData={allFormData}
        />
      ) : isHardwareConsignmentForm ? (
        <HardwareConsignmentSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          allFormData={allFormData}
          project={project}
        />
      ) : isTrainingPlanningForm ? (
        <TrainingPlanningSection
          value={formData.trainingPlanning || formData.plannedSchools || formData.installationPlanning || formData}
          onChange={(val) => {
            setFormData((prev) => ({
              ...prev,
              ...(typeof val === 'object' ? val : {}),
              trainingPlanning: val?.plannedSchools || val,
              installationPlanning: val?.plannedSchools || val
            }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          employees={employees}
          allFormData={allFormData}
          project={project}
          schools={effectiveProjectSchools}
        />
      ) : isInstallationPlanningForm ? (
        <InstallationPlanningSection
          value={formData.installationPlanning || formData}
          onChange={(val) => {
            setFormData((prev) => ({
              ...prev,
              ...(typeof val === 'object' ? val : {}),
              installationPlanning: val?.plannedSchools || val
            }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          employees={employees}
          allFormData={allFormData}
          project={project}
          schools={effectiveProjectSchools}
        />
      ) : isTrainingExecutionForm ? (
        <TrainingExecutionSection
          value={formData.trainingExecutionSection || formData.schoolWiseTrainingExecutions || formData}
          onChange={(val) => {
            setFormData((prev) => ({
              ...prev,
              ...(typeof val === 'object' ? val : {}),
              trainingExecutionSection: val?.schoolWiseTrainingExecutions || val?.trainingExecutionSection || val,
              schoolWiseTrainingExecutions: val?.schoolWiseTrainingExecutions || val?.trainingExecutionSection || val,
              issuesNoted: val?.issuesNoted !== undefined ? val.issuesNoted : prev.issuesNoted,
              onGroundFeedback: val?.onGroundFeedback !== undefined ? val.onGroundFeedback : prev.onGroundFeedback,
              remarks: val?.remarks !== undefined ? val.remarks : prev.remarks,
            }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          employees={employees}
          allFormData={allFormData}
          project={project}
          schools={effectiveProjectSchools}
        />
      ) : isTrainingCompletedForm ? (
        <TrainingCompletedSection
          value={formData.trainingCompletedSection || formData.schoolWiseTrainingCompletion || formData}
          onChange={(val) => {
            setFormData((prev) => ({
              ...prev,
              ...(typeof val === 'object' ? val : {}),
              trainingCompletedSection: val?.schoolWiseTrainingCompletion || val?.trainingCompletedSection || val,
              schoolWiseTrainingCompletion: val?.schoolWiseTrainingCompletion || val?.trainingCompletedSection || val,
              completed: val?.completed !== undefined ? val.completed : prev.completed,
              remarks: val?.remarks !== undefined ? val.remarks : prev.remarks,
            }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          employees={employees}
          allFormData={allFormData}
          project={project}
          schools={effectiveProjectSchools}
        />
      ) : isHardwareReadyForm ? (
        <HardwareReadySection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          allFormData={allFormData}
          project={project}
          schools={effectiveProjectSchools}
        />
      ) : isTechConfigForm ? (
        <TechProjectConfigSection
          value={formData}
          onChange={(val) => {
            setFormData((prev) => ({ ...prev, ...val }));
            setSuccessMsg(null);
            setError(null);
          }}
          disabled={disabled || submitting}
          project={project}
          allFormData={allFormData}
          schools={effectiveProjectSchools}
          onSuccessMsg={(msg) => setSuccessMsg(msg)}
          onErrorMsg={(msg) => setError(msg)}
        />
      ) : (
        /* Grid of Dynamic Form Fields */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fieldsArray.map((field, idx) => {
            const fieldKey = field.name || field.key || `field_${idx}`;
            const value = formData[fieldKey] !== undefined ? formData[fieldKey] : (field.defaultValue ?? '');
            const fullWidth = isFullWidth(field);

            // If this field is projectName / projectTitle, render as a clean Headline Card instead of an input box!
            if (fieldKey === 'projectName' || fieldKey === 'projectTitle') {
              const displayProjectTitle = project?.projectName || project?.title || value || 'Project';
              const displayProjectId = project?.projectId || '';
              return (
                <div key={fieldKey} className="sm:col-span-2">
                  <div className="p-3.5 bg-gradient-to-r from-[#3a7d84]/10 via-[#51a8b1]/10 to-[#f8fafb] border border-[#51a8b1]/30 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3a7d84] to-[#51a8b1] flex items-center justify-center text-white shadow-2xs shrink-0">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#3a7d84] block">
                          Project Headline
                        </span>
                        <h4 className="text-sm font-bold text-[#1f2937] font-heading leading-tight truncate" title={displayProjectTitle}>
                          {displayProjectTitle}
                        </h4>
                      </div>
                    </div>
                    {displayProjectId && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white border border-[#51a8b1]/30 text-[#3a7d84] font-bold shadow-2xs shrink-0">
                        {displayProjectId}
                      </span>
                    )}
                  </div>
                </div>
              );
            }



            if (fieldKey === 'apkFileUrl' || field.key === 'apkFileUrl' || fieldKey === 'appFileUrl') {
              return (
                <div key={fieldKey} className="sm:col-span-2 space-y-1">
                  <AppBuildUploadSection
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    allFormData={allFormData}
                    onFormDataChange={(updates) => {
                      setFormData((prev) => ({ ...prev, ...updates }));
                    }}
                    onSuccessMsg={(msg) => setSuccessMsg(msg)}
                    onErrorMsg={(msg) => setError(msg)}
                  />
                </div>
              );
            }

            if (
              (fieldKey === 'damagedItems' || fieldKey === 'readyForInstallation') &&
              fieldsArray.some(
                (f) =>
                  f.key === 'allHardwareReceived' ||
                  f.key === 'schoolHardwareReady' ||
                  f.type === 'hardwareReadySection'
              )
            ) {
              return null;
            }

            return (
              <div
                key={fieldKey}
                className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}
              >
                {field.type === 'multiPoSection' ? (
                  <MultiPoSection
                    value={value || formData}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                      setSuccessMsg(null);
                      setError(null);
                    }}
                    disabled={disabled || submitting}
                    project={project}
                    allFormData={allFormData}
                  />
                ) : field.type === 'multiPiInvoiceSection' ? (
                  <MultiPiInvoiceSection
                    value={value || formData}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                      setSuccessMsg(null);
                      setError(null);
                    }}
                    disabled={disabled || submitting}
                    project={project}
                    allFormData={allFormData}
                  />
                ) : field.type === 'multiSchoolSection' || field.type === 'multiSchoolInfo' ? (
                  <MultiSchoolSection
                    value={value || formData}
                    onChange={(val) => {
                      setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                      setSuccessMsg(null);
                      setError(null);
                    }}
                    disabled={disabled || submitting}
                  />
                ) : field.type === 'solutionsConfig' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3a7d84] mb-1">
                      {field.label || 'Solutions Configuration'}
                    </label>
                    <SolutionsConfigTable
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      schools={
                        allFormData.stage3Schools ||
                        allFormData.schools ||
                        formData.schools ||
                        allFormData.stage3SchoolData?.schools ||
                        allFormData.schoolInformation?.schools ||
                        (project as any)?.orderRequirement?.schoolInformation?.schools ||
                        allFormData.orderRequirement?.schoolInformation?.schools ||
                        []
                      }
                      allFormData={{
                        ...allFormData,
                        project,
                        orderRequirement: (project as any)?.orderRequirement || allFormData.orderRequirement,
                        stage3SchoolData: allFormData.stage3SchoolData || (project as any)?.orderRequirement?.schoolInformation || {},
                        schoolInformation: allFormData.schoolInformation || (project as any)?.orderRequirement?.schoolInformation || {},
                      }}
                    />
                  </div>
                ) : field.type === 'hardwareRequirementsInput' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3a7d84] mb-1">
                      {field.label || 'Hardware Equipment Requirements'}
                    </label>
                    <HardwareRequirementsInput
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      schools={
                        allFormData.stage3Schools ||
                        allFormData.schools ||
                        formData.schools ||
                        allFormData.stage3SchoolData?.schools ||
                        allFormData.schoolInformation?.schools ||
                        (project as any)?.orderRequirement?.schoolInformation?.schools ||
                        allFormData.orderRequirement?.schoolInformation?.schools ||
                        []
                      }
                      allFormData={{
                        ...allFormData,
                        project,
                        orderRequirement: (project as any)?.orderRequirement || allFormData.orderRequirement,
                        stage3SchoolData: allFormData.stage3SchoolData || (project as any)?.orderRequirement?.schoolInformation || {},
                        schoolInformation: allFormData.schoolInformation || (project as any)?.orderRequirement?.schoolInformation || {},
                        stage3SolutionsData: allFormData.stage3SolutionsData || (project as any)?.orderRequirement?.solutionSelection || {},
                        stage3SchoolWiseSolutions: allFormData.stage3SchoolWiseSolutions || (project as any)?.orderRequirement?.solutionSelection?.schoolWiseSolutions || {}
                      }}
                    />
                  </div>
                ) : field.type === 'hardwareStockCheck' || fieldKey === 'stockCheck' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#3a7d84] mb-1">
                      {field.label || 'Hardware Stock Verification'}
                    </label>
                    <HardwareStockCheck
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                      employees={employees}
                      project={project}
                    />
                  </div>
                ) : field.type === 'hardwarePurchaseSection' || field.type === 'hardwarePurchaseView' || fieldKey === 'productProcurements' ? (
                  <div>
                    <HardwarePurchaseSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                    />
                  </div>
                ) : field.type === 'hardwareConsignmentSection' || fieldKey === 'productConsignments' ? (
                  <div>
                    <HardwareConsignmentSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                      project={project}
                    />
                  </div>
                ) : field.type === 'hardwareReadySection' || field.type === 'hardwareReady' || field.type === 'hardwareReadyView' || fieldKey === 'schoolHardwareReady' || fieldKey === 'allHardwareReceived' ? (
                  <div>
                    <HardwareReadySection
                      value={value || formData}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                      project={project}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'contentConfigSection' ? (
                  <div>
                    <ContentConfigSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                    />
                  </div>
                ) : field.type === 'sheetReadinessSection' ? (
                  <div>
                    <SheetReadinessSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                      employees={employees}
                      project={project}
                    />
                  </div>
                ) : field.type === 'appFileDownloadSection' || field.type === 'appDownloadSection' || field.type === 'appDownloadView' ? (
                  <div>
                    <AppFileDownloadSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                    />
                  </div>
                ) : field.type === 'integrationTestingSection' || field.type === 'testingResultsSection' ? (
                  <div>
                    <IntegrationTestingSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      employees={employees}
                    />
                  </div>
                ) : field.type === 'installationPlanningSection' || field.type === 'installationPlanning' || fieldKey === 'installationPlanning' ? (
                  <div>
                    <InstallationPlanningSection
                      value={value || formData.installationPlanning || formData}
                      onChange={(val) => {
                        setFormData((prev) => ({
                          ...prev,
                          ...(typeof val === 'object' ? val : {}),
                          installationPlanning: val?.plannedSchools || val,
                          [fieldKey]: val
                        }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      employees={employees}
                      allFormData={allFormData}
                      project={project}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'trainingPlanningSection' || field.type === 'trainingPlanning' ? (
                  <div>
                    <TrainingPlanningSection
                      value={formData}
                      onChange={(val) => {
                        setFormData((prev) => ({
                          ...prev,
                          ...(typeof val === 'object' && !Array.isArray(val) ? val : {}),
                          [fieldKey]: val?.plannedSchools || (Array.isArray(val) ? val : val?.trainingPlanning || val),
                          trainingPlanning: val?.plannedSchools || (Array.isArray(val) ? val : val?.trainingPlanning || val),
                          schoolWiseTrainingPlans: val?.schoolWiseTrainingPlans || prev.schoolWiseTrainingPlans,
                          plannedSchools: val?.plannedSchools || prev.plannedSchools,
                        }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      employees={employees}
                      allFormData={allFormData}
                      project={project}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'trainingExecutionSection' || field.type === 'trainingSection' ? (
                  <div>
                    <TrainingExecutionSection
                      value={value || formData}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      employees={employees}
                      allFormData={allFormData}
                      project={project}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'installationSection' || field.type === 'schoolInstallationSection' || field.type === 'installationConfigSection' ? (
                  <div>
                    <InstallationSection
                      value={value || formData}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, ...val, [fieldKey]: val }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      employees={employees}
                      allFormData={allFormData}
                      project={project}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'schoolAndLicenseSection' || field.type === 'schoolAndLicenseCreationSection' || field.key === 'schoolAndLicenseSection' ? (
                  <div className="sm:col-span-2">
                    <SchoolAndLicenseCreationSection
                      value={formData}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, ...val }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      project={project}
                      allFormData={allFormData}
                      schools={effectiveProjectSchools}
                      onStatusChange={onStatusChange}
                      nodeStatus={nodeStatus || (schema as any)?.nodeStatus || (schema as any)?.status}
                      onSubmitAndComplete={async (data) => {
                        try {
                          setSubmitting(true);
                          setError(null);
                          setSuccessMsg(null);
                          await onSubmit(data);
                          if (onStatusChange) {
                            await onStatusChange('COMPLETED');
                          }
                          setSuccessMsg('School & License Creation stage marked as Completed!');
                        } catch (err: any) {
                          setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to complete stage.');
                          throw err;
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                    />
                  </div>
                ) : field.type === 'schoolLicenseSection' || field.type === 'projectConfigSection' ? (
                  <div className="sm:col-span-2">
                    <SchoolLicenseListSection
                      value={formData}
                      onChange={(val) => {
                        setFormData((prev) => ({ ...prev, ...val }));
                        setSuccessMsg(null);
                        setError(null);
                      }}
                      disabled={disabled || submitting}
                      project={project}
                      allFormData={allFormData}
                      schools={effectiveProjectSchools}
                    />
                  </div>
                ) : field.type === 'select' ? (
                  <FormFieldSelect
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    error={fieldErrors[fieldKey]}
                  />
                ) : field.type === 'radio' ? (
                  <FormFieldRadio
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                  />
                ) : field.type === 'textarea' ? (
                  <FormFieldTextarea
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    error={fieldErrors[fieldKey]}
                  />
                ) : field.type === 'file' ? (
                  <FormFieldUpload
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    error={fieldErrors[fieldKey]}
                  />
                ) : (
                  <FormFieldInput
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    error={fieldErrors[fieldKey]}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Save / Submit Footer */}
      {!disabled && !isProjectReviewForm && !hideFooter && (
        <div className="sticky bottom-0 z-20 py-3 px-6 bg-white/95 backdrop-blur-sm border-t border-[#b9c0cb]/30 flex items-center justify-end gap-3 shadow-xs -mx-6 -mb-6 mt-6">
          <button
            type="submit"
            disabled={submitting || (!isDirty && !justSaved)}
            className={`inline-flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ml-auto ${justSaved
                ? 'bg-[#a8cf45] text-white border border-[#a8cf45] shadow-xs cursor-default'
                : isDirty
                  ? 'bg-[#51a8b1] hover:bg-[#3a7d84] text-white border border-[#51a8b1] shadow-xs hover:shadow-md cursor-pointer active:scale-95'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-default opacity-80'
              }`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span className="text-white font-bold">Saving...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold">Saved!</span>
              </>
            ) : isDirty ? (
              <>
                <Save className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold">Save</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-bold">Saved</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
