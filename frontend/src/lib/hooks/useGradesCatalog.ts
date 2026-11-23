'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { contentApi, IGradeStream } from '../api/content.api';
import { IGrade } from '@/types/grade';

export interface ClassSegment {
  id: string;
  name: string;
  classes: string[];
}

export interface ILmsClassOption {
  id: string;
  name: string;
  label: string;
  grade: string;
  stream: string | null;
  category: string;
  pillColor: string;
}

const normalizeStreamLabel = (rawStream: string): string => {
  const s = String(rawStream || '').trim();
  if (s.toLowerCase().includes('art') || s.toLowerCase().includes('humanities')) return 'Arts';
  if (s.toLowerCase().includes('commerce')) return 'Commerce';
  if (s.toLowerCase().includes('science')) return 'Science';
  return s;
};

export function useGradesCatalog() {
  const [grades, setGrades] = useState<IGrade[]>([]);
  const [streams, setStreams] = useState<IGradeStream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGradesCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch directly from Core Backend LMS via standard endpoints
      const [gradesRes, streamsRes] = await Promise.allSettled([
        contentApi.getGrades(),
        contentApi.getGradeStreams(),
      ]);

      if (gradesRes.status === 'fulfilled' && Array.isArray(gradesRes.value)) {
        setGrades(gradesRes.value);
      } else if (gradesRes.status === 'rejected') {
        console.error('Failed to load grades from Core Backend:', gradesRes.reason);
      }

      if (streamsRes.status === 'fulfilled' && Array.isArray(streamsRes.value)) {
        setStreams(streamsRes.value);
      } else if (streamsRes.status === 'rejected') {
        console.error('Failed to load grade streams from Core Backend:', streamsRes.reason);
      }
    } catch (err: any) {
      console.error('Failed to fetch grades catalog from Core Backend API:', err);
      setError(err?.message || 'Failed to fetch grades catalog from Core Backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGradesCatalog();
  }, [fetchGradesCatalog]);

  // Dynamic class options mapped directly from Core Backend API grades & streams
  const classOptions = useMemo<ILmsClassOption[]>(() => {
    const list: ILmsClassOption[] = [];

    grades.forEach((g) => {
      const gName = String(g.name || g.grade || '').trim();
      const isSeniorSec = gName === '11' || gName === '12' || g.category === 'Senior Secondary';

      if (isSeniorSec && streams.length > 0) {
        streams.forEach((st) => {
          const streamLabel = normalizeStreamLabel(st.name);
          const className = `${gName} ${streamLabel}`;
          let pill = 'bg-purple-50 text-purple-900 border-purple-300';
          if (streamLabel === 'Commerce') pill = 'bg-pink-50 text-pink-900 border-pink-300';
          if (streamLabel === 'Arts') pill = 'bg-indigo-50 text-indigo-900 border-indigo-300';

          list.push({
            id: `${g.id || gName}_${streamLabel.toLowerCase()}`,
            name: className,
            label: className,
            grade: gName,
            stream: streamLabel,
            category: 'Senior Secondary',
            pillColor: pill,
          });
        });
      } else {
        const num = parseInt(gName, 10);
        let category = g.category || 'Primary';
        let pill = 'bg-sky-50 text-sky-800 border-sky-200';
        if (!isNaN(num)) {
          if (num >= 1 && num <= 5) {
            category = 'Primary';
            pill = 'bg-sky-50 text-sky-800 border-sky-200';
          } else if (num >= 6 && num <= 8) {
            category = 'Middle';
            pill = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          } else if (num >= 9 && num <= 10) {
            category = 'Secondary';
            pill = 'bg-amber-50 text-amber-800 border-amber-200';
          }
        }

        list.push({
          id: g.id || `grade_${gName}`,
          name: gName,
          label: !isNaN(Number(gName)) ? `Class ${gName}` : gName,
          grade: gName,
          stream: null,
          category,
          pillColor: pill,
        });
      }
    });

    return list;
  }, [grades, streams]);

  // Derived list of all class names strictly from Core Backend API response
  const allClassNames = useMemo<string[]>(() => {
    return classOptions.map((opt) => opt.name);
  }, [classOptions]);

  // Derived segments strictly from Core Backend
  const classSegments = useMemo<ClassSegment[]>(() => {
    const primary = classOptions.filter((opt) => opt.category === 'Primary').map((opt) => opt.name);
    const middle = classOptions.filter((opt) => opt.category === 'Middle').map((opt) => opt.name);
    const secondary = classOptions.filter((opt) => opt.category === 'Secondary').map((opt) => opt.name);
    const seniorSec = classOptions.filter((opt) => opt.category === 'Senior Secondary').map((opt) => opt.name);

    const segments: ClassSegment[] = [];
    if (primary.length > 0) {
      segments.push({ id: 'primary', name: 'Primary (1 - 5)', classes: primary });
    }
    if (middle.length > 0) {
      segments.push({ id: 'middle', name: 'Middle School (6 - 8)', classes: middle });
    }
    if (secondary.length > 0) {
      segments.push({ id: 'secondary', name: 'Secondary (9 - 10)', classes: secondary });
    }
    if (seniorSec.length > 0) {
      segments.push({ id: 'senior_sec', name: 'Senior Secondary (11 & 12 Streams)', classes: seniorSec });
    }
    return segments;
  }, [classOptions]);

  return {
    grades,
    streams,
    allClassNames,
    classOptions,
    classSegments,
    loading,
    error,
    refetch: fetchGradesCatalog,
  };
}

export default useGradesCatalog;
