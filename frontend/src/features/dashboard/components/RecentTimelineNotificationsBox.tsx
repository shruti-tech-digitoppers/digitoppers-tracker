'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { INotificationItem } from '../../../lib/api/notifications.api';
import { 
  Bell, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Layers, 
  CheckCheck, 
  Inbox, 
  Briefcase, 
  ListTodo,
  Activity,
  Sparkles
} from 'lucide-react';

type MainCategory = 'ASSIGNMENT' | 'REQUESTS' | 'UPDATES';
type AssignmentSubCategory = 'PROJECT' | 'TASK';

interface RecentTimelineNotificationsBoxProps {
  notifications: INotificationItem[];
  loading?: boolean;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: INotificationItem) => void;
}

export function RecentTimelineNotificationsBox({
  notifications = [],
  loading = false,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
}: RecentTimelineNotificationsBoxProps) {
  const router = useRouter();
  const [category, setCategory] = useState<MainCategory>('ASSIGNMENT');
  const [assignmentSub, setAssignmentSub] = useState<AssignmentSubCategory>('PROJECT');

  // ── Helper to determine item classification ─────────────────────────
  const classifyItem = (item: INotificationItem) => {
    const type = item.type || 'GENERAL';
    const meta = (item.metadata || {}) as Record<string, any>;
    const title = (item.title || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();

    // 1. Task Assignment
    if (
      type === 'TASK_ASSIGNED' ||
      meta.assignmentType === 'TASK' ||
      Boolean(meta.nodeKey) ||
      title.includes('task assigned') ||
      title.includes('assigned step') ||
      msg.includes('task') ||
      msg.includes('node')
    ) {
      return { main: 'ASSIGNMENT', sub: 'TASK' };
    }

    // 2. Project Assignment
    if (
      type === 'ASSIGNMENT' ||
      type === 'PROJECT_ASSIGNED' ||
      type === 'MEMBER_ASSIGNED' ||
      title.includes('assigned as') ||
      title.includes('project manager') ||
      title.includes('contributor') ||
      msg.includes('project manager') ||
      msg.includes('contributor')
    ) {
      return { main: 'ASSIGNMENT', sub: 'PROJECT' };
    }

    // 3. Requests
    if (
      type.includes('PROJECT_REQUEST') ||
      Boolean(meta.requestId) ||
      title.includes('request') ||
      msg.includes('project request')
    ) {
      return { main: 'REQUESTS', sub: 'REQUEST' };
    }

    // 4. Timeline Updates & Progress
    return { main: 'UPDATES', sub: 'TIMELINE' };
  };

  // ── Counts for Categories & Sub-filters ───────────────────────────────
  const counts = useMemo(() => {
    let assignmentTotal = 0;
    let projectAssignment = 0;
    let taskAssignment = 0;
    let requests = 0;
    let updates = 0;

    notifications.forEach((n) => {
      const cls = classifyItem(n);
      if (cls.main === 'ASSIGNMENT') {
        assignmentTotal++;
        if (cls.sub === 'PROJECT') projectAssignment++;
        else if (cls.sub === 'TASK') taskAssignment++;
      } else if (cls.main === 'REQUESTS') {
        requests++;
      } else if (cls.main === 'UPDATES') {
        updates++;
      }
    });

    return {
      assignmentTotal,
      projectAssignment,
      taskAssignment,
      requests,
      updates
    };
  }, [notifications]);

  // ── Filtering Logic ──────────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    return notifications.filter((item) => {
      const cls = classifyItem(item);

      // Main category filter
      if (category === 'ASSIGNMENT') {
        if (cls.main !== 'ASSIGNMENT') return false;
        if (assignmentSub === 'PROJECT' && cls.sub !== 'PROJECT') return false;
        if (assignmentSub === 'TASK' && cls.sub !== 'TASK') return false;
      } else if (category === 'REQUESTS') {
        if (cls.main !== 'REQUESTS') return false;
      } else if (category === 'UPDATES') {
        if (cls.main !== 'UPDATES') return false;
      }

      return true;
    });
  }, [notifications, category, assignmentSub]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const formatItemTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // ── High Color Capacity & Visual Styling ─────────────────────────────
  const getItemVisuals = (item: INotificationItem) => {
    const cls = classifyItem(item);
    const type = item.type || 'GENERAL';

    // 1. Project Assignment (Vibrant Royal Indigo Theme)
    if (cls.main === 'ASSIGNMENT' && cls.sub === 'PROJECT') {
      return {
        label: 'Project Assignment',
        icon: Briefcase,
        borderLeft: 'border-l-[5px] border-l-indigo-600',
        bgCard: 'bg-gradient-to-br from-indigo-100/90 via-indigo-50/50 to-white border-indigo-200/90 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100/80',
        tagBg: 'bg-indigo-600 text-white border-indigo-700 font-extrabold shadow-2xs',
        iconColor: 'text-indigo-600',
        badgePill: 'text-indigo-950 bg-white/95 border-indigo-200/90 shadow-2xs',
        badgeIdText: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        actionBtn: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xs',
        actionLabel: 'View Project',
        detailText: 'text-indigo-700 hover:text-indigo-900',
      };
    }

    // 2. Task Assignment (Vibrant Deep Teal Theme)
    if (cls.main === 'ASSIGNMENT' && cls.sub === 'TASK') {
      return {
        label: 'Task Assignment',
        icon: ListTodo,
        borderLeft: 'border-l-[5px] border-l-[#0d9488]',
        bgCard: 'bg-gradient-to-br from-teal-100/90 via-teal-50/50 to-white border-teal-200/90 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-100/80',
        tagBg: 'bg-[#0d9488] text-white border-teal-700 font-extrabold shadow-2xs',
        iconColor: 'text-[#0d9488]',
        badgePill: 'text-teal-950 bg-white/95 border-teal-200/90 shadow-2xs',
        badgeIdText: 'text-[#0f766e] bg-teal-50 border-teal-200',
        actionBtn: 'bg-gradient-to-r from-[#0d9488] to-[#0f766e] hover:from-[#0f766e] hover:to-[#115e59] text-white shadow-xs',
        actionLabel: 'Open Task',
        detailText: 'text-[#0f766e] hover:text-[#115e59]',
      };
    }

    // 3. Requests Review / Approved (Vibrant Purple & Emerald Themes)
    if (cls.main === 'REQUESTS') {
      if (type === 'PROJECT_REQUEST_APPROVED') {
        return {
          label: 'Request Approved',
          icon: CheckCircle2,
          borderLeft: 'border-l-[5px] border-l-emerald-600',
          bgCard: 'bg-gradient-to-br from-emerald-100/90 via-emerald-50/50 to-white border-emerald-200/90 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100/80',
          tagBg: 'bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-2xs',
          iconColor: 'text-emerald-700',
          badgePill: 'text-emerald-950 bg-white/95 border-emerald-200/90 shadow-2xs',
          badgeIdText: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          actionBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-xs',
          actionLabel: 'View Project',
          detailText: 'text-emerald-700 hover:text-emerald-900',
        };
      }
      return {
        label: 'Project Request',
        icon: FileText,
        borderLeft: 'border-l-[5px] border-l-purple-600',
        bgCard: 'bg-gradient-to-br from-purple-100/90 via-purple-50/50 to-white border-purple-200/90 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-100/80',
        tagBg: 'bg-purple-600 text-white border-purple-700 font-extrabold shadow-2xs',
        iconColor: 'text-purple-600',
        badgePill: 'text-purple-950 bg-white/95 border-purple-200/90 shadow-2xs',
        badgeIdText: 'text-purple-700 bg-purple-50 border-purple-200',
        actionBtn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs',
        actionLabel: 'Review & Confirm',
        actionIcon: CheckCircle2,
        detailText: 'text-purple-700 hover:text-purple-900',
      };
    }

    // 4. Timeline Updates & Milestones (Vibrant Amber Theme)
    return {
      label: 'Timeline Update',
      icon: Activity,
      borderLeft: 'border-l-[5px] border-l-amber-500',
      bgCard: 'bg-gradient-to-br from-amber-100/90 via-amber-50/50 to-white border-amber-200/90 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/80',
      tagBg: 'bg-amber-600 text-white border-amber-700 font-extrabold shadow-2xs',
      iconColor: 'text-amber-600',
      badgePill: 'text-amber-950 bg-white/95 border-amber-200/90 shadow-2xs',
      badgeIdText: 'text-amber-800 bg-amber-50 border-amber-200',
      actionBtn: 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-xs',
      actionLabel: 'Open Tracker',
      detailText: 'text-amber-800 hover:text-amber-950',
    };
  };

  const handleOpenAction = (item: INotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!item.isRead) {
      onMarkAsRead(item._id);
    }
    const meta = (item.metadata || {}) as Record<string, any>;
    const rawProj = meta.projectId || (item as any).project?._id || (item as any).project || (item as any).relatedProject;
    const targetProjId = typeof rawProj === 'object' && rawProj !== null ? (rawProj._id || rawProj.id || rawProj.projectId) : rawProj;

    if (item.type === 'PROJECT_REQUEST_REVIEW' || (!targetProjId && meta.requestId)) {
      onSelectNotification(item);
      return;
    }

    if (targetProjId && targetProjId !== '[object Object]') {
      router.push(`/tracker?projectId=${targetProjId}`);
    } else {
      onSelectNotification(item);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-100/80 overflow-hidden font-sans flex flex-col h-[calc(100vh-180px)] min-h-[620px] max-h-[850px] transition-all">
      {/* ── Header Section ─────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50/60 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Title & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3a7d84] to-[#51a8b1] text-white flex items-center justify-center shadow-md shadow-[#51a8b1]/30 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-sm sm:text-base text-[#111827] tracking-tight truncate">
                  Assignments &amp; Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center text-[10.5px] font-black bg-rose-500 text-white min-w-[22px] h-5 px-1.5 rounded-full shadow-xs shrink-0 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Interactive project assignments, requests, and timeline feeds
              </p>
            </div>
          </div>

          {/* Mark All Read Action */}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-[11px] font-extrabold text-[#0d9488] hover:text-[#0f766e] flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 shadow-2xs transition cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* ── Main Filter Tabs (Assignments / Requests / Updates) ── */}
        <div className="flex items-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-[11px] sm:text-xs shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setCategory('ASSIGNMENT')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              category === 'ASSIGNMENT'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/90 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Assignments</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              category === 'ASSIGNMENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-200/70 text-slate-700 border-slate-300'
            }`}>
              {counts.assignmentTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategory('REQUESTS')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              category === 'REQUESTS'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/90 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Requests</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              category === 'REQUESTS' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-200/70 text-slate-700 border-slate-300'
            }`}>
              {counts.requests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategory('UPDATES')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              category === 'UPDATES'
                ? 'bg-white text-amber-700 shadow-sm border border-slate-200/90 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-600" />
            <span>Updates</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold border ${
              category === 'UPDATES' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-200/70 text-slate-700 border-slate-300'
            }`}>
              {counts.updates}
            </span>
          </button>
        </div>

        {/* ── Sub-Filters for Assignments (Projects vs Tasks) ──────────── */}
        {category === 'ASSIGNMENT' && (
          <div className="flex items-center gap-2 p-1 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => setAssignmentSub('PROJECT')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentSub === 'PROJECT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Projects ({counts.projectAssignment})</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentSub('TASK')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentSub === 'TASK'
                  ? 'bg-[#0d9488] text-white shadow-md shadow-teal-200 font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks ({counts.taskAssignment})</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Scrollable Notifications Cards Feed ────────────── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 divide-y divide-transparent">
        {displayedItems.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm mx-auto flex items-center justify-center text-[#0d9488]">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-sm text-slate-800">
                No notifications in this category
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Real-time project assignments, requests, and roadmap milestones will stream here automatically.
              </p>
            </div>
          </div>
        ) : (
          displayedItems.map((item) => {
            const visual = getItemVisuals(item);
            const meta = (item.metadata || {}) as Record<string, any>;
            const isMongoObjectId = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
            
            // Extract Project/Request code
            let projCode = 
              ((item as any).project?.projectId) ||
              (!isMongoObjectId(meta.projectId) ? meta.projectId : null) ||
              meta.requestCustomId ||
              meta.requestId ||
              null;
            
            if (!projCode && item.message) {
              const reqMatch = item.message.match(/(REQ-[0-9]{4}-[0-9]{3,4})/i) || item.message.match(/(PRJ-[0-9]{4}-[0-9]{3,4})/i);
              if (reqMatch) projCode = reqMatch[1];
            }

            // Extract Project/Request Title
            let rawTitle = meta.projectName || meta.projectTitle || (item as any).project?.projectName || (item as any).project?.title || meta.title;
            if (!rawTitle && item.message) {
              const parenMatch = item.message.match(/\(([a-zA-Z0-9\s_-]+)\)/);
              if (parenMatch && parenMatch[1] && !parenMatch[1].startsWith('REQ-') && !parenMatch[1].startsWith('PRJ-')) {
                rawTitle = parenMatch[1];
              }
            }
            const cleanProjTitle = rawTitle || (projCode ? 'Project Request' : null);
            const nodeKey = meta.nodeKey;

            // Normalized Notification Title
            const normalizedTitle = (() => {
              const t = (item.title || '').trim();
              const lower = t.toLowerCase();
              if (
                lower.includes('project request submitted') || 
                lower.includes('project request awaiting review') || 
                lower.includes('project request for review') ||
                lower === 'new project request submitted'
              ) {
                return 'New Project Request Received';
              }
              return t;
            })();

            return (
              <div
                key={item._id}
                onClick={() => onSelectNotification(item)}
                className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer space-y-3 ${
                  visual.borderLeft
                } ${visual.bgCard} ${
                  !item.isRead ? 'ring-1 ring-slate-300/80 shadow-md' : 'opacity-95 hover:opacity-100 shadow-xs'
                }`}
              >
                {/* 1. Header Row: Badge, Relative Time & Unread Beacon */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-3 py-1 rounded-xl border ${visual.tagBg}`}>
                    <visual.icon className="w-3.5 h-3.5" />
                    <span>{visual.label}</span>
                  </span>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatItemTime(item.createdAt)}</span>
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-xs ml-0.5 animate-ping" />
                    )}
                  </div>
                </div>

                {/* 2. Project Code & Step Breadcrumb */}
                {(projCode || cleanProjTitle || nodeKey) && (
                  <div className={`px-3 py-2 rounded-xl border text-xs space-y-1 ${visual.badgePill}`}>
                    {(cleanProjTitle || projCode) && (
                      <div className="font-bold flex items-center gap-1.5 truncate">
                        <Layers className={`w-4 h-4 ${visual.iconColor} shrink-0`} />
                        <span className="truncate">
                          {projCode ? (
                            <span className={`font-mono font-extrabold mr-1.5 px-1.5 py-0.5 rounded-md border text-[11px] ${visual.badgeIdText}`}>
                              {projCode}
                            </span>
                          ) : null}
                          <span className="text-slate-900 font-extrabold">{cleanProjTitle}</span>
                        </span>
                      </div>
                    )}
                    {nodeKey && (
                      <div className="text-[11px] font-mono pl-5.5 truncate font-semibold text-slate-600">
                        Assigned Step: <strong className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-300 font-extrabold">{nodeKey}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Title & Full Description */}
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-xs sm:text-[13.5px] text-slate-900 leading-snug">
                    {normalizedTitle}
                  </h4>
                  <p className="text-[12px] text-slate-700 leading-relaxed line-clamp-2 font-normal">
                    {item.message}
                  </p>
                </div>

                {/* 4. Action Footer */}
                <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={(e) => handleOpenAction(item, e)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${visual.actionBtn}`}
                  >
                    {visual.actionIcon && <visual.actionIcon className="w-4 h-4" />}
                    <span>{visual.actionLabel}</span>
                    {!visual.actionIcon && <ArrowUpRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

