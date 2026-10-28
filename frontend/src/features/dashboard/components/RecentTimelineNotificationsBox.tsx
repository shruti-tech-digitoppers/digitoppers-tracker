'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { INotificationItem, notificationsApi } from '../../../lib/api/notifications.api';
import { 
  Bell, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Layers, 
  CheckCheck, 
  Check,
  Inbox, 
  Briefcase, 
  ListTodo,
  Activity,
  Sparkles,
  PanelRightClose,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

type MainCategory = 'ALL' | 'ASSIGNMENT' | 'REQUESTS' | 'UPDATES';
type AssignmentSubCategory = 'PROJECT' | 'TASK';

interface RecentTimelineNotificationsBoxProps {
  notifications: INotificationItem[];
  loading?: boolean;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectNotification: (item: INotificationItem) => void;
  onToggleShrink?: () => void;
  isShrunk?: boolean;
}

export function RecentTimelineNotificationsBox({
  notifications = [],
  loading = false,
  onRefresh,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
  onToggleShrink,
  isShrunk = false,
}: RecentTimelineNotificationsBoxProps) {
  const router = useRouter();
  const [category, setCategory] = useState<MainCategory>('ASSIGNMENT');
  const [assignmentSub, setAssignmentSub] = useState<AssignmentSubCategory>('PROJECT');
  const [testingSlack, setTestingSlack] = useState<boolean>(false);
  const [slackStatus, setSlackStatus] = useState<{ message: string; isError: boolean } | null>(null);

  const handleTestSlack = async () => {
    setTestingSlack(true);
    setSlackStatus(null);
    try {
      const res = await notificationsApi.testSlackNotification();
      setSlackStatus({ message: res.message || 'Slack test message sent!', isError: false });
      setTimeout(() => setSlackStatus(null), 5000);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Could not send message to Slack';
      setSlackStatus({ message: errMsg, isError: true });
      setTimeout(() => setSlackStatus(null), 7000);
    } finally {
      setTestingSlack(false);
    }
  };

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

  // ── Unread Counts for Categories & Sub-filters (Decreases as marked read) ──────
  const unreadCounts = useMemo(() => {
    let allTotal = 0;
    let assignmentTotal = 0;
    let projectAssignment = 0;
    let taskAssignment = 0;
    let requests = 0;
    let updates = 0;

    notifications.filter((n) => !n.isRead).forEach((n) => {
      allTotal++;
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
      allTotal,
      assignmentTotal,
      projectAssignment,
      taskAssignment,
      requests,
      updates
    };
  }, [notifications]);

  // ── Total Counts for Reference ──────────────────────────────────────
  const totalCounts = useMemo(() => {
    let allTotal = notifications.length;
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
      allTotal,
      assignmentTotal,
      projectAssignment,
      taskAssignment,
      requests,
      updates
    };
  }, [notifications]);

  // ── Filtering Logic ──────────────────────────────────────────────────
  const displayedItems = useMemo(() => {
    const filtered = notifications.filter((item) => {
      if (category === 'ALL') return true;

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

    // Sort strictly by timestamp: latest notification always on top!
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
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
        tagBgRead: 'bg-indigo-50/90 text-indigo-700 border-indigo-200/90 font-bold',
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
        tagBgRead: 'bg-teal-50/90 text-teal-700 border-teal-200/90 font-bold',
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
          tagBgRead: 'bg-emerald-50/90 text-emerald-700 border-emerald-200/90 font-bold',
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
        tagBgRead: 'bg-purple-50/90 text-purple-700 border-purple-200/90 font-bold',
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
      tagBgRead: 'bg-amber-50/90 text-amber-800 border-amber-200/90 font-bold',
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
    <div className="adaptive-notifications-box bg-white border border-[#b6e0e4]/80 shadow-2xs hover:shadow-xs overflow-hidden font-sans flex flex-col transition-all duration-200">
      {/* ── Filter Tabs & Action Controls ─────────────────────────────────── */}
      <div className="p-2 sm:p-2.5 border-b border-[#b6e0e4]/50 bg-gradient-to-r from-[#f0f8f9]/90 via-white to-[#f8fafb] space-y-1.5">
        {/* ── Main Filter Tabs (All / Assignments / Requests / Updates) with Sleek Horizontal Scroll ── */}
        <div className="sleek-tabs-scroll p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-inner">
          <div className="flex items-center gap-1.5 min-w-max text-[10.5px] sm:text-[11px]">
            <button
              type="button"
              onClick={() => setCategory('ALL')}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                category === 'ALL'
                  ? 'bg-white text-[#2d6b73] shadow-xs border border-slate-200/90 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2d6b73]" />
              <span>All</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full border transition-all ${
                unreadCounts.allTotal > 0
                  ? (category === 'ALL' ? 'bg-teal-50 text-[#2d6b73] border-teal-200 font-black' : 'bg-teal-100/70 text-teal-800 border-teal-300 font-bold')
                  : 'bg-slate-200/50 text-slate-400 border-slate-300 font-semibold'
              }`}>
                {unreadCounts.allTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('ASSIGNMENT')}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                category === 'ASSIGNMENT'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/90 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assignments</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full border transition-all ${
                unreadCounts.assignmentTotal > 0
                  ? (category === 'ASSIGNMENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-black' : 'bg-indigo-100/70 text-indigo-800 border-indigo-300 font-bold')
                  : 'bg-slate-200/50 text-slate-400 border-slate-300 font-semibold'
              }`}>
                {unreadCounts.assignmentTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('REQUESTS')}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                category === 'REQUESTS'
                  ? 'bg-white text-purple-700 shadow-xs border border-slate-200/90 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Requests</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full border transition-all ${
                unreadCounts.requests > 0
                  ? (category === 'REQUESTS' ? 'bg-purple-50 text-purple-700 border-purple-200 font-black' : 'bg-purple-100/70 text-purple-800 border-purple-300 font-bold')
                  : 'bg-slate-200/50 text-slate-400 border-slate-300 font-semibold'
              }`}>
                {unreadCounts.requests}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('UPDATES')}
              className={`shrink-0 px-3 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                category === 'UPDATES'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/90 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-600" />
              <span>Updates</span>
              <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded-full border transition-all ${
                unreadCounts.updates > 0
                  ? (category === 'UPDATES' ? 'bg-amber-50 text-amber-800 border-amber-200 font-black' : 'bg-amber-100/70 text-amber-900 border-amber-300 font-bold')
                  : 'bg-slate-200/50 text-slate-400 border-slate-300 font-semibold'
              }`}>
                {unreadCounts.updates}
              </span>
            </button>
          </div>
        </div>

        {/* ── Sub-Filters for Assignments (Projects vs Tasks) ──────────── */}
        {category === 'ASSIGNMENT' && (
          <div className="flex items-center gap-2 p-1 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              type="button"
              onClick={() => setAssignmentSub('PROJECT')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentSub === 'PROJECT'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Projects ({unreadCounts.projectAssignment})</span>
            </button>

            <button
              type="button"
              onClick={() => setAssignmentSub('TASK')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                assignmentSub === 'TASK'
                  ? 'bg-[#0d9488] text-white shadow-md shadow-teal-200 font-black'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Tasks ({unreadCounts.taskAssignment})</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-0.5 px-0.5 text-xs">
          <div className="flex items-center">
            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                <span>{unreadCount} unread update{unreadCount > 1 ? 's' : ''}</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" /> All caught up
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Send a test notification to Slack channel"
            >
              <span className="text-[10px]">💬</span>
              <span>{testingSlack ? 'Sending...' : 'Test Slack'}</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => onMarkAllAsRead()}
                className="text-[11px] font-bold text-[#0d9488] hover:text-[#0f766e] flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 border border-teal-200 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Slack Status Feedback Banner ── */}
        {slackStatus && (
          <div className={`text-[11px] px-2.5 py-1.5 rounded-lg border flex items-center justify-between transition-all ${
            slackStatus.isError
              ? 'bg-amber-50 text-amber-900 border-amber-300'
              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
          }`}>
            <span>{slackStatus.message}</span>
            <button
              type="button"
              onClick={() => setSlackStatus(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 ml-2"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Scrollable Notifications Cards Feed ────────────── */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2 adaptive-scroll divide-y divide-transparent">
        {displayedItems.length === 0 ? (
          <div className="text-center py-10 px-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm mx-auto flex items-center justify-center text-[#0d9488]">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-extrabold text-xs text-slate-800">
                {category === 'ALL' ? 'No notifications yet' : 'No notifications in this category'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
                Real-time project assignments, requests, and roadmap milestones will stream here automatically.
              </p>
            </div>
          </div>
        ) : (
          displayedItems.map((item) => {
            const visual = getItemVisuals(item);
            const meta = (item.metadata || {}) as Record<string, any>;
            const isMongoObjectId = (val: any) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
            const isUnread = !item.isRead;
            
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
                onClick={() => {
                  if (isUnread) {
                    onMarkAsRead(item._id);
                  }
                  onSelectNotification(item);
                }}
                className={`group relative p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer space-y-2 ${visual.borderLeft} ${
                  isUnread
                    ? `${visual.bgCard} ring-1.5 ring-slate-400/80 shadow-xs opacity-100`
                    : 'bg-white/80 hover:bg-slate-50/90 border-slate-200/90 opacity-60 hover:opacity-90 shadow-2xs'
                }`}
              >
                {/* 1. Header Row: Badge, Relative Time & Unread Status Indicator */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-0.5 rounded-lg border ${
                      isUnread ? visual.tagBg : visual.tagBgRead
                    }`}>
                      <visual.icon className="w-3.5 h-3.5" />
                      <span>{visual.label}</span>
                    </span>

                    {isUnread ? (
                      <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        NEW
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-400 bg-slate-100/70 border border-slate-200/80 px-1.5 py-0.2 rounded-md">
                        <Check className="w-2.5 h-2.5 text-slate-400 stroke-[2]" />
                        READ
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-mono font-medium shrink-0">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatItemTime(item.createdAt)}</span>

                    {/* Quick Single Mark Read Button: Only shown when unread, removed once marked as read */}
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead(item._id);
                        }}
                        className="p-1 rounded-md border text-teal-700 hover:text-white bg-teal-50 hover:bg-teal-600 border-teal-200 transition-all cursor-pointer shadow-2xs"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Project Code & Step Breadcrumb */}
                {(projCode || cleanProjTitle || nodeKey) && (
                  <div className={`px-3 py-2 rounded-xl border text-xs space-y-1 ${
                    isUnread ? visual.badgePill : 'bg-white/80 border-slate-200/80 text-slate-600'
                  }`}>
                    {(cleanProjTitle || projCode) && (
                      <div className="font-bold flex items-center gap-1.5 truncate">
                        <Layers className={`w-4 h-4 ${isUnread ? visual.iconColor : 'text-slate-400'} shrink-0`} />
                        <span className="truncate">
                          {projCode ? (
                            <span className={`font-mono font-extrabold mr-1.5 px-1.5 py-0.5 rounded-md border text-[11px] ${
                              isUnread ? visual.badgeIdText : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {projCode}
                            </span>
                          ) : null}
                          <span className={`${isUnread ? 'text-slate-900 font-black' : 'text-slate-700 font-bold'}`}>
                            {cleanProjTitle}
                          </span>
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
                  <h4 className={`font-heading text-xs sm:text-[13.5px] leading-snug ${
                    isUnread ? 'text-slate-900 font-black' : 'text-slate-700 font-bold'
                  }`}>
                    {normalizedTitle}
                  </h4>
                  <p className={`text-[12px] leading-relaxed line-clamp-2 ${
                    isUnread ? 'text-slate-700 font-medium' : 'text-slate-500 font-normal'
                  }`}>
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

