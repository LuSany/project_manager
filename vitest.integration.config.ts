/**
 * 集成测试 Vitest 配置
 *
 * 连接真实数据库进行集成测试
 */

import { defineConfig } from 'vitest/config'
import path from 'path'
import dotenv from 'dotenv'

// 加载 .env.test 文件
dotenv.config({ path: '.env.test' })

export default defineConfig({
  test: {
    include: [
      'tests/integration/**/*.test.ts',
      'tests/integration/**/*.spec.ts',
      // 需要数据库的单元测试
      'tests/unit/db.test.ts',
      'tests/unit/business.test.ts',
    ],
    setupFiles: ['tests/setup.ts'],
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // 集成测试使用单线程避免数据库冲突
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})