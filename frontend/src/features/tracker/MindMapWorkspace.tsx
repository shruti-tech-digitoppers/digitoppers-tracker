'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { timelineApi } from '../../lib/api/timeline.api';
import { projectsApi } from '../../lib/api/projects.api';
import { employeesApi } from '../../lib/api/employees.api';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IProject } from '../../types/project';
import { IUser } from '../../types/auth';
import { canUpdateNodeStatus, canAssignNode } from '../../lib/permissions';
import { HorizontalRoadmapCanvas } from './HorizontalRoadmapCanvas';
import { NodeInspectorDrawer } from './NodeInspectorDrawer';
import {
  Compass,
  RefreshCw,
  FolderKanban,
  Layers,
  AlertCircle,
  ChevronLeft,
  Building2,
} from 'lucide-react';

export function MindMapWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlProjectId = searchParams.get('projectId');

  const [projects, setProjects] = useState<IProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(urlProjectId || '');
  const [nodes, setNodes] = useState<ITimelineNode[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ITimelineNode | null>(null);

  const selectedNodeIdRef = useRef<string | null>(null);
  selectedNodeIdRef.current = selectedNode?._id || null;

  const [formSchema, setFormSchema] = useState<FormSchemaType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mutating, setMutating] = useState<boolean>(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try { setCurrentUser(JSON.parse(storedUser)); } catch {}
      }
    }

    projectsApi.getProjects()
      .then((res) => {
        const list = res.projects || [];
        setProjects(list);
        if (!selectedProjectId && list.length > 0) {
          setSelectedProjectId(list[0]._id);
        }
      })
      .catch(() => {});

    employeesApi.getEmployees()
      .then((res) => setEmployees(res.employees || []))
      .catch(() => {});
  }, []);

  const fetchTimeline = useCallback(async (projId: string, showGlobalLoading = true) => {
    if (!projId) return;
    try {
      if (showGlobalLoading) setLoading(true);
      setError(null);
      const res = await timelineApi.getTimelineByProjectId(projId);
      const timelineNodes = res.timeline?.nodes || [];
      setNodes(timelineNodes);

      const currentSelectedId = selectedNodeIdRef.current;
      if (currentSelectedId) {
        const findNode = (list: ITimelineNode[]): ITimelineNode | null => {
          for (const n of list) {
            if (n._id === currentSelectedId) return n;
            if (n.children && n.children.length > 0) {
              const found = findNode(n.children);
              if (found) return found;
            }
          }
          return null;
        };
        const updated = findNode(timelineNodes);
        if (updated) setSelectedNode(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load project timeline.');
      setNodes([]);
    } finally {
      if (showGlobalLoading) setLoading(false);
    }
  }, []);

  // When project changes, clear selection and reload
  useEffect(() => {
    if (selectedProjectId) {
      setSelectedNode(null);
      setFormSchema(null);
      setFormData({});
      fetchTimeline(selectedProjectId, true);
    }
  }, [selectedProjectId, fetchTimeline]);

  // Sync URL param → selectedProjectId when URL changes
  useEffect(() => {
    if (urlProjectId && urlProjectId !== selectedProjectId) {
      setSelectedProjectId(urlProjectId);
    }
  }, [urlProjectId]);

  const handleNodeSelect = async (node: ITimelineNode) => {
    setSelectedNode(node);
    setMutationError(null);
    setFormSchema(null);
    setFormData({});

    if (!selectedProjectId) return;

    try {
      const [detailRes, formRes] = await Promise.all([
        timelineApi.getNodeDetail(selectedProjectId, node._id).catch(() => null),
        timelineApi.getNodeForm(selectedProjectId, node._id).catch(() => null),
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
    if (!selectedProjectId || !selectedNode) return;
    try {
      setMutating(true);
      setMutationError(null);
      const res = await timelineApi.updateNodeStatus(selectedProjectId, selectedNode._id, newStatus);
      if (res.node) setSelectedNode(res.node);
      await fetchTimeline(selectedProjectId, false);
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to update node status.');
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
    if (!selectedProjectId || !nodeIdToAssign) return;

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
      await timelineApi.assignNode(selectedProjectId, nodeIdToAssign, empId || null);
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to assign node resource.');
      // Refresh in case of failure to roll back
      await fetchTimeline(selectedProjectId, false);
    }
  };

  const handleFormSubmit = async (updatedFormData: Record<string, any>) => {
    if (!selectedProjectId || !selectedNode) return;
    try {
      const res = await timelineApi.updateNodeForm(selectedProjectId, selectedNode._id, updatedFormData);
      if (res.node) setSelectedNode(res.node);
      const formRes = await timelineApi.getNodeForm(selectedProjectId, selectedNode._id);
      if (formRes) {
        setFormSchema(formRes.formSchema || null);
        setFormData(formRes.formData || {});
      }
      await fetchTimeline(selectedProjectId, false);
    } catch (err: any) {
      setMutationError(err.response?.data?.message || 'Failed to save node form data.');
    }
  };

  const selectedProject = projects.find((p) => p._id === selectedProjectId);
  const canModifyStatus = selectedNode ? canUpdateNodeStatus(currentUser, 'PROJECT_MANAGER', selectedNode) : false;
  const canModifyAssignment = canAssignNode(currentUser, 'PROJECT_MANAGER');

  return (
    <div className="p-6 max-w-[1700px] mx-auto space-y-4">

      {/* ── Header Bar ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3">
          {/* Back to dashboard */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Compass className="w-4 h-4" />
              </span>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Execution Roadmap
              </h1>
            </div>
            {selectedProject && (
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {selectedProject.projectCode} — {selectedProject.title}
              </p>
            )}
          </div>
        </div>

        {/* Right: Project Switcher + Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-xs flex-1 md:flex-none">
            <FolderKanban className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none w-full md:w-72 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-white text-slate-800">
                  {p.projectCode} — {p.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => selectedProjectId && fetchTimeline(selectedProjectId, true)}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition shadow-xs cursor-pointer flex-shrink-0"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main canvas ─────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-3">
          <div className="w-8 h-8 border-[3px] border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading roadmap...</p>
        </div>
      ) : !selectedProjectId ? (
        <div className="text-center py-40 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2 bg-white">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No project selected.</p>
          <p className="text-xs">Select a project from the dropdown above.</p>
        </div>
      ) : nodes.length === 0 ? (
        <div className="text-center py-40 border border-dashed border-slate-300 rounded-2xl text-slate-500 space-y-2 bg-white">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No timeline nodes found.</p>
          <p className="text-xs">Ensure stages are initialized in the backend.</p>
        </div>
      ) : (
        <>
          <HorizontalRoadmapCanvas
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={handleNodeSelect}
            projectCode={selectedProject?.projectCode}
            projectTitle={selectedProject?.title}
            employees={employees}
            onAssign={(nodeId, empId) => handleAssignmentChange(empId, nodeId)}
          />

          <NodeInspectorDrawer
            node={selectedNode}
            employees={employees}
            currentUser={currentUser}
            formSchema={formSchema}
            formData={formData}
            mutating={mutating}
            mutationError={mutationError}
            onClose={() => setSelectedNode(null)}
            onStatusChange={handleStatusChange}
            onAssignmentChange={handleAssignmentChange}
            onFormSubmit={handleFormSubmit}
            canModifyStatus={canModifyStatus}
            canModifyAssignment={canModifyAssignment}
            allNodes={nodes}
          />
        </>
      )}
    </div>
  );
}