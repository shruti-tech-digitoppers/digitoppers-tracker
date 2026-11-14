'use client';

import React from 'react';
import { SchoolAndLicenseCreationSection } from './SchoolAndLicenseCreationSection';
import { IProject } from '../../../types/project';

interface SchoolLicenseListSectionProps {
  value?: any;
  onChange?: (val: any) => void;
  disabled?: boolean;
  project?: IProject | null;
  allFormData?: Record<string, any>;
  schools?: any[];
}

/**
 * SchoolLicenseListSection
 * Unified Stage 3 Task 5 Component.
 * Integrates Schoolwise Selection with Stage 3 Task 2 (Solutions), Task 3 (Hardware), and Task 5 (Licenses).
 */
export function SchoolLicenseListSection(props: SchoolLicenseListSectionProps) {
  return <SchoolAndLicenseCreationSection {...props} />;
}

export default SchoolLicenseListSection;
