import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { timelineApi } from '../../lib/api/timeline.api';
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
  ExternalLink,
  Check,
  User,
} from 'lucide-react';

interface ProjectRoadmapCardProps {
  project: IProject;
  currentUser?: IUser | null;
  isExpanded?: boolean;
  expanded?: boolean;
  onToggle: () => void;
  onProjectUpdated?: () => void;
  compactTimeline?: boolean;
  employees?: IUser[];
}

const DEFAULT_STAGE_LABELS = [
  'Lead & Negotiation',
  'PO & PI Generation',
  'Order Requirement & Stock',
  'Execution & Implementation',
  'Quality & Content QA',
  'Field Installation & Dispatch',
  'Teacher Training',
  'Handover & Closure',
];

const SHORT_STAGE_LABELS = [
  'Lead',
  'PO / PI',
  'Order Req',
  'Execution',
  'QA Check',
  'Dispatch',
  'Training',
  'Closure',
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]', dot: 'bg-[#a8cf45]', icon: 'text-[#759724]' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500', icon: 'text-amber-600' },
  ON_HOLD: { label: 'On Hold', cls: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500', icon: 'text-amber-600' },
  COMPLETED: { label: 'Completed', cls: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]', dot: 'bg-[#51a8b1]', icon: 'text-[#3a7d84]' },
  ARCHIVED: { label: 'Archived', cls: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40', dot: 'bg-[#b9c0cb]', icon: 'text-[#4a5462]' },
};

export function ProjectRoadmapCard({
  project,
  currentUser = null,
  isExpanded,
  expanded,
  onToggle,
  onProjectUpdated,
  compactTimeline = false,
  employees = [],
}: ProjectRoadmapCardProps) {
  const isCardExpanded = isExpanded !== undefined ? isExpanded : Boolean(expanded);

  const [nodes, setNodes] = useState<ITimelineNode[]>([]);
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
      setError(err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to load timeline.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [project._id]);

  // Load timeline on mount so progress is visible even when collapsed
  useEffect(() => {
    fetchTimeline(false);
  }, [fetchTimeline]);

  const handleNodeSelect = async (node: ITimelineNode) => {
    // In guest mode (not logged in), no form/drawer opens
    if (!currentUser) {
      return;
    }
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
    } catch { }
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
      setMutationError(null);
      const res = await timelineApi.updateNodeForm(project._id, selectedNode._id, updated);
      if (res.node) {
        setSelectedNode((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...res.node,
            name: res.node.name && res.node.name !== 'Stage / Task' && res.node.name !== 'Untitled Node' ? res.node.name : prev.name,
            key: res.node.key || prev.key,
            type: res.node.type || prev.type,
            children: res.node.children && res.node.children.length > 0 ? res.node.children : prev.children,
          };
        });
      }
      const formRes = await timelineApi.getNodeForm(project._id, selectedNode._id);
      if (formRes) {
        setFormSchema(formRes.formSchema || null);
        setFormData(formRes.formData || {});
      }
      await fetchTimeline(false);
      if (onProjectUpdated) onProjectUpdated();
      setMutationError(null);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save form data.';
      setMutationError(msg);
      throw err;
    }
  };

  const canModifyStatus = selectedNode ? canUpdateNodeStatus(currentUser, 'PROJECT_MANAGER', selectedNode) : true;
  const canModifyAssignment = canAssignNode(currentUser, 'PROJECT_MANAGER');
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.ARCHIVED;

  // Top-level stages sorted by order
  const stageNodes = nodes.filter((n) => !n.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
  const stagesToCount = stageNodes.length > 0 ? stageNodes : nodes;
  const totalStages = 8;
  const completedStages = stagesToCount.filter((n) => n.status === 'COMPLETED').length;
  const progressPct = Math.round((completedStages / totalStages) * 100);

  // Resolve Project Manager name cleanly
  const pmObj = typeof project.projectManager === 'object' && project.projectManager !== null
    ? project.projectManager
    : employees.find((e) => e._id === project.projectManager);
  const pmName = (pmObj as any)?.name || (typeof project.projectManager === 'string' && project.projectManager ? project.projectManager : 'Assigned PM');

  return (
    <div
      className={`rounded-2xl border bg-white shadow-xs transition-all duration-300 overflow-hidden font-sans ${isCardExpanded
          ? 'border-[#51a8b1]/60 shadow-md ring-1 ring-[#51a8b1]/20'
          : 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 hover:shadow-md'
        }`}
    >
      {/* ── Card Header — always visible with space-between layout ── */}
      <div
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 px-5 py-4 cursor-pointer select-none group"
        onClick={onToggle}
      >
        {/* Left: Project Meta Details */}
        <div className="flex items-center gap-3.5 min-w-0 max-w-full lg:max-w-[280px] xl:max-w-[320px] flex-shrink-0">
          <div
            className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center bg-[#f0f8f9] border border-[#b6e0e4] ${statusCfg.icon} shadow-2xs`}
          >
            <Building2 className="w-5 h-5 text-[#51a8b1]" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10.5px] font-black text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2.5 py-0.5 rounded-lg">
                {project.projectId}
              </span>
              <span
                className={`lg:hidden inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>

            <div>
              <h3 className="font-heading text-sm font-bold text-[#1e293b] leading-tight truncate max-w-[260px] sm:max-w-[300px]">
                {project.projectName || project.title}
              </h3>
              <p className="text-[11px] text-[#556987] truncate">{project.organization || 'Direct Organization'}</p>
            </div>
          </div>
        </div>

        {/* Center: Stage Progress (Compact Progress Bar in Split View, Full 8-Stage Stepper in Full Width) */}
        {compactTimeline ? (
          <div className="w-full lg:flex-1 max-w-full lg:max-w-[340px] xl:max-w-[400px] mx-0 lg:mx-4 px-1 py-1 flex flex-col justify-center space-y-2">
            {/* Project Manager & Progress Counter */}
            <div className="flex items-center justify-between text-xs font-bold gap-2">
              <div className="flex items-center gap-1.5 text-[#3a7d84] min-w-0">
                <User className="w-3.5 h-3.5 text-[#51a8b1] shrink-0" />
                <span className="text-[11px] text-[#556987] font-medium shrink-0">PM:</span>
                <span className="truncate max-w-[130px] sm:max-w-[160px] font-bold text-[#1e293b]">{pmName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                <span className="text-[#556987] font-semibold">{completedStages}/{totalStages} Stages</span>
                <span className="font-mono font-black bg-[#f0f8f9] text-[#3a7d84] px-2 py-0.5 rounded-md border border-[#b6e0e4] text-[10.5px]">
                  {progressPct}%
                </span>
              </div>
            </div>

            {/* Compact Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/90 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#a8cf45] via-[#51a8b1] to-[#3a7d84] transition-all duration-700 rounded-full"
                style={{ width: `${Math.max(progressPct, 4)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="w-full lg:flex-1 max-w-full lg:max-w-[580px] xl:max-w-[690px] mx-0 lg:mx-6 px-1 sm:px-3 py-1.5 flex flex-col justify-center">
            {/* Horizontal Stepper Track */}
            <div className="flex items-center justify-between w-full relative">
              {/* Background connecting track line (aligned with circle centers) */}
              <div className="absolute top-3.5 sm:top-4 left-4 right-4 -translate-y-1/2 h-2 bg-slate-100 border border-slate-200/90 rounded-full z-0 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#a8cf45] via-[#51a8b1] to-[#3a7d84] transition-all duration-700 rounded-full"
                  style={{ width: `${Math.max(progressPct, 4)}%` }}
                />
              </div>

              {/* 8 Stage Milestone Circles & Phase Names */}
              {Array.from({ length: 8 }).map((_, idx) => {
                const stageNode = stageNodes[idx];
                const isCompleted = stageNode ? stageNode.status === 'COMPLETED' : idx < completedStages;
                const isCurrent = stageNode ? stageNode.status === 'IN_PROGRESS' : (!isCompleted && idx === completedStages);
                const shortLabel = SHORT_STAGE_LABELS[idx] || `S0${idx + 1}`;

                return (
                  <div
                    key={idx}
                    className="relative z-10 flex flex-col items-center max-w-[58px] sm:max-w-[70px]"
                  >
                    {/* Step Bubble (+20% size increase) */}
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-extrabold transition-all duration-200 shadow-2xs ${
                        isCompleted
                          ? 'bg-[#a8cf45] text-white border-2 border-white ring-2 ring-[#a8cf45]/60 shadow-sm'
                          : isCurrent
                            ? 'bg-[#51a8b1] text-white border-2 border-white ring-4 ring-[#51a8b1]/30 shadow-md animate-pulse'
                            : 'bg-white border-2 border-slate-300 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 stroke-[3.5] text-white" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Phase Name under bubble */}
                    <span
                      className={`text-[9.5px] sm:text-[10.5px] tracking-tight mt-1.5 text-center truncate w-full leading-tight select-none ${
                        isCompleted
                          ? 'text-[#465b1c] font-black'
                          : isCurrent
                            ? 'text-[#3a7d84] font-black'
                            : 'text-[#556987] font-semibold'
                      }`}
                    >
                      {shortLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Project Manager & Stage Count Subtext (Clean & Direct) */}
            <div className="flex items-center justify-between w-full mt-2.5 px-1 text-[11px] sm:text-xs">
              <div className="flex items-center gap-1.5 text-[#556987] font-medium truncate max-w-[320px] sm:max-w-[380px]">
                <User className="w-3.5 h-3.5 text-[#51a8b1] flex-shrink-0" />
                <span>Project Manager:</span>
                <strong className="text-[#3a7d84] font-bold truncate">
                  {pmName}
                </strong>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[#556987] font-semibold text-[11px]">
                  <strong className="text-[#3a7d84]">{completedStages}</strong> of {totalStages} Stages
                </span>
                <span className="font-mono font-black text-[10.5px] text-[#1e293b] bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {progressPct}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Status Badge + Open Tracker button + Refresh + Chevron */}
        <div className="flex items-center gap-3 sm:gap-3.5 flex-shrink-0 self-end lg:self-center">
          {/* Status Badge */}
          <span
            className={`hidden lg:inline-flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.cls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>

          {/* Open Tracker Button */}
          <Link
            href={`/tracker?projectId=${project._id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] text-xs font-bold text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white hover:border-[#51a8b1] transition shadow-2xs cursor-pointer"
            title="Open in Tracker workspace"
          >
            <span>Open Tracker</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </Link>

          {/* Refresh (only when expanded) */}
          {isCardExpanded && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fetchTimeline(true);
              }}
              className="p-2 rounded-xl border border-[#b9c0cb]/50 text-[#4a5462] hover:bg-[#f0f8f9] hover:text-[#3a7d84] transition cursor-pointer"
              title="Refresh timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#51a8b1]' : ''}`} />
            </button>
          )}

          {/* Chevron */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
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
        className={`grid transition-all duration-300 ease-in-out ${isCardExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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
              <div className="text-center py-8 space-y-2 text-[#4a5462]">
                <p className="text-xs font-semibold text-[#333333]">
                  {project.status === 'PENDING_REVIEW'
                    ? 'Project Request Pending Confirmation'
                    : 'No timeline stages found for this project.'}
                </p>
                <p className="text-[11.5px] text-[#4a5462] max-w-lg mx-auto">
                  {project.status === 'PENDING_REVIEW'
                    ? 'Timeline roadmap will be created once the assigned reviewer completes the review and approves this request.'
                    : 'Open in Execution Tracker to initialize the 8-stage rollout roadmap.'}
                </p>
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
                  isClickable={Boolean(currentUser)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Node Inspector Drawer (Only for authenticated users) ── */}
      {selectedNode && currentUser && (
        <NodeInspectorDrawer
          node={selectedNode}
          isOpen={Boolean(selectedNode && currentUser)}
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
