const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude test files from the bundle
config.resolver.blockList = [
  /\.test\.[jt]sx?$/,
  /node_modules\/.*\/__tests__\/.*/,
];

module.exports = config;
