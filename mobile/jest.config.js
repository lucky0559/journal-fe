const preset = require('jest-expo/jest-preset');

module.exports = {
  ...preset,
  setupFilesAfterEnv: [...(preset.setupFilesAfterEnv ?? []), '<rootDir>/jest.setup.ts'],
  moduleNameMapper: { ...(preset.moduleNameMapper ?? {}), '^@/(.*)$': '<rootDir>/src/$1',
    // lucide-react-native's default entry is ESM (.mjs); Jest uses its CommonJS build.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
};
