module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/migrations/',
    '/config/',
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};

