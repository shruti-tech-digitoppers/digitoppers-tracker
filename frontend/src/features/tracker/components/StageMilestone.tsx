'use client';

import React from 'react';
import { ITimelineNode } from '../../../types/timeline';
import { MindmapNode } from '../MindmapNode';
import { ChevronRight } from 'lucide-react';

import { IUser } from '../../../types/auth';

interface StageMilestoneProps {
  stage: ITimelineNode;
  orderNumber: number;
  selectedNodeId: string | null | undefined;
  isNodeExpanded: (id: string) => boolean;
  toggleNodeExpand: (id: string, e?: React.MouseEvent) => void;
  isGateLocked: (node: ITimelineNode) => boolean;
  matchesFilter: (node: ITimelineNode) => boolean;
  onSelectNode: (node: ITimelineNode) => void;
  showConnector?: boolean;
  employees?: IUser[];
  onAssign?: (nodeId: string, empId: string) => void;
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
}: StageMilestoneProps) {
  const isSelected = selectedNodeId === stage._id;
  const isExpanded = isNodeExpanded(stage._id);
  const subtasks = (stage.children || []).filter(matchesFilter);
  const hasSubstages = Boolean(stage.children && stage.children.length > 0);

  return (
    <div className="relative flex items-start">
      <div className="flex flex-col items-center">
        {/* Stage Number Tag */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] text-[9px] font-mono font-bold">
            {orderNumber}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#4a5462]">
            Phase {orderNumber}
          </span>
        </div>

        {/* Stage Card */}
        <MindmapNode
          node={stage}
          level={0}
          orderNumber={orderNumber}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onSelect={onSelectNode}
          onToggleExpand={hasSubstages ? toggleNodeExpand : undefined}
          isGateLocked={isGateLocked(stage)}
          employees={employees}
          onAssign={onAssign}
        />

        {/* Downward Subtasks */}
        {isExpanded && subtasks.length > 0 && (
          <div className="flex flex-col items-center mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Vertical connector stem from stage header down to subtasks */}
            <div className="w-0.5 h-3 bg-[#51a8b1]/70 rounded-full" />

            {/* Vertical Subtasks Container */}
            <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-[#f0f8f9]/50 border border-[#b6e0e4] shadow-2xs relative">
              <div className="flex items-center justify-between px-1 mb-0.5">
                <span className="text-[8.5px] font-mono font-bold text-[#4a5462] uppercase tracking-wider">
                  Subtasks ({subtasks.length})
                </span>
              </div>

              {subtasks.map((task, idx) => (
                <div key={task._id} className="relative flex items-start gap-1.5">
                  {/* Step indicator dot */}
                  <div className="flex flex-col items-center pt-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#51a8b1]" />
                    {idx < subtasks.length - 1 && (
                      <div className="w-0.5 h-full bg-[#b6e0e4] my-0.5" />
                    )}
                  </div>

                  {/* Subtask Card */}
                  <MindmapNode
                    node={task}
                    level={1}
                    isSelected={selectedNodeId === task._id}
                    onSelect={onSelectNode}
                    isGateLocked={isGateLocked(task)}
                    employees={employees}
                    onAssign={onAssign}
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
              stage.status === 'COMPLETED' ? 'bg-[#a8cf45]' : 'bg-[#51a8b1]/70'
            }`}
          />
          <ChevronRight
            className={`w-4 h-4 -ml-1.5 stroke-[3] ${
              stage.status === 'COMPLETED' ? 'text-[#759724]' : 'text-[#51a8b1]'
            }`}
          />
        </div>
      )}
    </div>
  );
}
