import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { timelineApi } from '../../lib/api/timeline.api';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IProject } from '../../types/project';
import { IUser } from '../../types/auth';
import { canUpdateNodeStatus, canAssignNode } from '../../lib/permissions';
import { showReadOnlyToast } from '../../components/shell/ReadOnlyToast';
import { HorizontalRoadmapCanvas } from '../tracker/HorizontalRoadmapCanvas';
import { NodeInspectorDrawer } from '../tracker/NodeInspectorDrawer';
import { getStageTheme } from '../tracker/utils/stageColorThemes';
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
  Pause,
  Clock,
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

const CANONICAL_STAGE_NAMES = [
  'Project Review',
  'PO & PI',
  'Order Requirement',
  'Execution',
  'Testing',
  'Installation',
  'Training',
  'Project Closure',
];

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]', dot: 'bg-[#a8cf45]', icon: 'text-[#759724]' },
  PENDING_REVIEW: { label: 'Pending Review', cls: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500', icon: 'text-amber-600' },
  ON_HOLD: { label: 'On Hold', cls: 'bg-orange-50 text-orange-900 border-orange-300 shadow-2xs font-extrabold', dot: 'bg-orange-500 animate-pulse', icon: 'text-orange-600' },
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
  const cardRef = useRef<HTMLDivElement>(null);
  const isCardExpanded = isExpanded !== undefined ? isExpanded : Boolean(expanded);

  const [nodes, setNodes] = useState<ITimelineNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);

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

  // 1. Lazy Viewport Observer: Pre-fetch when card scrolls near the viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el || loaded) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  // 2. Fetch on-demand: when in view OR when card is expanded
  useEffect(() => {
    if ((inView || isCardExpanded) && !loaded && !loading) {
      fetchTimeline(false);
    }
  }, [inView, isCardExpanded, loaded, loading, fetchTimeline]);

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

  const isUserAdmin = Boolean(
    currentUser && (
      (currentUser.globalRole || '').toUpperCase() === 'ADMIN' ||
      (currentUser.role || '').toUpperCase() === 'ADMIN' ||
      (currentUser.globalRole || '').toUpperCase() === 'SUPER_ADMIN' ||
      (currentUser.role || '').toUpperCase() === 'SUPER_ADMIN'
    )
  );

  const handleAssignmentChange = async (empId: string, targetNodeId?: string) => {
    if (!isUserAdmin) {
      showReadOnlyToast('🔒 Read-only access — contact an Admin to assign employees.');
      return;
    }
    const nodeIdToAssign = targetNodeId || selectedNode?._id;
    if (!nodeIdToAssign) return;

    const assignedEmpObj = empId ? employees.find((e) => e._id === empId) || null : null;
    const assignmentUpdates: Partial<ITimelineNode> = {
      assignedTo: assignedEmpObj || (empId ? ({ _id: empId } as any) : null),
      assignedEmployee: assignedEmpObj || (empId ? ({ _id: empId } as any) : null),
      ...(empId ? { status: 'IN_PROGRESS' as any } : {})
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
      fetchTimeline(false).then(() => {
        if (onProjectUpdated) onProjectUpdated();
      }).catch((syncErr) => {
        console.warn('Background timeline sync note:', syncErr);
      });
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to assign.');
      // Quietly sync on failure
      fetchTimeline(false).catch(() => {});
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
        if (res.node.formSchema) {
          setFormSchema(res.node.formSchema);
        }
        if (res.node.formData) {
          setFormData(res.node.formData);
        }
      }

      // Sync full project timeline & dashboard cards non-blockingly in background
      // This eliminates the 2-3s UI freeze and keeps Save instant while preserving full data consistency
      fetchTimeline(false)
        .then(() => {
          if (onProjectUpdated) onProjectUpdated();
        })
        .catch((syncErr) => {
          console.warn('Background timeline sync note:', syncErr);
        });

      setMutationError(null);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || err.message || 'Failed to save form data.';
      if (err.response?.status === 403 || msg.toLowerCase().includes('assigned') || msg.toLowerCase().includes('viewer')) {
        showReadOnlyToast('🔒 Read-only access — you are not assigned to this task.');
      }
      setMutationError(msg);
      throw err;
    }
  };

  const canModifyStatus = selectedNode ? canUpdateNodeStatus(currentUser, 'PROJECT_MANAGER', selectedNode) : true;
  const canModifyAssignment = isUserAdmin;
  const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.ARCHIVED;

  // Top-level stages sorted by order
  const stageNodes = nodes.filter((n) => !n.parent).sort((a, b) => (a.order || 0) - (b.order || 0));
  const stagesToCount = stageNodes.length > 0 ? stageNodes : nodes;
  const totalStages = 8;
  const completedStages = stagesToCount.filter((n) => n.status === 'COMPLETED').length;
  const progressPct = Math.round((completedStages / totalStages) * 100);

  // Parallel and hold status checks across stages and sub-streams
  const hasAnyHold = stagesToCount.some(s => s.status === 'ON_HOLD' || (s.children && s.children.some(c => c.status === 'ON_HOLD')));
  const inProgressCount = stagesToCount.filter(s => s.status === 'IN_PROGRESS' || (s.children && s.children.some(c => c.status === 'IN_PROGRESS'))).length;
  const parallelSubstreamsCount = stagesToCount.reduce((acc, s) => {
    const activeChildren = s.children ? s.children.filter(c => c.status === 'IN_PROGRESS').length : 0;
    return acc + (activeChildren > 1 ? activeChildren : 0);
  }, 0);
  const totalParallelActive = Math.max(inProgressCount, parallelSubstreamsCount);

  // Resolve Project Manager name cleanly
  const pmObj = typeof project.projectManager === 'object' && project.projectManager !== null
    ? project.projectManager
    : employees.find((e) => e._id === project.projectManager);
  const pmName = (pmObj as any)?.name || (typeof project.projectManager === 'string' && project.projectManager ? project.projectManager : 'Assigned PM');

  return (
    <div
      ref={cardRef}
      className={`adaptive-project-card rounded-xl border bg-white shadow-2xs transition-all duration-200 overflow-hidden font-sans ${isCardExpanded
          ? 'border-[#51a8b1]/60 shadow-xs ring-1 ring-[#51a8b1]/20'
          : 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 hover:shadow-xs'
        }`}
    >
      {/* ── Card Header — Compact 2-Row Layout in Split Mode, Spacious 3-Col Layout in Full Width Mode ── */}
      {compactTimeline ? (
        <div
          className="cursor-pointer select-none group transition-colors"
          onClick={onToggle}
        >
          {/* Top Row: Meta details on Left + Actions on Right */}
          <div className="flex items-center justify-between gap-2.5 px-3 sm:px-3.5 py-2 sm:py-2.5">
            {/* Left: Icon + Code + Title + Org */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`flex-shrink-0 w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center bg-[#f0f8f9] border border-[#b6e0e4] ${statusCfg.icon} shadow-2xs`}
              >
                <Building2 className="w-4 h-4 text-[#51a8b1]" />
              </div>

              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-[9.5px] font-black text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-1.5 py-0.2 rounded shrink-0">
                    {project.projectId}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${statusCfg.cls}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </div>

                <h3 className="font-heading text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
                  {project.projectName || project.title}
                </h3>
                <p className="text-[10px] text-slate-500 truncate font-medium">{project.organization || 'Direct Organization'}</p>
              </div>
            </div>

            {/* Right: Open Tracker + Chevron */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <Link
                href={`/tracker?projectId=${project._id}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f8f9] border border-[#b6e0e4] text-[11px] font-bold text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white hover:border-[#51a8b1] transition shadow-2xs cursor-pointer"
                title="Open in Tracker workspace"
              >
                <span>Tracker</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </Link>

              {isCardExpanded && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchTimeline(true);
                  }}
                  className="p-1 rounded-lg border border-[#b9c0cb]/50 text-[#4a5462] hover:bg-[#f0f8f9] hover:text-[#3a7d84] transition cursor-pointer"
                  title="Refresh timeline"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#51a8b1]' : ''}`} />
                </button>
              )}

              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  isCardExpanded
                    ? 'bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]'
                    : 'bg-[#f8fafb] text-[#4a5462] border border-[#b9c0cb]/40 group-hover:text-[#3a7d84]'
                }`}
              >
                {isCardExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Full-width PM + Stage Progress Bar */}
          <div className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-slate-50/90 via-[#f8fafb] to-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            {/* PM Name */}
            <div className="flex items-center gap-1 min-w-0">
              <User className="w-3 h-3 text-[#51a8b1] shrink-0" />
              <span className="text-slate-500 font-medium text-[10.5px] shrink-0">PM:</span>
              <span className="font-bold text-slate-800 truncate text-[11px]">{pmName}</span>
            </div>

            {/* Progress Bar & Stage Count */}
            <div className="flex items-center gap-2 flex-1 max-w-[260px] sm:max-w-[340px] justify-end flex-wrap">
              {hasAnyHold && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 border border-orange-300 animate-pulse shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Hold
                </span>
              )}
              {totalParallelActive >= 2 && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] animate-pulse shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#51a8b1]" />
                  {totalParallelActive} Parallel Active
                </span>
              )}
              <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-600 shrink-0">
                <strong className="text-[#3a7d84]">{completedStages}</strong>/8
              </span>
              <div className="flex-1 h-1.5 bg-slate-200/90 rounded-full overflow-hidden shadow-inner min-w-[50px]">
                <div
                  className="h-full bg-gradient-to-r from-[#a8cf45] via-[#51a8b1] to-[#3a7d84] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct > 0 ? Math.max(progressPct, 4) : 0}%` }}
                />
              </div>
              <span className="font-mono font-black text-[9.5px] text-[#3a7d84] bg-white border border-[#b6e0e4] px-1 py-0.2 rounded shadow-2xs shrink-0">
                {progressPct}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 lg:gap-4 px-3.5 sm:px-4 py-2.5 sm:py-3 cursor-pointer select-none group"
          onClick={onToggle}
        >
          {/* Invisible Div 1: Project Name & Identity Block (Fixed allocated width across all cards) */}
          <div className="w-full lg:w-[250px] xl:w-[280px] 2xl:w-[310px] shrink-0 flex items-center gap-2.5 min-w-0">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#f0f8f9] border border-[#b6e0e4] ${statusCfg.icon} shadow-2xs`}
            >
              <Building2 className="w-4.5 h-4.5 text-[#51a8b1]" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[9.5px] font-black text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-2 py-0.2 rounded-md">
                  {project.projectId}
                </span>
                <span
                  className={`lg:hidden inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${statusCfg.cls}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>

              <div>
                <h3
                  className="font-heading text-xs sm:text-[13px] font-bold text-[#1e293b] leading-tight truncate"
                  title={project.projectName || project.title}
                >
                  {project.projectName || project.title}
                </h3>
                <p
                  className="text-[10.5px] text-[#556987] truncate"
                  title={project.organization || 'Direct Organization'}
                >
                  {project.organization || 'Direct Organization'}
                </p>
              </div>
            </div>
          </div>

          {/* Invisible Div 2: Center 8-Stage Stepper & Timeline Progress (Fills space evenly across all cards) */}
          <div className="w-full lg:flex-1 min-w-0 lg:px-2 xl:px-4 py-1 flex flex-col justify-center">
            {/* Horizontal Stepper Track */}
            <div className="relative w-full flex items-start">
              {/* Background connecting track line (Starts at Circle 1 exact center, ends at Circle 8 exact center) */}
              <div className="absolute top-[14px] left-[6.25%] right-[6.25%] -translate-y-1/2 h-1.5 bg-slate-100 border border-slate-200/90 rounded-full z-0 overflow-hidden shadow-inner pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-[#a8cf45] via-[#51a8b1] to-[#3a7d84] transition-all duration-700 rounded-full"
                  style={{ width: `${completedStages > 0 ? Math.min(100, (completedStages / 7) * 100) : 0}%` }}
                />
              </div>

              {/* 8 Stage Milestone Columns (Each strictly flex-1, guaranteeing identical width & perfectly locked circle positions) */}
              {Array.from({ length: 8 }).map((_, idx) => {
                const stageNode = stageNodes[idx];
                const isCompleted = stageNode ? stageNode.status === 'COMPLETED' : idx < completedStages;
                const isOnHold = stageNode 
                  ? (stageNode.status === 'ON_HOLD' || Boolean(stageNode.children && stageNode.children.some(c => c.status === 'ON_HOLD'))) 
                  : false;
                const isCurrent = stageNode 
                  ? (stageNode.status === 'IN_PROGRESS' || Boolean(stageNode.children && stageNode.children.some(c => c.status === 'IN_PROGRESS'))) 
                  : (!isCompleted && !isOnHold && idx === completedStages);
                const shortLabel = stageNode?.name
                  ? stageNode.name.replace(/^\d+\s*[—–-]\s*/, '').trim()
                  : (CANONICAL_STAGE_NAMES[idx] || `S0${idx + 1}`);

                // Parallel workstreams active check (e.g. Stage 04 Execution having multiple parallel streams running)
                const parallelRunningCount = stageNode?.children
                  ? stageNode.children.filter((c) => c.status === 'IN_PROGRESS').length
                  : 0;
                const isParallelActive = parallelRunningCount > 1;

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-0 flex flex-col items-center relative z-10 px-0.5"
                  >
                    {/* Step Bubble - strictly 28px x 28px with uniform border-2, vertical center always at y=14px on the line */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-extrabold transition-all duration-200 shadow-2xs relative shrink-0 ${
                        isCompleted
                          ? 'bg-[#a8cf45] text-white border-2 border-white ring-2 ring-[#a8cf45]/60 shadow-xs'
                          : isOnHold
                            ? 'bg-orange-500 text-white border-2 border-white ring-2 ring-orange-400/50 shadow-xs'
                            : isCurrent
                              ? 'bg-[#51a8b1] text-white border-2 border-white ring-2 ring-[#51a8b1]/40 shadow-xs'
                              : 'bg-white border-2 border-slate-300 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3.5] text-white" />
                      ) : isOnHold ? (
                        <Pause className="w-3 h-3 stroke-[3] text-white" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Phase Name under bubble - Fixed min-height ensures labels & badges expand downward without shifting the bubble */}
                    <div className="mt-1 text-center truncate w-full min-h-[30px] flex flex-col items-center justify-start select-none">
                      <span
                        className={`text-[9px] sm:text-[9.5px] tracking-tight text-center truncate w-full leading-tight ${
                          isCompleted
                            ? 'text-[#465b1c] font-black'
                            : isOnHold
                              ? 'text-orange-600 font-black'
                              : isCurrent
                                ? 'text-[#3a7d84] font-black'
                                : 'text-[#556987] font-semibold'
                        }`}
                        title={shortLabel}
                      >
                        {shortLabel}
                      </span>
                      {isOnHold && (
                        <span className="block text-[8px] text-orange-600 font-black uppercase tracking-tight mt-0.5">
                          HOLD
                        </span>
                      )}
                      {isCurrent && !isOnHold && (
                        <span className="block text-[8px] text-[#3a7d84] font-bold uppercase tracking-tight mt-0.5">
                          {isParallelActive ? 'PARALLEL' : 'ACTIVE'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Project Manager & Stage Count Subtext */}
            <div className="flex items-center justify-between w-full mt-1.5 px-1 text-[10.5px]">
              <div className="flex items-center gap-1 text-[#556987] font-medium truncate max-w-[200px] sm:max-w-[280px]">
                <User className="w-3 h-3 text-[#51a8b1] flex-shrink-0" />
                <span>PM:</span>
                <strong className="text-[#3a7d84] font-bold truncate">
                  {pmName}
                </strong>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[#556987] font-semibold text-[10.5px]">
                  <strong className="text-[#3a7d84]">{completedStages}</strong>/8 Stages
                </span>
                <span className="font-mono font-black text-[9.5px] text-[#1e293b] bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shadow-2xs">
                  {progressPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Invisible Div 3: Right Status Badge + Open Tracker button + Refresh + Chevron */}
          <div className="w-full lg:w-[200px] xl:w-[215px] 2xl:w-[230px] shrink-0 flex items-center justify-end gap-2 sm:gap-2.5 self-end lg:self-center">
            <span
              className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>

            <Link
              href={`/tracker?projectId=${project._id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] text-[11px] font-bold text-[#3a7d84] hover:bg-[#51a8b1] hover:text-white hover:border-[#51a8b1] transition shadow-2xs cursor-pointer"
              title="Open in Tracker workspace"
            >
              <span>Tracker</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </Link>

            {isCardExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchTimeline(true);
                }}
                className="p-1.5 rounded-xl border border-[#b9c0cb]/50 text-[#4a5462] hover:bg-[#f0f8f9] hover:text-[#3a7d84] transition cursor-pointer"
                title="Refresh timeline"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#51a8b1]' : ''}`} />
              </button>
            )}

            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isCardExpanded
                  ? 'bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]'
                  : 'bg-[#f8fafb] text-[#4a5462] border border-[#b9c0cb]/40 group-hover:text-[#3a7d84]'
              }`}
            >
              {isCardExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
        </div>
      )}

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
          project={project}
          currentUser={currentUser}
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
          onSelectNode={handleNodeSelect}
        />
      )}
    </div>
  );
}
