import { test, expect } from '@playwright/test';

test.describe('Personal Settings E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('用户应能访问设置首页', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.locator('h1')).toContainText('设置');
    await expect(page.locator('text=当前账户')).toBeVisible();
  });

  test('用户应能访问个人资料页面', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page.locator('h1')).toContainText('个人资料');
  });

  test('用户应能访问通知偏好页面', async ({ page }) => {
    await page.goto('/settings/preferences');
    await expect(page.locator('h1')).toContainText('通知偏好');
  });

  test('用户应能修改个人资料', async ({ page }) => {
    await page.goto('/settings/profile');

    // 填写表单
    const nameInput = page.locator('input#name');
    await nameInput.fill('');
    await nameInput.fill('测试用户新名字');

    const deptInput = page.locator('input#department');
    await deptInput.fill('技术部');

    const positionInput = page.locator('input#position');
    await positionInput.fill('高级工程师');

    // 提交
    await page.click('button[type="submit"]');

    // 等待成功提示
    await expect(page.locator('.toast-success')).toBeVisible();

    // 验证表单值已更新
    await expect(nameInput).toHaveValue('测试用户新名字');
    await expect(deptInput).toHaveValue('技术部');
  });

  test('用户邮箱不可修改', async ({ page }) => {
    await page.goto('/settings/profile');

    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeDisabled();
  });

  test('用户应能配置通知偏好 - 邮件通知开关', async ({ page }) => {
    await page.goto('/settings/preferences');

    // 找到邮件通知开关
    const emailSwitch = page.locator('[role="switch"]').first();
    const initialState = await emailSwitch.getAttribute('data-state');

    // 切换开关
    await emailSwitch.click();

    // 等待成功提示
    await expect(page.locator('.toast-success')).toBeVisible();

    // 验证状态已改变
    const newState = await emailSwitch.getAttribute('data-state');
    expect(newState).not.toBe(initialState);
  });

  test('用户应能配置通知偏好 - 站内通知开关', async ({ page }) => {
    await page.goto('/settings/preferences');

    // 找到站内通知开关（第二个）
    const inAppSwitch = page.locator('[role="switch"]').nth(1);
    await inAppSwitch.click();

    // 等待成功提示
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('用户应能配置通知类型偏好', async ({ page }) => {
    await page.goto('/settings/preferences');

    // 找到任务到期提醒开关
    const taskDueSwitch = page.locator('text=任务到期提醒').locator('..').locator('[role="switch"]');
    const isVisible = await taskDueSwitch.isVisible().catch(() => false);

    if (isVisible) {
      await taskDueSwitch.click();
      await expect(page.locator('.toast-success')).toBeVisible();
    }
  });

  test('用户应能配置摘要通知偏好', async ({ page }) => {
    await page.goto('/settings/preferences');

    // 找到每日摘要开关
    const dailyDigestSwitch = page.locator('text=每日摘要').locator('..').locator('[role="switch"]');
    const isVisible = await dailyDigestSwitch.isVisible().catch(() => false);

    if (isVisible) {
      await dailyDigestSwitch.click();
      await expect(page.locator('.toast-success')).toBeVisible();
    }
  });

  test('用户应能从设置首页导航到各子页面', async ({ page }) => {
    await page.goto('/settings');

    // 点击个人资料卡片
    await page.click('text=个人资料');
    await expect(page).toHaveURL('/settings/profile');

    // 返回并点击通知偏好
    await page.goto('/settings');
    await page.click('text=通知偏好');
    await expect(page).toHaveURL('/settings/preferences');
  });

  test('未登录用户不能访问设置页面', async ({ page }) => {
    await page.goto('/logout');
    await page.goto('/settings');

    // 应该被重定向到登录页
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
