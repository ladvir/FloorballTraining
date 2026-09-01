import { defineConfig } from 'vitest/config'

// Pure-logic unit tests only (src/utils/*.test.ts) - no React Native transform, no jsdom.
// Component/render tests need jest-expo + @testing-library/react-native and are tracked
// separately (#152 / #147).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
