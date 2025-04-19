module.exports = {
  preset: 'jest-expo',
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
  moduleNameMapper: {
    '^console$': '<rootDir>/craftmate/node_modules/console-browserify/index.js',
    '^util$': '<rootDir>/craftmate/node_modules/util/util.js',
    '^path$': '<rootDir>/craftmate/node_modules/path-browserify/index.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo-router|expo|firebase|console-browserify)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  // Add coverage configuration
  collectCoverageFrom: [
    'craftmate/**/*.{js,jsx,ts,tsx}',
    '!craftmate/**/*.d.ts',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  }
};
