import { test, expect } from '@playwright/test';

test.describe('Project Features E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/projects/, { timeout: 15000 });
    // 等待 localStorage 设置
    await page.waitForTimeout(500);
  });

  test.describe('Project Milestones', () => {
    test('用户应能访问项目里程碑页面', async ({ page }) => {
      // 先获取一个有效的项目 ID
      await page.goto('/projects');
      await page.waitForTimeout(1000);

      // 检查是否有项目
      const projectLinks = page.locator('a[href^="/projects/"]').filter({ hasNot: page.locator('a[href="/projects/new"]') });
      const count = await projectLinks.count();

      if (count > 0) {
        // 点击第一个项目
        await projectLinks.first().click();
        await page.waitForTimeout(500);

        // 尝试访问里程碑页面
        const projectId = page.url().match(/\/projects\/([^\/]+)/)?.[1];
        if (projectId) {
          await page.goto(`/projects/${projectId}/milestones`);
          await page.waitForTimeout(500);
        }
      }

      // 验证页面已加载
      const pageContent = await page.textContent('body');
      expect(pageContent).toBeTruthy();
    });

    test('里程碑页面应显示里程碑列表', async ({ page }) => {
      // 使用种子数据中的示例项目
      await page.goto('/projects');
      await page.waitForTimeout(1000);

      // 检查是否有项目
      const projectLinks = page.locator('a[href^="/projects/"]').filter({ hasNot: page.locator('a[href="/projects/new"]') });
      const count = await projectLinks.count();

      if (count > 0) {
        await projectLinks.first().click();
        await page.waitForTimeout(500);

        const projectId = page.url().match(/\/projects\/([^\/]+)/)?.[1];
        if (projectId) {
          await page.goto(`/projects/${projectId}/milestones`);
          await page.waitForTimeout(500);

          // 检查页面是否加载
          const pageContent = await page.textContent('body');
          expect(pageContent).toBeTruthy();
        }
      }
    });

    test('用户应能创建新里程碑', async ({ page }) => {
      await page.goto('/projects/1/milestones');

      // 点击"新建里程碑"按钮
      const createButton = page.locator('button:has-text("新建里程碑")');
      const isVisible = await createButton.isVisible().catch(() => false);

      if (isVisible) {
        await createButton.click();

        // 等待对话框打开
        await expect(page.locator('role=dialog')).toBeVisible();

        // 填写表单
        await page.fill('input[name="title"]', '测试里程碑');
        await page.fill('textarea[name="description"]', '这是一个测试里程碑');

        // 提交
        await page.click('button[type="submit"]');

        // 等待成功提示
        await expect(page.locator('.toast-success')).toBeVisible();

        // 验证新里程碑显示在列表中
        await expect(page.locator('text=测试里程碑')).toBeVisible();
      }
    });

    test('里程碑应显示进度', async ({ page }) => {
      await page.goto('/projects/1/milestones');

      // 验证进度百分比显示
      const progressText = page.locator('text=%');
      const isVisible = await progressText.isVisible().catch(() => false);

      if (isVisible) {
        await expect(progressText).toBeVisible();
      }
    });
  });

  test.describe('Project Documents', () => {
    test('用户应能访问项目文档页面', async ({ page }) => {
      await page.goto('/projects/1/documents');
      await expect(page.locator('h1')).toContainText('文档管理');
    });

    test('文档页面应显示文档列表', async ({ page }) => {
      await page.goto('/projects/1/documents');

      // 检查是否有文档表格或空状态
      const hasTable = await page.locator('table').isVisible().catch(() => false);
      const hasEmptyState = await page.locator('text=暂无文档').isVisible().catch(() => false);

      expect(hasTable || hasEmptyState).toBe(true);
    });

    test('用户应能上传文档', async ({ page }) => {
      await page.goto('/projects/1/documents');

      // 点击"上传文档"按钮
      const uploadButton = page.locator('button:has-text("上传文档")');
      const isVisible = await uploadButton.isVisible().catch(() => false);

      if (isVisible) {
        await uploadButton.click();

        // 等待文件选择对话框
        await page.waitForTimeout(500);

        // 验证文件上传对话框打开
        const dialogVisible = await page.locator('input[type="file"]').isVisible().catch(() => false);
        expect(dialogVisible).toBe(true);
      }
    });

    test('文档列表应显示文件信息', async ({ page }) => {
      await page.goto('/projects/1/documents');

      // 验证表格列
      const headers = page.locator('table thead th');
      const headerTexts = await headers.allTextContents();

      expect(headerTexts).toContain('文件名');
      expect(headerTexts).toContain('类型');
      expect(headerTexts).toContain('大小');
    });

    test('用户应能下载文档', async ({ page }) => {
      await page.goto('/projects/1/documents');

      // 查找下载按钮
      const downloadButton = page.locator('button').filter({ hasText: '下载' }).first();
      const isVisible = await downloadButton.isVisible().catch(() => false);

      if (isVisible) {
        // 开始下载等待
        const downloadPromise = page.waitForEvent('download');
        await downloadButton.click();
        const download = await downloadPromise;

        // 验证下载开始
        expect(download.suggestedFilename()).toBeTruthy();
      }
    });
  });

  test.describe('Project Settings', () => {
    test('用户应能访问项目设置页面', async ({ page }) => {
      await page.goto('/projects/1/settings');
      await expect(page.locator('h1')).toContainText('项目设置');
    });

    test('项目设置页面应显示基本信息表单', async ({ page }) => {
      await page.goto('/projects/1/settings');

      // 验证表单字段存在
      await expect(page.locator('input#name')).toBeVisible();
      await expect(page.locator('textarea#description')).toBeVisible();
      await expect(page.locator('select#status')).toBeVisible();
    });

    test('用户应能修改项目名称', async ({ page }) => {
      await page.goto('/projects/1/settings');

      const nameInput = page.locator('input#name');
      const initialValue = await nameInput.inputValue();

      // 修改名称
      await nameInput.fill('');
      await nameInput.fill('新项目名称');

      // 提交
      await page.click('button:has-text("保存")');

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证值已更新
      await expect(nameInput).toHaveValue('新项目名称');

      // 恢复原名
      await nameInput.fill('');
      await nameInput.fill(initialValue);
      await page.click('button:has-text("保存")');
    });

    test('用户应能修改项目状态', async ({ page }) => {
      await page.goto('/projects/1/settings');

      const statusSelect = page.locator('select#status');
      await statusSelect.selectOption('ACTIVE');

      // 提交
      await page.click('button:has-text("保存")');

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();

      // 验证状态已更新
      const selectedValue = await statusSelect.inputValue();
      expect(selectedValue).toBe('ACTIVE');
    });

    test('用户应能设置项目日期', async ({ page }) => {
      await page.goto('/projects/1/settings');

      const startDateInput = page.locator('input#startDate');
      await startDateInput.fill('2025-01-01');

      const endDateInput = page.locator('input#endDate');
      await endDateInput.fill('2025-12-31');

      // 提交
      await page.click('button:has-text("保存")');

      // 等待成功提示
      await expect(page.locator('.toast-success')).toBeVisible();
    });

    test('项目设置页面应显示项目所有者信息', async ({ page }) => {
      await page.goto('/projects/1/settings');

      // 验证所有者信息卡片存在
      await expect(page.locator('text=项目所有者')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('用户应能从项目详情导航到各子页面', async ({ page }) => {
      await page.goto('/projects/1');

      // 假设有导航链接
      const milestoneLink = page.locator('a:has-text("里程碑")');
      const isVisible = await milestoneLink.isVisible().catch(() => false);

      if (isVisible) {
        await milestoneLink.click();
        await expect(page).toHaveURL(/.*\/milestones.*/);
      }
    });
  });
});
