import { test, expect } from '@playwright/test'

test.describe('文件预览调试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // 检查是否已在登录页面
    const emailInput = page.locator('input[type="email"], input[name="email"]')
    const isVisible = await emailInput.isVisible().catch(() => false)

    if (isVisible) {
      await emailInput.fill('admin@example.com')
      await page.locator('input[type="password"], input[name="password"]').fill('Admin123!')
      await page.locator('button[type="submit"]').click()
      await page.waitForURL('**/', { timeout: 10000 }).catch(() => {})
      await page.waitForLoadState('networkidle')
    }
  })

  test('调试 OnlyOffice 预览 - 捕获网络请求和错误', async ({ page, context }) => {
    test.setTimeout(120000)

    // 收集控制台错误
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`)
      }
    })

    // 收集网络请求
    const networkLogs: string[] = []
    page.on('request', (request) => {
      if (
        request.url().includes('preview') ||
        request.url().includes('download') ||
        request.url().includes('onlyoffice')
      ) {
        networkLogs.push(`[Request] ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('preview') || url.includes('download') || url.includes('onlyoffice')) {
        const status = response.status()
        let body = ''
        try {
          const contentType = response.headers()['content-type'] || ''
          if (contentType.includes('json')) {
            body = await response.text()
          }
        } catch (e) {}
        networkLogs.push(`[Response] ${status} ${url} ${body.substring(0, 500)}`)
      }
    })

    // 访问项目页面
    console.log('=== 访问项目页面 ===')
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    // 找到第一个项目
    const projectLink = page.locator('a[href*="/projects/"]').first()
    const hasProject = await projectLink.isVisible().catch(() => false)

    if (!hasProject) {
      console.log('没有找到项目，跳过测试')
      test.skip()
      return
    }

    // 点击项目
    await projectLink.click()
    await page.waitForLoadState('networkidle')
    console.log('已进入项目详情页')

    // 查找文档标签
    const documentsTab = page
      .locator('a[href*="/documents"], button:has-text("文档"), [data-testid="documents-tab"]')
      .first()
    const hasDocumentsTab = await documentsTab.isVisible().catch(() => false)

    if (hasDocumentsTab) {
      await documentsTab.click()
      await page.waitForLoadState('networkidle')
      console.log('已进入文档页面')
    }

    // 查找文件列表
    const fileItems = page
      .locator('[data-testid="file-item"], tr:has(td), .file-item, [class*="file"]')
      .filter({
        has: page.locator('text=/\\.(doc|docx|xlsx|xls|pptx|ppt|wps|et|dps)/i'),
      })

    const fileCount = await fileItems.count()
    console.log(`找到 ${fileCount} 个 Office/WPS 文件`)

    if (fileCount === 0) {
      // 尝试其他选择器
      const allRows = page.locator('tr')
      const rowCount = await allRows.count()
      console.log(`表格行数: ${rowCount}`)

      // 打印页面内容帮助调试
      const pageContent = await page.content()
      console.log('页面包含 docx:', pageContent.includes('.docx'))
      console.log('页面包含 xlsx:', pageContent.includes('.xlsx'))
    }

    // 找到预览按钮
    const previewButton = page
      .locator('button:has-text("预览"), [data-testid="preview-button"]')
      .first()
    const hasPreviewButton = await previewButton.isVisible().catch(() => false)

    if (hasPreviewButton) {
      console.log('找到预览按钮，点击...')
      await previewButton.click()
      await page.waitForTimeout(3000)
    } else {
      // 尝试点击文件直接预览
      if (fileCount > 0) {
        console.log('点击文件进行预览...')
        await fileItems.first().click()
        await page.waitForTimeout(3000)
      }
    }

    // 检查是否打开了预览页面
    const currentUrl = page.url()
    console.log(`当前 URL: ${currentUrl}`)

    // 如果在新标签页打开了 OnlyOffice
    const pages = context.pages()
    console.log(`打开的页面数: ${pages.length}`)

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i]
      const url = p.url()
      console.log(`页面 ${i}: ${url}`)

      if (url.includes('preview') || url.includes('onlyoffice')) {
        console.log(`切换到预览页面 ${i}`)
        await p.waitForLoadState('networkidle')

        // 检查 OnlyOffice 错误
        const errorElement = p
          .locator('[class*="error"], .asc-window-container, [class*="alert"]')
          .first()
        const hasError = await errorElement.isVisible({ timeout: 5000 }).catch(() => false)

        if (hasError) {
          const errorText = await errorElement.textContent().catch(() => '无法获取错误文本')
          console.log(`OnlyOffice 错误: ${errorText}`)
        }
      }
    }

    // 等待更多时间让错误显示
    await page.waitForTimeout(5000)

    // 打印所有收集的信息
    console.log('\n=== 网络请求日志 ===')
    networkLogs.forEach((log) => console.log(log))

    console.log('\n=== 控制台错误 ===')
    consoleErrors.forEach((err) => console.log(err))

    // 截图
    await page.screenshot({ path: 'test-results/preview-debug.png', fullPage: true })
    console.log('\n截图已保存到 test-results/preview-debug.png')
  })

  test('直接测试预览 API', async ({ page, request }) => {
    test.setTimeout(60000)

    // 获取文件列表
    const filesResponse = await request.get('/api/v1/files?limit=10')
    const filesData = await filesResponse.json()

    console.log('=== 文件列表 ===')
    if (filesData.data?.items) {
      filesData.data.items.forEach((f: any) => {
        console.log(`${f.id} | ${f.fileName} | ${f.mimeType}`)
      })
    } else {
      console.log('无法获取文件列表:', filesData)
    }

    // 找一个 Office 文件测试预览 API
    const officeFile = filesData.data?.items?.find((f: any) =>
      f.fileName?.match(/\.(doc|docx|xlsx|xls|pptx|ppt|wps|et|dps)$/i)
    )

    if (officeFile) {
      console.log(`\n=== 测试预览 API: ${officeFile.fileName} ===`)

      const previewResponse = await request.get(`/api/v1/files/preview?fileId=${officeFile.id}`)
      const previewData = await previewResponse.json()
      console.log('预览 API 响应:', JSON.stringify(previewData, null, 2))

      if (previewData.data?.previewUrl) {
        console.log(`\n预览 URL: ${previewData.data.previewUrl}`)

        // 访问预览页面
        await page.goto(previewData.data.previewUrl)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(5000)

        // 检查错误
        const pageContent = await page.content()
        const hasError =
          pageContent.includes('错误') ||
          pageContent.includes('error') ||
          pageContent.includes('Error')
        console.log(`页面包含错误: ${hasError}`)

        await page.screenshot({ path: 'test-results/preview-page.png', fullPage: true })
      }
    }
  })
})
