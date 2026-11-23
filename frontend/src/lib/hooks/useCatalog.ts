import { useState, useEffect, useCallback } from 'react';
import { solutionsApi, SolutionItem } from '../api/solutions.api';
import { hardwareApi, HardwareItem } from '../api/hardware.api';

export interface MasterSolution {
  _id?: string;
  key: string;
  label: string;
  name?: string;
  icon: string;
  desc: string;
  description?: string;
  platform?: string;
  platforms?: string[];
  licenseRequired?: boolean;
  isLicenseRequired?: boolean;
  licenseCount?: number;
}

export interface MasterHardware {
  _id?: string;
  key: string;
  label: string;
  name?: string;
  spec?: string;
  specs?: any;
  specification?: string;
  icon: string;
  desc: string;
  description?: string;
  unit?: string;
  solutions?: string[];
}

export function useSolutionsAndHardware() {
  const [solutions, setSolutions] = useState<MasterSolution[]>([]);
  const [hardware, setHardware] = useState<MasterHardware[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSolutionsAndHardware = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sols, hws] = await Promise.allSettled([
        solutionsApi.getSolutions(),
        hardwareApi.getHardware(),
      ]);

      if (sols.status === 'fulfilled' && Array.isArray(sols.value)) {
        setSolutions(
          sols.value.map((s: SolutionItem) => ({
            _id: s._id,
            key: s.key,
            label: s.label || s.name || s.key,
            name: s.name || s.label || s.key,
            icon: s.icon || '🔬',
            desc: s.description || s.desc || '',
            description: s.description || s.desc || '',
          }))
        );
      } else if (sols.status === 'rejected') {
        console.error('Failed to load solutions from MongoDB:', sols.reason);
      }

      if (hws.status === 'fulfilled' && Array.isArray(hws.value)) {
        setHardware(
          hws.value.map((h: HardwareItem) => ({
            _id: h._id,
            key: h.key,
            label: h.label || h.name || h.key,
            name: h.name || h.label || h.key,
            spec: h.spec || h.specification || '',
            specs: h.specs || [],
            specification: h.specification || h.spec || '',
            icon: h.icon || '🖥️',
            desc: h.description || h.desc || '',
            description: h.description || h.desc || '',
            unit: h.unit || 'Units',
            solutions: Array.isArray(h.solutions)
              ? h.solutions.map((sol: any) =>
                  typeof sol === 'object' && sol !== null ? sol.key : sol
                )
              : [],
          }))
        );
      } else if (hws.status === 'rejected') {
        console.error('Failed to load hardware from MongoDB:', hws.reason);
      }
    } catch (err: any) {
      console.error('Failed to fetch solutions and hardware catalog from MongoDB:', err);
      setError(err?.message || 'Failed to fetch catalog from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSolutionsAndHardware();
  }, [fetchSolutionsAndHardware]);

  // Helper to filter hardware mapped to specific solutions
  const getHardwareForSolutions = useCallback(
    (solutionKeys: string[]) => {
      if (!solutionKeys || solutionKeys.length === 0) return hardware;
      return hardware.filter((item) => {
        const itemSolKeys: string[] = item.solutions || [];
        return itemSolKeys.some((sk) => solutionKeys.includes(sk));
      });
    },
    [hardware]
  );

  return {
    solutions,
    hardware,
    products: hardware,
    loading,
    error,
    refreshSolutionsAndHardware: fetchSolutionsAndHardware,
    refreshCatalog: fetchSolutionsAndHardware,
    refreshProducts: fetchSolutionsAndHardware,
    getHardwareForSolutions,
  };
}

// Aliases for compatibility
export const useCatalog = useSolutionsAndHardware;
export const useProducts = useSolutionsAndHardware;
export type CatalogSolution = MasterSolution;
export type CatalogHardware = MasterHardware;
export type ProductSolution = MasterSolution;
export type ProductHardware = MasterHardware;
export * from './useGradesCatalog';

