'use client';

import React from 'react';
import { ITimelineNode } from '../../../types/timeline';
import { MindmapNode } from '../MindmapNode';
import { getStreamTheme } from '../utils/stageColorThemes';
import { IUser } from '../../../types/auth';

interface ParallelStreamColumnProps {
  streamNode: ITimelineNode | undefined;
  streamType: 'HARDWARE' | 'TECH' | 'CONTENT';
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

export function ParallelStreamColumn({
  streamNode,
  streamType,
  selectedNodeId,
  isNodeExpanded,
  toggleNodeExpand,
  isGateLocked,
  matchesFilter,
  onSelectNode,
  employees = [],
  onAssign,
  isClickable = true,
}: ParallelStreamColumnProps) {
  if (!streamNode) return null;
  const isExpanded = isNodeExpanded(streamNode._id);
  const subtasks = (streamNode.children || []).filter(matchesFilter);
  const streamTheme = getStreamTheme(streamType);

  return (
    <div className="flex flex-col items-center">
      {/* Stream Primary Node */}
      <MindmapNode
        node={streamNode}
        level={1}
        stageIndex={4}
        streamType={streamType}
        isSelected={selectedNodeId === streamNode._id}
        isExpanded={isExpanded}
        onSelect={onSelectNode}
        onToggleExpand={subtasks.length > 0 ? toggleNodeExpand : undefined}
        isGateLocked={isGateLocked(streamNode)}
        employees={employees}
        onAssign={onAssign}
        isClickable={isClickable}
      />

      {/* Subtasks flowing DOWNWARDS directly below the stream node */}
      {isExpanded && subtasks.length > 0 && (
        <div className="flex flex-col items-center mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Vertical connector stem */}
          <div className={`w-0.5 h-2.5 rounded-full ${streamTheme.lineBg}`} />

          {/* Subtasks list with distinct stream light theme */}
          <div className={`flex flex-col gap-1.5 p-2 rounded-2xl border shadow-2xs ${streamTheme.containerBg} ${streamTheme.containerBorder}`}>
            {subtasks.map((task, tIdx) => (
              <div key={task._id} className="relative flex items-start gap-1">
                <div className="flex flex-col items-center pt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${streamTheme.dotBg}`} />
                  {tIdx < subtasks.length - 1 && (
                    <div className={`w-0.5 h-full my-0.5 ${streamTheme.lineBg}`} />
                  )}
                </div>
                <MindmapNode
                  node={task}
                  level={2}
                  stageIndex={4}
                  streamType={streamType}
                  orderNumber={tIdx + 1}
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
  );
}
