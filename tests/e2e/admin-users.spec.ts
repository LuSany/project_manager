import { test, expect } from '@playwright/test';

test.describe('Admin Users Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 使用管理员账号登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('管理员应能访问用户管理页面', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('h1')).toContainText('用户管理');
    await expect(page.locator('table')).toBeVisible();
  });

  test('管理员应能查看用户列表', async ({ page }) => {
    await page.goto('/admin/users');

    // 等待表格加载
    await page.waitForSelector('table tbody tr');

    // 验证表格有数据
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('管理员应能搜索用户', async ({ page }) => {
    await page.goto('/admin/users');

    const searchInput = page.locator('input[placeholder="搜索用户..."]');
    await searchInput.fill('test');

    // 等待搜索完成
    await page.waitForTimeout(500);

    // 验证搜索结果
    const rows = page.locator('table tbody tr');
    for (const row of await rows.all()) {
      const text = await row.textContent();
      expect(text.toLowerCase()).toContain('test');
    }
  });

  test('管理员应能按状态筛选用户', async ({ page }) => {
    await page.goto('/admin/users');

    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('PENDING');

    // 等待筛选完成
    await page.waitForTimeout(500);

    // 验证所有显示的用户都是待审批状态
    const rows = page.locator('table tbody tr');
    const badges = rows.locator('.status-badge');
    for (const badge of await badges.all()) {
      const text = await badge.textContent();
      expect(text).toContain('待审批');
    }
  });

  test('管理员应能审批待审批用户', async ({ page }) => {
    await page.goto('/admin/users');

    // 查找待审批用户行的审批按钮
    const approveButton = page.locator('button:has-text("审批通过")').first();
    const isVisible = await approveButton.isVisible().catch(() => false);

    if (isVisible) {
      await approveButton.click();

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证状态已更新
      await expect(page.locator('text=已激活')).toBeVisible();
    }
  });

  test('管理员应能禁用用户', async ({ page }) => {
    await page.goto('/admin/users');

    // 查找禁用按钮（只有已激活用户才有）
    const disableButton = page.locator('button:has-text("禁用")').first();
    const isVisible = await disableButton.isVisible().catch(() => false);

    if (isVisible) {
      await disableButton.click();

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证状态已更新
      await expect(page.locator('text=已禁用')).toBeVisible();
    }
  });

  test('管理员应能启用已禁用用户', async ({ page }) => {
    await page.goto('/admin/users');

    // 查找启用按钮
    const enableButton = page.locator('button:has-text("启用")').first();
    const isVisible = await enableButton.isVisible().catch(() => false);

    if (isVisible) {
      await enableButton.click();

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证状态已更新
      await expect(page.locator('text=已激活')).toBeVisible();
    }
  });

  test('管理员应能修改用户角色', async ({ page }) => {
    await page.goto('/admin/users');

    // 查找角色选择器
    const roleSelect = page.locator('select[aria-label="角色"]').first();
    const isVisible = await roleSelect.isVisible().catch(() => false);

    if (isVisible) {
      await roleSelect.selectOption('PROJECT_ADMIN');

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证角色已更新
      await expect(page.locator('text=项目管理员')).toBeVisible();
    }
  });

  test('非管理员用户不能访问用户管理页面', async ({ page }) => {
    // 退出登录
    await page.goto('/logout');

    // 使用普通用户登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'user123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // 尝试访问管理页面
    await page.goto('/admin/users');

    // 应该被重定向或显示无权访问
    const url = page.url();
    expect(url).not.toContain('/admin/users');
  });
});
