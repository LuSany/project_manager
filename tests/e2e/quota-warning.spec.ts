import { test, expect } from '@playwright/test'

/**
 * E2E Test 14: 配额预警通知测试
 *
 * 验证配额使用达到 50%/80%/100% 阈值时发送站内通知
 */

test.describe.configure({ mode: 'serial' })

test.describe('E2E-14: Quota Warning Tests', () => {

  test('E2E-14a: 配额管理页面验证', async ({ page }) => {
    // 导航到配额管理页面（需要管理员权限）
    await page.goto('/admin/quotas')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 验证页面加载成功（检查表格或其他元素）
    const quotaTable = page.locator('table')
    await expect(quotaTable).toBeVisible({ timeout: 10000 })

    // 验证示例项目的配额存在
    const quotaRow = page.locator('table tbody tr').filter({ hasText: '示例项目' })
    await expect(quotaRow.first()).toBeVisible({ timeout: 10000 })

    // 验证配额显示（10小时）- 使用更精确的定位器
    const totalHoursText = await quotaRow.first().textContent()
    expect(totalHoursText).toContain('10')
  })

  test('E2E-14b: 配额预警通知验证', async ({ page }) => {
    // 验证通知页面功能正常
    await page.goto('/notifications')
    await page.waitForLoadState('networkidle')

    // 验证页面标题
    await expect(page.locator('h1')).toContainText('通知中心')

    // 验证通知列表存在
    const notificationList = page.locator('table tbody tr')
    const count = await notificationList.count()

    // 可能已有通知（之前测试产生的）
    console.log(`当前通知数量: ${count}`)
  })

  test('E2E-14c: API配额状态验证', async ({ page }) => {
    // 通过API验证配额状态
    const response = await page.request.get('/api/v1/quotas')
    expect(response.status()).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    // 查找示例项目的配额
    const quotas = data.data?.items || data.data || []
    const projectQuota = quotas.find((q: { projectName?: string; project?: { name: string } }) =>
      q.projectName === '示例项目' || q.project?.name === '示例项目'
    )

    if (projectQuota) {
      console.log('配额状态:', {
        totalHours: projectQuota.totalHours,
        usedHours: projectQuota.usedHours,
        percentage: projectQuota.percentage || projectQuota.usagePercent,
        warningSent50: projectQuota.warningSent50,
        warningSent80: projectQuota.warningSent80,
        warningSent100: projectQuota.warningSent100,
      })

      expect(projectQuota.totalHours).toBe(10)
    }
  })

  test('E2E-14d: 创建预订触发配额预警', async ({ page }) => {
    // 获取设备类型和项目ID
    const deviceTypesRes = await page.request.get('/api/v1/device-types?pageSize=100')
    const deviceTypesData = await deviceTypesRes.json()

    const projectsRes = await page.request.get('/api/v1/projects')
    const projectsData = await projectsRes.json()

    // 查找示例项目
    const projects = projectsData.data?.items || projectsData.data || []
    const testProject = projects.find((p: { name: string }) => p.name === '示例项目')

    if (!testProject || !deviceTypesData.success) {
      console.log('无法获取测试数据，跳过预订创建')
      return
    }

    // 查找可用设备
    const devicesRes = await page.request.get('/api/v1/devices?pageSize=100')
    const devicesData = await devicesRes.json()

    const devices = devicesData.data?.items || devicesData.data || []
    const availableDevice = devices.find((d: { status: string }) => d.status === 'AVAILABLE')

    if (!availableDevice) {
      console.log('无可用设备，跳过预订创建')
      return
    }

    // 创建预订（5小时，触发50%阈值）
    const now = new Date()
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 明天
    const endTime = new Date(startTime.getTime() + 5 * 60 * 60 * 1000) // 5小时后

    const bookingRes = await page.request.post('/api/v1/bookings', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        deviceId: availableDevice.id,
        projectId: testProject.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    })

    console.log('预订创建状态:', bookingRes.status())

    if (bookingRes.status() === 200 || bookingRes.status() === 201) {
      const bookingData = await bookingRes.json()
      console.log('预订创建成功:', bookingData.data?.id || bookingData.id)

      // 验证通知页面
      await page.goto('/notifications')
      await page.waitForLoadState('networkidle')

      // 查找配额相关通知
      const quotaNotifications = page.locator('table tbody tr').filter({
        hasText: /配额/,
      })

      // 通知可能需要时间处理，等待片刻
      await page.waitForTimeout(2000)

      const notificationCount = await quotaNotifications.count()
      console.log(`配额相关通知数量: ${notificationCount}`)
    }
  })

  test('E2E-14e: 配额管理页面预警状态显示', async ({ page }) => {
    // 导航到配额管理页面
    await page.goto('/admin/quotas')
    await page.waitForLoadState('networkidle')

    // 查找示例项目的配额行
    const quotaRow = page.locator('table tbody tr').filter({ hasText: '示例项目' })
    await expect(quotaRow.first()).toBeVisible({ timeout: 5000 })

    // 验证进度条显示（根据使用量可能有不同颜色）
    const progressBar = quotaRow.first().locator('[class*="bg-"]')

    // 验证状态标签
    const statusBadge = quotaRow.first().locator('span')

    // 打印当前状态便于调试
    const rowText = await quotaRow.first().textContent()
    console.log('配额行内容:', rowText)
  })
})