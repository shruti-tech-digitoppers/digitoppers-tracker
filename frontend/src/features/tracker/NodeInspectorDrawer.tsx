'use client';

import React, { useState } from 'react';
import { usePermissionContext } from '../../context/PermissionContext';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { IProject } from '../../types/project';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { useClickOutside } from '../../hooks/useClickOutside';
import { getStageTheme } from './utils/stageColorThemes';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  User,
  Lock,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Layers,
  Building2
} from 'lucide-react';

interface NodeInspectorDrawerProps {
  node: ITimelineNode | null;
  employees?: IUser[];
  availableEmployees?: IUser[];
  currentUser?: IUser | null;
  project?: IProject | null;
  isOpen?: boolean;
  formSchema: FormSchemaType | null;
  formData: Record<string, any>;
  mutating?: boolean;
  isMutating?: boolean;
  mutationError?: string | null;
  error?: string | null;
  onClose: () => void;
  onStatusChange: (status: TimelineNodeStatus) => Promise<void>;
  onAssigneeChange?: (employeeId: string, targetNodeId?: string) => Promise<void>;
  onAssignmentChange?: (employeeId: string, targetNodeId?: string) => Promise<void>;
  onFormSubmit: (formData: Record<string, any>) => Promise<void>;
  canModifyStatus?: boolean;
  canEditStatus?: boolean;
  canModifyAssignment?: boolean;
  canAssign?: boolean;
  allNodes?: ITimelineNode[];
}

export const NodeInspectorDrawer: React.FC<NodeInspectorDrawerProps> = ({
  node,
  employees = [],
  availableEmployees = [],
  currentUser = null,
  project = null,
  isOpen = true,
  formSchema,
  formData,
  mutating = false,
  isMutating = false,
  mutationError = null,
  error = null,
  onClose,
  onStatusChange,
  onAssigneeChange,
  onAssignmentChange,
  onFormSubmit,
  canModifyStatus,
  canEditStatus,
  canModifyAssignment,
  canAssign,
  allNodes = [],
}) => {
  const modalRef = useClickOutside<HTMLDivElement>(() => {
    onClose();
  }, { enabled: Boolean(node) });

  if (!node) return null;

  const stageTheme = getStageTheme(node.order || node.key);
  const empList = employees.length > 0 ? employees : availableEmployees;
  const isCurrentlyMutating = mutating || isMutating;
  const currentError = mutationError || error;
  const allowStatusEdit = canModifyStatus !== undefined ? canModifyStatus : (canEditStatus !== undefined ? canEditStatus : true);
  const allowAssignEdit = canModifyAssignment !== undefined ? canModifyAssignment : (canAssign !== undefined ? canAssign : true);
  const handleAssign = onAssignmentChange || onAssigneeChange || (async (employeeId: string, targetNodeId?: string) => { });

  // Read-only permission guard
  const { isReadOnly } = usePermissionContext();

  // Animated one-liner banner state
  const [showReadOnlyBanner, setShowReadOnlyBanner] = useState(false);
  const [bannerKey, setBannerKey] = useState(0);

  const triggerReadOnlyBanner = () => {
    setBannerKey(k => k + 1); // re-trigger animation each time
    setShowReadOnlyBanner(true);
    setTimeout(() => setShowReadOnlyBanner(false), 2800);
  };

  const nodeStatusMap = React.useMemo(() => {
    const map = new Map<string, TimelineNodeStatus>();
    const traverse = (list: ITimelineNode[]) => {
      for (const item of list) {
        if (item.key) map.set(item.key.toUpperCase(), item.status);
        if (item.children) traverse(item.children);
      }
    };
    traverse(allNodes);
    return map;
  }, [allNodes]);

  const execKeys = [
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
    'CONTENT_CONFIGURATION',
    'CONTENT_REVIEW_QA',
    'SHEET_READINESS',
    'DUMP_READINESS',
    'CONTENT_READY'
  ];
  const isExecutionNode = node.key ? execKeys.includes(node.key.toUpperCase()) : false;
  const orderReqStatus = nodeStatusMap.get('ORDER_REQUIREMENT');
  const isExecutionLockedByOrderReq = isExecutionNode && orderReqStatus !== undefined && orderReqStatus !== 'COMPLETED';

  const isGateLocked = isExecutionLockedByOrderReq || Boolean(
    node.dependencies &&
    node.dependencies.length > 0 &&
    node.dependencies.some((depKey) => {
      const depStatus = nodeStatusMap.get(depKey.toUpperCase());
      return depStatus !== 'COMPLETED';
    })
  );

  const isStage1 = node.key === 'PROJECT_REVIEWER' || node.key === 'PROJECT_CREATED' || node.order === 1;

  const statusOptions: { value: TimelineNodeStatus; label: string; icon: any; activeClass: string; inactiveClass: string }[] = [
    {
      value: 'PENDING',
      label: 'Pending',
      icon: Clock,
      activeClass: 'bg-[#4a5462] text-white border-[#4a5462] shadow-xs font-bold',
      inactiveClass: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/50 hover:bg-[#f1f3f6]'
    },
    {
      value: 'IN_PROGRESS',
      label: 'In Progress',
      icon: PlayCircle,
      activeClass: 'bg-[#51a8b1] text-white border-[#51a8b1] shadow-sm shadow-[#51a8b1]/30 font-bold',
      inactiveClass: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4] hover:bg-[#d9eef0]'
    },
    {
      value: 'COMPLETED',
      label: 'Completed',
      icon: CheckCircle2,
      activeClass: 'bg-[#a8cf45] text-[#333333] border-[#a8cf45] shadow-sm shadow-[#a8cf45]/30 font-bold',
      inactiveClass: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6] hover:bg-[#eff8d0]'
    },
    {
      value: 'ON_HOLD',
      label: 'On Hold',
      icon: Clock,
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-sm font-bold',
      inactiveClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
    },
    {
      value: 'CANCELLED',
      label: 'Blocked',
      icon: AlertCircle,
      activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold',
      inactiveClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
    },
  ];

  const currentAssigneeId = typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null
    ? (node.assignedEmployee as any)._id
    : typeof node.assignedTo === 'object' && node.assignedTo !== null
      ? (node.assignedTo as any)._id
      : typeof node.assignedEmployee === 'string'
        ? node.assignedEmployee
        : typeof node.assignedTo === 'string'
          ? node.assignedTo
          : '';

  const currentAssigneeObj = typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null && (node.assignedEmployee as any).name
    ? (node.assignedEmployee as any)
    : typeof node.assignedTo === 'object' && node.assignedTo !== null && (node.assignedTo as any).name
      ? (node.assignedTo as any)
      : empList.find(e => 
          e._id === currentAssigneeId || 
          (e as any).id === currentAssigneeId || 
          e.employeeCode === currentAssigneeId || 
          e.phone === currentAssigneeId ||
          (typeof node.assignedTo === 'object' && (node.assignedTo as any)?.email === e.email)
        ) || null;

  // Extract stage 03 and stage 04 context for seamless cross-stage data flow
  const findNodeRecursive = (list: ITimelineNode[], targetKey: string): ITimelineNode | null => {
    for (const item of list) {
      if (item.key === targetKey) return item;
      if (item.children && item.children.length > 0) {
        const found = findNodeRecursive(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  const stage3SchoolNode = findNodeRecursive(allNodes, 'SCHOOL_ONBOARDING_INFORMATION');
  const stage3SolNode = findNodeRecursive(allNodes, 'SOLUTION_SELECTION');
  const stage3HwNode = findNodeRecursive(allNodes, 'HARDWARE_REQUIREMENT');
  const stage4StockNode = findNodeRecursive(allNodes, 'REQ_AND_STOCK_CHECK');
  const stage4TechNode = findNodeRecursive(allNodes, 'PROJECT_CONFIG_AND_IMPLEMENTATION');

  const resolvedSchools = 
    stage3SchoolNode?.formData?.schools || 
    (project as any)?.orderRequirement?.schoolInformation?.schools || 
    (project as any)?.schools || 
    (stage3SchoolNode?.formData?.schoolName ? [{
      id: 'school-1',
      schoolName: stage3SchoolNode.formData.schoolName,
      address: stage3SchoolNode.formData.address || '',
      classes: stage3SchoolNode.formData.classes || [],
      pocName: stage3SchoolNode.formData.pocName || stage3SchoolNode.formData.contactPerson || '',
      phone: stage3SchoolNode.formData.phone || '',
      email: stage3SchoolNode.formData.email || ''
    }] : []);

  const combinedAllFormData: Record<string, any> = {
    ...(formData || {}),
    schools: resolvedSchools,
    stage3Schools: resolvedSchools,
    stage3SolutionsData: stage3SolNode?.formData || (project as any)?.orderRequirement?.solutionSelection || {},
    stage3SchoolWiseSolutions: stage3SolNode?.formData?.schoolWiseSolutions || (project as any)?.orderRequirement?.solutionSelection?.schoolWiseSolutions || {},
    stage3HardwareData: stage3HwNode?.formData || (project as any)?.orderRequirement?.hardwareRequirement || {},
    stage3HardwareKeys: stage3HwNode?.formData?.activeHardwareKeys || stage3HwNode?.formData?.hardwareRequirements?.activeHardwareKeys || (project as any)?.orderRequirement?.hardwareRequirement?.activeHardwareKeys || [],
    stage3SchoolWiseHardware: stage3HwNode?.formData?.schoolWiseHardware || stage3HwNode?.formData?.hardwareRequirements?.schoolWiseHardware || (project as any)?.orderRequirement?.hardwareRequirement?.schoolWiseHardware || {},
    stage3HardwareItems: stage3HwNode?.formData?.hardwareRequirements?.items || stage3HwNode?.formData?.hardware?.items || stage3HwNode?.formData?.items || (project as any)?.orderRequirement?.hardwareRequirement?.items || {},
    stage4StockItems: stage4StockNode?.formData?.stockCheck?.items || stage4StockNode?.formData?.items || {},
    techApkFileUrl: stage4TechNode?.formData?.apkFileUrl || stage4TechNode?.formData?.appFileUrl || stage4TechNode?.formData?.fileUrl || '',
    techFormData: stage4TechNode?.formData || {},
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Center Floating Modal Container */}
      <div ref={modalRef} className="relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] bg-white border border-[#b9c0cb]/40 shadow-2xl rounded-3xl flex flex-col z-10 text-[#333333] animate-in zoom-in-95 fade-in duration-200 overflow-hidden">

        {/* Modal Header with Integrated Execution Status on the Right and Stage Theme Color */}
        <div className={`px-6 py-4 border-b border-[#f1f3f6] bg-gradient-to-r ${stageTheme.drawerHeaderGradient} flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0`}>
          {/* Left: Stage/Task Info with prominent Project Headline */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stageTheme.drawerIconBg} text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0`}>
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              {/* Project Headline */}
              {project && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#2f4154] text-white shadow-2xs">
                    {project.projectId || 'PROJECT'}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1f2937] tracking-tight truncate max-w-[420px]">
                    {project.projectName || project.title || 'DigiToppers Project'}
                  </span>
                </div>
              )}
              {/* Stage Title with Stage Color Family Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${stageTheme.drawerBadgeBg} ${stageTheme.drawerBadgeText} ${stageTheme.drawerBadgeBorder}`}>
                  {node.key}
                </span>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#1f2937] leading-tight truncate">
                  {node.name}
                </h3>
              </div>
            </div>
          </div>

          {/* Right Column: Status Selector (Top) + Assignee / Project Manager Selector (Bottom) + Close Button */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Top Row: Status Segmented Buttons + Close Modal Button */}
            <div className="flex items-center gap-2 justify-end">
              {/* Status Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-white border border-[#b9c0cb]/40 rounded-xl shadow-2xs">
                {statusOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = node.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      disabled={isCurrentlyMutating || !allowStatusEdit}
                      onClick={() => onStatusChange(opt.value)}
                      title={`Set status to ${opt.label}`}
                      className={`inline-flex items-center justify-center gap-1 py-1 px-2.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer select-none border ${
                        isSelected ? opt.activeClass : opt.inactiveClass
                      } ${!allowStatusEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-3 h-3 flex-shrink-0" />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Close Modal Button */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] border border-[#b9c0cb]/40 hover:border-[#51a8b1]/50 bg-white transition cursor-pointer shrink-0 shadow-2xs"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

                      {/* Bottom Row: Shifted Assign / Project Manager Component directly under Status */}
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[11px] font-bold text-[#556987] flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-[#51a8b1]" />
                {isStage1 ? 'Project Manager:' : 'Assigned To:'}
              </span>
              {(allowAssignEdit && !isReadOnly) ? (
                <select
                  disabled={isCurrentlyMutating}
                  value={currentAssigneeId}
                  onChange={(e) => handleAssign(e.target.value)}
                  className="border border-[#b6e0e4] bg-[#f0f8f9] text-[#3a7d84] rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#51a8b1] disabled:opacity-50 cursor-pointer max-w-[220px] truncate shadow-2xs hover:border-[#51a8b1]"
                >
                  <option value="">{isStage1 ? 'Select Project Manager' : 'Unassigned'}</option>
                  {empList.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                /* Read-only pill — click triggers animated banner */
                <button
                  type="button"
                  onClick={isReadOnly ? triggerReadOnlyBanner : undefined}
                  className="border border-[#b6e0e4] bg-[#f0f8f9] rounded-xl px-2.5 py-1 text-xs text-[#3a7d84] flex items-center gap-1 font-bold shadow-2xs truncate max-w-[220px] cursor-default select-none"
                  title={isReadOnly ? 'You have read-only access' : `${isStage1 ? 'Project Manager' : 'Assigned to'}: ${currentAssigneeObj?.name || 'Unassigned'}`}
                >
                  {currentAssigneeObj ? (
                    <>
                      <span className="truncate">{currentAssigneeObj.name}</span>
                      {currentAssigneeObj.employeeCode && (
                        <span className="text-[10px] opacity-75 font-mono">[{currentAssigneeObj.employeeCode}]</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 italic">
                      {isStage1 ? 'No Project Manager Assigned' : 'Unassigned'}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Error Notice if any */}
          {currentError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold font-heading">Action Failed</p>
                <p>{currentError}</p>
              </div>
            </div>
          )}

          {/* Dependencies / Gate Check Warning */}
          {isGateLocked && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-xs">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold font-heading">Stage Gate Notice</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {isExecutionLockedByOrderReq
                    ? 'Awaiting completion of Stage 03 (Order Requirement). Stage 04 Execution Phase will automatically start once Order Requirement is completed.'
                    : `Requires completion of: ${node.dependencies?.join(', ')}`}
                </p>
              </div>
            </div>
          )}

                    {/* Sub-Tasks & Stages Assignment Section */}
          {/* Animated Read-Only Banner — slides in from left below header */}
          {isReadOnly && (
            <div
              key={bannerKey}
              className={`overflow-hidden transition-all duration-300 ${showReadOnlyBanner ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-xs">
                <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                <p className="text-xs font-semibold text-amber-700 tracking-wide">
                  🔒 You have <strong>read-only access</strong> — contact an Admin to assign employees.
                </p>
              </div>
            </div>
          )}

          {(() => {
            const getChildrenList = (): ITimelineNode[] => {
              if (node.children && node.children.length > 0) return node.children;
              const findInTree = (list: ITimelineNode[]): ITimelineNode[] => {
                for (const item of list) {
                  if (item._id === node._id) return item.children || [];
                  if (item.children && item.children.length > 0) {
                    const found = findInTree(item.children);
                    if (found.length > 0) return found;
                  }
                }
                return [];
              };
              return findInTree(allNodes);
            };

            const subTasksList = (getChildrenList() || []).filter(c => c.key !== 'PI_REQUEST');
            if (!subTasksList || subTasksList.length === 0) return null;

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
                    <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Sub-Stages / Tasks & Assigned Employees ({subTasksList.length})
                  </label>
                  <span className="text-[10px] text-[#556987] font-medium">
                    Assigned employees will be rendered in the timeline
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {subTasksList.map((child, index) => {
                    const childAssigneeObj =
                      typeof child.assignedEmployee === 'object' && child.assignedEmployee !== null
                        ? child.assignedEmployee as any
                        : typeof child.assignedTo === 'object' && child.assignedTo !== null
                          ? child.assignedTo as any
                          : null;

                    const childAssigneeId =
                      childAssigneeObj?._id ||
                      (typeof child.assignedEmployee === 'string' ? child.assignedEmployee : '') ||
                      (typeof child.assignedTo === 'string' ? child.assignedTo : '');

                    const assignedEmp = empList.find(e => e._id === childAssigneeId);
                    const childStatus = child.status || 'PENDING';

                    return (
                      <div
                        key={child._id || `subtask-${index}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-[#b6e0e4] hover:border-[#51a8b1] rounded-2xl shadow-2xs hover:shadow-xs transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex items-center justify-center w-6 h-6 rounded-xl text-[11px] font-mono font-black shrink-0 bg-[#f0f8f9] border border-[#b6e0e4] text-[#3a7d84] shadow-2xs">
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-[#1f2937] font-heading truncate">
                                {child.name}
                              </span>
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${childStatus === 'COMPLETED'
                                  ? 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]'
                                  : childStatus === 'IN_PROGRESS'
                                    ? 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]'
                                    : 'bg-[#f8fafb] text-[#556987] border-[#b9c0cb]/40'
                                }`}>
                                {childStatus}
                              </span>
                            </div>
                            <div className="mt-0.5">
                              <span className="text-[10px] font-mono font-bold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4] px-1.5 py-0.5 rounded-md">
                                {child.key || 'TASK'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full sm:w-64 shrink-0">
                          {(allowAssignEdit && !isReadOnly) ? (
                            <div className="flex items-center gap-1.5">
                              <User className={`w-3.5 h-3.5 shrink-0 ${childAssigneeId ? 'text-[#3a7d84]' : 'text-[#b9c0cb]'}`} />
                              <select
                                disabled={isCurrentlyMutating}
                                value={childAssigneeId}
                                onChange={(e) => handleAssign(e.target.value, child._id)}
                                className="w-full border border-[#b6e0e4] bg-[#f0f8f9] text-[#3a7d84] rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#51a8b1] disabled:opacity-50 cursor-pointer shadow-2xs hover:border-[#51a8b1]"
                                title="Assign employee for this task"
                              >
                                <option value="">👤 Unassigned</option>
                                {empList.map((emp) => (
                                  <option key={emp._id} value={emp._id}>
                                    {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            /* Read-only: clickable pill that triggers the banner */
                            <button
                              type="button"
                              onClick={isReadOnly ? triggerReadOnlyBanner : undefined}
                              className="flex items-center gap-1.5 w-full text-xs bg-[#f0f8f9] border border-[#b6e0e4] px-3 py-1.5 rounded-xl text-[#3a7d84] font-bold justify-between shadow-2xs cursor-default select-none"
                              title={isReadOnly ? '🔒 Read-only — contact Admin to assign' : 'Assigned employee'}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <User className={`w-3.5 h-3.5 shrink-0 ${assignedEmp || childAssigneeObj ? 'text-[#3a7d84]' : 'text-[#94a3b8]'}`} />
                                {assignedEmp || childAssigneeObj ? (
                                  <span className="truncate">Assigned to: <strong className="text-[#3a7d84]">{(assignedEmp || childAssigneeObj).name}</strong></span>
                                ) : (
                                  <span className="text-[#94a3b8] font-medium">Unassigned</span>
                                )}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Dynamic Stage / Task Form */}
          <div className="space-y-3">
            <DynamicFormRenderer
              schema={formSchema || (node.formSchema as any)}
              initialData={formData || (node.formData as any) || {}}
              onSubmit={onFormSubmit}
              disabled={isCurrentlyMutating}
              employees={empList}
              allFormData={combinedAllFormData}
              project={project}
              currentUser={currentUser}
              onStatusChange={onStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
