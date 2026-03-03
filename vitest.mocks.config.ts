/**
 * Mock 测试专用 Vitest 配置
 *
 * 不加载全局 setup 文件，避免数据库连接
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/mock-tools.test.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
