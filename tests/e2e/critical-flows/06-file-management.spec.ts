/**
 * E2E-06: 文件管理流程
 *
 * 端到端测试核心流程
 * 文件上传 → 预览 → 编辑 → 下载 → 版本管理
 *
 * Phase 3 E2E 测试 - 6 用例
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'

test.describe('E2E-06: Complete File Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
  })

  test('should upload file successfully', async ({ page }) => {
    await page.goto('/files')
    await page.click('text=Upload, text=上传')

    const testFile = path.join(__dirname, 'test-upload.txt')
    await page.setInputFiles('input[type="file"]', testFile)
    await page.fill('[name="fileName"]', 'E2E Test File')
    await page.click('button:has-text("Upload")')

    await expect(page.locator('text=E2E Test File')).toBeVisible()
  })

  test('should preview document file', async ({ page }) => {
    await page.goto('/files')
    await page.click('text=File')

    await page.click('text=Preview, text=预览')

    // Wait for preview to load
    await page.waitForTimeout(2000)

    await expect(page.locator('iframe, .preview-container')).toBeVisible()
  })

  test('should download file', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download')

    await page.goto('/files')
    await page.click('text=File')
    await page.click('text=Download, text=下载')

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBeTruthy()
  })

  test('should manage file versions', async ({ page }) => {
    await page.goto('/files')
    await page.click('text=File')

    // Upload new version
    await page.click('text=New Version, text=新版本')
    const newVersion = path.join(__dirname, 'test-v2.txt')
    await page.setInputFiles('input[type="file"]', newVersion)
    await page.click('button:has-text("Upload")')

    await expect(page.locator('text=Version 2')).toBeVisible()
  })

  test('should set file permissions', async ({ page }) => {
    await page.goto('/files')
    await page.click('text=File')

    await page.click('text=Permissions, text=权限')
    await page.click('[data-testid="select-user"]')
    await page.click('text=Test User')
    await page.selectOption('[name="accessLevel"]', 'READ')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should complete file management workflow', async ({ page }) => {
    // Upload
    await page.goto('/files/new')
    const testFile = path.join(__dirname, 'workflow-test.txt')
    await page.setInputFiles('input[type="file"]', testFile)
    await page.fill('[name="fileName"]', 'Workflow Test File')
    await page.click('button:has-text("Upload")')

    // Preview
    await page.click('text=Preview')
    await page.waitForTimeout(2000)

    // Share
    await page.click('text=Share, text=分享')
    await page.click('button:has-text("Generate Link")')

    // Download
    const downloadPromise = page.waitForEvent('download')
    await page.click('text=Download')
    await downloadPromise

    await expect(page.locator('text=Workflow Test File')).toBeVisible()
  })
})
