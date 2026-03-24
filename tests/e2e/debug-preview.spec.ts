import { test, expect } from '@playwright/test'

const testCases = [
  { id: '0faf8799-2845-4ee7-8fe6-f53afdd5c268', name: 'xlsx', ext: 'xlsx' },
  { id: '6ddeffc3-9733-4daa-8414-3ecaa0d40a64', name: 'xls', ext: 'xls' },
  { id: '9e4427dc-c2b2-4aa1-9e17-27e8408d3c1c', name: 'et', ext: 'et' },
  { id: '2f46dbe7-4735-438e-92bb-37cc7cc55408', name: 'pptx', ext: 'pptx' },
  { id: '6b3a7952-dc1c-4879-af48-911023b07e61', name: 'ppt', ext: 'ppt' },
  { id: 'aacd5dc6-2baf-4522-bd4d-0a928b21f9e2', name: 'dps', ext: 'dps' },
]

for (const tc of testCases) {
  test(`测试 ${tc.ext} 文件预览`, async ({ page }) => {
    test.setTimeout(90000)

    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    await page.fill('input[type="email"]', 'admin@example.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/dashboard|projects/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    await page.goto(`/files/${tc.id}/preview`)
    await page.waitForTimeout(20000)

    await page.screenshot({ path: `test-results/preview-${tc.name}.png`, fullPage: true })

    // 检查是否有错误对话框
    const errorDialog = await page.locator('[class*="error"]').isVisible().catch(() => false)
    const errorText = errorDialog ? await page.locator('[class*="error"]').textContent() : null
    
    console.log(`${tc.ext}: ${errorText ? '错误: ' + errorText : '正常'}`)
  })
}
