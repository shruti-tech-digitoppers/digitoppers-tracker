'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { activityApi, IActivityItem } from '../../lib/api/activity.api';
interface ProjectActivityWorkspaceProps {
  projectId: string;
}

export function ProjectActivityWorkspace({ projectId }: ProjectActivityWorkspaceProps) {
  const [activities, setActivities] = useState<IActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await activityApi.getProjectActivity(projectId);
      setActivities(res.activities || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project activity audit history.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return <div className="text-center py-16 text-muted-foreground">Loading activity audit history from backend...</div>;
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6 bg-card border rounded-lg shadow-sm">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Audit History & Activity</h2>
          <p className="text-sm text-muted-foreground">Chronological log of actions and events recorded for this project.</p>
        </div>
        <button
          onClick={fetchActivity}
          className="border px-3 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors"
        >
          Refresh Log
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg text-muted-foreground text-sm">
          No activity recorded yet for this project.
        </div>
      ) : (
        <div className="divide-y space-y-4">
          {activities.map((item) => {
            const actorName =
              typeof item.actor === 'object' && item.actor !== null
                ? item.actor.name || item.actor.email
                : 'System / User';

            return (
              <div key={item._id} className="pt-4 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{actorName}</span>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono">
                      {item.action}
                    </span>
                  </div>
                  {item.resource && (
                    <p className="text-xs text-muted-foreground font-mono">Resource: {item.resource}</p>
                  )}
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <pre className="text-[11px] bg-muted/50 p-2 rounded text-muted-foreground overflow-x-auto mt-1">
                      {JSON.stringify(item.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}