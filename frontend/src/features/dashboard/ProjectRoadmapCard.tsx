'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { timelineApi } from '../../lib/api/timeline.api';
import { employeesApi } from '../../lib/api/employees.api';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IProject } from '../../types/project';
import { IUser } from '../../types/auth';
import { canUpdateNodeStatus, canAssignNode } from '../../lib/permissions';
import { HorizontalRoadmapCanvas } from '../tracker/HorizontalRoadmapCanvas';
import { NodeInspectorDrawer } from '../tracker/NodeInspectorDrawer';
import {
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';

interface ProjectRoadmapCardProps {
  project: IProject;
  currentUser?: IUser | null;
  isExpanded?: boolean;
  expanded?: boolean;
  onToggle: () => void;
  onProjectUpdated?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]', dot: 'bg-[#a8cf45]', icon: 'text-[#759724]' },
  ON_HOLD:   { label: 'On Hold',   cls: 'bg-amber-50 text-amber-800 border-amber-200',       dot: 'bg-amber-500',  icon: 'text-amber-600'   },
  COMPLETED: { label: 'Completed', cls: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]',     dot: 'bg-[#51a8b1]',  icon: 'text-[#3a7d84]'    },
  ARCHIVED:  { label: 'Archived',  cls: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40',  dot: 'bg-[#b9c0cb]',  icon: 'text-[#4a5462]'   },
};

export function ProjectRoadmapCard({
  project,
  currentUser = null,
  isExpanded,
  expanded,
  onToggle,
  onProjectUpdated,
}: ProjectRoadmapCardProps) {
  const isCardExpanded = isExpanded !== undefined ? isExpanded : Boolean(expanded);

  const [nodes, setNodes] = useState<ITimelineNode[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Inspector state
  const [selectedNode, setSelectedNode] = useState<ITimelineNode | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchemaType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const res = await timelineApi.getTimelineByProjectId(project._id);
      setNodes(res.timeline?.nodes || []);
      setLoaded(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load timeline.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [project._id]);

  useEffect(() => {
    employeesApi.getEmployees()
      .then((res) => setEmployees(res.employees || []))
      .catch(() => {});
  }, []);

  // Lazy-load timeline on first expand
  useEffect(() => {
    if (isCardExpanded && !loaded) {
      fetchTimeline();
    }
  }, [isCardExpanded, loaded, fetchTimeline]);

  const handleNodeSelect = async (node: ITimelineNode) => {
    setSelectedNode(node);
    setMutationError(null);
    setFormSchema(null);
    setFormData({});
    try {
      const [detailRes, formRes] = await Promise.all([
        timelineApi.getNodeDetail(project._id, node._id).catch(() => null),
        timelineApi.getNodeForm(project._id, node._id).catch(() => null),
      ]);
      if (detailRes?.node) {
        const mergedChildren =
          detailRes.node.children && detailRes.node.children.length > 0
            ? detailRes.node.children
            : node.children || [];
        setSelectedNode({ ...detailRes.node, children: mergedChildren });
      }
      if (formRes) {
        setFormSchema(formRes.formSchema || null);
        setFormData(formRes.formData || {});
      }
    } catch {}
  };

  const handleStatusChange = async (newStatus: TimelineNodeStatus) => {
    if (!selectedNode) return;
    try {
      setMutating(true);
      setMutationError(null);
      const res = await timelineApi.updateNodeStatus(project._id, selectedNode._id, newStatus);
      if (res.node) setSelectedNode(res.node);
      await fetchTimeline(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setMutating(false);
    }
  };

  const updateNodeInTree = (
    list: ITimelineNode[],
    nodeId: string,
    updates: Partial<ITimelineNode>
  ): ITimelineNode[] => {
    return list.map((node) => {
      if (node._id === nodeId) {
        return { ...node, ...updates };
      }
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updates),
        };
      }
      return node;
    });
  };

  const handleAssignmentChange = async (empId: string, targetNodeId?: string) => {
    const nodeIdToAssign = targetNodeId || selectedNode?._id;
    if (!nodeIdToAssign) return;

    const assignedEmpObj = empId ? employees.find((e) => e._id === empId) || null : null;
    const assignmentUpdates = {
      assignedTo: assignedEmpObj || empId || null,
      assignedEmployee: assignedEmpObj || empId || null,
    };

    // 1. Optimistically update local nodes tree immediately (zero latency, zero reload)
    setNodes((prev) => updateNodeInTree(prev, nodeIdToAssign, assignmentUpdates));

    // 2. Optimistically update current selectedNode / drawer in-place
    if (selectedNode) {
      if (nodeIdToAssign === selectedNode._id) {
        setSelectedNode({ ...selectedNode, ...assignmentUpdates });
      } else if (selectedNode.children) {
        const updatedChildren = updateNodeInTree(selectedNode.children, nodeIdToAssign, assignmentUpdates);
        setSelectedNode({ ...selectedNode, children: updatedChildren });
      }
    }

    // 3. Save to backend asynchronously in the background
    try {
      setMutationError(null);
      await timelineApi.assignNode(project._id, nodeIdToAssign, empId || null);
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to assign.');
      // Quietly sync on failure
      await fetchTimeline(false);
    }
  };

  const handleFormSubmit = async (updated: Record<string, any>) => {
    if (!selectedNode) return;
    try {
      const res = await timelineApi.updateNodeForm(project._id, selectedNode._id, updated);
      if (res.node) setSelectedNode(res.node);
      const formRes = await timelineApi.getNodeForm(project._id, selectedNode._id);
      if (formRes) {
        setFormSchema(formRes.formSchema || null);
        setFormData(formRes.formData || {});
      }
      await fetchTimeline(false);
      if (onProjectUpdated) onProjectUpdated();
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to save form data.');
    }
  };

  const canModifyStatus = selectedNode ? canUpdateNodeStatus(currentUser, 'PROJECT_MANAGER', selectedNode) : true;
  const canModifyAssignment = canAssignNode(currentUser, 'PROJECT_MANAGER');
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.ARCHIVED;

  const totalStages = nodes.length;
  const completedStages = nodes.filter((n) => n.status === 'COMPLETED').length;
  const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-xs transition-all duration-300 overflow-hidden font-sans ${
        isCardExpanded
          ? 'border-[#51a8b1]/60 shadow-md ring-1 ring-[#51a8b1]/20'
          : 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 hover:shadow-md'
      }`}
    >
      {/* ── Card Header — always visible ─────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none group"
        onClick={onToggle}
      >
        {/* Left: project meta */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-[#f0f8f9] border border-[#b6e0e4] ${statusCfg.icon}`}
          >
            <Building2 className="w-5 h-5 text-[#51a8b1]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2 py-0.5 rounded-md">
                {project.projectCode}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusCfg.cls}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
            <h3 className="font-heading text-sm font-bold text-[#333333] leading-tight mt-1 truncate max-w-[420px]">
              {project.title}
            </h3>
            <p className="text-[11px] text-[#4a5462] truncate">{project.client}</p>
          </div>
        </div>

        {/* Right: progress + refresh + chevron */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Mini progress bar */}
          {loaded && totalStages > 0 && (
            <div className="hidden sm:flex flex-col items-end gap-0.5 min-w-[100px]">
              <span className="text-[10px] font-semibold text-[#4a5462]">
                {completedStages}/{totalStages} stages
              </span>
              <div className="w-24 bg-[#f1f4f6] rounded-full h-2 overflow-hidden border border-[#b9c0cb]/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPct === 100 ? 'bg-[#a8cf45]' : 'bg-[#51a8b1]'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-[#3a7d84]">{progressPct}%</span>
            </div>
          )}

          {/* Refresh (only when expanded) */}
          {isCardExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchTimeline(true);
              }}
              className="p-1.5 rounded-xl border border-[#b9c0cb]/50 text-[#4a5462] hover:bg-[#f0f8f9] hover:text-[#3a7d84] transition"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#51a8b1]' : ''}`} />
            </button>
          )}

          {/* Chevron */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
              isCardExpanded
                ? 'bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]'
                : 'bg-[#f8fafb] text-[#4a5462] border border-[#b9c0cb]/40 group-hover:text-[#3a7d84]'
            }`}
          >
            {isCardExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </div>

      {/* ── Smooth Collapse / Expand Body ─────────────────── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isCardExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#b9c0cb]/30 p-4 bg-[#f8fafb]/60">
            {loading && !loaded ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-[#51a8b1]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Loading project execution timeline...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : nodes.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#4a5462]">
                No timeline stages found for this project.
              </div>
            ) : (
              <div className="relative">
                <HorizontalRoadmapCanvas
                  project={project}
                  nodes={nodes}
                  selectedNodeId={selectedNode?._id || null}
                  onSelectNode={handleNodeSelect}
                  hideProjectHeader={true}
                  employees={employees}
                  onAssign={(nodeId, empId) => handleAssignmentChange(empId, nodeId)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Node Inspector Drawer ─────────────────────────── */}
      {selectedNode && (
        <NodeInspectorDrawer
          node={selectedNode}
          isOpen={Boolean(selectedNode)}
          onClose={() => setSelectedNode(null)}
          formSchema={formSchema}
          formData={formData}
          onFormSubmit={handleFormSubmit}
          onStatusChange={handleStatusChange}
          onAssignmentChange={handleAssignmentChange}
          availableEmployees={employees}
          canEditStatus={canModifyStatus}
          canAssign={canModifyAssignment}
          isMutating={mutating}
          error={mutationError}
          allNodes={nodes}
        />
      )}
    </div>
  );
}
