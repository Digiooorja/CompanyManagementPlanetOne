module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 20000,
  // Sequelize keeps a connection pool alive, which trips Jest's "did not
  // exit" warning even after every test file closes its own connections in
  // afterAll(). forceExit is the standard pragmatic workaround for
  // Sequelize + Jest (documented tradeoff, not a bug in the tests).
  forceExit: true,
  verbose: true,
};
