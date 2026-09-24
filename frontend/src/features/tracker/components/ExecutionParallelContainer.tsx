'use client';

import React from 'react';
import { ITimelineNode } from '../../../types/timeline';
import { MindmapNode } from '../MindmapNode';
import { ParallelStreamColumn } from './ParallelStreamColumn';
import { Split, GitMerge, ChevronRight } from 'lucide-react';
import { getStageTheme } from '../utils/stageColorThemes';
import { IUser } from '../../../types/auth';

interface ExecutionParallelContainerProps {
  executionStage: ITimelineNode;
  selectedNodeId: string | null | undefined;
  isNodeExpanded: (id: string) => boolean;
  toggleNodeExpand: (id: string, e?: React.MouseEvent) => void;
  isGateLocked: (node: ITimelineNode) => boolean;
  matchesFilter: (node: ITimelineNode) => boolean;
  onSelectNode?: (node: ITimelineNode) => void;
  employees?: IUser[];
  onAssign?: (nodeId: string, empId: string) => void;
  isClickable?: boolean;
}

export function ExecutionParallelContainer({
  executionStage,
  selectedNodeId,
  isNodeExpanded,
  toggleNodeExpand,
  isGateLocked,
  matchesFilter,
  onSelectNode,
  employees = [],
  onAssign,
  isClickable = true,
}: ExecutionParallelContainerProps) {
  const hardwareStream = executionStage?.children?.find(
    (c) => (c.key || '').toUpperCase().includes('HARDWARE') || (c.name || '').toLowerCase().includes('hardware')
  );
  const techStream = executionStage?.children?.find(
    (c) => (c.key || '').toUpperCase().includes('TECH') || (c.name || '').toLowerCase().includes('tech')
  );
  const contentStream = executionStage?.children?.find(
    (c) => (c.key || '').toUpperCase().includes('CONTENT') || (c.name || '').toLowerCase().includes('content')
  );

  const otherExecutionChildren = (executionStage?.children || []).filter(
    (c) => c._id !== hardwareStream?._id && c._id !== techStream?._id && c._id !== contentStream?._id
  );

  const isExpanded = isNodeExpanded(executionStage._id);
  const theme = getStageTheme(4);

  return (
    <div className="relative flex items-start">
      <div className="flex flex-col items-center">
        {/* Stage Number Tag */}
        <div className="flex items-center gap-1 mb-1.5">
          <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono font-bold border ${theme.numberBg} ${theme.numberText} ${theme.numberBorder}`}>
            04
          </span>
          <span className={`font-heading text-[9.5px] font-black uppercase tracking-wider ${theme.badgeText}`}>
            Execution Stage
          </span>
        </div>

        {/* Stage Milestone Node */}
        <MindmapNode
          node={executionStage}
          level={0}
          stageIndex={4}
          orderNumber={4}
          isSelected={selectedNodeId === executionStage._id}
          isExpanded={isExpanded}
          onSelect={onSelectNode}
          onToggleExpand={toggleNodeExpand}
          isGateLocked={isGateLocked(executionStage)}
          employees={employees}
          onAssign={onAssign}
          isClickable={isClickable}
        />

        {/* 3 Parallel Streams Opening DOWNWARDS beneath Execution */}
        {isExpanded && (
          <div className="flex flex-col items-center mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Vertical connector stem */}
            <div className={`w-0.5 h-3 rounded-full ${theme.connectorLine}`} />

            {/* 3 Parallel Streams Container */}
            <div className="p-3 rounded-3xl bg-gradient-to-b from-teal-50/40 via-white to-teal-50/20 border-2 border-teal-200/90 shadow-xs">
              {/* Split Indicator Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-teal-900 bg-teal-50 border border-teal-200/90 px-3 py-1 rounded-full mb-3 shadow-2xs mx-auto w-fit">
                <Split className="w-2.5 h-2.5 text-teal-600" />
                3 Parallel Workstreams (Hardware • Tech • Content)
              </div>

              {/* 3 Parallel Stream Columns Side-by-Side */}
              <div className="flex items-start gap-3">
                {/* Hardware Stream Column */}
                <ParallelStreamColumn
                  streamNode={hardwareStream}
                  streamType="HARDWARE"
                  selectedNodeId={selectedNodeId}
                  isNodeExpanded={isNodeExpanded}
                  toggleNodeExpand={toggleNodeExpand}
                  isGateLocked={isGateLocked}
                  matchesFilter={matchesFilter}
                  onSelectNode={onSelectNode}
                  employees={employees}
                  onAssign={onAssign}
                  isClickable={isClickable}
                />

                {/* Tech Stream Column */}
                <ParallelStreamColumn
                  streamNode={techStream}
                  streamType="TECH"
                  selectedNodeId={selectedNodeId}
                  isNodeExpanded={isNodeExpanded}
                  toggleNodeExpand={toggleNodeExpand}
                  isGateLocked={isGateLocked}
                  matchesFilter={matchesFilter}
                  onSelectNode={onSelectNode}
                  employees={employees}
                  onAssign={onAssign}
                  isClickable={isClickable}
                />

                {/* Content Stream Column */}
                <ParallelStreamColumn
                  streamNode={contentStream}
                  streamType="CONTENT"
                  selectedNodeId={selectedNodeId}
                  isNodeExpanded={isNodeExpanded}
                  toggleNodeExpand={toggleNodeExpand}
                  isGateLocked={isGateLocked}
                  matchesFilter={matchesFilter}
                  onSelectNode={onSelectNode}
                  employees={employees}
                  onAssign={onAssign}
                  isClickable={isClickable}
                />

                {/* Other Custom Streams if any */}
                {otherExecutionChildren.map((child) => (
                  <div key={child._id} className="flex flex-col items-center">
                    <MindmapNode
                      node={child}
                      level={1}
                      stageIndex={4}
                      isSelected={selectedNodeId === child._id}
                      onSelect={onSelectNode}
                      employees={employees}
                      onAssign={onAssign}
                      isClickable={isClickable}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Milestone Connector with Convergence Indicator */}
      <div className="flex flex-col items-center justify-center px-1 mt-5">
        <div className="flex items-center h-[70px]">
          <div
            className={`h-[3px] w-7 rounded-sm ${
              executionStage.status === 'COMPLETED' ? 'bg-[#a8cf45]' : theme.connectorLine
            }`}
          />
          <ChevronRight
            className={`w-4 h-4 -ml-1.5 stroke-[3] ${
              executionStage.status === 'COMPLETED' ? 'text-[#759724]' : theme.connectorArrow
            }`}
          />
        </div>
        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/90 -mt-3 shadow-2xs">
          <GitMerge className="w-2.5 h-2.5 text-teal-600" /> Converge
        </span>
      </div>
    </div>
  );
}
