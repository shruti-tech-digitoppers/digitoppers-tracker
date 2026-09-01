export type TimelineNodeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface IFormFieldOption {
  label: string;
  value: string | number;
}

export interface IFormFieldSchema {
  key?: string;
  name?: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'date' | 'url' | 'file' | 'multiselect' | 'solutionsConfig' | 'hardwareConfig' | 'radio' | string;
  label: string;
  required?: boolean;
  options?: IFormFieldOption[];
  defaultValue?: any;
  placeholder?: string;
  hint?: string;
}

export type FormSchemaType =
  | IFormFieldSchema[]
  | { fields?: IFormFieldSchema[] }
  | Record<string, any>
  | null;

export interface ITimelineNode {
  _id: string;
  timeline: string;
  key: string;
  name: string;
  type: string;
  order?: number;
  status: TimelineNodeStatus;
  assignedTo?: string | { _id: string; name: string; email: string; employeeCode?: string } | null;
  assignedEmployee?: string | { _id: string; name: string; email: string; employeeCode?: string } | null;
  dependencies: string[];
  formSchema?: FormSchemaType;
  formData?: Record<string, any>;
  metadata?: Record<string, any>;
  parent?: string | null;
  parentNode?: string | null;
  children?: ITimelineNode[];
  createdAt: string;
  updatedAt: string;
}

export interface ITimeline {
  _id: string;
  project: string;
  nodes: ITimelineNode[];
  createdAt: string;
  updatedAt: string;
}