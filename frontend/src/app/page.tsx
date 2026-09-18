'use client';

import React from 'react';
import { ExecutiveDashboardWorkspace } from '@/features/dashboard/ExecutiveDashboardWorkspace';

export default function Home() {
  return <ExecutiveDashboardWorkspace hideSidePanel={true} />;
}
