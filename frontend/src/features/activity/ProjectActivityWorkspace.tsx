'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  Search, 
  RotateCw, 
  Calendar, 
  User, 
  FolderKanban, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  TrendingUp,
  ChevronLeft,
  X,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { activityApi, IActivityItem, IActivityStats } from '../../lib/api/activity.api';
import { projectsApi } from '../../lib/api/projects.api';
import { IProject } from '../../types/project';

interface ProjectActivityWorkspaceProps {
  projectId?: string;
  projectName?: string;
  isDrawer?: boolean;
  onClose?: () => void;
}

export function ProjectActivityWorkspace({
  projectId,
  projectName,
  isDrawer = false,
  onClose
}: ProjectActivityWorkspaceProps) {
  const [activities, setActivities] = useState<IActivityItem[]>([]);
  const [stats, setStats] = useState<IActivityStats | null>(null);
  const [projectsList, setProjectsList] = useState<IProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(projectId || 'ALL');
  const [selectedActionCategory, setSelectedActionCategory] = useState<string>('ALL');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch projects list for filter dropdown if in global mode
  useEffect(() => {
    if (!projectId) {
      projectsApi.getProjects()
        .then((res: any) => {
          const list = res.data || res.projects || [];
          setProjectsList(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, [projectId]);

  // Fetch activities
  const fetchActivities = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const targetProjectId = projectId || (selectedProjectFilter !== 'ALL' ? selectedProjectFilter : undefined);

      const params: any = {
        page: currentPage,
        limit: isDrawer ? 30 : 25,
        search: searchQuery.trim() || undefined,
        action: selectedActionCategory !== 'ALL' ? selectedActionCategory : undefined,
      };

      if (targetProjectId) {
        params.project = targetProjectId;
      }

      const [actRes, statsRes] = await Promise.all([
        targetProjectId
          ? activityApi.getProjectActivity(targetProjectId, params)
          : activityApi.getAllActivities(params),
        !projectId && !isDrawer ? activityApi.getActivityStats().catch(() => null) : Promise.resolve(null)
      ]);

      setActivities(actRes.activities || []);
      setTotalCount(actRes.total || (actRes.activities || []).length);
      setTotalPages(actRes.pages || 1);
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load activity log audit trail.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, selectedProjectFilter, selectedActionCategory, searchQuery, currentPage, isDrawer]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActionBadgeStyle = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('ADDED') || act.includes('ASSIGN')) {
      return 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]';
    }
    if (act.includes('APPROVE') || act.includes('COMPLETE') || act.includes('ACCEPT')) {
      return 'bg-[#f7fbe9] text-[#465b1c] border-[#dfefa6]';
    }
    if (act.includes('UPDATE') || act.includes('STATUS') || act.includes('EDIT') || act.includes('FORM')) {
      return 'bg-sky-50 text-sky-800 border-sky-200';
    }
    if (act.includes('DELETE') || act.includes('REJECT') || act.includes('REMOVE') || act.includes('DEACTIVAT')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-[#f1f3f6] text-[#4a5462] border-[#b9c0cb]/60';
  };

  const getActionIcon = (action: string, resourceType?: string) => {
    const act = (action || '').toUpperCase();
    const res = (resourceType || '').toUpperCase();

    if (act.includes('COMPLETE') || act.includes('APPROVE')) return CheckCircle2;
    if (res.includes('NODE') || res.includes('STAGE') || res.includes('TIMELINE')) return Layers;
    if (res.includes('PROJECT')) return FolderKanban;
    if (res.includes('REQUEST')) return FileText;
    if (res.includes('EMPLOYEE') || res.includes('MEMBER')) return User;
    return History;
  };

  const formatActivityTitle = (item: IActivityItem) => {
    if (item.description) return item.description;

    const action = item.action || 'ACTIVITY';
    const cleanAction = action.replace(/_/g, ' ');
    const projName = typeof item.project === 'object' && item.project ? (item.project.projectName || item.project.projectId) : '';
    return `${cleanAction}${projName ? ` on ${projName}` : ''}`;
  };

  const actionCategories = [
    { label: 'All Activities', value: 'ALL' },
    { label: 'Project Updates', value: 'PROJECT_UPDATED' },
    { label: 'Timeline & Nodes', value: 'NODE_STATUS_CHANGED' },
    { label: 'Requests & Approvals', value: 'REQUEST_APPROVED' },
    { label: 'Requirements', value: 'REQUIREMENTS_UPDATED' },
    { label: 'Assignments', value: 'CONTRIBUTOR_ASSIGNED' }
  ];

  return (
    <div className={`flex flex-col font-sans ${isDrawer ? 'h-full bg-white' : 'space-y-5'}`}>
      
      {/* ── Section Header ────────────────────────────────────────── */}
      <div className={`flex items-center justify-between gap-3 ${isDrawer ? 'p-5 border-b border-[#f1f3f6]' : 'pb-4 border-b border-[#b9c0cb]/40'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#3a7d84] shadow-2xs">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-bold text-[#333333] leading-tight">
                {projectId ? 'Project Audit History & Activity' : 'System Activity Logs'}
              </h2>
              {projectId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                  {projectName || 'Current Project'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#4a5462] mt-0.5">
              {projectId 
                ? 'Chronological record of status changes, stage updates, form submissions, and assignments.'
                : 'Complete audit trail of all project mutations, node milestones, and team activities.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchActivities(true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#4a5462] bg-white border border-[#b9c0cb]/60 hover:bg-[#f8fafb] hover:text-[#3a7d84] hover:border-[#b6e0e4] transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh logs"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3a7d84]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isDrawer && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#4a5462] hover:text-[#333333] hover:bg-[#f1f3f6] transition cursor-pointer"
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Global Mode Stats Grid ─────────────────────────────────── */}
      {!projectId && !isDrawer && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a5462]">Total Activities</p>
              <p className="text-xl font-heading font-bold text-[#333333]">{stats.totalActivities.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f7fbe9] text-[#465b1c] border border-[#dfefa6] flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a5462]">Today's Events</p>
              <p className="text-xl font-heading font-bold text-[#333333]">{stats.todayActivities.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f8fafb] text-[#51a8b1] border border-[#b9c0cb]/50 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a5462]">Active Contributors</p>
              <p className="text-xl font-heading font-bold text-[#333333]">{stats.activeContributors}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a5462]">Matching Events</p>
              <p className="text-xl font-heading font-bold text-[#333333]">{totalCount.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ───────────────────────────────── */}
      <div className={`flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between ${isDrawer ? 'px-5 py-3 bg-[#f8fafb] border-b border-[#f1f3f6]' : 'bg-[#f8fafb] p-3 rounded-xl border border-[#b9c0cb]/40'}`}>
        <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#949ea9]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search actions, names, project codes, deltas..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-[#b9c0cb]/60 bg-white text-[#333333] placeholder:text-[#949ea9] focus:outline-none focus:border-[#51a8b1] focus:ring-1 focus:ring-[#51a8b1] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#949ea9] hover:text-[#333333]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Project Filter (if Global Mode) */}
          {!projectId && (
            <div className="min-w-[180px]">
              <select
                value={selectedProjectFilter}
                onChange={(e) => {
                  setSelectedProjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-[#b9c0cb]/60 bg-white text-[#333333] font-semibold focus:outline-none focus:border-[#51a8b1]"
              >
                <option value="ALL">All Projects</option>
                {projectsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.projectId || ''} - {p.projectName || p.title || 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {actionCategories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setSelectedActionCategory(cat.value);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedActionCategory === cat.value
                  ? 'bg-[#51a8b1] text-white shadow-2xs'
                  : 'bg-white text-[#4a5462] border border-[#b9c0cb]/50 hover:bg-[#f0f8f9] hover:text-[#3a7d84]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Activity Timeline ─────────────────────────────────── */}
      <div className={`flex-1 overflow-y-auto ${isDrawer ? 'p-5' : ''}`}>
        {loading && activities.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center gap-3 text-[#4a5462]">
            <RotateCw className="w-6 h-6 animate-spin text-[#51a8b1]" />
            <p className="text-xs font-semibold">Loading audit history & events...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-[#b9c0cb]/60 rounded-2xl bg-white flex flex-col items-center justify-center gap-2 text-[#4a5462]">
            <History className="w-8 h-8 text-[#b9c0cb]" />
            <p className="text-sm font-bold text-[#333333] font-heading">No activity records found</p>
            <p className="text-xs text-[#4a5462] max-w-sm">
              No matching activity events recorded for the current project or search criteria.
            </p>
          </div>
        ) : (
          <div className="relative pl-7 space-y-3.5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#b9c0cb]/40">
            {activities.map((item) => {
              const actorName =
                item.actorName ||
                (typeof item.actor === 'object' && item.actor !== null
                  ? item.actor.name || item.actor.email
                  : 'Team Member');

              const actorRole =
                typeof item.actor === 'object' && item.actor !== null
                  ? (item.actor as any).role || (item.actor as any).globalRole || (item.actor as any).designation
                  : undefined;

              const projectData = typeof item.project === 'object' && item.project ? item.project : null;
              const projectNameText = projectData ? (projectData.projectName || projectData.projectId) : item.metadata?.projectName;

              const ActionIcon = getActionIcon(item.action, item.resourceType);
              const badgeStyle = getActionBadgeStyle(item.action);
              const isExpanded = !!expandedItems[item._id];
              const hasMetadata = item.metadata && Object.keys(item.metadata).length > 0;

              const eventTime = new Date(item.createdAt);
              const formattedDate = eventTime.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = eventTime.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div key={item._id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[27px] top-3.5 w-5 h-5 rounded-full bg-white border-2 border-[#51a8b1] flex items-center justify-center shadow-xs z-10 group-hover:scale-110 group-hover:border-[#3a7d84] transition-transform">
                    <ActionIcon className="w-2.5 h-2.5 text-[#3a7d84]" />
                  </div>

                  {/* Card Body */}
                  <div className="bg-white p-3.5 rounded-xl border border-[#b9c0cb]/40 shadow-2xs hover:border-[#b6e0e4] hover:shadow-xs transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Actor Badge */}
                        <span className="font-bold text-xs text-[#333333] flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-[#2f4154] text-white text-[10px] flex items-center justify-center font-bold">
                            {actorName.charAt(0).toUpperCase()}
                          </span>
                          {actorName}
                        </span>

                        {actorRole && (
                          <span className="text-[10px] font-semibold text-[#4a5462] bg-[#f1f3f6] px-1.5 py-0.5 rounded">
                            {actorRole}
                          </span>
                        )}

                        {/* Action Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyle}`}>
                          {item.action.replace(/_/g, ' ')}
                        </span>

                        {/* Project Name (if applicable) */}
                        {projectNameText && (
                          <span className="text-[10px] font-semibold text-[#3a7d84] bg-[#f0f8f9] border border-[#b6e0e4]/80 px-2 py-0.5 rounded-md">
                            {projectNameText}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-[11px] text-[#4a5462]">
                        <Clock className="w-3 h-3 text-[#949ea9]" />
                        <span>{formattedDate} · {formattedTime}</span>
                      </div>
                    </div>

                    {/* Description Text */}
                    <p className="text-xs text-[#333333] font-medium mt-2 leading-relaxed">
                      {formatActivityTitle(item)}
                    </p>

                    {/* Metadata Toggle Bar */}
                    {hasMetadata && (
                      <div className="mt-2.5 pt-2 border-t border-[#f1f3f6] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleExpand(item._id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-[#3a7d84] hover:text-[#265459] transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Payload Delta' : 'View Audit Delta & Payload'}</span>
                        </button>

                        <span className="text-[10px] text-[#4a5462] font-mono">
                          Resource: {item.resourceType || 'General'}
                        </span>
                      </div>
                    )}

                    {/* Expandable JSON payload viewer */}
                    {isExpanded && hasMetadata && (
                      <div className="mt-2 p-3 rounded-xl bg-[#1e293b] text-[#d1d8df] text-[11px] font-mono overflow-x-auto shadow-inner border border-[#334155]">
                        <pre className="whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(item.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Pagination Controls ────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between pt-3 border-t border-[#b9c0cb]/40 ${isDrawer ? 'px-5 py-3' : ''}`}>
          <p className="text-xs text-[#4a5462]">
            Showing page <span className="font-bold text-[#333333]">{currentPage}</span> of <span className="font-bold text-[#333333]">{totalPages}</span> ({totalCount} records)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[#b9c0cb]/60 text-[#4a5462] hover:bg-[#f8fafb] hover:text-[#333333] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[#b9c0cb]/60 text-[#4a5462] hover:bg-[#f8fafb] hover:text-[#333333] disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}