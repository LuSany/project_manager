import { test, expect } from "@playwright/test";

// 测试用户注册流程
test.describe("用户注册", () => {
  test("应该成功注册新用户", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.fill('input[name="name"]', "测试用户");
    await page.click('button[type="submit"]');

    // 应该显示成功消息或重定向
    await expect(page).toHaveURL(/\/login.*/);
  });

  test("应该拒绝重复的邮箱", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");
    await page.fill('input[name="name"]', "重复用户");
    await page.click('button[type="submit"]');

    // 应该显示错误消息
    const errorMessage = page.getByText("邮箱已存在");
    await expect(errorMessage).toBeVisible();
  });
});

// 测试用户登录流程
test.describe("用户登录", () => {
  test("应该成功登录有效凭据", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');

    // 应该重定向到工作台
    await expect(page).toHaveURL(/\/dashboard.*/);
  });

  test("应该拒绝无效凭据", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // 应该显示错误消息
    const errorMessage = page.getByText("邮箱或密码错误");
    await expect(errorMessage).toBeVisible();
  });
});
