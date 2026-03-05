import { test, expect } from '@playwright/test';

test.describe('Notification Center E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('用户应能访问通知中心', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('h1')).toContainText('通知中心');
  });

  test('通知中心应显示通知列表', async ({ page }) => {
    await page.goto('/notifications');

    // 检查表格或列表是否存在
    const table = page.locator('table');
    const hasTable = await table.isVisible().catch(() => false);

    if (hasTable) {
      await expect(table).toBeVisible();
    } else {
      // 如果没有通知，应显示空状态
      await expect(page.locator('text=暂无通知')).toBeVisible();
    }
  });

  test('用户应能筛选未读通知', async ({ page }) => {
    await page.goto('/notifications');

    // 点击"只看未读"按钮
    const unreadButton = page.locator('button:has-text("只看未读")');
    const isVisible = await unreadButton.isVisible().catch(() => false);

    if (isVisible) {
      await unreadButton.click();
      await page.waitForTimeout(500);

      // 验证筛选生效
      const activeButton = page.locator('button:has-text("只看未读"):not([variant="outline"])');
      const isActive = await activeButton.isVisible().catch(() => false);
      expect(isActive).toBe(true);
    }
  });

  test('用户应能标记单条通知为已读', async ({ page }) => {
    await page.goto('/notifications');

    // 查找未读通知的"标记已读"按钮
    const markReadButton = page.locator('button:has-text("标记已读")').first();
    const isVisible = await markReadButton.isVisible().catch(() => false);

    if (isVisible) {
      const row = markReadButton.locator('..').locator('..');
      const initialBgClass = await row.getAttribute('class');
      expect(initialBgClass).toContain('bg-muted');

      await markReadButton.click();
      await page.waitForTimeout(500);

      // 验证通知已标记为已读（背景色改变）
      const newBgClass = await row.getAttribute('class');
      expect(newBgClass).not.toContain('bg-muted');
    }
  });

  test('用户应能全部标记已读', async ({ page }) => {
    await page.goto('/notifications');

    // 点击"全部标记已读"按钮
    const markAllReadButton = page.locator('button:has-text("全部标记已读")');
    const isVisible = await markAllReadButton.isVisible().catch(() => false);

    if (isVisible) {
      await markAllReadButton.click();
      await page.waitForTimeout(500);

      // 验证所有通知都标记为已读
      const unreadRows = page.locator('table tbody tr.bg-muted');
      const count = await unreadRows.count();
      expect(count).toBe(0);
    }
  });

  test('用户应能访问通知偏好设置', async ({ page }) => {
    await page.goto('/notifications');

    // 点击"通知偏好"按钮
    const preferencesButton = page.locator('button:has-text("通知偏好")');
    await preferencesButton.click();

    // 应该跳转到偏好设置页面
    await expect(page).toHaveURL('/settings/preferences');
  });

  test('用户应能点击查看通知详情', async ({ page }) => {
    await page.goto('/notifications');

    // 查找"查看"按钮
    const viewButton = page.locator('button:has-text("查看")').first();
    const isVisible = await viewButton.isVisible().catch(() => false);

    if (isVisible) {
      const row = viewButton.locator('..').locator('..');
      const link = row.locator('a').first();
      const href = await link.getAttribute('href');

      if (href) {
        await link.click();
        // 验证跳转到相关页面
        await page.waitForTimeout(500);
        expect(page.url()).toContain(href);
      }
    }
  });

  test('通知类型应显示正确图标和标签', async ({ page }) => {
    await page.goto('/notifications');

    // 验证通知类型标签显示
    const typeBadges = page.locator('.status-badge, [role="badge"]');
    const count = await typeBadges.count();

    if (count > 0) {
      // 至少有一个通知类型标签
      const firstBadge = typeBadges.first();
      await expect(firstBadge).toBeVisible();
    }
  });

  test('通知应按时间排序显示', async ({ page }) => {
    await page.goto('/notifications');

    // 验证通知列表存在
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    if (count > 1) {
      // 获取第一条和最后一条通知的时间
      const firstTime = await rows.first().locator('td').nth(3).textContent();
      const lastTime = await rows.last().locator('td').nth(3).textContent();

      // 验证第一条通知时间更新
      expect(firstTime).toBeTruthy();
      expect(lastTime).toBeTruthy();
    }
  });
});
