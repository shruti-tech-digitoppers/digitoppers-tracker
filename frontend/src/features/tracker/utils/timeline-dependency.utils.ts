import { ITimelineNode, TimelineNodeStatus } from '../../../types/timeline';

export const EXECUTION_NODE_KEYS = [
  'EXECUTION',
  'HARDWARE_STREAM',
  'TECH_STREAM',
  'CONTENT_STREAM',
  'REQ_AND_STOCK_CHECK',
  'PURCHASE_IF_NEEDED',
  'CONSIGNMENT_TRACKING',
  'HARDWARE_READY',
  'PROJECT_CONFIG_AND_IMPLEMENTATION',
  'TECH_TESTING',
  'CONTENT_REVIEW_QA',
  'SHEET_READINESS',
  'DUMP_READINESS',
  'CONTENT_READY',
];

/**
 * Builds an index of node statuses by key, id, and _id for fast lookup
 */
export function buildNodeStatusMap(allNodes: ITimelineNode[]): Map<string, TimelineNodeStatus> {
  const map = new Map<string, TimelineNodeStatus>();

  const traverse = (list: ITimelineNode[]) => {
    for (const item of list) {
      if (item.key) map.set(item.key.toUpperCase(), item.status);
      if ((item as any).id) map.set(String((item as any).id).toUpperCase(), item.status);
      if (item._id) map.set(String(item._id), item.status);
      if (item.children) traverse(item.children);
    }
  };

  traverse(allNodes);
  return map;
}

/**
 * Builds an index of node display names by key, id, and _id for human-readable messages
 */
export function buildNodeNameMap(allNodes: ITimelineNode[]): Map<string, string> {
  const map = new Map<string, string>();

  const traverse = (list: ITimelineNode[]) => {
    for (const item of list) {
      const name = item.name || item.key || 'Prerequisite Task';
      if (item.key) map.set(item.key.toUpperCase(), name);
      if ((item as any).id) map.set(String((item as any).id).toUpperCase(), name);
      if (item._id) map.set(String(item._id), name);
      if (item.children) traverse(item.children);
    }
  };

  traverse(allNodes);
  return map;
}

/**
 * Checks whether a node is locked by unfinished prerequisites with human-readable reasons
 */
export function isNodeDependencyLocked(
  node: ITimelineNode,
  statusMap: Map<string, TimelineNodeStatus>,
  nameMap?: Map<string, string>
): { isLocked: boolean; reason: string | null } {
  if (!node) return { isLocked: false, reason: null };

  const nodeKey = (node.key || (node as any).id || '').toUpperCase();
  const isExecutionNode = EXECUTION_NODE_KEYS.includes(nodeKey);

  // 1. Special Guard: School & License Creation (Stage 3 Task 5) must be COMPLETED for Execution nodes
  if (isExecutionNode) {
    const licenseStatus = statusMap.get('SCHOOL_AND_LICENSE_CREATION');
    if (licenseStatus !== undefined && licenseStatus !== 'COMPLETED') {
      return {
        isLocked: true,
        reason: 'Requires completion of: School & License Creation (Stage 03 - Task 5)',
      };
    }

    const orderReqStatus = statusMap.get('ORDER_REQUIREMENT');
    if (orderReqStatus !== undefined && orderReqStatus !== 'COMPLETED') {
      return {
        isLocked: true,
        reason: 'Requires completion of: Order Requirement (Stage 03)',
      };
    }
  }

  // 2. Check explicit dependentOn / dependencies
  const deps = [
    ...(Array.isArray(node.dependentOn) ? node.dependentOn : []),
    ...(Array.isArray(node.dependencies) ? node.dependencies : []),
  ];

  const unmetNames: string[] = [];

  for (const dep of deps) {
    if (!dep) continue;
    const depKey = String(dep);
    const depStatus = statusMap.get(depKey) || statusMap.get(depKey.toUpperCase());

    if (depStatus !== undefined && depStatus !== 'COMPLETED') {
      const readableName =
        (nameMap && (nameMap.get(depKey) || nameMap.get(depKey.toUpperCase()))) ||
        (depKey === '6aed876723d8d4cc43f772ad' ? 'School & License Creation' : depKey);

      if (!unmetNames.includes(readableName)) {
        unmetNames.push(readableName);
      }
    }
  }

  if (unmetNames.length > 0) {
    return {
      isLocked: true,
      reason: `Requires completion of: ${unmetNames.join(', ')}`,
    };
  }

  return { isLocked: false, reason: null };
}
