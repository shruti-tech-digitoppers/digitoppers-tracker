'use client';

import React, { useState, useMemo } from 'react';
import { useEmployees } from '../../hooks/useEmployees';
import { EmployeesTable } from './components/EmployeesTable';
import { CreateEmployeeModal } from './components/CreateEmployeeModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { DeleteEmployeeModal } from './components/DeleteEmployeeModal';
import { EmployeeProjectRolesModal } from './components/EmployeeProjectRolesModal';
import { CreateProjectRequestModal } from '../requests/components/CreateProjectRequestModal';
import { requestsApi } from '../../lib/api/requests.api';
import { ICreateProjectRequestPayload } from '../../types/request';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Layers,
  Shield,
  Send
} from 'lucide-react';
import { IUser } from '../../types/auth';
import Link from 'next/link';

export function EmployeesWorkspace() {
  const [currentUser, setCurrentUser] = useState<IUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const {
    employees,
    loading,
    error,
    refresh,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
    getEmployeeProjectRoles,
    updateEmployeeProjectRole,
  } = useEmployees();

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IUser | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<IUser | null>(null);
  const [roleManagingEmployee, setRoleManagingEmployee] = useState<IUser | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'EMPLOYEE'>('ALL');

  const isAdmin = 
    currentUser?.globalRole === 'ADMIN' || 
    (currentUser as any)?.role === 'ADMIN';

  const canRequestProject = isAdmin || Boolean(currentUser?.canRequestNewProject || currentUser?.permissions?.canRequestNewProject);

  const handleCreateProjectRequest = async (payload: ICreateProjectRequestPayload) => {
    return await requestsApi.createRequest(payload);
  };

  // Filtered employees memo
  const filteredEmployees = useMemo(() => {

    return employees.filter((emp) => {
      const isActive = emp.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;

      const userRole = emp.globalRole || emp.role || 'EMPLOYEE';
      if (roleFilter !== 'ALL' && userRole !== roleFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = (emp.name || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();

      return name.includes(q) || email.includes(q) || code.includes(q);
    });
  }, [employees, searchQuery, statusFilter, roleFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.isActive !== false).length;
    const inactive = employees.filter((e) => e.isActive === false).length;
    const admins = employees.filter((e) => (e.globalRole || e.role) === 'ADMIN').length;
    return { total, active, inactive, admins };
  }, [employees]);

  if (currentUser && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl border border-[#b9c0cb]/40 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#333333] font-heading">
            Admin Access Required
          </h2>
          <p className="text-xs text-[#4a5462] leading-relaxed">
            Only users with administrative privileges can manage employees, staff credentials, and project roles.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-xs transition"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6 font-sans">
      {/* ── Top Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#3a7d84] font-heading">
              Employee Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f0f8f9] text-[#3a7d84] text-xs font-bold border border-[#b6e0e4]">
              {employees.length} Members
            </span>
          </div>
          <p className="text-xs text-[#4a5462] mt-0.5">
            By default, all staff have <span className="font-semibold text-[#3a7d84]">Viewer</span> access across all projects unless assigned as Manager or Contributor.
          </p>
        </div>


        <div className="flex items-center gap-3">
          {canRequestProject && (
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#51a8b1] hover:bg-[#3a7d84] rounded-xl shadow-xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>New Project Request</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#3a7d84] bg-[#f0f8f9] hover:bg-[#e6f4f6] border border-[#b6e0e4] rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Employee</span>
          </button>
        </div>
      </div>

      {/* ── KPI Stat Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="bg-white p-4 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#51a8b1]/15 text-[#3a7d84] flex items-center justify-center font-bold text-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4a5462]">Total Staff</p>
            <p className="text-xl font-bold text-[#333333] font-heading">{stats.total}</p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4a5462]">Active</p>
            <p className="text-xl font-bold text-emerald-700 font-heading">{stats.active}</p>
          </div>
        </div>

        {/* Inactive Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4a5462]">Inactive</p>
            <p className="text-xl font-bold text-slate-700 font-heading">{stats.inactive}</p>
          </div>
        </div>

        {/* Global Admins */}
        <div className="bg-white p-4 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm border border-purple-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#4a5462]">Admins</p>
            <p className="text-xl font-bold text-purple-700 font-heading">{stats.admins}</p>
          </div>
        </div>
      </div>

      {/* ── Search and Filter Controls ──────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#b9c0cb]/40 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5462]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or code..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] focus:border-transparent transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#f8fafb] p-1 rounded-xl border border-[#b9c0cb]/40">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#3a7d84] shadow-2xs font-bold'
                  : 'text-[#4a5462] hover:text-[#333333]'
              }`}
            >
              All Status
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 shadow-2xs font-bold border border-emerald-200'
                  : 'text-[#4a5462] hover:text-[#333333]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === 'INACTIVE'
                  ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold border border-rose-200'
                  : 'text-[#4a5462] hover:text-[#333333]'
              }`}
            >
              Inactive
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-[#f8fafb] border border-[#b9c0cb]/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51a8b1] text-[#333333] font-medium transition cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      {/* ── Error Banner if any ──────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* ── Main Employees Table ─────────────────────────────────────── */}
      <EmployeesTable
        employees={filteredEmployees}
        loading={loading}
        onEdit={(emp) => setEditingEmployee(emp)}
        onDelete={(emp) => setDeletingEmployee(emp)}
        onToggleStatus={toggleEmployeeStatus}
        onManageProjectRoles={(emp) => setRoleManagingEmployee(emp)}
      />

      {/* ── Create Employee Modal ────────────────────────────────────── */}
      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={createEmployee}
      />

      {/* ── Edit Employee Modal ──────────────────────────────────────── */}
      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={Boolean(editingEmployee)}
        onClose={() => setEditingEmployee(null)}
        onSubmit={updateEmployee}
      />

      {/* ── Delete Employee Confirmation Modal ───────────────────────── */}
      <DeleteEmployeeModal
        employee={deletingEmployee}
        isOpen={Boolean(deletingEmployee)}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={deleteEmployee}
      />

      {/* ── Per-Project Roles & Permissions Modal ────────────────────── */}
      <EmployeeProjectRolesModal
        employee={roleManagingEmployee}
        isOpen={Boolean(roleManagingEmployee)}
        onClose={() => setRoleManagingEmployee(null)}
        onFetchRoles={getEmployeeProjectRoles}
        onUpdateRole={updateEmployeeProjectRole}
      />

      {/* ── Create / Request Project Modal ─────────────────────────────── */}
      <CreateProjectRequestModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        employees={employees}
        onSubmit={handleCreateProjectRequest}
      />
    </div>
  );
}

export default EmployeesWorkspace;
