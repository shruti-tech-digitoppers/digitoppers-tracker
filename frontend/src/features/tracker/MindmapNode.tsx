'use client';

import React from 'react';
import { ITimelineNode, TimelineNodeStatus } from '../../types/timeline';
import { IUser } from '../../types/auth';
import { getStageTheme, getStreamTheme, StageColorTheme } from './utils/stageColorThemes';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Lock, 
  Layers, 
  PlayCircle,
  Cpu,
  Code2,
  BookOpen,
  GitBranch,
  ShieldCheck,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface MindmapNodeProps {
  node: ITimelineNode;
  level?: number;
  stageIndex?: number;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect?: (node: ITimelineNode) => void;
  onToggleExpand?: (nodeId: string, e: React.MouseEvent) => void;
  orderNumber?: number;
  streamType?: 'HARDWARE' | 'TECH' | 'CONTENT';
  isGateLocked?: boolean;
  isClickable?: boolean;
  /** When true, renders an inline assign dropdown on the card (stream root nodes) */
  showAssignDropdown?: boolean;
  /** List of available employees for the dropdown */
  employees?: IUser[];
  /** Called when a new assignee is selected from the inline dropdown */
  onAssign?: (nodeId: string, empId: string) => void;
}

export const MindmapNode = React.memo<MindmapNodeProps>(function MindmapNode({
  node,
  level = 0,
  stageIndex,
  isSelected = false,
  isExpanded = true,
  onSelect,
  onToggleExpand,
  orderNumber,
  streamType,
  isGateLocked = false,
  isClickable = true,
  showAssignDropdown = false,
  employees = [],
  onAssign,
}: MindmapNodeProps) {
  const hasChildren = Boolean(node.children && node.children.length > 0);
  
  const totalChildren = node.children?.length || 0;
  const completedChildren = node.children?.filter(c => c.status === 'COMPLETED').length || 0;
  const childrenProgress = totalChildren > 0 ? Math.round((completedChildren / totalChildren) * 100) : 0;

  const stageTheme = getStageTheme(stageIndex || orderNumber || node.order || node.key);
  const streamTheme = streamType ? getStreamTheme(streamType) : null;

  const getStatusConfig = (status: TimelineNodeStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          badgeBg: 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]',
          dotBg: 'bg-[#a8cf45]',
          border: 'border-[#dfefa6] hover:border-[#a8cf45]',
          borderSelected: 'border-[#a8cf45] ring-2 ring-[#a8cf45]/40 shadow-sm',
          icon: <CheckCircle2 className="w-2.5 h-2.5 text-[#759724]" />,
          cardBg: 'bg-white',
          headerBg: 'bg-[#a8cf45]',
          label: 'Done'
        };
      case 'IN_PROGRESS':
        return {
          badgeBg: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]',
          dotBg: 'bg-[#51a8b1] animate-pulse',
          border: 'border-[#51a8b1] hover:border-[#3a7d84]',
          borderSelected: 'border-[#51a8b1] ring-2 ring-[#51a8b1]/40 shadow-sm',
          icon: <PlayCircle className="w-2.5 h-2.5 text-[#51a8b1]" />,
          cardBg: 'bg-white',
          headerBg: 'bg-[#51a8b1]',
          label: 'In Progress'
        };
      case 'ON_HOLD':
        return {
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          dotBg: 'bg-amber-500',
          border: 'border-amber-200 hover:border-amber-400',
          borderSelected: 'border-amber-500 ring-2 ring-amber-500/25',
          icon: <Clock className="w-2.5 h-2.5 text-amber-600" />,
          cardBg: 'bg-white',
          headerBg: 'bg-amber-500',
          label: 'On Hold'
        };
      case 'CANCELLED':
        return {
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          dotBg: 'bg-rose-500',
          border: 'border-rose-200 hover:border-rose-400',
          borderSelected: 'border-rose-500 ring-2 ring-rose-500/25',
          icon: <AlertCircle className="w-2.5 h-2.5 text-rose-600" />,
          cardBg: 'bg-white',
          headerBg: 'bg-rose-500',
          label: 'Blocked'
        };
      default:
        return {
          badgeBg: 'bg-[#f8fafb] text-[#4a5462] border-[#b9c0cb]/40',
          dotBg: 'bg-[#b9c0cb]',
          border: 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50',
          borderSelected: 'border-[#51a8b1] ring-2 ring-[#51a8b1]/30',
          icon: <Clock className="w-2.5 h-2.5 text-[#b9c0cb]" />,
          cardBg: 'bg-white',
          headerBg: 'bg-[#b9c0cb]',
          label: 'Pending'
        };
    }
  };

  const getStreamConfig = (type?: string) => {
    switch (type) {
      case 'HARDWARE':
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-cyan-600" />,
          label: 'Hardware Stream',
          badgeCls: 'bg-cyan-50 text-cyan-900 border-cyan-200/90',
          accent: 'bg-cyan-500'
        };
      case 'TECH':
        return {
          icon: <Code2 className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Tech Stream',
          badgeCls: 'bg-indigo-50 text-indigo-900 border-indigo-200/90',
          accent: 'bg-indigo-500'
        };
      case 'CONTENT':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Content Stream',
          badgeCls: 'bg-amber-50 text-amber-900 border-amber-200/90',
          accent: 'bg-amber-500'
        };
      default:
        return null;
    }
  };

  const statusCfg = getStatusConfig(node.status);
  const streamCfg = getStreamConfig(streamType);
  const isStageRoot = level === 0;

  // Resolve current assignee details
  const assigneeObj =
    typeof node.assignedEmployee === 'object' && node.assignedEmployee !== null
      ? node.assignedEmployee as any
      : typeof node.assignedTo === 'object' && node.assignedTo !== null
      ? node.assignedTo as any
      : null;

  const currentAssigneeId =
    assigneeObj?._id ||
    (typeof node.assignedEmployee === 'string' ? node.assignedEmployee : '') ||
    (typeof node.assignedTo === 'string' ? node.assignedTo : '');

  const matchedEmp = employees && employees.length > 0
    ? employees.find(
        (e) =>
          (currentAssigneeId && (
            e._id === currentAssigneeId ||
            (e as any).id === currentAssigneeId ||
            e.employeeCode === currentAssigneeId ||
            e.phone === currentAssigneeId
          )) ||
          (assigneeObj?.email && e.email === assigneeObj.email) ||
          (assigneeObj?.phone && e.phone === assigneeObj.phone)
      )
    : null;

  const currentAssigneeName =
    assigneeObj?.name ||
    matchedEmp?.name ||
    null;

  // Avatar initial for the assignee badge
  const avatarInitial = currentAssigneeName
    ? currentAssigneeName.charAt(0).toUpperCase()
    : null;

  // Card background & border matching stage/stream color family
  const cardBgClass = isStageRoot
    ? stageTheme.cardBg
    : streamTheme
    ? streamTheme.cardBg
    : stageTheme.taskCardBg;

  const cardBorderClass = isSelected
    ? stageTheme.cardBorderSelected
    : isStageRoot
    ? `${stageTheme.cardBorder} ${stageTheme.cardHoverBorder}`
    : `${stageTheme.taskCardBorder}`;

  return (
    <div className="relative group font-sans">
      
      {/* ── Main Node Card ───────────────────────────────── */}
      <div
        onClick={isClickable && onSelect ? () => onSelect(node) : undefined}
        className={`
          relative w-52 rounded-xl transition-all duration-200 select-none text-left
          border shadow-xs overflow-hidden
          ${cardBgClass}
          ${cardBorderClass}
          ${isClickable ? 'cursor-pointer' : 'cursor-default'}
          ${isGateLocked ? 'opacity-70 saturate-50' : isClickable ? 'hover:shadow-md hover:-translate-y-0.5' : ''}
        `}
      >
        {/* Top Status Indicator Stripe */}
        <div className={`h-1.5 w-full ${statusCfg.headerBg} transition-colors duration-300`} title={`Status: ${statusCfg.label}`} />

        <div className="p-2.5 space-y-1.5">
          
          {/* Header Row: Stage/Task Theme Badge + Status Badge */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              {streamCfg ? (
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${streamCfg.badgeCls}`}>
                  {streamCfg.icon}
                  <span className="truncate">{streamType}</span>
                </span>
              ) : isStageRoot ? (
                <span className={`font-heading font-black text-[9px] px-1.5 py-0.5 rounded border ${stageTheme.badgeBg} ${stageTheme.badgeText} ${stageTheme.badgeBorder}`}>
                  PHASE {orderNumber || node.order || stageTheme.stageNumber}
                </span>
              ) : (
                <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${stageTheme.taskBadgeBg} ${stageTheme.taskBadgeText} ${stageTheme.taskBadgeBorder}`}>
                  TASK #{orderNumber || node.order || 1}
                </span>
              )}
            </div>

            {/* Status Pill Badge */}
            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusCfg.badgeBg} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotBg}`} />
              {statusCfg.label}
            </span>
          </div>

          {/* Node Title */}
          <h4 className="font-heading text-xs font-bold text-[#1f2937] leading-snug line-clamp-2" title={node.name}>
            {node.name}
          </h4>

          {/* Quality / Dependency Gate Alert Banner */}
          {isGateLocked && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-1 font-semibold">
              <Lock className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
              <span>Gate Locked (Awaiting pre-reqs)</span>
            </div>
          )}

          {/* Progress bar if node has sub-tasks */}
          {hasChildren && (
            <div className="space-y-0.5 pt-0.5">
              <div className="flex justify-between text-[9px] text-[#4a5462] font-semibold">
                <span>{completedChildren}/{totalChildren} completed</span>
                <span>{childrenProgress}%</span>
              </div>
              <div className="w-full bg-[#f1f4f6] rounded-full h-1 overflow-hidden border border-[#b9c0cb]/30">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    childrenProgress === 100 ? 'bg-[#a8cf45]' : 'bg-[#51a8b1]'
                  }`}
                  style={{ width: `${childrenProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Footer Row: Always show Assignee Name or Unassigned ── */}
          <div className="pt-1.5 border-t border-[#f1f3f6]">
            {/* ── STREAM ROOT: inline quick-assign dropdown ── */}
            {showAssignDropdown && onAssign && isClickable ? (
              <div
                className="space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 text-[9px] text-[#3a7d84] font-bold uppercase tracking-wide">
                  <UserCheck className="w-2.5 h-2.5" />
                  Assign Stream
                </div>
                <select
                  value={currentAssigneeId}
                  onChange={(e) => onAssign(node._id, e.target.value)}
                  className="w-full text-[10px] border border-[#b9c0cb]/60 rounded-lg px-1.5 py-1 bg-[#f8fafb] text-[#333333] focus:outline-none focus:ring-1 focus:ring-[#51a8b1] cursor-pointer leading-tight"
                  title="Assign this stream to a team member"
                >
                  <option value="">👤 Unassigned</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name}{emp.employeeCode ? ` [${emp.employeeCode}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* ── STAGE / SUB-TASK: read-only assignee display ── */
              <div className="flex items-center justify-between text-[9.5px] text-[#4a5462]">
                <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                  {currentAssigneeName ? (
                    <>
                      {/* Avatar initial chip */}
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#3a7d84] text-white font-bold text-[8.5px] flex items-center justify-center shadow-2xs">
                        {avatarInitial}
                      </span>
                      <span className="truncate font-bold text-[#2d6b73]">
                        {currentAssigneeName}
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-medium text-slate-400">Unassigned</span>
                    </>
                  )}
                </div>

                {hasChildren && onToggleExpand && (
                  <button
                    type="button"
                    onClick={(e) => onToggleExpand(node._id, e)}
                    className="p-0.5 hover:bg-[#f0f8f9] rounded text-[#51a8b1] transition cursor-pointer shrink-0"
                    title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            )}

            {/* When showAssignDropdown is true, still show collapse toggle if needed */}
            {showAssignDropdown && hasChildren && onToggleExpand && (
              <div className="flex justify-end mt-0.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(node._id, e); }}
                  className="p-0.5 hover:bg-[#f0f8f9] rounded text-[#51a8b1] transition cursor-pointer"
                  title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
