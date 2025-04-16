module.exports = {
  preset: 'jest-expo',
  setupFiles: [
    '<rootDir>/jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react-native|@react-native-community|@react-navigation|expo-router|expo|firebase)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
