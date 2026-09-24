export interface StageColorTheme {
  stageNumber: number;
  name: string;
  family: string;
  // Stage Header / Number Pill
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  numberBg: string;
  numberText: string;
  numberBorder: string;
  // Stage & Task Card Background (Aesthetic light pastel color family)
  cardBg: string;
  cardBorder: string;
  cardBorderSelected: string;
  cardHoverBorder: string;
  accentBar: string;
  titleColor: string;
  // Connector line / arrow
  connectorLine: string;
  connectorArrow: string;
  // Subtasks container & task items
  subtaskContainerBg: string;
  subtaskContainerBorder: string;
  subtaskDot: string;
  subtaskLine: string;
  taskBadgeBg: string;
  taskBadgeText: string;
  taskBadgeBorder: string;
  taskCardBg: string;
  taskCardBorder: string;
  taskAccentBar: string;
  // Drawer / Inspector
  drawerHeaderGradient: string;
  drawerIconBg: string;
  drawerBadgeBg: string;
  drawerBadgeText: string;
  drawerBadgeBorder: string;
}

export interface StreamColorTheme {
  streamType: 'HARDWARE' | 'TECH' | 'CONTENT';
  badgeCls: string;
  accent: string;
  containerBg: string;
  containerBorder: string;
  dotBg: string;
  lineBg: string;
  cardBg: string;
  cardBorder: string;
  badgeText: string;
}

export const STAGE_COLOR_THEMES: Record<number, StageColorTheme> = {
  // Phase 1: Warm Sand / Soft Champagne
  1: {
    stageNumber: 1,
    name: 'Project Review',
    family: 'champagne',
    badgeBg: 'bg-amber-100/90',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300/80',
    numberBg: 'bg-amber-200/90',
    numberText: 'text-amber-950',
    numberBorder: 'border-amber-400/80',
    cardBg: 'bg-[#fef9f0]',
    cardBorder: 'border-amber-200/90',
    cardBorderSelected: 'border-amber-500 ring-2 ring-amber-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-amber-400 hover:shadow-amber-100',
    accentBar: 'bg-amber-400',
    titleColor: 'text-amber-950',
    connectorLine: 'bg-amber-300',
    connectorArrow: 'text-amber-600',
    subtaskContainerBg: 'bg-amber-100/40',
    subtaskContainerBorder: 'border-amber-200/80',
    subtaskDot: 'bg-amber-500',
    subtaskLine: 'bg-amber-300',
    taskBadgeBg: 'bg-amber-100/90',
    taskBadgeText: 'text-amber-900',
    taskBadgeBorder: 'border-amber-300/80',
    taskCardBg: 'bg-[#fefbf6]',
    taskCardBorder: 'border-amber-200/80 hover:border-amber-400',
    taskAccentBar: 'bg-amber-400',
    drawerHeaderGradient: 'from-amber-100/70 via-amber-50 to-white',
    drawerIconBg: 'from-amber-500 to-amber-600',
    drawerBadgeBg: 'bg-amber-100/90',
    drawerBadgeText: 'text-amber-900',
    drawerBadgeBorder: 'border-amber-300/80',
  },

  // Phase 2: Ice Sky Blue / Crystal Blue
  2: {
    stageNumber: 2,
    name: 'PO & PI Generation',
    family: 'sky',
    badgeBg: 'bg-sky-100/90',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300/80',
    numberBg: 'bg-sky-200/90',
    numberText: 'text-sky-950',
    numberBorder: 'border-sky-400/80',
    cardBg: 'bg-[#f0f7ff]',
    cardBorder: 'border-sky-200/90',
    cardBorderSelected: 'border-sky-500 ring-2 ring-sky-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-sky-400 hover:shadow-sky-100',
    accentBar: 'bg-sky-400',
    titleColor: 'text-sky-950',
    connectorLine: 'bg-sky-300',
    connectorArrow: 'text-sky-600',
    subtaskContainerBg: 'bg-sky-100/40',
    subtaskContainerBorder: 'border-sky-200/80',
    subtaskDot: 'bg-sky-500',
    subtaskLine: 'bg-sky-300',
    taskBadgeBg: 'bg-sky-100/90',
    taskBadgeText: 'text-sky-900',
    taskBadgeBorder: 'border-sky-300/80',
    taskCardBg: 'bg-[#f6faff]',
    taskCardBorder: 'border-sky-200/80 hover:border-sky-400',
    taskAccentBar: 'bg-sky-400',
    drawerHeaderGradient: 'from-sky-100/70 via-sky-50 to-white',
    drawerIconBg: 'from-sky-500 to-sky-600',
    drawerBadgeBg: 'bg-sky-100/90',
    drawerBadgeText: 'text-sky-900',
    drawerBadgeBorder: 'border-sky-300/80',
  },

  // Phase 3: Soft Violet / Lilac Iris (Aesthetic pastel purple-blue, replaces emerald green)
  3: {
    stageNumber: 3,
    name: 'Order Requirement',
    family: 'violet',
    badgeBg: 'bg-violet-100/90',
    badgeText: 'text-violet-900',
    badgeBorder: 'border-violet-300/80',
    numberBg: 'bg-violet-200/90',
    numberText: 'text-violet-950',
    numberBorder: 'border-violet-400/80',
    cardBg: 'bg-[#f7f3ff]',
    cardBorder: 'border-violet-200/90',
    cardBorderSelected: 'border-violet-500 ring-2 ring-violet-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-violet-400 hover:shadow-violet-100',
    accentBar: 'bg-violet-400',
    titleColor: 'text-violet-950',
    connectorLine: 'bg-violet-300',
    connectorArrow: 'text-violet-600',
    subtaskContainerBg: 'bg-violet-100/40',
    subtaskContainerBorder: 'border-violet-200/80',
    subtaskDot: 'bg-violet-500',
    subtaskLine: 'bg-violet-300',
    taskBadgeBg: 'bg-violet-100/90',
    taskBadgeText: 'text-violet-900',
    taskBadgeBorder: 'border-violet-300/80',
    taskCardBg: 'bg-[#fbf9ff]',
    taskCardBorder: 'border-violet-200/80 hover:border-violet-400',
    taskAccentBar: 'bg-violet-400',
    drawerHeaderGradient: 'from-violet-100/70 via-violet-50 to-white',
    drawerIconBg: 'from-violet-500 to-violet-600',
    drawerBadgeBg: 'bg-violet-100/90',
    drawerBadgeText: 'text-violet-900',
    drawerBadgeBorder: 'border-violet-300/80',
  },

  // Phase 4: Nordic Ocean / Soft Aqua Slate
  4: {
    stageNumber: 4,
    name: 'Execution Stage',
    family: 'teal',
    badgeBg: 'bg-teal-100/90',
    badgeText: 'text-teal-900',
    badgeBorder: 'border-teal-300/80',
    numberBg: 'bg-teal-200/90',
    numberText: 'text-teal-950',
    numberBorder: 'border-teal-400/80',
    cardBg: 'bg-[#f0f9fa]',
    cardBorder: 'border-teal-200/90',
    cardBorderSelected: 'border-teal-500 ring-2 ring-teal-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-teal-400 hover:shadow-teal-100',
    accentBar: 'bg-teal-400',
    titleColor: 'text-teal-950',
    connectorLine: 'bg-teal-300',
    connectorArrow: 'text-teal-600',
    subtaskContainerBg: 'bg-teal-100/40',
    subtaskContainerBorder: 'border-teal-200/80',
    subtaskDot: 'bg-teal-500',
    subtaskLine: 'bg-teal-300',
    taskBadgeBg: 'bg-teal-100/90',
    taskBadgeText: 'text-teal-900',
    taskBadgeBorder: 'border-teal-300/80',
    taskCardBg: 'bg-[#f6fbfc]',
    taskCardBorder: 'border-teal-200/80 hover:border-teal-400',
    taskAccentBar: 'bg-teal-400',
    drawerHeaderGradient: 'from-teal-100/70 via-teal-50 to-white',
    drawerIconBg: 'from-teal-500 to-teal-600',
    drawerBadgeBg: 'bg-teal-100/90',
    drawerBadgeText: 'text-teal-900',
    drawerBadgeBorder: 'border-teal-300/80',
  },

  // Phase 5: Soft Purple / Lavender Amethyst
  5: {
    stageNumber: 5,
    name: 'Tech & Content QA',
    family: 'purple',
    badgeBg: 'bg-purple-100/90',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300/80',
    numberBg: 'bg-purple-200/90',
    numberText: 'text-purple-950',
    numberBorder: 'border-purple-400/80',
    cardBg: 'bg-[#faf4ff]',
    cardBorder: 'border-purple-200/90',
    cardBorderSelected: 'border-purple-500 ring-2 ring-purple-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-purple-400 hover:shadow-purple-100',
    accentBar: 'bg-purple-400',
    titleColor: 'text-purple-950',
    connectorLine: 'bg-purple-300',
    connectorArrow: 'text-purple-600',
    subtaskContainerBg: 'bg-purple-100/40',
    subtaskContainerBorder: 'border-purple-200/80',
    subtaskDot: 'bg-purple-500',
    subtaskLine: 'bg-purple-300',
    taskBadgeBg: 'bg-purple-100/90',
    taskBadgeText: 'text-purple-900',
    taskBadgeBorder: 'border-purple-300/80',
    taskCardBg: 'bg-[#fdfaff]',
    taskCardBorder: 'border-purple-200/80 hover:border-purple-400',
    taskAccentBar: 'bg-purple-400',
    drawerHeaderGradient: 'from-purple-100/70 via-purple-50 to-white',
    drawerIconBg: 'from-purple-500 to-purple-600',
    drawerBadgeBg: 'bg-purple-100/90',
    drawerBadgeText: 'text-purple-900',
    drawerBadgeBorder: 'border-purple-300/80',
  },

  // Phase 6: Warm Peach / Soft Apricot
  6: {
    stageNumber: 6,
    name: 'Field Installation',
    family: 'orange',
    badgeBg: 'bg-orange-100/90',
    badgeText: 'text-orange-900',
    badgeBorder: 'border-orange-300/80',
    numberBg: 'bg-orange-200/90',
    numberText: 'text-orange-950',
    numberBorder: 'border-orange-400/80',
    cardBg: 'bg-[#fff7f0]',
    cardBorder: 'border-orange-200/90',
    cardBorderSelected: 'border-orange-500 ring-2 ring-orange-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-orange-400 hover:shadow-orange-100',
    accentBar: 'bg-orange-400',
    titleColor: 'text-orange-950',
    connectorLine: 'bg-orange-300',
    connectorArrow: 'text-orange-600',
    subtaskContainerBg: 'bg-orange-100/40',
    subtaskContainerBorder: 'border-orange-200/80',
    subtaskDot: 'bg-orange-500',
    subtaskLine: 'bg-orange-300',
    taskBadgeBg: 'bg-orange-100/90',
    taskBadgeText: 'text-orange-900',
    taskBadgeBorder: 'border-orange-300/80',
    taskCardBg: 'bg-[#fffbf6]',
    taskCardBorder: 'border-orange-200/80 hover:border-orange-400',
    taskAccentBar: 'bg-orange-400',
    drawerHeaderGradient: 'from-orange-100/70 via-orange-50 to-white',
    drawerIconBg: 'from-orange-500 to-orange-600',
    drawerBadgeBg: 'bg-orange-100/90',
    drawerBadgeText: 'text-orange-900',
    drawerBadgeBorder: 'border-orange-300/80',
  },

  // Phase 7: Soft Indigo / Periwinkle Twilight (replaces rose/red)
  7: {
    stageNumber: 7,
    name: 'Teacher Training',
    family: 'indigo',
    badgeBg: 'bg-indigo-100/90',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-300/80',
    numberBg: 'bg-indigo-200/90',
    numberText: 'text-indigo-950',
    numberBorder: 'border-indigo-400/80',
    cardBg: 'bg-[#f2f5ff]',
    cardBorder: 'border-indigo-200/90',
    cardBorderSelected: 'border-indigo-500 ring-2 ring-indigo-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-indigo-400 hover:shadow-indigo-100',
    accentBar: 'bg-indigo-400',
    titleColor: 'text-indigo-950',
    connectorLine: 'bg-indigo-300',
    connectorArrow: 'text-indigo-600',
    subtaskContainerBg: 'bg-indigo-100/40',
    subtaskContainerBorder: 'border-indigo-200/80',
    subtaskDot: 'bg-indigo-500',
    subtaskLine: 'bg-indigo-300',
    taskBadgeBg: 'bg-indigo-100/90',
    taskBadgeText: 'text-indigo-900',
    taskBadgeBorder: 'border-indigo-300/80',
    taskCardBg: 'bg-[#f7f9ff]',
    taskCardBorder: 'border-indigo-200/80 hover:border-indigo-400',
    taskAccentBar: 'bg-indigo-400',
    drawerHeaderGradient: 'from-indigo-100/70 via-indigo-50 to-white',
    drawerIconBg: 'from-indigo-500 to-indigo-600',
    drawerBadgeBg: 'bg-indigo-100/90',
    drawerBadgeText: 'text-indigo-900',
    drawerBadgeBorder: 'border-indigo-300/80',
  },

  // Phase 8: Cool Slate / Silver Platinum
  8: {
    stageNumber: 8,
    name: 'Handover & Closure',
    family: 'slate',
    badgeBg: 'bg-slate-200/90',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300/80',
    numberBg: 'bg-slate-300/90',
    numberText: 'text-slate-900',
    numberBorder: 'border-slate-400/80',
    cardBg: 'bg-[#f5f7fa]',
    cardBorder: 'border-slate-300/90',
    cardBorderSelected: 'border-slate-600 ring-2 ring-slate-400/40 shadow-sm',
    cardHoverBorder: 'hover:border-slate-400 hover:shadow-slate-100',
    accentBar: 'bg-slate-400',
    titleColor: 'text-slate-950',
    connectorLine: 'bg-slate-300',
    connectorArrow: 'text-slate-600',
    subtaskContainerBg: 'bg-slate-200/40',
    subtaskContainerBorder: 'border-slate-300/80',
    subtaskDot: 'bg-slate-500',
    subtaskLine: 'bg-slate-300',
    taskBadgeBg: 'bg-slate-200/90',
    taskBadgeText: 'text-slate-800',
    taskBadgeBorder: 'border-slate-300/80',
    taskCardBg: 'bg-[#fafbfc]',
    taskCardBorder: 'border-slate-300/80 hover:border-slate-400',
    taskAccentBar: 'bg-slate-400',
    drawerHeaderGradient: 'from-slate-200/70 via-slate-100 to-white',
    drawerIconBg: 'from-slate-600 to-slate-700',
    drawerBadgeBg: 'bg-slate-200/90',
    drawerBadgeText: 'text-slate-900',
    drawerBadgeBorder: 'border-slate-400/80',
  },
};

export const STREAM_COLOR_THEMES: Record<string, StreamColorTheme> = {
  HARDWARE: {
    streamType: 'HARDWARE',
    badgeCls: 'bg-cyan-100 text-cyan-950 border-cyan-300',
    accent: '#0891b2',
    containerBg: 'bg-cyan-50/70',
    containerBorder: 'border-cyan-200',
    dotBg: 'bg-cyan-500',
    lineBg: 'bg-cyan-300',
    cardBg: 'bg-[#f0faff]',
    cardBorder: 'border-cyan-200/90 hover:border-cyan-400',
    badgeText: 'text-cyan-950',
  },
  TECH: {
    streamType: 'TECH',
    badgeCls: 'bg-indigo-100 text-indigo-950 border-indigo-300',
    accent: '#4f46e5',
    containerBg: 'bg-indigo-50/70',
    containerBorder: 'border-indigo-200',
    dotBg: 'bg-indigo-500',
    lineBg: 'bg-indigo-300',
    cardBg: 'bg-[#f4f6ff]',
    cardBorder: 'border-indigo-200/90 hover:border-indigo-400',
    badgeText: 'text-indigo-950',
  },
  CONTENT: {
    streamType: 'CONTENT',
    badgeCls: 'bg-amber-100 text-amber-950 border-amber-300',
    accent: '#d97706',
    containerBg: 'bg-amber-50/70',
    containerBorder: 'border-amber-200',
    dotBg: 'bg-amber-500',
    lineBg: 'bg-amber-300',
    cardBg: 'bg-[#fef9f0]',
    cardBorder: 'border-amber-200/90 hover:border-amber-400',
    badgeText: 'text-amber-950',
  },
};

/**
 * Resolves the stage index (1-8) based on stage order number or key
 */
export function getStageOrder(stageKey?: string, order?: number): number {
  if (order && order >= 1 && order <= 8) return order;
  if (!stageKey) return 1;

  const key = stageKey.toUpperCase();
  if (key.includes('PROJECT_REVIEW') || key.includes('PROJECT_CREATED') || key.includes('LEAD')) return 1;
  if (key.includes('PO_AND_PI') || key.includes('PO_') || key.includes('PI_')) return 2;
  if (key.includes('ORDER_REQUIREMENT') || key.includes('SCHOOL_') || key.includes('SOLUTION') || key.includes('HARDWARE_REQUIREMENT')) return 3;
  if (key.includes('EXECUTION') || key.includes('HARDWARE_STREAM') || key.includes('TECH_STREAM') || key.includes('CONTENT_STREAM')) return 4;
  if (key.includes('TECH_AND_CONTENT_TESTING') || key.includes('TESTING_') || key.includes('INTEGRATION_TESTING')) return 5;
  if (key.includes('INSTALLATION')) return 6;
  if (key.includes('TRAINING')) return 7;
  if (key.includes('CLOSURE') || key.includes('PROJECT_CLOS')) return 8;

  return 1;
}

export function getStageTheme(stageIndexOrKey?: number | string): StageColorTheme {
  let idx = 1;
  if (typeof stageIndexOrKey === 'number') {
    idx = stageIndexOrKey >= 1 && stageIndexOrKey <= 8 ? stageIndexOrKey : 1;
  } else if (typeof stageIndexOrKey === 'string') {
    idx = getStageOrder(stageIndexOrKey);
  }
  return STAGE_COLOR_THEMES[idx] || STAGE_COLOR_THEMES[1];
}

export function getStreamTheme(streamType?: string): StreamColorTheme {
  if (!streamType) return STREAM_COLOR_THEMES.HARDWARE;
  const upper = streamType.toUpperCase();
  if (upper.includes('TECH')) return STREAM_COLOR_THEMES.TECH;
  if (upper.includes('CONTENT')) return STREAM_COLOR_THEMES.CONTENT;
  return STREAM_COLOR_THEMES.HARDWARE;
}
