'use client';

import React, { useMemo } from 'react';
import { usePermissionContext } from '../../context/PermissionContext';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { IProject } from '../../types/project';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { useClickOutside } from '../../hooks/useClickOutside';
import { getStageTheme } from './utils/stageColorThemes';
import { OrderRequirementPdfBanner } from './components/OrderRequirementPdfBanner';
import {
  X,
  Check,
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
  Building2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react';
import { formatTimelineDate, formatTimeAgo } from './utils/timeFormat';

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
  onSelectNode?: (node: ITimelineNode) => void;
  onNavigateNode?: (node: ITimelineNode) => void;
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
  onSelectNode,
  onNavigateNode,
  canModifyStatus,
  canEditStatus,
  canModifyAssignment,
  canAssign,
  allNodes = [],
}) => {
  const handleNavigate = onSelectNode || onNavigateNode;

  const [isFormDirty, setIsFormDirty] = React.useState<boolean>(false);
  const [assignedEmployeeMap, setAssignedEmployeeMap] = React.useState<Record<string, string>>({});
  const [initialAssignedEmployeeMap, setInitialAssignedEmployeeMap] = React.useState<Record<string, string>>({});
  const [showUnsavedWarning, setShowUnsavedWarning] = React.useState<boolean>(false);
  const [pendingAction, setPendingAction] = React.useState<{ type: 'CLOSE' } | { type: 'NAVIGATE'; targetNode: ITimelineNode } | null>(null);
  const formRef = React.useRef<{ submitForm: () => Promise<void>; isDirty: () => boolean; getFormData: () => Record<string, any> } | null>(null);

  const getChildrenList = React.useCallback((): ITimelineNode[] => {
    if (!node) return [];
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
  }, [node, allNodes]);

  // Reset dirty state & populate employee assignment snapshot when switching node
  React.useEffect(() => {
    if (!node) return;
    const initialMap: Record<string, string> = {};
    const nodeAssigneeId =
      typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null
        ? (node.assignedEmployee as any)._id
        : typeof node.assignedTo === 'object' && node.assignedTo !== null
          ? (node.assignedTo as any)._id
          : typeof node.assignedEmployee === 'string'
            ? node.assignedEmployee
            : typeof node.assignedTo === 'string'
              ? node.assignedTo
              : '';
    initialMap[node._id] = nodeAssigneeId || '';

    const children = getChildrenList() || [];
    for (const child of children) {
      if (!child || !child._id) continue;
      const childAssigneeObj =
        typeof child.assignedEmployee === 'object' && child.assignedEmployee !== null
          ? (child.assignedEmployee as any)
          : typeof child.assignedTo === 'object' && child.assignedTo !== null
            ? (child.assignedTo as any)
            : null;
      const childAssigneeId =
        childAssigneeObj?._id ||
        (typeof child.assignedEmployee === 'string' ? child.assignedEmployee : '') ||
        (typeof child.assignedTo === 'string' ? child.assignedTo : '');
      initialMap[child._id] = childAssigneeId || '';
    }

    setAssignedEmployeeMap(initialMap);
    setInitialAssignedEmployeeMap(initialMap);
    setIsFormDirty(false);
    setShowUnsavedWarning(false);
    setPendingAction(null);
  }, [node?._id, getChildrenList]);

  const isAssignDirty = React.useMemo(() => {
    for (const [id, empId] of Object.entries(assignedEmployeeMap)) {
      if ((initialAssignedEmployeeMap[id] || '') !== (empId || '')) {
        return true;
      }
    }
    return false;
  }, [assignedEmployeeMap, initialAssignedEmployeeMap]);

  const isDirty = isFormDirty || isAssignDirty;

  const requestClose = () => {
    if (isDirty) {
      setPendingAction({ type: 'CLOSE' });
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const requestNavigate = (targetNode: ITimelineNode) => {
    if (isDirty) {
      setPendingAction({ type: 'NAVIGATE', targetNode });
      setShowUnsavedWarning(true);
    } else if (handleNavigate) {
      handleNavigate(targetNode);
    }
  };

  const modalRef = useClickOutside<HTMLDivElement>(() => {
    requestClose();
  }, { enabled: Boolean(node) });

  // Native browser prompt on tab close / reload if dirty
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const flatNodes = React.useMemo(() => {
    const result: ITimelineNode[] = [];
    const traverse = (list: ITimelineNode[]) => {
      for (const item of list) {
        if (!item) continue;
        if (item.key === 'PI_REQUEST' || item.key === 'INSTALLATION_TESTING') continue;
        result.push(item);
        if (item.children && Array.isArray(item.children) && item.children.length > 0) {
          traverse(item.children);
        }
      }
    };
    traverse(allNodes);
    return result;
  }, [allNodes]);

  const currentIndex = React.useMemo(() => {
    if (!node) return -1;
    return flatNodes.findIndex(
      (n) => n._id === node._id || (node.key && n.key === node.key)
    );
  }, [flatNodes, node]);

  const prevNode = currentIndex > 0 ? flatNodes[currentIndex - 1] : null;
  const nextNode = currentIndex >= 0 && currentIndex < flatNodes.length - 1 ? flatNodes[currentIndex + 1] : null;

  // Keyboard navigation shortcuts: Alt + ArrowLeft / Alt + ArrowRight or Arrow keys when not typing
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.altKey && e.key === 'ArrowLeft') || e.key === 'ArrowLeft') {
        if (prevNode && handleNavigate) {
          e.preventDefault();
          requestNavigate(prevNode);
        }
      } else if ((e.altKey && e.key === 'ArrowRight') || e.key === 'ArrowRight') {
        if (nextNode && handleNavigate) {
          e.preventDefault();
          requestNavigate(nextNode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevNode, nextNode, handleNavigate, isFormDirty]);

  if (!node || !currentUser) return null;

  const stageTheme = getStageTheme(node.order || node.key);
  const empList = employees.length > 0 ? employees : availableEmployees;
  const isCurrentlyMutating = mutating || isMutating;
  const currentError = mutationError || error;
  const allowStatusEdit = canModifyStatus !== undefined ? canModifyStatus : (canEditStatus !== undefined ? canEditStatus : true);
  const allowAssignEdit = canModifyAssignment !== undefined ? canModifyAssignment : (canAssign !== undefined ? canAssign : true);
  const handleAssign = onAssignmentChange || onAssigneeChange || (async (employeeId: string, targetNodeId?: string) => { });

  // Read-only permission guard + global bottom toast
  const { isReadOnly, showReadOnlyToast } = usePermissionContext();

  const triggerReadOnlyBanner = () => {
    showReadOnlyToast('🔒 Read-only access — contact an Admin to assign employees.');
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

  const currentSelectedAssigneeId = assignedEmployeeMap[node._id] !== undefined
    ? assignedEmployeeMap[node._id]
    : currentAssigneeId;

  const currentAssigneeObj = empList.find(e => e._id === currentSelectedAssigneeId) ||
    (typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null && (node.assignedEmployee as any).name
      ? (node.assignedEmployee as any)
      : typeof node.assignedTo === 'object' && node.assignedTo !== null && (node.assignedTo as any).name
        ? (node.assignedTo as any)
        : null);

  // Extract stage 03 and stage 04 context for seamless cross-stage data flow
  const findNodeRecursive = (list: ITimelineNode[], targetKey: string): ITimelineNode | null => {
    if (!Array.isArray(list)) return null;
    for (const item of list) {
      const k = (item.key || '').toUpperCase();
      const target = targetKey.toUpperCase();
      if (k === target || k.includes(target) || (target === 'SCHOOL_ONBOARDING_INFORMATION' && (k.includes('SCHOOL') || (item.name || '').toLowerCase().includes('school')))) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findNodeRecursive(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  const stage3SchoolNode = useMemo(() => findNodeRecursive(allNodes, 'SCHOOL_ONBOARDING_INFORMATION'), [allNodes]);
  const stage3SolNode = useMemo(() => findNodeRecursive(allNodes, 'SOLUTION_SELECTION'), [allNodes]);
  const stage3HwNode = useMemo(() => findNodeRecursive(allNodes, 'HARDWARE_REQUIREMENT'), [allNodes]);
  const stage3ContentNode = useMemo(() => findNodeRecursive(allNodes, 'CONTENT_CONFIGURATION'), [allNodes]);
  const stage4StockNode = useMemo(() => findNodeRecursive(allNodes, 'REQ_AND_STOCK_CHECK'), [allNodes]);
  const stage4TechNode = useMemo(() => findNodeRecursive(allNodes, 'PROJECT_CONFIG_AND_IMPLEMENTATION'), [allNodes]);

  const resolvedSchools = useMemo(() => {
    // 1. Check current node formData.schools
    if (Array.isArray(formData?.schools) && formData.schools.length > 0) {
      return formData.schools;
    }
    // 2. Check stage3SchoolNode.formData.schools
    if (Array.isArray(stage3SchoolNode?.formData?.schools) && stage3SchoolNode.formData.schools.length > 0) {
      return stage3SchoolNode.formData.schools;
    }
    // 3. Search allNodes for any node containing DB schools
    if (Array.isArray(allNodes)) {
      for (const n of allNodes) {
        if (Array.isArray(n.formData?.schools) && n.formData.schools.length > 0) {
          return n.formData.schools;
        }
      }
    }
    // 4. Check project schools from database
    const projSchools =
      (project as any)?.schools ||
      (project as any)?.orderRequirement?.schoolInformation?.schools ||
      (project as any)?.orderRequirement?.schools;
    if (Array.isArray(projSchools) && projSchools.length > 0) {
      return projSchools;
    }
    return [];
  }, [stage3SchoolNode, formData, project, allNodes]);

  const combinedAllFormData: Record<string, any> = React.useMemo(() => ({
    ...(formData || {}),
    schools: resolvedSchools,
    stage3Schools: resolvedSchools,
    projectSchools: resolvedSchools,
    stage3SolutionsData: stage3SolNode?.formData || (project as any)?.orderRequirement?.solutionSelection || {},
    stage3SchoolWiseSolutions: stage3SolNode?.formData?.schoolWiseSolutions || (project as any)?.orderRequirement?.solutionSelection?.schoolWiseSolutions || {},
    stage3HardwareData: stage3HwNode?.formData || (project as any)?.orderRequirement?.hardwareRequirement || {},
    stage3HardwareKeys: stage3HwNode?.formData?.activeHardwareKeys || stage3HwNode?.formData?.hardwareRequirements?.activeHardwareKeys || (project as any)?.orderRequirement?.hardwareRequirement?.activeHardwareKeys || [],
    stage3SchoolWiseHardware: stage3HwNode?.formData?.schoolWiseHardware || stage3HwNode?.formData?.hardwareRequirements?.schoolWiseHardware || (project as any)?.orderRequirement?.hardwareRequirement?.schoolWiseHardware || {},
    stage3HardwareItems: stage3HwNode?.formData?.hardwareRequirements?.items || stage3HwNode?.formData?.hardware?.items || stage3HwNode?.formData?.items || (project as any)?.orderRequirement?.hardwareRequirement?.items || {},
    // REQ_AND_STOCK_CHECK saves as: { stockCheck: { items: { IFP_PANEL: { stockDecision, purchaseQty, ... } } } }
    // Resolve all possible paths to get the stock check items
    stage4StockItems: (
      stage4StockNode?.formData?.stockCheck?.items ||
      stage4StockNode?.formData?.items ||
      stage4StockNode?.formData?.stockCheckItems ||
      (project as any)?.execution?.hardware?.reqAndStockCheck?.stockCheck?.items ||
      {}
    ),
    // Raw full formData of REQ_AND_STOCK_CHECK node for direct access
    stage4StockNodeFormData: stage4StockNode?.formData || {},
    techApkFileUrl: stage4TechNode?.formData?.apkFileUrl || stage4TechNode?.formData?.appFileUrl || stage4TechNode?.formData?.fileUrl || '',
    techFormData: stage4TechNode?.formData || {},
    stage3ContentNode: stage3ContentNode?.formData || {},
    stage3ContentData: stage3ContentNode?.formData?.contentSets || stage3ContentNode?.formData || (project as any)?.orderRequirement?.contentConfiguration?.contentSets || (project as any)?.orderRequirement?.contentConfiguration || {},
    contentConfigData: stage3ContentNode?.formData?.contentSets || stage3ContentNode?.formData || (project as any)?.orderRequirement?.contentConfiguration?.contentSets || (project as any)?.orderRequirement?.contentConfiguration || {},
  }), [
    formData,
    resolvedSchools,
    stage3SolNode,
    stage3HwNode,
    stage3ContentNode,
    stage4StockNode,
    stage4TechNode,
    project
  ]);

  const memoizedInitialData = React.useMemo(() => {
    return formData || (node.formData as any) || {};
  }, [formData, node?._id, node?.formData]);

  const [justSaved, setJustSaved] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const handleFooterSave = async () => {
    if (isSaving || isCurrentlyMutating) return;
    try {
      setIsSaving(true);

      // 1. Save any pending employee assignments
      if (isAssignDirty) {
        for (const [id, empId] of Object.entries(assignedEmployeeMap)) {
          if ((initialAssignedEmployeeMap[id] || '') !== (empId || '')) {
            await handleAssign(empId, id === node._id ? undefined : id);
          }
        }
        setInitialAssignedEmployeeMap({ ...assignedEmployeeMap });
      }

      // 2. Save form data if form is dirty or formRef exists
      if (formRef.current && (isFormDirty || formRef.current.isDirty())) {
        await formRef.current.submitForm();
        setIsFormDirty(false);
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: any) {
      console.error('Failed to save stage changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 md:p-8 font-sans">
      {/* Backdrop */}
      <div
        onClick={requestClose}
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
              {/* Stage / Task Title */}
              <div className="flex items-center gap-2.5 flex-wrap">
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
                onClick={requestClose}
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
                  disabled={isCurrentlyMutating || isSaving}
                  value={currentSelectedAssigneeId}
                  onChange={(e) => {
                    const newEmpId = e.target.value;
                    setAssignedEmployeeMap((prev) => ({
                      ...prev,
                      [node._id]: newEmpId,
                    }));
                  }}
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

            {/* Row 3: Quick Prev / Next Navigation Pill directly under Assigned To */}
            {flatNodes.length > 1 && handleNavigate && (
              <div className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-xs border border-[#b9c0cb]/50 rounded-xl p-0.5 shadow-2xs justify-end mt-0.5">
                <button
                  type="button"
                  disabled={!prevNode || isCurrentlyMutating}
                  onClick={() => prevNode && requestNavigate(prevNode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    prevNode && !isCurrentlyMutating
                      ? 'text-[#2f4154] hover:bg-[#f0f8f9] hover:text-[#3a7d84] border border-transparent hover:border-[#b6e0e4] cursor-pointer active:scale-95'
                      : 'text-[#94a3b8] opacity-40 cursor-not-allowed border border-transparent'
                  }`}
                  title={prevNode ? `Previous: ${prevNode.name} (Alt+←)` : 'No previous stage/task'}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-[#f1f3f6] text-[#4a5462]">
                  {currentIndex >= 0 ? `${currentIndex + 1}/${flatNodes.length}` : '—'}
                </span>

                <button
                  type="button"
                  disabled={!nextNode || isCurrentlyMutating}
                  onClick={() => nextNode && requestNavigate(nextNode)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    nextNode && !isCurrentlyMutating
                      ? 'text-[#2f4154] hover:bg-[#f0f8f9] hover:text-[#3a7d84] border border-transparent hover:border-[#b6e0e4] cursor-pointer active:scale-95'
                      : 'text-[#94a3b8] opacity-40 cursor-not-allowed border border-transparent'
                  }`}
                  title={nextNode ? `Next: ${nextNode.name} (Alt+→)` : 'No next stage/task'}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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

          {/* Stage 03 Order Requirement Handover Specification in PDF Form */}
          <OrderRequirementPdfBanner
            node={node}
            allNodes={allNodes}
            project={project}
            allFormData={combinedAllFormData}
          />

          {/* Sub-Tasks & Stages Assignment Section */}

          {(() => {
            const subTasksList = (getChildrenList() || []).filter(
              c => c.key !== 'PI_REQUEST' && c.key !== 'INSTALLATION_TESTING'
            );
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

                    const childSelectedAssigneeId = assignedEmployeeMap[child._id] !== undefined
                      ? assignedEmployeeMap[child._id]
                      : childAssigneeId;

                    const assignedEmp = empList.find(e => e._id === childSelectedAssigneeId);
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
                          </div>
                        </div>

                        <div className="w-full sm:w-64 shrink-0">
                          {(allowAssignEdit && !isReadOnly) ? (
                            <div className="flex items-center gap-1.5">
                              <User className={`w-3.5 h-3.5 shrink-0 ${childSelectedAssigneeId ? 'text-[#3a7d84]' : 'text-[#b9c0cb]'}`} />
                              <select
                                disabled={isCurrentlyMutating || isSaving}
                                value={childSelectedAssigneeId}
                                onChange={(e) => {
                                  const newEmpId = e.target.value;
                                  setAssignedEmployeeMap((prev) => ({
                                    ...prev,
                                    [child._id]: newEmpId,
                                  }));
                                }}
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
              initialData={memoizedInitialData}
              onSubmit={onFormSubmit}
              disabled={isCurrentlyMutating}
              employees={empList}
              allFormData={combinedAllFormData}
              project={project}
              currentUser={currentUser}
              onStatusChange={onStatusChange}
              onDirtyChange={(dirty) => setIsFormDirty(dirty)}
              formRef={formRef}
              hideFooter={true}
            />
          </div>
        </div>

        {/* Unified Modal Footer with Previous, Timestamp Info, Save Action & Next Navigation */}
        <div className="px-6 py-3.5 bg-[#f8fafc]/95 backdrop-blur-xs border-t border-[#e2e8f0] shadow-[0_-4px_16px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Previous Stage / Task Button */}
          {flatNodes.length > 1 && handleNavigate ? (
            <button
              type="button"
              disabled={!prevNode || isCurrentlyMutating}
              onClick={() => prevNode && requestNavigate(prevNode)}
              className={`h-[42px] inline-flex items-center gap-2.5 px-3.5 rounded-xl text-xs font-bold transition-all border ${
                prevNode && !isCurrentlyMutating
                  ? 'bg-white text-[#1e293b] border-[#cbd5e1] hover:bg-[#f0f8f9] hover:text-[#3a7d84] hover:border-[#51a8b1] shadow-2xs hover:shadow-xs cursor-pointer active:scale-95'
                  : 'bg-white/60 text-[#94a3b8] border-[#e2e8f0] opacity-40 cursor-not-allowed'
              }`}
              title={prevNode ? `Previous: ${prevNode.name} (Alt+←)` : 'No previous stage/task'}
            >
              <div className="w-6 h-6 rounded-lg bg-[#51a8b1]/10 flex items-center justify-center text-[#3a7d84] shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#64748b]">Previous</span>
                <span className="font-bold text-[#0f172a] text-[11.5px] truncate max-w-[130px] sm:max-w-[180px]">
                  {prevNode ? prevNode.name : 'First Stage'}
                </span>
              </div>
            </button>
          ) : <div />}

          {/* Right Group: Save Button + Next Stage / Task Button */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Save Button */}
            <button
              type="button"
              disabled={isSaving || isCurrentlyMutating || (!isDirty && !justSaved)}
              onClick={handleFooterSave}
              className={`h-[42px] inline-flex items-center gap-2 px-4 rounded-xl text-xs font-bold transition-all border ${
                justSaved
                  ? 'bg-[#10b981] text-white border-[#10b981] shadow-xs cursor-default'
                  : isDirty
                    ? 'bg-[#51a8b1] hover:bg-[#3a7d84] text-white border-[#51a8b1] shadow-xs hover:shadow-md cursor-pointer active:scale-95'
                    : 'bg-white border-[#cbd5e1]/80 text-[#64748b] cursor-default shadow-2xs'
              }`}
            >
              {isSaving || isCurrentlyMutating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin !text-white" style={{ color: '#ffffff' }} />
                  <span className="!text-white font-bold" style={{ color: '#ffffff' }}>Saving...</span>
                </>
              ) : justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} />
                  <span className="!text-white font-bold" style={{ color: '#ffffff' }}>Saved!</span>
                </>
              ) : isDirty ? (
                <>
                  <Save className="w-3.5 h-3.5 !text-white" style={{ color: '#ffffff' }} />
                  <span className="!text-white font-bold" style={{ color: '#ffffff' }}>Save Changes</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  <span className="text-[#334155] font-bold">Saved</span>
                </>
              )}
            </button>

            {/* Next Stage / Task Button with Guaranteed White Typography */}
            {flatNodes.length > 1 && handleNavigate && (
              <button
                type="button"
                disabled={!nextNode || isCurrentlyMutating}
                onClick={() => nextNode && requestNavigate(nextNode)}
                className={`h-[42px] inline-flex items-center gap-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                  nextNode && !isCurrentlyMutating
                    ? 'bg-gradient-to-r from-[#51a8b1] to-[#3a7d84] !text-white border-[#3a7d84] shadow-xs hover:shadow-md cursor-pointer active:scale-95 hover:opacity-95'
                    : 'bg-white/60 text-[#94a3b8] border-[#e2e8f0] opacity-40 cursor-not-allowed'
                }`}
                title={nextNode ? `Next: ${nextNode.name} (Alt+→)` : 'No next stage/task'}
                style={nextNode && !isCurrentlyMutating ? { color: '#ffffff', backgroundColor: '#3a7d84' } : undefined}
              >
                <div className="flex flex-col items-end text-right min-w-0">
                  <span
                    className="text-[9px] uppercase font-mono font-bold tracking-wider !text-white opacity-90"
                    style={{ color: '#ffffff' }}
                  >
                    Next
                  </span>
                  <span
                    className="font-bold text-[11.5px] !text-white truncate max-w-[130px] sm:max-w-[180px]"
                    style={{ color: '#ffffff' }}
                  >
                    {nextNode ? nextNode.name : 'Last Stage'}
                  </span>
                </div>
                <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
                  <ChevronRight className="w-4 h-4 !text-white" style={{ color: '#ffffff' }} />
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Unsaved Changes Confirmation Dialog Modal ── */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
          <div className="relative w-full max-w-md bg-white border border-[#b9c0cb]/60 shadow-2xl rounded-3xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="font-heading font-extrabold text-base text-[#1f2937] leading-snug">
                  Unsaved Changes in Form
                </h4>
                <p className="text-xs text-[#556987] leading-relaxed">
                  You have unsaved modifications in <strong className="text-[#1f2937]">{node.name}</strong>. If you leave without saving, your changes will be lost.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-[#f1f3f6]">
              {/* Keep Editing */}
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setPendingAction(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-[#4a5462] bg-[#f8fafb] hover:bg-[#f1f3f6] border border-[#b9c0cb]/40 transition cursor-pointer"
              >
                Keep Editing
              </button>

              {/* Discard & Leave */}
              <button
                type="button"
                onClick={() => {
                  setAssignedEmployeeMap({ ...initialAssignedEmployeeMap });
                  setIsFormDirty(false);
                  setShowUnsavedWarning(false);
                  if (pendingAction?.type === 'CLOSE') {
                    onClose();
                  } else if (pendingAction?.type === 'NAVIGATE' && pendingAction.targetNode && handleNavigate) {
                    handleNavigate(pendingAction.targetNode);
                  }
                  setPendingAction(null);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
              >
                Discard & Leave
              </button>

              {/* Save & Proceed */}
              <button
                type="button"
                disabled={isSaving || isCurrentlyMutating}
                onClick={async () => {
                  try {
                    await handleFooterSave();
                    setShowUnsavedWarning(false);
                    if (pendingAction?.type === 'CLOSE') {
                      onClose();
                    } else if (pendingAction?.type === 'NAVIGATE' && pendingAction.targetNode && handleNavigate) {
                      handleNavigate(pendingAction.targetNode);
                    }
                  } catch {
                    // Error handled
                  }
                  setPendingAction(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] border border-[#51a8b1] shadow-xs cursor-pointer"
              >
                {isSaving || isCurrentlyMutating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white" />
                    <span>Save & Proceed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
