export type GradeCategory = 'Primary' | 'Middle' | 'Secondary' | 'Senior Secondary';
export type GradeStreamType = 'Science' | 'Commerce' | 'Arts' | null;

export interface IGrade {
  _id?: string;
  name: string;        // '1', '2', ..., '10', '11 Science', '11 Commerce', '11 Arts', '12 Science', '12 Commerce', '12 Arts'
  id: string;          // 'c1', 'c2', ..., 'c10', 'c11_science', 'c11_commerce', 'c11_arts', 'c12_science', 'c12_commerce', 'c12_arts'
  grade: string;       // '1', '2', ..., '10', '11', '12'
  stream: GradeStreamType;
  category: GradeCategory;
  index: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

// Master list of 16 Curriculum Grades matching MongoDB 'grades' collection exactly
export const MASTER_GRADES: IGrade[] = [
  { id: 'c1', name: '1', grade: '1', stream: null, category: 'Primary', index: 1, color: '#3B82F6', icon: 'BookOpen', isActive: true },
  { id: 'c2', name: '2', grade: '2', stream: null, category: 'Primary', index: 2, color: '#3B82F6', icon: 'BookOpen', isActive: true },
  { id: 'c3', name: '3', grade: '3', stream: null, category: 'Primary', index: 3, color: '#3B82F6', icon: 'BookOpen', isActive: true },
  { id: 'c4', name: '4', grade: '4', stream: null, category: 'Primary', index: 4, color: '#3B82F6', icon: 'BookOpen', isActive: true },
  { id: 'c5', name: '5', grade: '5', stream: null, category: 'Primary', index: 5, color: '#3B82F6', icon: 'BookOpen', isActive: true },
  { id: 'c6', name: '6', grade: '6', stream: null, category: 'Middle', index: 6, color: '#10B981', icon: 'Compass', isActive: true },
  { id: 'c7', name: '7', grade: '7', stream: null, category: 'Middle', index: 7, color: '#10B981', icon: 'Compass', isActive: true },
  { id: 'c8', name: '8', grade: '8', stream: null, category: 'Middle', index: 8, color: '#10B981', icon: 'Compass', isActive: true },
  { id: 'c9', name: '9', grade: '9', stream: null, category: 'Secondary', index: 9, color: '#F59E0B', icon: 'GraduationCap', isActive: true },
  { id: 'c10', name: '10', grade: '10', stream: null, category: 'Secondary', index: 10, color: '#F59E0B', icon: 'GraduationCap', isActive: true },
  // Class 11 Streams
  { id: 'c11_science', name: '11 Science', grade: '11', stream: 'Science', category: 'Senior Secondary', index: 11, color: '#8B5CF6', icon: 'FlaskConical', isActive: true },
  { id: 'c11_commerce', name: '11 Commerce', grade: '11', stream: 'Commerce', category: 'Senior Secondary', index: 12, color: '#EC4899', icon: 'TrendingUp', isActive: true },
  { id: 'c11_arts', name: '11 Arts', grade: '11', stream: 'Arts', category: 'Senior Secondary', index: 13, color: '#6366F1', icon: 'Palette', isActive: true },
  // Class 12 Streams
  { id: 'c12_science', name: '12 Science', grade: '12', stream: 'Science', category: 'Senior Secondary', index: 14, color: '#8B5CF6', icon: 'FlaskConical', isActive: true },
  { id: 'c12_commerce', name: '12 Commerce', grade: '12', stream: 'Commerce', category: 'Senior Secondary', index: 15, color: '#EC4899', icon: 'TrendingUp', isActive: true },
  { id: 'c12_arts', name: '12 Arts', grade: '12', stream: 'Arts', category: 'Senior Secondary', index: 16, color: '#6366F1', icon: 'Palette', isActive: true },
];

export const ALL_GRADE_NAMES = MASTER_GRADES.map((g) => g.name);

export const PRIMARY_GRADE_NAMES = MASTER_GRADES.filter((g) => g.category === 'Primary').map((g) => g.name);
export const MIDDLE_GRADE_NAMES = MASTER_GRADES.filter((g) => g.category === 'Middle').map((g) => g.name);
export const SECONDARY_GRADE_NAMES = MASTER_GRADES.filter((g) => g.category === 'Secondary').map((g) => g.name);
export const CLASS_11_GRADE_NAMES = MASTER_GRADES.filter((g) => g.grade === '11').map((g) => g.name);
export const CLASS_12_GRADE_NAMES = MASTER_GRADES.filter((g) => g.grade === '12').map((g) => g.name);
export const SR_SECONDARY_GRADE_NAMES = MASTER_GRADES.filter((g) => g.category === 'Senior Secondary').map((g) => g.name);

export function isGradeSelected(selectedList: string[] | string | undefined, grade: IGrade | string): boolean {
  if (!selectedList) return false;
  const list = Array.isArray(selectedList) ? selectedList : [String(selectedList)];
  const targetName = typeof grade === 'string' ? grade : grade.name;
  const targetId = typeof grade === 'string' ? '' : grade.id;

  return list.some((item) => {
    const cleanItem = String(item).toLowerCase().trim().replace(/^class\s+/i, '').replace(/^grade\s+/i, '');
    const cleanTarget = targetName.toLowerCase().trim().replace(/^class\s+/i, '').replace(/^grade\s+/i, '');
    if (cleanItem === cleanTarget) return true;
    if (targetId && cleanItem === targetId.toLowerCase()) return true;
    // Friendly matches
    if (cleanTarget === '11 science' && (cleanItem.includes('11') && (cleanItem.includes('pcm') || cleanItem.includes('pcb')))) return true;
    if (cleanTarget === '12 science' && (cleanItem.includes('12') && (cleanItem.includes('pcm') || cleanItem.includes('pcb')))) return true;
    return false;
  });
}
