'use client';

import React from 'react';
import { ITimelineNode, TimelineNodeStatus, FormSchemaType } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
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
  Layers
} from 'lucide-react';

interface NodeInspectorDrawerProps {
  node: ITimelineNode | null;
  employees?: IUser[];
  availableEmployees?: IUser[];
  currentUser?: IUser | null;
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
  if (!node) return null;

  const empList = employees.length > 0 ? employees : availableEmployees;
  const isCurrentlyMutating = mutating || isMutating;
  const currentError = mutationError || error;
  const allowStatusEdit = canModifyStatus !== undefined ? canModifyStatus : (canEditStatus !== undefined ? canEditStatus : true);
  const allowAssignEdit = canModifyAssignment !== undefined ? canModifyAssignment : (canAssign !== undefined ? canAssign : true);
  const handleAssign = onAssignmentChange || onAssigneeChange || (async (employeeId: string, targetNodeId?: string) => {});

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

  const stage3HwNode = findNodeRecursive(allNodes, 'HARDWARE_REQUIREMENT');
  const stage4StockNode = findNodeRecursive(allNodes, 'REQ_AND_STOCK_CHECK');
  const stage4TechNode = findNodeRecursive(allNodes, 'PROJECT_CONFIG_AND_IMPLEMENTATION');

  const combinedAllFormData: Record<string, any> = {
    ...(formData || {}),
    stage3HardwareItems: stage3HwNode?.formData?.hardwareRequirements?.items || stage3HwNode?.formData?.hardware?.items || stage3HwNode?.formData?.items || {},
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
      <div className="relative w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] bg-white border border-[#b9c0cb]/40 shadow-2xl rounded-3xl flex flex-col z-10 text-[#333333] animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#f1f3f6] bg-gradient-to-r from-[#f8fafb] to-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#51a8b1] shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#2f4154] text-white font-mono text-[10.5px] font-bold">
                  {node.key}
                </span>
                <span className="text-xs font-semibold text-[#51a8b1] uppercase tracking-wider font-heading">
                  {node.type || 'TASK'}
                </span>
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-[#333333] leading-snug">
                {node.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] border border-transparent hover:border-[#b9c0cb]/40 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
          {node.dependencies && node.dependencies.length > 0 && (
            <div className="p-3.5 bg-[#f0f8f9] border border-[#b6e0e4] rounded-2xl flex items-start gap-3 text-[#3a7d84] text-xs">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#51a8b1]" />
              <div>
                <p className="font-bold font-heading">Stage Gate Dependencies</p>
                <p className="text-[11px] text-[#4a5462] mt-0.5">
                  Requires completion of: {node.dependencies.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Top Bar: Execution Status & Task Assignee */}
          {(() => {
            const showAssignment = !node.metadata?.noAssignment || node.key === 'PO_AND_PI';

            return (
              <div className={`p-4 bg-[#f8fafb] border border-[#b9c0cb]/40 rounded-2xl ${
                showAssignment ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''
              }`}>
                {/* Status Segmented Controller */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] font-heading">
                      Execution Status
                    </label>
                    {!allowStatusEdit && (
                      <span className="text-[10px] text-[#4a5462] flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3 h-3 text-amber-500" /> Read Only
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-white border border-[#b9c0cb]/40 rounded-xl">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = node.status === opt.value;
                      return (
                        <button
                          key={opt.value}
                          disabled={isCurrentlyMutating || !allowStatusEdit}
                          onClick={() => onStatusChange(opt.value)}
                          className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] transition-all cursor-pointer select-none border ${
                            isSelected ? opt.activeClass : opt.inactiveClass
                          } ${!allowStatusEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <Icon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resource Assignment if applicable */}
                {showAssignment && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
                        <User className="w-3.5 h-3.5 text-[#a8cf45]" />
                        {node.type === 'STAGE' || (node as any).isBranch ? 'Stage / Stream Lead' : 'Task Assignee / Owner'}
                      </label>
                      <span className="text-[10px] text-[#4a5462]">
                        {node.key === 'PO_AND_PI' ? 'Applies to PO & PI' : 'Assigned Member'}
                      </span>
                    </div>

                    <select
                      disabled={isCurrentlyMutating || !allowAssignEdit}
                      value={currentAssigneeId}
                      onChange={(e) => handleAssign(e.target.value)}
                      className="w-full border border-[#b9c0cb]/60 rounded-xl px-3 py-2 text-xs bg-white text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#51a8b1] disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">👤 Unassigned (Select Member)</option>
                      {empList.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} {emp.employeeCode ? `[${emp.employeeCode}]` : ''} ({emp.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sub-Tasks & Stages Assignment Section */}
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

            const subTasksList = getChildrenList();
            if (!subTasksList || subTasksList.length === 0) return null;

            return (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
                    <Layers className="w-3.5 h-3.5 text-[#51a8b1]" />
                    Sub-Stages / Tasks &amp; Assigned Employees ({subTasksList.length})
                  </label>
                  <span className="text-[10px] text-[#4a5462] font-medium">
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
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-[#b9c0cb]/50 hover:border-[#51a8b1]/60 rounded-2xl shadow-2xs transition-all"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="flex items-center justify-center w-5 h-5 rounded-lg bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] text-[10px] font-mono font-bold shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-[#333333] truncate">
                                {child.name}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                childStatus === 'COMPLETED'
                                  ? 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]'
                                  : childStatus === 'IN_PROGRESS'
                                  ? 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]'
                                  : 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40'
                              }`}>
                                {childStatus}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#51a8b1] tracking-wider mt-0.5">
                              {child.key || 'TASK'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full sm:w-64 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <User className={`w-3.5 h-3.5 shrink-0 ${childAssigneeId ? 'text-[#3a7d84]' : 'text-[#b9c0cb]'}`} />
                            <select
                              disabled={isCurrentlyMutating || !allowAssignEdit}
                              value={childAssigneeId}
                              onChange={(e) => handleAssign(e.target.value, child._id)}
                              className="w-full border border-[#b9c0cb]/60 rounded-xl px-2.5 py-1.5 text-xs bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#51a8b1] disabled:opacity-50 cursor-pointer font-medium"
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Dynamic Stage / Task Form (Now with full width breathing space!) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3a7d84] flex items-center gap-1.5 font-heading">
                <FileText className="w-3.5 h-3.5 text-[#51a8b1]" />
                Stage Data &amp; Form Fields
              </label>
            </div>

            <DynamicFormRenderer
              schema={formSchema || (node.formSchema as any)}
              initialData={formData || (node.formData as any) || {}}
              onSubmit={onFormSubmit}
              disabled={isCurrentlyMutating}
              employees={empList}
              allFormData={combinedAllFormData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
