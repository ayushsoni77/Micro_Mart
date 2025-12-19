/**
 * Jest configuration for user-service
 * - Node environment
 * - Looks for tests in `tests/**/*.spec.js`
 * - Collects coverage from core source directories
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.spec.js'],
  verbose: true,
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
    'index.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage'
};
