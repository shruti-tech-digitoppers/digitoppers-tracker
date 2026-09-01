import { apiClient } from './client';
import { ITimeline, ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';

export interface ITimelineResponse {
  success: boolean;
  timeline: ITimeline;
}

export interface INodeDetailResponse {
  success: boolean;
  node: ITimelineNode;
}

export interface INodeFormResponse {
  success: boolean;
  formSchema: FormSchemaType;
  formData: Record<string, any>;
}

export interface IStatusUpdatePayload {
  status: TimelineNodeStatus;
}

export interface IAssignmentPayload {
  employeeId: string | null;
}

export interface IUpdateFormPayload {
  formData: Record<string, any>;
}

function normalizeNode(n: any): ITimelineNode {
  return {
    _id: n._id || n.id || '',
    timeline: n.timeline || '',
    key: n.key || '',
    name: n.name || n.title || 'Untitled Node',
    type: n.type || 'STAGE',
    status: (n.status || 'PENDING') as TimelineNodeStatus,
    assignedEmployee: n.assignedTo || n.assignedEmployee || null,
    dependencies: n.dependencies || [],
    formSchema: n.formSchema,
    formData: n.formData || {},
    metadata: n.metadata || {},
    parent: n.parentNode || n.parent || null,
    children: Array.isArray(n.children) ? n.children.map(normalizeNode) : [],
    createdAt: n.createdAt || new Date().toISOString(),
    updatedAt: n.updatedAt || new Date().toISOString(),
  };
}

function mapTimelineToNodes(raw: any, projectId: string): ITimeline {
  if (!raw) {
    return { _id: '', project: projectId, nodes: [], createdAt: '', updatedAt: '' };
  }
  const timelineData = raw.data || raw.timeline || raw;
  const rawStructure = timelineData.structure || timelineData.nodes || timelineData.stages || (Array.isArray(timelineData) ? timelineData : []);
  const nodes: ITimelineNode[] = rawStructure.map(normalizeNode);
  const timelineObj = timelineData.timeline || timelineData;

  return {
    _id: timelineObj._id || '',
    project: timelineObj.project || projectId,
    nodes,
    createdAt: timelineObj.createdAt || new Date().toISOString(),
    updatedAt: timelineObj.updatedAt || new Date().toISOString(),
  };
}

export const timelineApi = {
  getTimelineByProjectId: async (projectId: string): Promise<ITimelineResponse> => {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/timeline`);
      return {
        success: true,
        timeline: mapTimelineToNodes(response.data, projectId),
      };
    } catch {
      return {
        success: true,
        timeline: { _id: '', project: projectId, nodes: [], createdAt: '', updatedAt: '' },
      };
    }
  },

  getNodeDetail: async (projectId: string, nodeId: string): Promise<INodeDetailResponse> => {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/timeline/nodes/${nodeId}`);
      const raw = response.data?.data || response.data?.node || response.data;
      return {
        success: true,
        node: normalizeNode(raw),
      };
    } catch {
      const res = await timelineApi.getTimelineByProjectId(projectId);
      const findNode = (nodes: ITimelineNode[]): ITimelineNode | null => {
        for (const n of nodes) {
          if (n._id === nodeId) return n;
          if (n.children && n.children.length > 0) {
            const found = findNode(n.children);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findNode(res.timeline.nodes);
      return {
        success: true,
        node: node || ({} as any),
      };
    }
  },

  updateNodeStatus: async (projectId: string, nodeId: string, status: TimelineNodeStatus, comment?: string): Promise<INodeDetailResponse> => {
    const response = await apiClient.patch<any>(`/projects/${projectId}/timeline/nodes/${nodeId}/status`, { status, comment });
    const raw = response.data?.data || response.data?.node || response.data;
    return { success: true, node: normalizeNode(raw) };
  },

  assignNode: async (projectId: string, nodeId: string, employeeId: string | null): Promise<INodeDetailResponse> => {
    const response = await apiClient.patch<any>(`/projects/${projectId}/timeline/nodes/${nodeId}/assignment`, { employeeId });
    const raw = response.data?.data || response.data?.node || response.data;
    return { success: true, node: normalizeNode(raw) };
  },

  getNodeForm: async (projectId: string, nodeId: string): Promise<INodeFormResponse> => {
    try {
      const response = await apiClient.get<any>(`/projects/${projectId}/timeline/nodes/${nodeId}/form`);
      const data = response.data?.data || response.data;
      return {
        success: true,
        formSchema: data.formSchema || [
          { name: 'notes', type: 'textarea', label: 'Stage Notes & Requirements', placeholder: 'Enter details...' },
          { name: 'expectedCompletionDate', type: 'date', label: 'Expected Completion Date' },
        ],
        formData: data.formData || {},
      };
    } catch {
      return {
        success: true,
        formSchema: [
          { name: 'notes', type: 'textarea', label: 'Stage Notes & Requirements', placeholder: 'Enter details...' },
          { name: 'expectedCompletionDate', type: 'date', label: 'Expected Completion Date' },
        ],
        formData: {},
      };
    }
  },

  updateNodeForm: async (projectId: string, nodeId: string, formData: Record<string, any>): Promise<INodeDetailResponse> => {
    const response = await apiClient.put<any>(`/projects/${projectId}/timeline/nodes/${nodeId}/form`, { formData });
    const raw = response.data?.data || response.data?.node || response.data;
    return { success: true, node: normalizeNode(raw) };
  },
};