import React, { Suspense } from 'react';
import { MindMapWorkspace } from '../../features/tracker/MindMapWorkspace';

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Loading Tracker...</div>}>
      <MindMapWorkspace />
    </Suspense>
  );
}