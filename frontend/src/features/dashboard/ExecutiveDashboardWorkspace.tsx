import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { projectsApi } from '../../lib/api/projects.api';
import { employeesApi } from '../../lib/api/employees.api';
import { authApi } from '../../lib/api/auth.api';
import { notificationsApi, INotificationItem } from '../../lib/api/notifications.api';
import { IProject } from '../../types/project';
import { IUser } from '../../types/auth';
import { DashboardStatsGrid, StatusFilter } from './components/DashboardStatsGrid';
import { DashboardFilterBar } from './components/DashboardFilterBar';
import { DashboardRoadmapList } from './components/DashboardRoadmapList';
import { RecentTimelineNotificationsBox } from './components/RecentTimelineNotificationsBox';
import { CreateProjectRequestModal } from '../requests/components/CreateProjectRequestModal';
import { NotificationDetailModal } from '../../components/shell/NotificationDetailModal';
import { requestsApi } from '../../lib/api/requests.api';
import { ICreateProjectRequestPayload } from '../../types/request';
import { RefreshCw, Send, Search, X, PanelRightOpen, Bell, Layers, UserCheck } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

interface ExecutiveDashboardWorkspaceProps {
  hideSidePanel?: boolean;
}

export function ExecutiveDashboardWorkspace({ hideSidePanel = false }: ExecutiveDashboardWorkspaceProps = {}) {
  const { searchQuery, clearSearch } = useSearch();
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);

  const [projects, setProjects] = useState<IProject[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<INotificationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'ME'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSidePanelShrunk, setIsSidePanelShrunk] = useState<boolean>(false);

  const isAdmin = currentUser?.globalRole === 'ADMIN' || (currentUser as any)?.role === 'ADMIN';
  const canRequestProject = isAdmin || Boolean(currentUser?.canRequestNewProject || currentUser?.permissions?.canRequestNewProject);

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;

      if (!token || hideSidePanel) {
        // Guest / Root mode: only fetch projects and their timelines
        const res = await projectsApi.getProjects();
        const projectList = res.projects || [];
        setProjects(projectList);
        setEmployees([]);
        setNotifications([]);

        setExpandedMap((prev) => {
          const next: Record<string, boolean> = {};
          projectList.forEach((p) => {
            next[p._id] = prev[p._id] !== undefined ? prev[p._id] : false;
          });
          return next;
        });
        return;
      }

      // Authenticated mode: fetch projects, employees, and notifications in parallel
      const [res, empRes, notifRes] = await Promise.all([
        projectsApi.getProjects(),
        employeesApi.getEmployees().catch(() => ({ success: true, employees: [] })),
        notificationsApi.getNotifications().catch(() => ({ success: true, notifications: [] })),
      ]);
      const projectList = res.projects || [];
      setProjects(projectList);
      setEmployees(empRes.employees || []);
      setNotifications(notifRes.notifications || []);

      // Default: Retain existing expansions
      setExpandedMap((prev) => {
        const next: Record<string, boolean> = {};
        projectList.forEach((p) => {
          if (prev[p._id] !== undefined) {
            next[p._id] = prev[p._id];
          } else {
            next[p._id] = false;
          }
        });
        return next;
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load projects dashboard.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  const refreshNotificationsOnly = useCallback(async () => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;
    if (!token) return;

    try {
      setNotificationsLoading(true);
      const notifRes = await notificationsApi.getNotifications();
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Failed to refresh notifications feed:', err);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;
    if (token) {
      authApi.getMe().then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
          try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
        }
      }).catch(() => {
        setCurrentUser(null);
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        } catch {}
      });
    } else {
      setCurrentUser(null);
    }

    fetchDashboardData(true);
  }, [fetchDashboardData]);

  const toggleProject = (projectId: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const isProjectAssignedToUser = useCallback((project: IProject, user: IUser | null) => {
    if (!user) return false;
    const uid = String(user._id || (user as any).id || '');
    const uName = (user.name || '').toLowerCase().trim();
    const uEmail = (user.email || '').toLowerCase().trim();
    const uCode = ((user as any).employeeCode || '').toLowerCase().trim();

    // 1. Project Manager check
    if (project.projectManager) {
      if (typeof project.projectManager === 'object') {
        const pm = project.projectManager as any;
        const pmId = String(pm._id || pm.id || '');
        const pmName = (pm.name || '').toLowerCase().trim();
        const pmEmail = (pm.email || '').toLowerCase().trim();
        const pmCode = (pm.employeeCode || '').toLowerCase().trim();
        if (pmId && pmId === uid) return true;
        if (uEmail && pmEmail && pmEmail === uEmail) return true;
        if (uName && pmName && (pmName === uName || pmName.includes(uName) || uName.includes(pmName))) return true;
        if (uCode && pmCode && pmCode === uCode) return true;
      } else if (typeof project.projectManager === 'string') {
        const pmStr = project.projectManager.toLowerCase().trim();
        if (project.projectManager === uid) return true;
        if (pmStr === uName || pmStr.includes(uName) || uName.includes(pmStr)) return true;
        if (pmStr === uEmail) return true;
        if (uCode && pmStr === uCode) return true;
      }
    }

    // 2. Project Members / Team
    if (Array.isArray((project as any).members)) {
      const match = (project as any).members.some((m: any) => {
        if (typeof m === 'object' && m !== null) {
          const mId = String(m._id || m.id || (m.employee && (m.employee._id || m.employee.id)) || '');
          const mName = (m.name || (m.employee && m.employee.name) || '').toLowerCase().trim();
          const mEmail = (m.email || (m.employee && m.employee.email) || '').toLowerCase().trim();
          if (mId && mId === uid) return true;
          if (uEmail && mEmail && mEmail === uEmail) return true;
          if (uName && mName && (mName === uName || mName.includes(uName) || uName.includes(mName))) return true;
        } else if (typeof m === 'string') {
          return m === uid || m.toLowerCase() === uEmail || m.toLowerCase() === uName;
        }
        return false;
      });
      if (match) return true;
    }

    // 3. Reviewer or Creator or Requester
    const rev = String((project as any).assignedReviewer || '');
    const req = String((project as any).requestedBy || '');
    const created = String(project.createdBy || '');
    if (rev === uid || req === uid || created === uid) return true;

    // 4. Also check notifications metadata linking to this user and project
    const hasLinkedNotification = notifications.some((n) => {
      const meta = (n.metadata || {}) as any;
      const nProj = meta.projectId || meta.projectDatabaseId || (n as any).project?._id || (n as any).project;
      const projIdStr = typeof nProj === 'object' && nProj !== null ? nProj._id : nProj;
      return projIdStr === project._id || projIdStr === project.projectId;
    });
    if (hasLinkedNotification) return true;

    return false;
  }, [notifications]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Small Scope Filter (All vs Me)
      if (scopeFilter === 'ME') {
        const isAssigned = isProjectAssignedToUser(p, currentUser);
        if (!isAssigned) return false;
      }

      // 2. Status Filter from 5 Stats Cards
      if (statusFilter !== 'ALL') {
        if (p.status !== statusFilter) return false;
      }

      // 3. Search Keyword Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const code = (p.projectId || '').toLowerCase();
      const name = (p.projectName || p.title || '').toLowerCase();
      const org = (p.organization || '').toLowerCase();
      const pmName = (
        typeof p.projectManager === 'object' && p.projectManager !== null
          ? (p.projectManager as any).name || ''
          : typeof p.projectManager === 'string'
          ? p.projectManager
          : ''
      ).toLowerCase();

      return code.includes(q) || name.includes(q) || org.includes(q) || pmName.includes(q);
    });
  }, [projects, scopeFilter, statusFilter, searchQuery, currentUser, isProjectAssignedToUser]);

  const allExpanded = filteredProjects.length > 0 && filteredProjects.every((p) => expandedMap[p._id]);
  const allCollapsed = filteredProjects.length > 0 && filteredProjects.every((p) => !expandedMap[p._id]);

  const expandAll = () =>
    setExpandedMap((prev) => {
      const next = { ...prev };
      filteredProjects.forEach((p) => { next[p._id] = true; });
      return next;
    });

  const collapseAll = () =>
    setExpandedMap((prev) => {
      const next = { ...prev };
      filteredProjects.forEach((p) => { next[p._id] = false; });
      return next;
    });

  const stats = useMemo(() => {
    const assignedCount = projects.filter((p) => isProjectAssignedToUser(p, currentUser)).length;
    return {
      total:     projects.length,
      active:    projects.filter((p) => p.status === 'ACTIVE').length,
      onHold:    projects.filter((p) => p.status === 'ON_HOLD').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      archived:  projects.filter((p) => p.status === 'ARCHIVED').length,
      assignedToMe: assignedCount,
    };
  }, [projects, currentUser, isProjectAssignedToUser]);

  const handleCreateProjectRequest = async (payload: ICreateProjectRequestPayload) => {
    const res = await requestsApi.createRequest(payload);
    await fetchDashboardData(false);
    return res.request;
  };

  return (
    <div className="max-w-[1700px] mx-auto space-y-5 font-sans">
      {/* ── Top Page Welcome & Actions Bar ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
        <div className="space-y-1">
          <h2 suppressHydrationWarning className="font-heading text-lg sm:text-2xl font-extrabold text-[#2d6b73] tracking-tight">
            Hello, {currentUser?.name || 'User'}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-[#556987]">
            Welcome to <span className="font-semibold text-[#3a7d84]">DigiToppers Project Tracker</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {canRequestProject && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-[#3a7d84] to-[#51a8b1] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Project Request</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="border border-[#b6e0e4] bg-white px-4 py-2.5 rounded-xl text-xs font-bold text-[#2d6b73] hover:bg-[#f0f8f9] transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#51a8b1] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* ── Full 5 Stats Cards Section (Total Projects, Active, On Hold, Completed, Archived) ── */}
      <DashboardStatsGrid
        stats={stats}
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* ── Sub-Stats Toolbar: Projects Timeline Title + 2 Small Filters (All vs Me) + Notifications Toggle ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Left: 'Projects Timeline' Title + 2 Filters (All vs Assigned to Me) */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 sm:pr-3 sm:border-r border-slate-200">
            <div className="w-7 h-7 rounded-xl bg-[#f0f9fa] border border-[#b6e0e4] flex items-center justify-center text-[#2d6b73]">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-heading text-sm font-bold text-slate-900 tracking-tight">
              Projects Timeline
            </span>
          </div>

          {/* Small Filters: All vs Me */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setScopeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scopeFilter === 'ALL'
                  ? 'bg-white text-[#3a7d84] shadow-xs border border-slate-200/90 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All</span>
              <span className="font-mono text-[10.5px] px-1.5 py-0.2 rounded-md bg-slate-200/70 text-slate-700 font-bold">
                {projects.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setScopeFilter('ME')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                scopeFilter === 'ME'
                  ? 'bg-[#0d9488] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assigned to Me</span>
              <span className={`font-mono text-[10.5px] px-1.5 py-0.2 rounded-md font-bold ${
                scopeFilter === 'ME' ? 'bg-[#0f766e] text-white' : 'bg-slate-200/70 text-slate-700'
              }`}>
                {stats.assignedToMe}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Primary Notification Shrink / Expand Button (Under Stats Cards) */}
        {currentUser && !hideSidePanel && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {!isSidePanelShrunk ? (
              <button
                type="button"
                onClick={() => setIsSidePanelShrunk(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50/70 text-slate-700 hover:text-[#0d9488] border border-slate-200/90 hover:border-teal-300 text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                title="Toggle notifications panel"
              >
                <Bell className="w-4 h-4 text-slate-500 group-hover:text-[#0d9488] transition" />
                <span>Notifications</span>
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSidePanelShrunk(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-[#3a7d84] hover:from-teal-700 hover:to-[#2e646a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer group animate-in fade-in"
                title="Open notifications & assignments feed"
              >
                <Bell className="w-4 h-4 text-white" />
                <span>Notifications</span>
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Main Workspace Layout: 62/38 Split when Logged In with Side Panel, 100% Full Width when Shrunk or Guest ── */}
      {(() => {
        const showSidePanel = Boolean(currentUser && !hideSidePanel && !isSidePanelShrunk);
        return (
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* ── Left Column: Timeline Roadmaps & Projects (Takes 100% full width if side panel is shrunk) ── */}
            <div className={`w-full ${showSidePanel ? 'lg:w-[62%] xl:w-[64%]' : 'lg:w-full'} space-y-4 min-w-0 transition-all duration-300`}>
              {/* Projects List with Collapsible Roadmaps */}
              <DashboardRoadmapList
                projects={filteredProjects}
                loading={loading}
                error={error}
                statusFilter={statusFilter}
                scopeFilter={scopeFilter}
                expandedMap={expandedMap}
                onToggleProject={toggleProject}
                onRetry={fetchDashboardData}
                onProjectUpdated={fetchDashboardData}
                currentUser={currentUser}
                compactTimeline={showSidePanel}
                employees={employees}
              />
            </div>

            {/* ── 38% Width Right Column: Recent Timeline Notifications & Requests Box ── */}
            {showSidePanel && (
              <div className="w-full lg:w-[38%] xl:w-[36%] lg:sticky lg:top-4 min-w-0 animate-in fade-in zoom-in-95 duration-200">
                <RecentTimelineNotificationsBox
                  notifications={notifications}
                  loading={notificationsLoading}
                  onRefresh={refreshNotificationsOnly}
                  onMarkAsRead={handleMarkNotificationRead}
                  onMarkAllAsRead={handleMarkAllNotificationsRead}
                  onSelectNotification={(item) => setSelectedNotification(item)}
                  onToggleShrink={() => setIsSidePanelShrunk(true)}
                  isShrunk={isSidePanelShrunk}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Project Creation Request Modal ────────────── */}
      <CreateProjectRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        onSubmit={handleCreateProjectRequest}
      />

      {/* ── Notification & Request Full Details / Confirmation Modal ── */}
      <NotificationDetailModal
        notification={selectedNotification}
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        onRefreshData={fetchDashboardData}
      />
    </div>
  );
}