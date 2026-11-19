// The frontend is native ES modules (see "type": "module"), so tests run through
// Node's ESM support (--experimental-vm-modules, set in the npm scripts) with no Babel transform.
export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.js'],
  transform: {},
};
