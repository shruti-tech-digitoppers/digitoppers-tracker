'use client';

import React from 'react';
import { ITimelineNode } from '../../../types/timeline';
import { MindmapNode } from '../MindmapNode';
import { ChevronRight } from 'lucide-react';
import { getStageTheme } from '../utils/stageColorThemes';
import { IUser } from '../../../types/auth';

interface StageMilestoneProps {
  stage: ITimelineNode;
  orderNumber: number;
  selectedNodeId: string | null | undefined;
  isNodeExpanded: (id: string) => boolean;
  toggleNodeExpand: (id: string, e?: React.MouseEvent) => void;
  isGateLocked: (node: ITimelineNode) => boolean;
  matchesFilter: (node: ITimelineNode) => boolean;
  onSelectNode?: (node: ITimelineNode) => void;
  showConnector?: boolean;
  employees?: IUser[];
  onAssign?: (nodeId: string, empId: string) => void;
  isClickable?: boolean;
}

export function StageMilestone({
  stage,
  orderNumber,
  selectedNodeId,
  isNodeExpanded,
  toggleNodeExpand,
  isGateLocked,
  matchesFilter,
  onSelectNode,
  showConnector = true,
  employees = [],
  onAssign,
  isClickable = true,
}: StageMilestoneProps) {
  const isSelected = selectedNodeId === stage._id;
  const isExpanded = isNodeExpanded(stage._id);
  const subtasks = (stage.children || []).filter(matchesFilter);
  const hasSubstages = Boolean(stage.children && stage.children.length > 0);
  const theme = getStageTheme(orderNumber || stage.order || stage.key);

  return (
    <div className="relative flex items-start">
      <div className="flex flex-col items-center">
        {/* Stage Number Tag */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono font-bold border ${theme.numberBg} ${theme.numberText} ${theme.numberBorder}`}>
            {orderNumber}
          </span>
          <span className={`text-[9.5px] font-heading font-black uppercase tracking-wider ${theme.badgeText}`}>
            Phase {orderNumber}
          </span>
        </div>

        {/* Stage Card */}
        <MindmapNode
          node={stage}
          level={0}
          stageIndex={orderNumber}
          orderNumber={orderNumber}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onSelect={onSelectNode}
          onToggleExpand={hasSubstages ? toggleNodeExpand : undefined}
          isGateLocked={isGateLocked(stage)}
          employees={employees}
          onAssign={onAssign}
          isClickable={isClickable}
        />

        {/* Downward Subtasks */}
        {isExpanded && subtasks.length > 0 && (
          <div className="flex flex-col items-center mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Vertical connector stem from stage header down to subtasks */}
            <div className={`w-0.5 h-3 rounded-full ${theme.connectorLine}`} />

            {/* Vertical Subtasks Container */}
            <div className={`flex flex-col gap-1.5 p-2 rounded-2xl border shadow-2xs relative ${theme.subtaskContainerBg} ${theme.subtaskContainerBorder}`}>
              <div className="flex items-center justify-between px-1 mb-0.5">
                <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider ${theme.badgeText}`}>
                  Subtasks ({subtasks.length})
                </span>
              </div>

              {subtasks.map((task, idx) => (
                <div key={task._id} className="relative flex items-start gap-1.5">
                  {/* Step indicator dot */}
                  <div className="flex flex-col items-center pt-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.subtaskDot}`} />
                    {idx < subtasks.length - 1 && (
                      <div className={`w-0.5 h-full my-0.5 ${theme.subtaskLine}`} />
                    )}
                  </div>

                  {/* Subtask Card */}
                  <MindmapNode
                    node={task}
                    level={1}
                    stageIndex={orderNumber}
                    orderNumber={idx + 1}
                    isSelected={selectedNodeId === task._id}
                    onSelect={onSelectNode}
                    isGateLocked={isGateLocked(task)}
                    employees={employees}
                    onAssign={onAssign}
                    isClickable={isClickable}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Milestone Connector to next Stage */}
      {showConnector && (
        <div className="flex items-center h-[70px] px-1 mt-5">
          <div
            className={`h-[3px] w-6 rounded-sm ${
              stage.status === 'COMPLETED' ? 'bg-[#a8cf45]' : theme.connectorLine
            }`}
          />
          <ChevronRight
            className={`w-4 h-4 -ml-1.5 stroke-[3] ${
              stage.status === 'COMPLETED' ? 'text-[#759724]' : theme.connectorArrow
            }`}
          />
        </div>
      )}
    </div>
  );
}
