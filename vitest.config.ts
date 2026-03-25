import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// 加载 .env.test 文件
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.tsx',
      'src/**/*.test.ts',
      'src/**/*.spec.ts',
      'src/**/*.test.tsx',
    ],
    exclude: ['tests/e2e/**/*', 'tests/**/*.e2e.ts', 'tests/integration/**/*'],
    setupFiles: ['tests/setup.ts'],
    environment: 'jsdom',
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/stores/**/*.ts'],
      exclude: ['src/types/**', '**/*.d.ts', '**/index.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
