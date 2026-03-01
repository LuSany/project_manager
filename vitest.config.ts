import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// 加载 .env.test 文件
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'tests/**/*.e2e.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000, // 30 秒超时，适用于集成测试
    hookTimeout: 30000, // 30 秒钩子超时
    // 集成测试需要串行执行以避免数据库冲突
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
