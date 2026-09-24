'use client';

import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  Shield, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  FolderGit2, 
  CheckCircle2, 
  XCircle, 
  FolderKanban,
  Mail,
  Hash
} from 'lucide-react';
import { IUser } from '../../../types/auth';

interface EmployeesTableProps {
  employees: IUser[];
  loading: boolean;
  onEdit: (employee: IUser) => void;
  onDelete: (employee: IUser) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onManageProjectRoles: (employee: IUser) => void;
}

export function EmployeesTable({
  employees,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageProjectRoles,
}: EmployeesTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#b9c0cb]/40 shadow-xs p-12 text-center">
        <div className="w-8 h-8 border-3 border-[#51a8b1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[#4a5462] font-medium">Loading employees directory...</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-[#b9c0cb]/50 shadow-xs p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f8f9] text-[#51a8b1] flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#333333] font-heading">No employees found</h3>
        <p className="text-xs text-[#4a5462] mt-1">Try adjusting your search criteria or add a new employee.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#b9c0cb]/40 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#f1f3f6] bg-[#f8fafb]/80 text-[#4a5462] font-semibold select-none">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Employee Code</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Global Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">
                <span>Project Assignments</span>
                <span className="block text-[10px] font-normal text-[#51a8b1]">(Default: Viewer)</span>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f3f6]">
            {employees.map((emp) => {
              const isAdmin = (emp.globalRole || emp.role) === 'ADMIN';
              const isActive = emp.isActive !== false;

              return (
                <tr
                  key={emp._id}
                  className="hover:bg-[#f0f8f9]/40 transition-colors group"
                >
                  {/* Employee Name + Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                        isAdmin
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-[#51a8b1]/15 text-[#3a7d84] border border-[#b6e0e4]/80'
                      }`}>
                        {emp.name?.charAt(0)?.toUpperCase() || 'E'}
                      </div>
                      <div>
                        <p className="font-bold text-[#333333] text-xs leading-tight">
                          {emp.name}
                        </p>
                        {emp.designation ? (
                          <p className="text-[10.5px] font-semibold text-[#51a8b1] leading-tight">
                            {emp.designation}
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#4a5462] leading-tight">
                            ID: {emp._id.substring(emp._id.length - 6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Employee Code */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-xs text-[#3a7d84] px-2 py-0.5 rounded bg-[#f0f8f9] border border-[#b6e0e4]">
                      {emp.employeeCode || 'N/A'}
                    </span>
                  </td>

                  {/* Email */}
                  <td className="py-3 px-4 text-[#4a5462] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#b9c0cb]" />
                      <span>{emp.email}</span>
                    </div>
                  </td>

                  {/* Global Role */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      isAdmin
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {isAdmin ? <ShieldCheck className="w-3 h-3 text-purple-600" /> : <Shield className="w-3 h-3 text-slate-500" />}
                      {emp.globalRole || emp.role || 'EMPLOYEE'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(emp._id, isActive)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                      title={isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>

                  {/* Project Roles Relations Button */}
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onManageProjectRoles(emp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#51a8b1]/50 text-[#3a7d84] hover:bg-[#f0f8f9] hover:border-[#51a8b1] text-xs font-bold transition shadow-2xs cursor-pointer group-hover:border-[#51a8b1]"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-[#51a8b1]" />
                      <span>Project Roles</span>
                    </button>
                  </td>

                  {/* Actions (Edit / Delete) */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(emp)}
                        className="p-1.5 rounded-lg text-[#4a5462] hover:text-[#3a7d84] hover:bg-[#f0f8f9] transition cursor-pointer"
                        title="Edit employee"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(emp)}
                        className="p-1.5 rounded-lg text-[#4a5462] hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
