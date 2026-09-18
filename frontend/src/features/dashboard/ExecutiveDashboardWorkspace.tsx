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
import { RefreshCw, Send, Search, X, PanelRightOpen, Bell } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

interface ExecutiveDashboardWorkspaceProps {
  hideSidePanel?: boolean;
}

export function ExecutiveDashboardWorkspace({ hideSidePanel = false }: ExecutiveDashboardWorkspaceProps = {}) {
  const { searchQuery, clearSearch } = useSearch();
  const [currentUser, setCurrentUser] = useState<IUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return null;
  });

  const [projects, setProjects] = useState<IProject[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<INotificationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

      if (!token) {
        // Guest mode: only fetch public projects list
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

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Status Filter
      const matchStatus = statusFilter === 'ALL' ? true : p.status === statusFilter;
      if (!matchStatus) return false;

      // 2. Search Keyword Filter
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
  }, [projects, statusFilter, searchQuery]);

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

  const stats = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter((p) => p.status === 'ACTIVE').length,
    onHold:    projects.filter((p) => p.status === 'ON_HOLD').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    archived:  projects.filter((p) => p.status === 'ARCHIVED').length,
  }), [projects]);

  const handleCreateProjectRequest = async (payload: ICreateProjectRequestPayload) => {
    const res = await requestsApi.createRequest(payload);
    await fetchDashboardData(false);
    return res.request;
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-[#3a7d84]">
            Executive Dashboard
          </h1>
          <p className="text-xs text-[#4a5462] font-medium mt-0.5">
            Real-time project overview — expand any confirmed project to view its live execution roadmap.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Re-expand Notifications Button (Visible when side panel is shrunk) */}
          {currentUser && !hideSidePanel && isSidePanelShrunk && (
            <button
              type="button"
              onClick={() => setIsSidePanelShrunk(false)}
              className="bg-teal-50 text-[#0f766e] border border-teal-200 hover:bg-teal-100 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer animate-in fade-in"
              title="Open Notifications & Assignments Panel"
            >
              <Bell className="w-4 h-4 text-[#0d9488]" />
              <span>Notifications</span>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
          )}

          {canRequestProject && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-[#51a8b1] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#3a7d84] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              New Project Request
            </button>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="border border-[#b9c0cb]/60 bg-white px-3.5 py-2 rounded-xl text-xs font-semibold text-[#3a7d84] hover:bg-[#f0f8f9] transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#51a8b1] ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </button>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────── */}
      <DashboardStatsGrid
        stats={stats}
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* ── Main Workspace Layout: 60/40 Split when Logged In with Side Panel, 100% Full Width when Shrunk or Guest ── */}
      {(() => {
        const showSidePanel = Boolean(currentUser && !hideSidePanel && !isSidePanelShrunk);
        return (
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* ── Left Column: Timeline Roadmaps & Projects (Takes 100% full width if side panel is shrunk) ── */}
            <div className={`w-full ${showSidePanel ? 'lg:w-[60%]' : 'lg:w-full'} space-y-4 min-w-0 transition-all duration-300`}>
              {/* Projects List with Collapsible Roadmaps */}
              <DashboardRoadmapList
                projects={filteredProjects}
                loading={loading}
                error={error}
                statusFilter={statusFilter}
                expandedMap={expandedMap}
                onToggleProject={toggleProject}
                onRetry={fetchDashboardData}
                onProjectUpdated={fetchDashboardData}
                currentUser={currentUser}
                compactTimeline={showSidePanel}
              />
            </div>

            {/* ── 40% Width Right Column: Recent Timeline Notifications & Requests Box ── */}
            {showSidePanel && (
              <div className="w-full lg:w-[40%] lg:sticky lg:top-4 min-w-0 animate-in fade-in zoom-in-95 duration-200">
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