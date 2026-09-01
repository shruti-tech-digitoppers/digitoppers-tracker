import { useState, useEffect, useCallback } from 'react';
import { projectsApi, ICreateProjectPayload, IUpdateProjectPayload } from '../lib/api/projects.api';
import { employeesApi } from '../lib/api/employees.api';
import { IProject } from '../types/project';
import { IUser } from '../types/auth';

export function useProjects() {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [employees, setEmployees] = useState<IUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, empRes] = await Promise.all([
        projectsApi.getProjects(),
        employeesApi.getEmployees().catch(() => ({ success: true, employees: [] })),
      ]);
      setProjects(projRes.projects || []);
      setEmployees(empRes.employees || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload: ICreateProjectPayload) => {
    const res = await projectsApi.createProject(payload);
    setProjects((prev) => [res.project, ...prev]);
    return res.project;
  };

  const updateProject = async (id: string, payload: IUpdateProjectPayload) => {
    const res = await projectsApi.updateProject(id, payload);
    setProjects((prev) => prev.map((p) => (p._id === id ? res.project : p)));
    return res.project;
  };

  const deleteProject = async (id: string) => {
    await projectsApi.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  return {
    projects,
    employees,
    loading,
    error,
    refresh: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}