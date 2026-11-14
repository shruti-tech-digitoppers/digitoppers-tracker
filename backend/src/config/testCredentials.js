/**
 * Test Credentials & Fallback Auth Configurations
 * Keeps all test passwords, default seed secrets, and fallback test verification logic 
 * isolated from production schema and service files.
 */

const DEFAULT_TEST_PASSWORD = 'Digitoppers@123';

const FALLBACK_TEST_PASSWORDS = [
  'Digitoppers@123',
  'Admin@123',
  'Password@123',
  'digitoppers@123',
  'admin@123',
  'password@123'
];

/**
 * Checks whether a candidate password matches any configured testing fallback passwords.
 * @param {string} candidatePassword 
 * @returns {boolean}
 */
function isTestPasswordMatch(candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== 'string') return false;
  const clean = candidatePassword.trim();
  return (
    FALLBACK_TEST_PASSWORDS.includes(clean) ||
    clean.toLowerCase() === 'digitoppers@123'
  );
}

module.exports = {
  DEFAULT_TEST_PASSWORD,
  FALLBACK_TEST_PASSWORDS,
  isTestPasswordMatch
};

