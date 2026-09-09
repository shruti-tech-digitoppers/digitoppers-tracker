'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ITimelineNode, TimelineNodeStatus } from '../../types/timeline';
import { IProject } from '../../types/project';
import { CanvasToolbar } from './components/CanvasToolbar';
import { StageMilestone } from './components/StageMilestone';
import { ExecutionParallelContainer } from './components/ExecutionParallelContainer';
import { Compass } from 'lucide-react';

import { IUser } from '../../types/auth';

interface HorizontalRoadmapCanvasProps {
  project?: IProject | null;
  nodes: ITimelineNode[];
  selectedNode?: ITimelineNode | null;
  selectedNodeId?: string | null;
  onSelectNode: (node: ITimelineNode) => void;
  hideProjectHeader?: boolean;
  projectCode?: string;
  projectTitle?: string;
  employees?: IUser[];
  onAssign?: (nodeId: string, empId: string) => void;
}

export function HorizontalRoadmapCanvas({
  project,
  nodes,
  selectedNode: propSelectedNode,
  selectedNodeId,
  onSelectNode,
  hideProjectHeader = false,
  projectCode,
  projectTitle,
  employees = [],
  onAssign,
}: HorizontalRoadmapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Auto-expand all stage nodes on initial load, preserving existing state
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    setExpandedNodes((prev) => {
      let changed = false;
      const nextExpanded = { ...prev };
      const expandAllRecursive = (list: ITimelineNode[]) => {
        list.forEach((node) => {
          if (nextExpanded[node._id] === undefined) {
            nextExpanded[node._id] = true;
            changed = true;
          }
          if (node.children && node.children.length > 0) {
            expandAllRecursive(node.children);
          }
        });
      };
      expandAllRecursive(nodes);
      return changed ? nextExpanded : prev;
    });
  }, [nodes]);

  const toggleNodeExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const isNodeExpanded = (nodeId: string) => {
    return expandedNodes[nodeId] !== undefined ? expandedNodes[nodeId] : true;
  };

  const effectiveSelectedNodeId = selectedNodeId || propSelectedNode?._id;

  // Map of node key -> status for gate/dependency lock calculations
  const nodeStatusMap = useMemo(() => {
    const map = new Map<string, TimelineNodeStatus>();
    const traverse = (list: ITimelineNode[]) => {
      for (const item of list) {
        if (item.key) map.set(item.key.toUpperCase(), item.status);
        if (item.children) traverse(item.children);
      }
    };
    traverse(nodes);
    return map;
  }, [nodes]);

  const isGateLocked = (node: ITimelineNode) => {
    if (!node.dependencies || node.dependencies.length === 0) return false;
    return node.dependencies.some((depKey) => {
      const depStatus = nodeStatusMap.get(depKey.toUpperCase());
      return depStatus !== 'COMPLETED';
    });
  };

  // Overall calculations
  const totalStages = nodes.length;
  const completedStages = nodes.filter((n) => n.status === 'COMPLETED').length;
  const overallProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

  // Separate stages: Pre-Execution, Execution, Post-Execution
  const executionStage = nodes.find((n) => {
    const k = (n.key || '').toUpperCase();
    const nm = (n.name || '').toUpperCase();
    return k === 'EXECUTION' || k.includes('EXECUTION') || nm.includes('EXECUTION');
  });

  const preExecutionStages = useMemo(() => {
    return nodes.filter((n) => {
      const k = (n.key || '').toUpperCase();
      const nm = (n.name || '').toUpperCase();
      if (executionStage && n._id === executionStage._id) return false;
      if (k === 'EXECUTION' || k.includes('EXECUTION') || nm.includes('EXECUTION')) return false;

      // If it has post-execution keywords, exclude
      const isPost =
        k.includes('TECH_AND_CONTENT') ||
        k.includes('TEST') ||
        k.includes('INSTALLATION') ||
        k.includes('TRAINING') ||
        k.includes('CLOSURE') ||
        nm.includes('TESTING') ||
        nm.includes('INSTALLATION') ||
        nm.includes('TRAINING') ||
        nm.includes('CLOSURE');

      if (isPost) return false;

      // Otherwise if executionStage exists, check order or default to pre
      if (executionStage && (n.metadata as any)?.order && (executionStage.metadata as any)?.order) {
        return (n.metadata as any).order < (executionStage.metadata as any).order;
      }
      return true;
    });
  }, [nodes, executionStage]);

  const postExecutionStages = useMemo(() => {
    return nodes.filter((n) => {
      if (executionStage && n._id === executionStage._id) return false;
      const k = (n.key || '').toUpperCase();
      const nm = (n.name || '').toUpperCase();
      if (k === 'EXECUTION' || k.includes('EXECUTION') || nm.includes('EXECUTION')) return false;

      const isPost =
        k.includes('TECH_AND_CONTENT') ||
        k.includes('TEST') ||
        k.includes('INSTALLATION') ||
        k.includes('TRAINING') ||
        k.includes('CLOSURE') ||
        nm.includes('TESTING') ||
        nm.includes('INSTALLATION') ||
        nm.includes('TRAINING') ||
        nm.includes('CLOSURE');

      return isPost;
    });
  }, [nodes, executionStage]);

  const matchesFilter = (n: ITimelineNode) => {
    if (filterStatus === 'ALL') return true;
    return n.status === filterStatus;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafb] select-none font-sans">
      {/* ── Top Header Toolbar ─────────────────────────────── */}
      <CanvasToolbar
        project={project}
        projectCode={projectCode}
        projectTitle={projectTitle}
        hideProjectHeader={hideProjectHeader}
        totalStages={totalStages}
        completedStages={completedStages}
        overallProgress={overallProgress}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        zoom={zoom}
        onZoomIn={() => setZoom((prev) => Math.min(1.4, prev + 0.1))}
        onZoomOut={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
        onResetZoom={() => setZoom(1)}
      />

      {/* ── Main Mindmap Canvas Area ───────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto p-6 relative bg-[radial-gradient(#b9c0cb_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#4a5462] gap-2">
            <Compass className="w-8 h-8 text-[#b9c0cb] animate-pulse" />
            <p className="text-xs font-semibold">No roadmap stages configured for this project template.</p>
          </div>
        ) : (
          <div
            className="flex items-start gap-2.5 min-w-max pb-20 transition-transform duration-200 origin-top-left"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* 1. PRE-EXECUTION SEQUENTIAL STAGES */}
            {preExecutionStages.map((stage, idx) => (
              <StageMilestone
                key={stage._id}
                stage={stage}
                orderNumber={idx + 1}
                selectedNodeId={effectiveSelectedNodeId}
                isNodeExpanded={isNodeExpanded}
                toggleNodeExpand={toggleNodeExpand}
                isGateLocked={isGateLocked}
                matchesFilter={matchesFilter}
                onSelectNode={onSelectNode}
                showConnector={true}
                employees={employees}
                onAssign={onAssign}
              />
            ))}

            {/* 2. PARALLEL EXECUTION CONTAINER (Stage 04: Hardware, Tech, Content) */}
            {executionStage && (
              <ExecutionParallelContainer
                executionStage={executionStage}
                selectedNodeId={effectiveSelectedNodeId}
                isNodeExpanded={isNodeExpanded}
                toggleNodeExpand={toggleNodeExpand}
                isGateLocked={isGateLocked}
                matchesFilter={matchesFilter}
                onSelectNode={onSelectNode}
                employees={employees}
                onAssign={onAssign}
              />
            )}

            {/* 3. POST-EXECUTION CONVERGENCE STAGES */}
            {postExecutionStages.map((stage, idx) => (
              <StageMilestone
                key={stage._id}
                stage={stage}
                orderNumber={idx + 5}
                selectedNodeId={effectiveSelectedNodeId}
                isNodeExpanded={isNodeExpanded}
                toggleNodeExpand={toggleNodeExpand}
                isGateLocked={isGateLocked}
                matchesFilter={matchesFilter}
                onSelectNode={onSelectNode}
                showConnector={idx < postExecutionStages.length - 1}
                employees={employees}
                onAssign={onAssign}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
