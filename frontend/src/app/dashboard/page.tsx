'use client';

import React, { useEffect, useState } from 'react';
import { projectsApi } from '../../lib/api/projects.api';
import { IProject } from '../../types/project';
import { ExecutiveDashboardWorkspace } from '../../features/dashboard/ExecutiveDashboardWorkspace';

export default function DashboardPage() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    projectsApi.getProjects()
      .then((res) => {
        setProjects(res.projects || []);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh] text-slate-600">Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-destructive/10 border border-destructive text-destructive p-4 rounded-md text-sm">
        {error}
      </div>
    );
  }

  return <ExecutiveDashboardWorkspace />;
}