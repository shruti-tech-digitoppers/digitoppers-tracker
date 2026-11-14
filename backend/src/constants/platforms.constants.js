/**
 * Platform and Solution Constants for Project Tracker (digi-ops-portal)
 * Kept aligned with Core Dashboard and LMS Backend.
 */
const LICENSE_PLATFORMS = Object.freeze(['tablet', 'android_laptop', 'windows', 'linux', 'ifp']);

const PLATFORMS = LICENSE_PLATFORMS;

const PLATFORM_LABELS = Object.freeze({
  tablet: 'Tablet',
  android_laptop: 'Android Laptop',
  windows: 'Windows',
  linux: 'Linux',
  ifp: 'IFP'
});

const PLATFORM_OPTIONS = Object.freeze([
  { value: 'tablet', label: 'Tablet' },
  { value: 'android_laptop', label: 'Android Laptop' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'ifp', label: 'IFP' }
]);

const SOLUTIONS = Object.freeze(['smartshala', 'epathshala_lab']);

/**
 * Default solution for a platform when it is unambiguous.
 * Windows/Linux can be either (OPS in SmartShala vs desktops in a Lab), so they return null.
 */
function defaultSolutionForPlatform(platform) {
  if (platform === 'ifp') return 'smartshala';
  if (platform === 'tablet' || platform === 'android_laptop') return 'epathshala_lab';
  return null;
}

/**
 * Resolves recommended default platform based on solution key or name.
 */
function getDefaultPlatformForSolution(solutionKeyOrName) {
  if (!solutionKeyOrName) return '';
  const key = String(solutionKeyOrName).trim().toUpperCase();

  if (key.includes('SMART') || key.includes('SHAALA') || key.includes('SHALA') || key.includes('IFP')) {
    return 'ifp';
  }
  if (key.includes('EPATHSHALA') || key.includes('TAB') || key.includes('STUDENT')) {
    return 'tablet';
  }
  if (
    key.includes('STEM') ||
    key.includes('ROBOTIC') ||
    key.includes('LANGUAGE') ||
    key.includes('COMPUTER') ||
    key.includes('OPS') ||
    key.includes('ASTRONOMY') ||
    key.includes('LAB')
  ) {
    return 'windows';
  }
  return '';
}

/**
 * Checks whether a given solution requires a software license / platform.
 * - Digital solutions (Smart Shaala, ePathshala, Language Lab) -> require a software platform.
 * - Physical / Kit labs (STEM Lab, Astronomy Lab, Science Kits, Robotics) -> do NOT require software licenses / platform.
 */
function doesSolutionRequirePlatform(solutionKeyOrName) {
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

module.exports = {
  LICENSE_PLATFORMS,
  PLATFORMS,
  PLATFORM_LABELS,
  PLATFORM_OPTIONS,
  SOLUTIONS,
  defaultSolutionForPlatform,
  getDefaultPlatformForSolution,
  doesSolutionRequirePlatform
};

