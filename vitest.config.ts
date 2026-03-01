import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'tests/**/*.e2e.ts'],
    // 使用 Mock setup 文件
    setupFiles: ['tests/setup.mock.ts'],
    testTimeout: 30000, // 30 秒超时，适用于集成测试
    hookTimeout: 30000, // 30 秒钩子超时
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
    },
    // 配置 deps 内联
    deps: {
      interopDefault: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['tests/e2e/**/*', 'tests/**/*.e2e.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 30000, // 30 秒超时，适用于集成测试
    hookTimeout: 30000, // 30 秒钩子超时
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
