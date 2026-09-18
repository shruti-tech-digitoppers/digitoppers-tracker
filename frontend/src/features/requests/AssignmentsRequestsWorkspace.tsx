'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowUpRight, 
  Eye, 
  History, 
  Layers, 
  Building2, 
  Calendar,
  XCircle,
  FileText,
  User,
  Shield,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Activity as ActivityIcon,
  Sparkles,
  IndianRupee,
  Check,
  X,
  Plus
} from 'lucide-react';
import { IProject } from '../../types/project';
import { IProjectRequest } from '../../types/request';
import { projectsApi } from '../../lib/api/projects.api';
import { requestsApi } from '../../lib/api/requests.api';
import { employeesApi } from '../../lib/api/employees.api';
import { activityApi, IActivityItem } from '../../lib/api/activity.api';
import { authApi } from '../../lib/api/auth.api';
import { CreateProjectRequestModal } from './components/CreateProjectRequestModal';
import { ProjectRequestReviewModal } from './components/ProjectRequestReviewModal';
import { IUser } from '../../types/auth';

export function AssignmentsRequestsWorkspace() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [requests, setRequests] = useState<IProjectRequest[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [activities, setActivities] = useState<IActivityItem[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state for Requests Column (Left)
  const [requestSearch, setRequestSearch] = useState('');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'MY_REQUESTS'>('ALL');

  // Search & Filter state for Assignments Column (Right)
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'ASSIGNED_TO_ME' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Logs visibility
  const [showLogs, setShowLogs] = useState(false);

  // Modals state
  const [selectedReviewRequest, setSelectedReviewRequest] = useState<IProjectRequest | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
          return;
        }
      } catch {}

      authApi.getMe().then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
          try { localStorage.setItem('user', JSON.stringify(res.user)); } catch {}
        }
      }).catch(() => {});
    }
  }, []);

  const isAdmin = currentUser?.globalRole === 'ADMIN' || (currentUser as any)?.role === 'ADMIN';
  const currentUserId = currentUser?._id || (currentUser as any)?.id || '';
  const canRequestProject = isAdmin || Boolean(currentUser?.canRequestNewProject || currentUser?.permissions?.canRequestNewProject);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [requestsRes, projectsRes, activitiesRes, empRes] = await Promise.all([
        requestsApi.getRequests({ status: 'ALL' }).catch(() => ({ requests: [], total: 0 })),
        projectsApi.getProjects({ status: 'ALL' }).catch(() => ({ success: false, projects: [] })),
        activityApi.getAllActivities().catch(() => ({ success: false, activities: [] })),
        employeesApi.getEmployees().catch(() => ({ success: false, employees: [] }))
      ]);

      if (requestsRes.requests) {
        setRequests(requestsRes.requests);
      }
      if (projectsRes.projects) {
        setProjects(projectsRes.projects);
      }
      if (activitiesRes.activities) {
        setActivities(activitiesRes.activities);
      }
      if (empRes.employees) {
        setEmployees(empRes.employees);
      }
    } catch (err) {
      console.error('Failed to load assignments & requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const stats = useMemo(() => {
    const totalRequests = requests.length;
    const pendingReviews = requests.filter((r) => r.status === 'PENDING').length;
    const approvedRequests = requests.filter((r) => r.status === 'APPROVED').length;
    const myRequests = requests.filter((r) => {
      const reqId = typeof r.requestedBy === 'object' && r.requestedBy !== null
        ? (r.requestedBy as any)._id
        : r.requestedBy;
      return reqId && reqId === currentUserId;
    }).length;

    const assignedToMe = projects.filter((p) => {
      const pmId = typeof p.projectManager === 'object' && p.projectManager !== null
        ? (p.projectManager as any)._id
        : p.projectManager;
      const revId = typeof p.assignedReviewer === 'object' && p.assignedReviewer !== null
        ? (p.assignedReviewer as any)._id
        : p.assignedReviewer;
      return (pmId && pmId === currentUserId) || (revId && revId === currentUserId);
    }).length;

    const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
    const totalAssignments = projects.length;

    return { 
      totalRequests, 
      pendingReviews, 
      approvedRequests,
      myRequests,
      assignedToMe, 
      activeProjects,
      completedProjects,
      totalAssignments 
    };
  }, [requests, projects, currentUserId]);

  // ── Column 1: Filtered Requests List (Left Column) ───────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Filter tab
      if (requestFilter === 'PENDING') {
        if (r.status !== 'PENDING') return false;
      } else if (requestFilter === 'APPROVED') {
        if (r.status !== 'APPROVED') return false;
      } else if (requestFilter === 'MY_REQUESTS') {
        const reqId = typeof r.requestedBy === 'object' && r.requestedBy !== null
          ? (r.requestedBy as any)._id
          : r.requestedBy;
        if (reqId !== currentUserId) return false;
      }

      // Search Query
      if (requestSearch.trim()) {
        const q = requestSearch.toLowerCase();
        const code = (r.requestId || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        const org = (r.organization || '').toLowerCase();
        const reqObj = typeof r.requestedBy === 'object' && r.requestedBy !== null ? (r.requestedBy as any) : null;
        const reqName = (reqObj?.name || '').toLowerCase();
        const revObj = typeof r.requestedTo === 'object' && r.requestedTo !== null ? (r.requestedTo as any) : null;
        const revName = (revObj?.name || '').toLowerCase();
        const pmObj = typeof r.projectManager === 'object' && r.projectManager !== null ? (r.projectManager as any) : null;
        const pmName = (pmObj?.name || '').toLowerCase();

        return (
          code.includes(q) ||
          title.includes(q) ||
          org.includes(q) ||
          reqName.includes(q) ||
          revName.includes(q) ||
          pmName.includes(q)
        );
      }

      return true;
    });
  }, [requests, requestFilter, requestSearch, currentUserId]);

  // ── Column 2: Filtered Assignments List (Right Column) ────────────
  const filteredAssignments = useMemo(() => {
    return projects.filter((p) => {
      // Filter tab
      if (assignmentFilter === 'ASSIGNED_TO_ME') {
        const pmId = typeof p.projectManager === 'object' && p.projectManager !== null
          ? (p.projectManager as any)._id
          : p.projectManager;
        const revId = typeof p.assignedReviewer === 'object' && p.assignedReviewer !== null
          ? (p.assignedReviewer as any)._id
          : p.assignedReviewer;
        if (pmId !== currentUserId && revId !== currentUserId) return false;
      } else if (assignmentFilter === 'ACTIVE') {
        if (p.status !== 'ACTIVE') return false;
      } else if (assignmentFilter === 'COMPLETED') {
        if (p.status !== 'COMPLETED') return false;
      }

      // Search Query
      if (assignmentSearch.trim()) {
        const q = assignmentSearch.toLowerCase();
        const code = (p.projectId || '').toLowerCase();
        const title = (p.projectName || p.title || '').toLowerCase();
        const org = (p.organization || '').toLowerCase();
        const pmObj = typeof p.projectManager === 'object' && p.projectManager !== null ? (p.projectManager as any) : null;
        const pmName = (pmObj?.name || '').toLowerCase();

        return code.includes(q) || title.includes(q) || org.includes(q) || pmName.includes(q);
      }

      return true;
    });
  }, [projects, assignmentFilter, assignmentSearch, currentUserId]);

  const handleOpenReviewModal = (req: IProjectRequest) => {
    setSelectedReviewRequest(req);
    setIsReviewModalOpen(true);
  };

  const handleConfirmed = () => {
    loadData(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatActivityAction = (action: string) => {
    switch (action) {
      case 'PROJECT_REQUEST_APPROVED':
        return { label: 'Request Approved & Initialized', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'PROJECT_CREATED':
        return { label: 'Project Request Created', color: 'bg-[#f0f8f9] text-[#3a7d84] border-[#b6e0e4]' };
      case 'PROJECT_UPDATED':
        return { label: 'Project Updated', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'NODE_STATUS_UPDATED':
        return { label: 'Task Status Updated', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'NODE_ASSIGNED':
        return { label: 'Task Assigned', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: action.replace(/_/g, ' '), color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1750px] mx-auto space-y-6 font-sans pb-16">
      
      {/* ── Top Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#b9c0cb]/40 p-5 rounded-3xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#3a7d84] font-heading">
              Assignments &amp; Requests
            </h1>
            <span className="px-3 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] text-xs font-bold border border-[#b6e0e4]">
              {requests.length} Requests
            </span>
          </div>
          <p className="text-xs text-[#4a5462] font-medium mt-1">
            Manage project creation requests on the left and track active project assignments on the right in parallel.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="px-4 py-2.5 bg-white hover:bg-[#f0f8f9] text-[#4a5462] hover:text-[#3a7d84] border border-[#b9c0cb]/40 rounded-2xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95"
            title="Refresh lists"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#51a8b1]' : ''}`} />
            <span>Refresh</span>
          </button>

          {canRequestProject && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-[#51a8b1] hover:bg-[#3a7d84] text-white rounded-2xl text-xs font-bold shadow-xs flex items-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>New Project Request</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Interactive Metric Summary Cards ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Requests */}
        <div 
          onClick={() => setRequestFilter('ALL')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer transition select-none hover:shadow-md ${
            requestFilter === 'ALL'
              ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/20 bg-gradient-to-br from-teal-50/40 via-white to-white'
              : 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-[#4a5462] uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-[#333333] mt-1">{stats.totalRequests}</p>
            <p className="text-[11px] text-[#4a5462] mt-0.5">New project requests received</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shadow-2xs">
            <Send className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Action (Interactive Highlight Card) */}
        <div 
          onClick={() => setRequestFilter('PENDING')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer transition select-none hover:shadow-md ${
            requestFilter === 'PENDING'
              ? 'border-purple-400 ring-2 ring-purple-300 bg-gradient-to-br from-purple-100/60 via-purple-50/40 to-white'
              : 'border-purple-200 hover:border-purple-300 bg-gradient-to-br from-purple-50/40 via-white to-white'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Pending Action</p>
            </div>
            <p className="text-2xl sm:text-3xl font-heading font-black text-purple-900 mt-1">{stats.pendingReviews}</p>
            <p className="text-[11px] text-purple-700 mt-0.5 font-medium">Awaiting reviewer confirmation</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Assigned to Me */}
        <div 
          onClick={() => setAssignmentFilter('ASSIGNED_TO_ME')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer transition select-none hover:shadow-md ${
            assignmentFilter === 'ASSIGNED_TO_ME'
              ? 'border-[#51a8b1] ring-2 ring-[#51a8b1]/20 bg-gradient-to-br from-teal-50/40 via-white to-white'
              : 'border-[#b9c0cb]/40 hover:border-[#51a8b1]/50'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-[#4a5462] uppercase tracking-wider">Assigned to Me</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-[#3a7d84] mt-1">{stats.assignedToMe}</p>
            <p className="text-[11px] text-[#4a5462] mt-0.5">Assigned projects &amp; tasks</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shadow-2xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Active Projects */}
        <div 
          onClick={() => setAssignmentFilter('ACTIVE')}
          className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between cursor-pointer transition select-none hover:shadow-md ${
            assignmentFilter === 'ACTIVE'
              ? 'border-emerald-400 ring-2 ring-emerald-300 bg-gradient-to-br from-emerald-100/60 via-emerald-50/40 to-white'
              : 'border-emerald-200 hover:border-emerald-300 bg-gradient-to-br from-emerald-50/40 via-white to-white'
          }`}
        >
          <div>
            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active Projects</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-emerald-900 mt-1">{stats.activeProjects}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">Live execution roadmap</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── PARALLEL 2-COLUMN VIEW (REQUESTS & ASSIGNMENTS SIDE-BY-SIDE) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        
        {/* ========================================================= */}
        {/* 📥 COLUMN 1: PROJECT REQUESTS & REVIEWS                   */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#b9c0cb]/40 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          
          {/* Column Header */}
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#f1f3f6]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-2xs shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-heading text-[#333333] flex items-center gap-2">
                  <span>Project Requests</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    {filteredRequests.length}
                  </span>
                </h2>
                <p className="text-xs text-[#4a5462]">Submissions with Request IDs awaiting review and confirmation</p>
              </div>
            </div>
          </div>

          {/* Full-Width Segmented Filter Bar (No Truncation) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold select-none border border-slate-200/60">
            <button
              type="button"
              onClick={() => setRequestFilter('ALL')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                requestFilter === 'ALL'
                  ? 'bg-white text-[#2f4154] shadow-xs font-black'
                  : 'text-[#4a5462] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              All ({stats.totalRequests})
            </button>
            <button
              type="button"
              onClick={() => setRequestFilter('PENDING')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                requestFilter === 'PENDING'
                  ? 'bg-purple-700 text-white shadow-xs font-black'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${requestFilter === 'PENDING' ? 'bg-white' : 'bg-purple-500'} animate-pulse`} />
              <span>Pending ({stats.pendingReviews})</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestFilter('APPROVED')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                requestFilter === 'APPROVED'
                  ? 'bg-emerald-700 text-white shadow-xs font-black'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Approved ({stats.approvedRequests})
            </button>
            <button
              type="button"
              onClick={() => setRequestFilter('MY_REQUESTS')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                requestFilter === 'MY_REQUESTS'
                  ? 'bg-[#51a8b1] text-white shadow-xs font-black'
                  : 'text-[#4a5462] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              My Requests
            </button>
          </div>

          {/* Search in Requests */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#4a5462] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search requests by Request ID, title, or requester..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-2xl text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#51a8b1] transition placeholder:text-slate-400 font-medium"
            />
            {requestSearch && (
              <button 
                type="button"
                onClick={() => setRequestSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Requests Cards List */}
          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-7 h-7 text-[#51a8b1] animate-spin mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-[#4a5462]">Loading project requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-16 text-center bg-[#f8fafb] rounded-3xl border border-dashed border-[#b9c0cb]/50 p-6 space-y-2">
                <Send className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-[#333333] font-heading">No project requests found</p>
                <p className="text-xs text-[#4a5462]">
                  {requestSearch ? 'No requests matching your search keywords.' : 'No requests in this category. Submit a new request to get started.'}
                </p>
                {canRequestProject && (
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#51a8b1] hover:bg-[#3a7d84] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Request</span>
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((req) => {
                const reqObj = typeof req.requestedBy === 'object' && req.requestedBy !== null ? (req.requestedBy as any) : null;
                const reqName = reqObj?.name || 'Employee';
                const reqEmail = reqObj?.email || '';

                const reqToObj = typeof req.requestedTo === 'object' && req.requestedTo !== null ? (req.requestedTo as any) : null;
                const reqToName = reqToObj?.name || 'Approver';
                const reqToId = reqToObj?._id || req.requestedTo;

                const pmObj = typeof req.projectManager === 'object' && req.projectManager !== null ? (req.projectManager as any) : null;
                const pmName = pmObj?.name || 'Unassigned PM';

                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isReviewerOrAdmin = isAdmin || (reqToId && reqToId === currentUserId);

                return (
                  <div
                    key={req._id}
                    onClick={() => handleOpenReviewModal(req)}
                    className={`p-4 sm:p-5 rounded-2xl border transition space-y-3.5 group cursor-pointer ${
                      isPending
                        ? 'bg-purple-50/30 border-purple-200/80 hover:border-purple-400 hover:bg-white hover:shadow-md'
                        : isApproved
                        ? 'bg-emerald-50/20 border-emerald-200/70 hover:border-emerald-400 hover:bg-white hover:shadow-md'
                        : 'bg-[#f8fafb]/60 border-[#b9c0cb]/40 hover:bg-white hover:border-[#51a8b1]/50 hover:shadow-md'
                    }`}
                  >
                    {/* Card Top: Request ID, Status & Action Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950 text-white font-mono text-xs font-bold shadow-2xs tracking-wide">
                            {req.requestId}
                          </span>
                          
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                              Pending Review
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Approved {req.projectId ? `(${req.projectId})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              {req.status}
                            </span>
                          )}
                        </div>

                        <h3 className="font-heading font-bold text-sm sm:text-base text-[#333333] group-hover:text-[#51a8b1] transition line-clamp-1 pt-0.5">
                          {req.title}
                        </h3>

                        {req.organization && (
                          <p className="text-xs text-[#4a5462] flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="truncate font-medium">{req.organization}</span>
                          </p>
                        )}
                      </div>

                      {/* Action CTA Button */}
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        {isPending && isReviewerOrAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(req)}
                            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Review &amp; Confirm</span>
                          </button>
                        ) : isPending ? (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(req)}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Details</span>
                          </button>
                        ) : isApproved && req.confirmedProjectId ? (
                          <Link
                            href={`/tracker?projectId=${typeof req.confirmedProjectId === 'object' ? req.confirmedProjectId._id : req.confirmedProjectId}`}
                            className="px-3.5 py-1.5 bg-[#f0f8f9] hover:bg-[#51a8b1] text-[#3a7d84] hover:text-white border border-[#b6e0e4] rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>Open Tracker</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(req)}
                            className="px-3 py-1.5 bg-[#f8fafb] hover:bg-gray-100 text-[#4a5462] border border-[#b9c0cb]/40 rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Middle Grid: Approver & Assigned PM */}
                    <div className="pt-2.5 border-t border-[#f1f3f6] grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                        <span className="text-[#4a5462] block text-[10.5px] font-semibold">Requested To:</span>
                        <span className="font-bold text-purple-900 truncate block mt-0.5">
                          {reqToName}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                        <span className="text-[#4a5462] block text-[10.5px] font-semibold">Proposed Project Manager:</span>
                        <span className="font-bold text-[#333333] truncate block mt-0.5">
                          {pmName}
                        </span>
                      </div>
                    </div>

                    {/* Card Bottom: Requester & Timestamp */}
                    <div className="pt-1.5 flex items-center justify-between text-[11px] text-[#4a5462]">
                      <span className="truncate font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Submitted by: <strong className="text-[#333333]">{reqName}</strong></span>
                      </span>
                      <span className="font-mono text-slate-400 shrink-0">{formatDate(req.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 🎯 COLUMN 2: ACTIVE ASSIGNMENTS & MANAGED PROJECTS        */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#b9c0cb]/40 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          
          {/* Column Header */}
          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#f1f3f6]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shadow-2xs shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold font-heading text-[#333333] flex items-center gap-2">
                  <span>Project Assignments</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4]">
                    {filteredAssignments.length}
                  </span>
                </h2>
                <p className="text-xs text-[#4a5462]">Active projects, PM ownership &amp; work streams</p>
              </div>
            </div>
          </div>

          {/* Full-Width Segmented Filter Bar (No Truncation) */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold select-none border border-slate-200/60">
            <button
              type="button"
              onClick={() => setAssignmentFilter('ALL')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                assignmentFilter === 'ALL'
                  ? 'bg-white text-[#2f4154] shadow-xs font-black'
                  : 'text-[#4a5462] hover:text-[#333333] hover:bg-white/50'
              }`}
            >
              All ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('ASSIGNED_TO_ME')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                assignmentFilter === 'ASSIGNED_TO_ME'
                  ? 'bg-[#51a8b1] text-white shadow-xs font-black'
                  : 'text-[#3a7d84] hover:bg-[#f0f8f9]'
              }`}
            >
              Assigned ({stats.assignedToMe})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('ACTIVE')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                assignmentFilter === 'ACTIVE'
                  ? 'bg-emerald-700 text-white shadow-xs font-black'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Active ({stats.activeProjects})
            </button>
            <button
              type="button"
              onClick={() => setAssignmentFilter('COMPLETED')}
              className={`py-2 px-2 rounded-xl text-center transition cursor-pointer ${
                assignmentFilter === 'COMPLETED'
                  ? 'bg-blue-700 text-white shadow-xs font-black'
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              Done ({stats.completedProjects})
            </button>
          </div>

          {/* Search in Assignments */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#4a5462] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search assignments by Project Code, title, client, or PM..."
              value={assignmentSearch}
              onChange={(e) => setAssignmentSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-2xl text-xs text-[#333333] focus:outline-none focus:ring-2 focus:ring-[#51a8b1] transition placeholder:text-slate-400 font-medium"
            />
            {assignmentSearch && (
              <button 
                type="button"
                onClick={() => setAssignmentSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Assignments Cards List */}
          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-7 h-7 text-[#51a8b1] animate-spin mx-auto mb-2.5" />
                <p className="text-xs font-semibold text-[#4a5462]">Loading project assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="py-16 text-center bg-[#f8fafb] rounded-3xl border border-dashed border-[#b9c0cb]/50 p-6 space-y-2">
                <Briefcase className="w-9 h-9 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-[#333333] font-heading">No assignments found</p>
                <p className="text-xs text-[#4a5462]">
                  {assignmentSearch ? 'No assignments matching your search keywords.' : 'Projects assigned to you or your team will appear here.'}
                </p>
              </div>
            ) : (
              filteredAssignments.map((p) => {
                const pmObj = typeof p.projectManager === 'object' && p.projectManager !== null ? (p.projectManager as any) : null;
                const pmName = pmObj?.name || (typeof p.projectManager === 'string' ? p.projectManager : 'Unassigned PM');
                const pmId = pmObj?._id || p.projectManager;
                const isMyProject = pmId === currentUserId;

                const code = p.projectId || 'PRJ';
                const name = p.projectName || p.title || 'Untitled Project';

                return (
                  <div
                    key={p._id}
                    className="p-4 sm:p-5 rounded-2xl border border-[#b9c0cb]/40 bg-[#f8fafb]/60 hover:bg-white hover:border-[#51a8b1]/50 hover:shadow-md transition space-y-3.5 group"
                  >
                    {/* Card Top: Code, Status & Open Button */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#2f4154] text-white font-mono text-xs font-bold shadow-2xs tracking-wide">
                            {code}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-2xs ${
                            p.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'COMPLETED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {p.status}
                          </span>
                          {isMyProject && (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#a8cf45]/20 text-[#3a7d84] border border-[#a8cf45]/40">
                              My PM Role
                            </span>
                          )}
                        </div>

                        <h3 className="font-heading font-bold text-sm sm:text-base text-[#333333] group-hover:text-[#51a8b1] transition line-clamp-1 pt-0.5">
                          {name}
                        </h3>

                        {p.organization && (
                          <p className="text-xs text-[#4a5462] flex items-center gap-1 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-[#51a8b1] shrink-0" />
                            <span className="truncate">{p.organization}</span>
                          </p>
                        )}
                      </div>

                      {/* Open in Tracker CTA Button */}
                      <Link
                        href={`/tracker?projectId=${p._id}`}
                        className="px-4 py-2 bg-[#51a8b1] hover:bg-[#3a7d84] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <span>Tracker</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Card Middle Grid: PM & Date */}
                    <div className="pt-2.5 border-t border-[#f1f3f6] grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                        <span className="text-[#4a5462] block text-[10.5px] font-semibold">Project Manager:</span>
                        <span className="font-bold text-[#333333] truncate block mt-0.5">
                          {pmName}
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2 border border-slate-200/50">
                        <span className="text-[#4a5462] block text-[10.5px] font-semibold">Created Date:</span>
                        <span className="font-mono text-[#4a5462] truncate block mt-0.5">
                          {formatDate(p.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── COLLAPSIBLE AUDIT & TRACKING LOGS (BOTTOM FULL-WIDTH) ── */}
      <div className="bg-white border border-[#b9c0cb]/40 rounded-3xl shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="w-full px-6 py-4 flex items-center justify-between bg-[#f8fafb] hover:bg-[#f0f8f9] transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-heading text-[#333333] uppercase tracking-wider">
                Execution &amp; Audit Logs ({activities.length} Records)
              </h3>
              <p className="text-[11px] text-[#4a5462]">Detailed timeline transitions and review approvals history</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#3a7d84]">
            <span>{showLogs ? 'Hide Logs' : 'View Logs'}</span>
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showLogs && (
          <div className="divide-y divide-[#f1f3f6] max-h-96 overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <History className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#333333]">No audit logs recorded yet</p>
              </div>
            ) : (
              activities.map((act) => {
                const actorObj = typeof act.actor === 'object' && act.actor !== null ? (act.actor as any) : null;
                const actorName = actorObj?.name || 'System User';
                const actorEmail = actorObj?.email || '';
                const actionBadge = formatActivityAction(act.action);

                const projectObj = typeof act.project === 'object' && act.project !== null ? (act.project as any) : null;
                const projCode = projectObj?.projectId || (typeof act.project === 'string' ? act.project : '');
                const projName = projectObj?.projectName || projectObj?.title || '';

                return (
                  <div key={act._id} className="p-4 px-6 hover:bg-[#f8fafb]/80 transition flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#f0f8f9] text-[#3a7d84] border border-[#b6e0e4] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        {actorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="font-bold text-[#333333]">{actorName}</span>
                          {actorEmail && <span className="text-[10px] text-[#4a5462]">({actorEmail})</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${actionBadge.color}`}>
                            {actionBadge.label}
                          </span>
                        </div>
                        {projCode && (
                          <p className="text-[11px] text-[#4a5462]">
                            Project: <span className="font-mono font-bold text-[#2f4154]">{projCode}</span> {projName ? `— ${projName}` : ''}
                          </p>
                        )}
                        {act.metadata?.reviewNotes && (
                          <p className="text-[11px] text-[#4a5462] bg-[#f8fafb] border border-[#b9c0cb]/30 rounded-lg p-2 mt-1 italic">
                            &quot;{act.metadata.reviewNotes}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-[#4a5462] shrink-0">
                      {formatDate(act.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Review & Confirm Project Request Modal ────────────────── */}
      {selectedReviewRequest && (
        <ProjectRequestReviewModal
          request={selectedReviewRequest}
          isOpen={isReviewModalOpen}
          isApprover={
            isAdmin ||
            (Boolean(selectedReviewRequest.requestedTo) &&
              (typeof selectedReviewRequest.requestedTo === 'object'
                ? String((selectedReviewRequest.requestedTo as any)._id)
                : String(selectedReviewRequest.requestedTo)) === String(currentUserId))
          }
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedReviewRequest(null);
          }}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* ── Submit New Project Request Modal ──────────────────────── */}
      <CreateProjectRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        employees={employees}
        onSubmit={async (payload) => {
          await requestsApi.createRequest(payload);
          loadData(true);
        }}
      />
    </div>
  );
}
