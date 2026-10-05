import { useState, useEffect, useCallback } from 'react';
import { solutionsApi, SolutionItem } from '../api/solutions.api';
import { hardwareApi, HardwareItem } from '../api/hardware.api';
import { DEFAULT_SOLUTIONS, DEFAULT_HARDWARE_ITEMS } from '@/components/forms/utils/formHelpers';

export interface MasterSolution {
  _id?: string;
  key: string;
  label: string;
  name?: string;
  icon: string;
  desc: string;
  description?: string;
}

export interface MasterHardware {
  _id?: string;
  key: string;
  label: string;
  name?: string;
  icon: string;
  desc: string;
  description?: string;
  unit?: string;
  solutions?: string[];
}

export function useSolutionsAndHardware() {
  const [solutions, setSolutions] = useState<MasterSolution[]>(DEFAULT_SOLUTIONS as any[]);
  const [hardware, setHardware] = useState<MasterHardware[]>(DEFAULT_HARDWARE_ITEMS as any[]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSolutionsAndHardware = useCallback(async () => {
    try {
      setLoading(true);
      const [sols, hws] = await Promise.allSettled([
        solutionsApi.getSolutions(),
        hardwareApi.getHardware(),
      ]);

      if (sols.status === 'fulfilled' && Array.isArray(sols.value) && sols.value.length > 0) {
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
      }

      if (hws.status === 'fulfilled' && Array.isArray(hws.value) && hws.value.length > 0) {
        setHardware(
          hws.value.map((h: HardwareItem) => ({
            _id: h._id,
            key: h.key,
            label: h.label || h.name || h.key,
            name: h.name || h.label || h.key,
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
      }
    } catch (err) {
      console.warn('Using fallback solutions and hardware items:', err);
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

