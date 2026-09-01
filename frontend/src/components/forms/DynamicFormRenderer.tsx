'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FormSchemaType, IFormFieldSchema } from '../../types/timeline';
import { IUser } from '../../types/auth';
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
import { FileText, Save, Check, AlertCircle, Loader2, User } from 'lucide-react';

interface DynamicFormRendererProps {
  schema: FormSchemaType;
  initialData: Record<string, any>;
  onSubmit: (formData: Record<string, any>) => Promise<void>;
  disabled?: boolean;
  employees?: IUser[];
  allFormData?: Record<string, any>;
}

export function DynamicFormRenderer({
  schema,
  initialData,
  onSubmit,
  disabled = false,
  employees = [],
  allFormData = {},
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData || {});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData || {});
    setError(null);
    setSuccessMsg(null);
  }, [initialData, schema]);

  const fieldsArray: IFormFieldSchema[] = useMemo(() => {
    if (!schema) return [];
    if (Array.isArray(schema)) return schema;
    if (typeof schema === 'object') {
      if (Array.isArray((schema as any).fields)) return (schema as any).fields;
      return Object.values(schema);
    }
    return [];
  }, [schema]);

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
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);
      await onSubmit(formData);
      setSuccessMsg('Stage data saved successfully.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save stage form data.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSchoolOnboardingForm = useMemo(() => {
    return fieldsArray.some(f => (f.key === 'schoolName' || f.name === 'schoolName' || f.key === 'multiSchoolSection')) &&
           fieldsArray.some(f => (f.key === 'schoolCode' || f.name === 'schoolCode' || f.key === 'principalName' || f.name === 'principalName' || f.key === 'totalStudents'));
  }, [fieldsArray]);

  const isFullWidth = (field: IFormFieldSchema) => {
    const type = field.type;
    return (
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

      {/* If this is the School Onboarding Information Stage, render the Multi-School Hub */}
      {isSchoolOnboardingForm ? (
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
              ) : field.type === 'employeeSelect' ? (
                <div>
                  <label className="block text-xs font-bold text-[#3a7d84] mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#51a8b1]" />
                    {field.label || 'Assigned Member'}
                  </label>
                  <select
                    disabled={disabled || submitting}
                    value={value || ''}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] focus:bg-white cursor-pointer"
                  >
                    <option value="">👤 Select Team Member</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({(emp as any).globalRole || 'Employee'})
                      </option>
                    ))}
                  </select>
                  {field.hint && <p className="text-[10px] text-[#4a5462] mt-0.5">{field.hint}</p>}
                </div>
              ) : field.type === 'hardwareConfig' ? (
                <div>
                  <label className="block text-xs font-bold text-[#3a7d84] mb-1">
                    {field.label || 'Hardware Configuration'}
                  </label>
                  <HardwareConfigSection
                    value={value}
                    onChange={(val) => handleChange(fieldKey, val)}
                    disabled={disabled || submitting}
                    employees={employees}
                  />
                </div>
              ) : field.type === 'file' ? (
                <FormFieldUpload
                  field={field}
                  name={fieldKey}
                  value={value}
                  onChange={(val) => handleChange(fieldKey, val)}
                  disabled={disabled || submitting}
                  onSuccessMsg={(msg) => setSuccessMsg(msg)}
                  onErrorMsg={(msg) => setError(msg)}
                />
              ) : field.type === 'textarea' ? (
                <FormFieldTextarea
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
              ) : field.type === 'select' || field.type === 'multiselect' ? (
                <FormFieldSelect
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
      {!disabled && (
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