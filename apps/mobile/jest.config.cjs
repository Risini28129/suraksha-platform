module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: { '^lucide-react-native$': require.resolve('lucide-react-native') },
  testMatch: ['**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo/.*|expo-.*|@react-navigation/.*|react-native-.*)/)',
  ],
};
