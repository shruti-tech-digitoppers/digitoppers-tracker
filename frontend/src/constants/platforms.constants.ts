/**
 * Platform and Solution Constants for Project Tracker Frontend
 * Aligned with Core Dashboard and LMS Backend.
 */
export const LICENSE_PLATFORMS = ['tablet', 'android_laptop', 'windows', 'linux', 'ifp'] as const;
export type LicensePlatform = typeof LICENSE_PLATFORMS[number];

export const PLATFORMS = LICENSE_PLATFORMS;
export type Platform = LicensePlatform;

export const PLATFORM_LABELS: Record<LicensePlatform, string> = {
  tablet: 'Tablet',
  android_laptop: 'Android Laptop',
  windows: 'Windows',
  linux: 'Linux',
  ifp: 'IFP'
};

export interface PlatformOption {
  value: LicensePlatform;
  label: string;
}

export const PLATFORM_OPTIONS: PlatformOption[] = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'android_laptop', label: 'Android Laptop' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'ifp', label: 'IFP' }
];

export const SOLUTIONS = ['smartshala', 'epathshala_lab'] as const;
export type SolutionCategory = typeof SOLUTIONS[number];

/**
 * Default solution for a platform when it is unambiguous.
 * Windows/Linux can be either (OPS in SmartShala vs desktops in a Lab), so they return null.
 */
export function defaultSolutionForPlatform(platform: string): string | null {
  if (platform === 'ifp') return 'smartshala';
  if (platform === 'tablet' || platform === 'android_laptop') return 'epathshala_lab';
  return null;
}

/**
 * Checks whether a given solution requires a software license / platform.
 * - Digital solutions (Smart Shaala, ePathshala, Language Lab) -> require a software platform.
 * - Physical / Kit labs (STEM Lab, Astronomy Lab, Science Kits, Robotics) -> do NOT require software licenses / platform.
 */
export function doesSolutionRequirePlatform(solutionKeyOrName?: string): boolean {
  if (!solutionKeyOrName) return false;
  const key = String(solutionKeyOrName).trim().toUpperCase();

  // Physical kit labs: No software license / platform needed
  if (
    key.includes('STEM') ||
    key.includes('ASTRONOMY') ||
    key.includes('SCIENCE_LEARNING') ||
    key.includes('ROBOTIC')
  ) {
    return false;
  }

  // Digital software solutions: Require software platform & license
  if (
    key.includes('SMART') ||
    key.includes('SHAALA') ||
    key.includes('SHALA') ||
    key.includes('EPATHSHALA') ||
    key.includes('LANGUAGE') ||
    key.includes('LMS')
  ) {
    return true;
  }

  return true;
}


