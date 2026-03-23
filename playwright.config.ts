import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'test-results/junit.xml' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/admin.json',
      },
      testMatch: [
        // 管理员专属测试
        /admin-users\.spec\.ts$/,
        /admin-.*\.spec\.ts$/,
        // 通用测试（所有用户）
        /auth\.spec\.ts$/,
        /auth-dashboard\.spec\.ts$/,
        /simple-login-test\.spec\.ts$/,
        /frontend-login-verification\.spec\.ts$/,
        /project-features\.spec\.ts$/,
        /notifications\.spec\.ts$/,
        /settings\.spec\.ts$/,
        /role-system\.spec\.ts$/,
        /task-dependencies\.spec\.ts$/,
        /p0-p1-features\.spec\.ts$/,
        /email-sending\.spec\.ts$/,
        /review-attachment\.spec\.ts$/,
        /debug-preview\.spec\.ts$/,
        /critical-flows\/.*\.spec\.ts$/,
      ],
      dependencies: ['setup'],
    },
    {
      name: 'chromium-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      testMatch: [
        // 普通用户可访问的测试（排除管理员专属）
        /auth\.spec\.ts$/,
        /auth-dashboard\.spec\.ts$/,
        /simple-login-test\.spec\.ts$/,
        /frontend-login-verification\.spec\.ts$/,
        /project-features\.spec\.ts$/,
        /notifications\.spec\.ts$/,
        /settings\.spec\.ts$/,
        /role-system\.spec\.ts$/,
        /task-dependencies\.spec\.ts$/,
        /p0-p1-features\.spec\.ts$/,
        /review-attachment\.spec\.ts$/,
        /debug-preview\.spec\.ts$/,
        // 关键流程测试（排除管理员流程）
        /critical-flows\/01-.*\.spec\.ts$/,
        /critical-flows\/02-.*\.spec\.ts$/,
        /critical-flows\/03-.*\.spec\.ts$/,
        /critical-flows\/04-.*\.spec\.ts$/,
        /critical-flows\/05-.*\.spec\.ts$/,
        /critical-flows\/06-.*\.spec\.ts$/,
      ],
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
