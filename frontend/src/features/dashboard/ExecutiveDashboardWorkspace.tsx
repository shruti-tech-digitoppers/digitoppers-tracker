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
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);

  const isAdmin = currentUser?.globalRole === 'ADMIN' || (currentUser as any)?.role === 'ADMIN';
  const canRequestProject = isAdmin || Boolean(currentUser?.canRequestNewProject || currentUser?.permissions?.canRequestNewProject);

  const fetchDashboardData = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('accessToken')) : null;

      if (!token) {
        // Guest mode: fetch public projects only (no assignments/notifications)
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

  const handleMarkNotificationRead = useCallback(async (id: string, isRead = true) => {
    try {
      const targetReadState = typeof isRead === 'boolean' ? isRead : true;
      await notificationsApi.markAsRead(id, targetReadState);
      setNotifications((prev) => {
        const next = prev.map((n) => (n._id === id ? { ...n, isRead: targetReadState } : n));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notifications-changed', {
            detail: { readId: id, isRead: targetReadState, notifications: next }
          }));
        }
        return next;
      });
    } catch {}
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async (isRead = true) => {
    try {
      const targetReadState = typeof isRead === 'boolean' ? isRead : true;
      await notificationsApi.markAllAsRead(targetReadState);
      setNotifications((prev) => {
        const next = prev.map((n) => ({ ...n, isRead: targetReadState }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notifications-changed', {
            detail: { markAllRead: true, isRead: targetReadState, notifications: next }
          }));
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e?.detail?.notifications && Array.isArray(e.detail.notifications)) {
        setNotifications(e.detail.notifications);
      } else if (e?.detail?.markAllRead) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } else if (e?.detail?.readId) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === e.detail.readId ? { ...n, isRead: e.detail.isRead ?? true } : n))
        );
      } else {
        refreshNotificationsOnly();
      }
    };
    window.addEventListener('notifications-changed', handleSync);
    return () => {
      window.removeEventListener('notifications-changed', handleSync);
    };
  }, [refreshNotificationsOnly]);

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
    <div className={`adaptive-dashboard-container font-sans ${isCompactMode ? 'high-density-view' : ''}`}>
      {/* ── Top Page Welcome & Actions Bar ─────────────────────── */}
      <div className="adaptive-welcome-bar">
        <div className="space-y-0.5">
          <h2 suppressHydrationWarning className="font-heading text-base sm:text-xl font-extrabold text-[#2d6b73] tracking-tight">
            Hello{currentUser?.name ? `, ${currentUser.name}` : ''}
          </h2>
          <p className="text-[11px] sm:text-xs font-medium text-[#556987]">
            Welcome to <span className="font-semibold text-[#3a7d84]">DigiToppers Project Tracker</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          {canRequestProject && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-[#3a7d84] to-[#51a8b1] text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Project Request</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Full 5 Stats Cards Section (Total Projects, Active, On Hold, Completed, Archived) ── */}
      <DashboardStatsGrid
        stats={stats}
        currentFilter={statusFilter}
        onSelectFilter={setStatusFilter}
      />

      {/* ── Top Dual Toggle Buttons (Sized according to text with compact padding) ── */}
      {(() => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return (
          <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
            {/* Projects Timeline Toggle Button */}
            <button
              type="button"
              onClick={() => setIsTimelineOpen((prev) => !prev)}
              style={{
                backgroundColor: isTimelineOpen ? '#2d6b73' : '#ffffff',
                color: isTimelineOpen ? '#ffffff' : '#2d6b73',
                borderColor: '#2d6b73',
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none shadow-2xs hover:shadow-xs active:scale-[0.98] group"
            >
              <div
                style={{
                  backgroundColor: isTimelineOpen ? '#ffffff' : '#2d6b73',
                  color: isTimelineOpen ? '#2d6b73' : '#ffffff',
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shadow-2xs transition-all duration-200 shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
              </div>

              <span
                style={{ color: isTimelineOpen ? '#ffffff' : '#2d6b73' }}
                className="font-heading font-extrabold text-xs tracking-tight"
              >
                Projects Timeline
              </span>

              <span
                style={{
                  backgroundColor: isTimelineOpen ? '#ffffff' : '#2d6b73',
                  color: isTimelineOpen ? '#2d6b73' : '#ffffff',
                }}
                className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded-full shadow-2xs"
              >
                {filteredProjects.length}
              </span>

              <div
                style={{
                  backgroundColor: isTimelineOpen ? '#ffffff' : '#2d6b73',
                  color: isTimelineOpen ? '#2d6b73' : '#ffffff',
                }}
                className="w-5 h-5 rounded-md flex items-center justify-center shadow-2xs transition-all duration-200 ml-0.5"
              >
                {isTimelineOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </button>

            {/* Assignments & Notifications Toggle Button (Only when logged in) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((prev) => !prev)}
                style={{
                  backgroundColor: isNotificationsOpen ? '#2d6b73' : '#ffffff',
                  color: isNotificationsOpen ? '#ffffff' : '#2d6b73',
                  borderColor: '#2d6b73',
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none shadow-2xs hover:shadow-xs active:scale-[0.98] group"
              >
                <div
                  style={{
                    backgroundColor: isNotificationsOpen ? '#ffffff' : '#2d6b73',
                    color: isNotificationsOpen ? '#2d6b73' : '#ffffff',
                  }}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shadow-2xs transition-all duration-200 shrink-0"
                >
                  <Bell className="w-3.5 h-3.5" />
                </div>

                <span
                  style={{ color: isNotificationsOpen ? '#ffffff' : '#2d6b73' }}
                  className="font-heading font-extrabold text-xs tracking-tight"
                >
                  Assignments &amp; Notifications
                </span>

                {unreadCount > 0 ? (
                  <span
                    className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-sm flex items-center gap-1 animate-pulse"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    {unreadCount} new
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: isNotificationsOpen ? '#ffffff' : '#f1f5f9',
                      color: isNotificationsOpen ? '#2d6b73' : '#64748b',
                    }}
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded-full shadow-2xs"
                  >
                    0
                  </span>
                )}

                <div
                  style={{
                    backgroundColor: isNotificationsOpen ? '#ffffff' : '#2d6b73',
                    color: isNotificationsOpen ? '#2d6b73' : '#ffffff',
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center shadow-2xs transition-all duration-200 ml-0.5"
                >
                  {isNotificationsOpen ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Main Expanded Content Area (Separated in UI) ── */}
      {(() => {
        const renderTimelineCard = (compact: boolean) => (
          <div className="bg-white rounded-2xl border border-[#b6e0e4]/80 shadow-xs hover:shadow-sm overflow-hidden flex flex-col transition-all duration-200">
            {/* Timeline Controls Toolbar */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-[#f0f8f9]/90 via-white to-[#f8fafb] border-b border-[#b6e0e4]/50 flex items-center justify-between gap-3 flex-wrap">
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
                  <span>All Projects</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/70 text-slate-700 font-bold">
                    {projects.length}
                  </span>
                </button>

                {currentUser && (
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
                    <span>Assigned to Me</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      scopeFilter === 'ME' ? 'bg-[#2d6b73] text-white' : 'bg-slate-200/70 text-slate-700'
                    }`}>
                      {stats.assignedToMe}
                    </span>
                  </button>
                )}
              </div>

              {/* Action Button: Toggle Expand All / Collapse All */}
              <button
                type="button"
                onClick={allExpanded ? collapseAll : expandAll}
                disabled={filteredProjects.length === 0}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#f0f8f9] text-[11px] font-bold text-[#2d6b73] border border-[#b6e0e4] transition cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed select-none"
                title={allExpanded ? 'Collapse all project roadmaps' : 'Expand all project roadmaps'}
              >
                {allExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Expand All</span>
                  </>
                )}
              </button>
            </div>

            {/* Timeline Roadmap List */}
            <div className="p-2 sm:p-2.5 md:p-3 space-y-2.5">
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

        // For unauthenticated users (without login): only show the full-width Timeline Card
        if (!currentUser) {
          if (isTimelineOpen) {
            return (
              <div className="w-full min-w-0 transition-all duration-300">
                {renderTimelineCard(false)}
              </div>
            );
          }
          return null;
        }

        // Case 1: Both Open (Adaptive Split Layout)
        if (isTimelineOpen && isNotificationsOpen) {
          return (
            <div className="adaptive-dual-container transition-all duration-300">
              <div className="w-full adaptive-timeline-pane min-w-0 transition-all duration-300">
                {renderTimelineCard(true)}
              </div>
              <div className="w-full adaptive-notifications-pane min-w-0 transition-all duration-300">
                {renderNotificationsCard()}
              </div>
            </div>
          );
        }

        // Case 2: Only Timeline Open (Takes 100% full space)
        if (isTimelineOpen && !isNotificationsOpen) {
          return (
            <div className="w-full min-w-0 transition-all duration-300">
              {renderTimelineCard(false)}
            </div>
          );
        }

        // Case 3: Only Notifications Open (Takes 100% full space)
        if (!isTimelineOpen && isNotificationsOpen) {
          return (
            <div className="w-full min-w-0 transition-all duration-300">
              {renderNotificationsCard()}
            </div>
          );
        }

        // Case 4: Both Collapsed
        return null;
      })()}

      {/* ── Project Creation Request Modal ────────────── */}
      {currentUser && (
        <CreateProjectRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employees={employees}
          onSubmit={handleCreateProjectRequest}
        />
      )}

      {/* ── Notification & Request Full Details / Confirmation Modal ── */}
      {currentUser && (
        <NotificationDetailModal
          notification={selectedNotification}
          isOpen={Boolean(selectedNotification)}
          onClose={() => setSelectedNotification(null)}
          onRefreshData={fetchDashboardData}
        />
      )}
    </div>
  );
}