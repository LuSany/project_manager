import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// 加载 .env.test 文件
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    include: [
      // 单元测试 - 不连接数据库
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.spec.ts',
      'tests/unit/**/*.test.tsx',
    ],
    exclude: [
      'tests/e2e/**/*',
      'tests/**/*.e2e.ts',
      'tests/integration/**/*',
      // 排除需要数据库的测试
      'tests/unit/db.test.ts',
      'tests/unit/business.test.ts',
    ],
    // 单元测试使用 mock setup (不连接数据库)
    setupFiles: ['tests/setup.unit.ts'],
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
