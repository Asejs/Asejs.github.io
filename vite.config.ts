/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/**/*.test.ts',
        'src/test/**',
        'src/main.ts',
        'src/env.d.ts',
        'src/favorites/**',
        'src/rov/**',
        'src/components/RovPlayground.vue',
      ],
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
    },
  },
})
