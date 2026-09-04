'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FormSchemaType, IFormFieldSchema, TimelineNodeStatus } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { IProject } from '../../types/project';
import { FormFieldInput } from './fields/FormFieldInput';
import { FormFieldSelect } from './fields/FormFieldSelect';
import { FormFieldRadio } from './fields/FormFieldRadio';
import { FormFieldTextarea } from './fields/FormFieldTextarea';
import { FormFieldUpload } from './fields/FormFieldUpload';
import { SolutionsConfigTable } from './fields/SolutionsConfigTable';
import { HardwareConfigSection } from './fields/HardwareConfigSection';
import { HardwareRequirementsInput } from './fields/HardwareRequirementsInput';
import { HardwareStockCheck } from './fields/HardwareStockCheck';
import { HardwarePurchaseView } from './fields/HardwarePurchaseView';
import { HardwarePurchaseSection } from './fields/HardwarePurchaseSection';
import { HardwareConsignmentSection } from './fields/HardwareConsignmentSection';
import { ContentConfigSection } from './fields/ContentConfigSection';
import { AppFileDownloadSection } from './fields/AppFileDownloadSection';
import { IntegrationTestingSection } from './fields/IntegrationTestingSection';
import { MultiSchoolSection } from './fields/MultiSchoolSection';
import { ProjectReviewSection } from './fields/ProjectReviewSection';
import { FileText, Save, Check, AlertCircle, Loader2, User, Building2 } from 'lucide-react';

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
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

  useEffect(() => {
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

  const fieldsArray: IFormFieldSchema[] = useMemo(() => {
    if (!schema) return [];
    let list: IFormFieldSchema[] = [];
    if (Array.isArray(schema)) list = schema;
    else if (typeof schema === 'object') {
      if (Array.isArray((schema as any).fields)) list = (schema as any).fields;
      else list = Object.values(schema);
    }
    return list;
  }, [schema]);

  const isSchoolOnboardingForm = useMemo(() => {
    return fieldsArray.some(f => (f.key === 'schoolName' || f.name === 'schoolName' || f.key === 'multiSchoolSection')) &&
      fieldsArray.some(f => (f.key === 'schoolCode' || f.name === 'schoolCode' || f.key === 'principalName' || f.name === 'principalName' || f.key === 'totalStudents'));
  }, [fieldsArray]);

  const isProjectReviewForm = useMemo(() => {
    return fieldsArray.some(f => (f.key === 'organizationName' || f.name === 'organizationName' || f.key === 'projectName' || f.key === 'projectReviewSection')) &&
      fieldsArray.some(f => (f.key === 'confirmed' || f.name === 'confirmed' || f.key === 'projectReviewed' || f.key === 'projectCreated' || f.key === 'leadSource' || f.key === 'expectedProjectValue' || f.key === 'pmReviewStatus'));
  }, [fieldsArray]);

  if (fieldsArray.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#4a5462] italic py-3">
        <FileText className="w-3.5 h-3.5 text-[#b9c0cb]" />
        <span>No specific form fields configured for this stage.</span>
      </div>
    );
  }

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setSuccessMsg(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const currentSnapshot = JSON.stringify(formData);
    // If the data hasn't changed since last save and a success message is already showing or was just saved
    if (currentSnapshot === lastSavedSnapshot && successMsg) {
      setSuccessMsg('Stage information is already saved & up to date.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      await onSubmit(formData);
      setLastSavedSnapshot(currentSnapshot);
      setSuccessMsg('Stage data saved successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save stage form data.');
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
      type === 'textarea' ||
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
      type === 'appFileDownloadSection' ||
      type === 'appDownloadSection' ||
      type === 'appDownloadView' ||
      type === 'integrationTestingSection' ||
      type === 'testingResultsSection' ||
      type === 'radio' ||
      type === 'multiselect' ||
      type === 'file'
    );
  };

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
              setSuccessMsg('Stage 01 (01 — PROJECT REVIEWER) approved & completed successfully!');
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
      ) : (
        /* Grid of Dynamic Form Fields */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fieldsArray.map((field, idx) => {
            const fieldKey = field.name || field.key || `field_${idx}`;
            const value = formData[fieldKey] !== undefined ? formData[fieldKey] : (field.defaultValue ?? '');
            const fullWidth = isFullWidth(field);

            // If this field is projectName / projectTitle, render as a clean Headline Card instead of an input box!
            if (fieldKey === 'projectName' || fieldKey === 'projectTitle') {
              const displayProjectTitle = project?.title || (project as any)?.projectName || value || 'Project';
              const displayProjectCode = project?.projectCode || (project as any)?.projectId || '';
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
                    {displayProjectCode && (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white border border-[#51a8b1]/30 text-[#3a7d84] font-bold shadow-2xs shrink-0">
                        {displayProjectCode}
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={fieldKey}
                className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}
              >
                {field.type === 'multiSchoolSection' || field.type === 'multiSchoolInfo' ? (
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
                    />
                  </div>
                ) : field.type === 'hardwareStockCheck' ? (
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
                    />
                  </div>
                ) : field.type === 'hardwarePurchaseSection' || field.type === 'hardwarePurchaseView' ? (
                  <div>
                    <HardwarePurchaseSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
                    />
                  </div>
                ) : field.type === 'hardwareConsignmentSection' ? (
                  <div>
                    <HardwareConsignmentSection
                      value={value}
                      onChange={(val) => handleChange(fieldKey, val)}
                      disabled={disabled || submitting}
                      allFormData={allFormData}
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
                ) : field.type === 'select' ? (
                  <FormFieldSelect
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
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
                  />
                ) : field.type === 'file' ? (
                  <FormFieldUpload
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                  />
                ) : (
                  <FormFieldInput
                    field={field}
                    name={fieldKey}
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save / Submit Footer */}
      {!disabled && !isProjectReviewForm && (
        <div className="pt-3 border-t border-[#b9c0cb]/30 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#51a8b1] text-white hover:bg-[#3a7d84] active:scale-95 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Data...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Stage Information</span>
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}