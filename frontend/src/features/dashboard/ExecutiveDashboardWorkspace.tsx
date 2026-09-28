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
import { 
  RefreshCw, 
  Send, 
  Search, 
  X, 
  PanelRightOpen, 
  PanelRightClose,
  Bell, 
  Layers, 
  UserCheck, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useLoading } from '../../context/LoadingContext';

interface ExecutiveDashboardWorkspaceProps {
  hideSidePanel?: boolean;
}

export function ExecutiveDashboardWorkspace({ hideSidePanel = false }: ExecutiveDashboardWorkspaceProps = {}) {
  const { searchQuery, clearSearch } = useSearch();
  const { showLoading, hideLoading } = useLoading();
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
  
  // Independent Partition Open/Close Toggles
  const [isTimelineOpen, setIsTimelineOpen] = useState<boolean>(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(true);

  const isAdmin = currentUser?.globalRole === 'ADMIN' || (currentUser as any)?.role === 'ADMIN';
  const canRequestProject = isAdmin || Boolean(currentUser?.canRequestNewProject || currentUser?.permissions?.canRequestNewProject);

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;

      if (!token) {
        // Guest mode: fetch projects and generate project activity feeds
        const res = await projectsApi.getProjects();
        const projectList = res.projects || [];
        setProjects(projectList);
        setEmployees([]);

        // Generate lively timeline updates & assignments from active projects for demonstration
        const nowIso = new Date().toISOString();
        const guestNotifications: INotificationItem[] = projectList.slice(0, 5).map((p, idx) => ({
          _id: `guest-notif-${p._id || idx}`,
          recipient: 'guest',
          title: `Project Update: ${p.projectName || (p as any).title || 'Project'}`,
          message: `Current Status: ${(p as any).currentStage || p.status || 'Active'} is in progress with real-time tracking enabled.`,
          type: idx === 0 ? 'ASSIGNMENT' : idx === 1 ? 'TASK_ASSIGNED' : 'STATUS_UPDATE',
          isRead: idx > 1,
          createdAt: new Date(Date.now() - idx * 3600000).toISOString(),
          updatedAt: nowIso,
          metadata: {
            projectId: p._id,
            projectName: p.projectName || p.title,
            projectCustomId: p.projectId,
            targetUrl: `/tracker?projectId=${p._id}`
          }
        }));
        setNotifications(guestNotifications);

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

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
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
            onClick={() => {
              showLoading({
                message: 'Refreshing DigiToppers Dashboard...',
                subtext: 'Syncing project roadmaps and real-time activities',
              });
              fetchDashboardData(true).finally(() => {
                setTimeout(hideLoading, 600);
              });
            }}
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

      {/* ── Main Dual Partition Workspace Helpers & Render ── */}
      {(() => {
        const renderTimelineCard = (compact: boolean) => (
          <div className="bg-white rounded-2xl border border-[#b6e0e4]/80 shadow-xs hover:shadow-sm overflow-hidden flex flex-col transition-all duration-200">
            {/* Timeline Card Header */}
            <div className="p-4 sm:p-4.5 bg-gradient-to-r from-[#f0f8f9]/90 via-white to-[#f8fafb] border-b border-[#b6e0e4]/50 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] text-[#3a7d84] flex items-center justify-center shadow-2xs shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-sm sm:text-base text-[#2d6b73] tracking-tight">
                    Projects Timeline
                  </h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]">
                    {filteredProjects.length}
                  </span>
                </div>
              </div>

              {/* Scope Filters (All / Me) + Card Actions */}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {/* Scope filter */}
                <div className="flex items-center bg-[#f0f8f9]/80 p-1 rounded-xl border border-[#b6e0e4]/60 text-xs gap-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                      scopeFilter === 'ALL'
                        ? 'bg-white text-[#2d6b73] shadow-xs border border-[#b6e0e4] font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>All</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/70 text-slate-700 font-bold">
                      {projects.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeFilter('ME')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-xs ${
                      scopeFilter === 'ME'
                        ? 'bg-gradient-to-r from-[#3a7d84] to-[#51a8b1] text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Me</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      scopeFilter === 'ME' ? 'bg-[#2d6b73] text-white' : 'bg-slate-200/70 text-slate-700'
                    }`}>
                      {stats.assignedToMe}
                    </span>
                  </button>
                </div>

                <div className="hidden xl:flex items-center gap-1 pr-1 border-r border-[#b6e0e4]/50">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#f0f8f9] text-[11px] font-bold text-[#2d6b73] border border-[#b6e0e4] transition cursor-pointer shadow-2xs"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#f0f8f9] text-[11px] font-bold text-[#2d6b73] border border-[#b6e0e4] transition cursor-pointer shadow-2xs"
                  >
                    Collapse All
                  </button>
                </div>

                {/* Collapse Arrow Toggle */}
                <button
                  type="button"
                  onClick={() => setIsTimelineOpen(false)}
                  className="w-8 h-8 rounded-xl bg-[#f0f8f9] hover:bg-[#3a7d84] text-[#3a7d84] hover:text-white border border-[#b6e0e4] shadow-2xs transition-all duration-200 flex items-center justify-center cursor-pointer group/btn"
                  title="Collapse Projects Timeline"
                >
                  <ChevronUp className="w-4 h-4 transition-transform duration-200 group-hover/btn:-translate-y-0.5" />
                </button>
              </div>
            </div>

            {/* Timeline Roadmap List */}
            <div className="p-3 sm:p-4 md:p-5 space-y-4">
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
                compactTimeline={compact}
                employees={employees}
              />
            </div>
          </div>
        );

        const renderNotificationsCard = () => (
          <RecentTimelineNotificationsBox
            notifications={notifications}
            loading={notificationsLoading}
            onRefresh={refreshNotificationsOnly}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onSelectNotification={(item) => setSelectedNotification(item)}
            onToggleShrink={() => setIsNotificationsOpen(false)}
            isShrunk={false}
          />
        );

        const renderCollapsedTimelineDock = () => (
          <div
            onClick={() => setIsTimelineOpen(true)}
            className="w-full bg-white rounded-2xl border border-[#b6e0e4]/80 shadow-xs p-3.5 sm:p-4 px-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#51a8b1] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#3a7d84] shadow-2xs group-hover:bg-[#3a7d84] group-hover:text-white group-hover:border-[#3a7d84] transition-all duration-200">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#2d6b73] group-hover:text-[#1e4a50] transition-colors">
                  Projects Timeline
                </h4>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#f0f8f9] text-[#2d6b73] border border-[#b6e0e4]">
                  {filteredProjects.length}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-xl bg-[#f0f8f9] group-hover:bg-[#3a7d84] text-[#3a7d84] group-hover:text-white border border-[#b6e0e4] group-hover:border-[#3a7d84] flex items-center justify-center shadow-2xs transition-all duration-200"
              title="Open Projects Timeline"
            >
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </div>
        );

        const renderCollapsedNotificationsDock = () => (
          <div
            onClick={() => setIsNotificationsOpen(true)}
            className="w-full bg-white rounded-2xl border border-[#b6e0e4]/80 shadow-xs p-3.5 sm:p-4 px-5 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-[#51a8b1] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 group select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#f0f8f9] border border-[#b6e0e4] flex items-center justify-center text-[#3a7d84] shadow-2xs group-hover:bg-[#3a7d84] group-hover:text-white group-hover:border-[#3a7d84] transition-all duration-200">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#2d6b73] group-hover:text-[#1e4a50] transition-colors">
                  Assignments &amp; Notifications
                </h4>
              </div>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-xl bg-[#f0f8f9] group-hover:bg-[#3a7d84] text-[#3a7d84] group-hover:text-white border border-[#b6e0e4] group-hover:border-[#3a7d84] flex items-center justify-center shadow-2xs transition-all duration-200"
              title="Open Assignments & Notifications"
            >
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
            </button>
          </div>
        );

        // Case 1: Both Open (70% Timeline / 30% Notifications side-by-side)
        if (isTimelineOpen && isNotificationsOpen) {
          return (
            <div className="flex flex-col lg:flex-row items-start gap-6 transition-all duration-300">
              <div className="w-full lg:w-[70%] min-w-0 transition-all duration-300">
                {renderTimelineCard(true)}
              </div>
              <div className="w-full lg:w-[30%] min-w-0 lg:sticky lg:top-4 transition-all duration-300">
                {renderNotificationsCard()}
              </div>
            </div>
          );
        }

        // Case 2: Only Timeline Open (Collapsed Notifications Dock sits ABOVE, Timeline takes 100% space)
        if (isTimelineOpen && !isNotificationsOpen) {
          return (
            <div className="space-y-4 transition-all duration-300">
              {renderCollapsedNotificationsDock()}
              <div className="w-full min-w-0 transition-all duration-300">
                {renderTimelineCard(false)}
              </div>
            </div>
          );
        }

        // Case 3: Only Notifications Open (Collapsed Timeline Dock sits ABOVE, Notifications takes 100% space)
        if (!isTimelineOpen && isNotificationsOpen) {
          return (
            <div className="space-y-4 transition-all duration-300">
              {renderCollapsedTimelineDock()}
              <div className="w-full min-w-0 transition-all duration-300">
                {renderNotificationsCard()}
              </div>
            </div>
          );
        }

        // Case 4: Both Collapsed (Render side-by-side summary docks)
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300">
            {renderCollapsedTimelineDock()}
            {renderCollapsedNotificationsDock()}
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