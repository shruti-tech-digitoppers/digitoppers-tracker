import { useState, useEffect, useCallback } from 'react';
import { employeesApi } from '../lib/api/employees.api';
import { 
  IUser, 
  ICreateEmployeePayload, 
  IUpdateEmployeePayload, 
  ProjectDesignation 
} from '../types/auth';

export function useEmployees() {
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await employeesApi.getEmployees();
      setEmployees(res.employees || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const createEmployee = async (payload: ICreateEmployeePayload) => {
    const res = await employeesApi.createEmployee(payload);
    await fetchEmployees();
    return res.data;
  };

  const updateEmployee = async (id: string, payload: IUpdateEmployeePayload) => {
    const res = await employeesApi.updateEmployee(id, payload);
    setEmployees((prev) =>
      prev.map((emp) => (emp._id === id ? { ...emp, ...res.data } : emp))
    );
    return res.data;
  };

  const toggleEmployeeStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = await employeesApi.updateStatus(id, newStatus);
    setEmployees((prev) =>
      prev.map((emp) => (emp._id === id ? { ...emp, isActive: newStatus } : emp))
    );
    return res.data;
  };

  const deleteEmployee = async (id: string) => {
    await employeesApi.deleteEmployee(id);
    setEmployees((prev) => prev.filter((emp) => emp._id !== id));
  };

  const getEmployeeProjectRoles = async (employeeId: string) => {
    return await employeesApi.getEmployeeProjectRoles(employeeId);
  };

  const updateEmployeeProjectRole = async (
    employeeId: string,
    projectId: string,
    designation: ProjectDesignation
  ) => {
    const res = await employeesApi.updateEmployeeProjectRole(employeeId, projectId, designation);
    return res;
  };

  return {
    employees,
    loading,
    error,
    refresh: fetchEmployees,
    createEmployee,
    updateEmployee,
    toggleEmployeeStatus,
    deleteEmployee,
    getEmployeeProjectRoles,
    updateEmployeeProjectRole,
  };
}
