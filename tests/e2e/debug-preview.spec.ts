import { test } from '@playwright/test';

test.describe('评审材料预览功能调试', () => {
  test('调试预览 API 调用', async ({ page, context }) => {
    // 设置更长的超时
    test.setTimeout(60000);

    // 监听新标签页请求
    const popupRequests: any[] = [];
    const popupResponses: any[] = [];

    context.on('request', request => {
      if (request.url().includes('/api/v1/files/') || request.url().includes('/files/')) {
        console.log(`[新标签页请求] ${request.method()} ${request.url()}`);
        popupRequests.push({ url: request.url(), method: request.method() });
      }
    });

    context.on('response', async response => {
      if (response.url().includes('/api/v1/files/') || response.url().includes('/files/')) {
        const body = await response.text().catch(() => 'N/A');
        console.log(`[新标签页响应] ${response.status()} ${response.url()}`);
        console.log(`[新标签页响应] Body: ${body.substring(0, 300)}`);
        popupResponses.push({ url: response.url(), status: response.status(), body });
      }
    });

    // 登录 - 使用 3007 端口
    console.log('访问登录页...');
    await page.goto('http://localhost:3007/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('执行登录...');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('登录后 URL:', page.url());

    // 导航到评审详情页
    console.log('导航到评审详情页...');
    await page.goto('http://localhost:3007/projects/cmmhhbk3x000fk9b1fzscpbow/reviews/cmmoz8ny80003k9ghebsi2oqu');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 查找评审材料
    const materialsSection = page.locator('text=评审材料');
    if (await materialsSection.isVisible().catch(() => false)) {
      console.log('找到评审材料区域');

      // 查找预览按钮
      const previewButton = page.locator('button[title="预览文件"]').first();
      if (await previewButton.isVisible().catch(() => false)) {
        console.log('找到预览按钮，准备点击...');

        // 等待新页面打开
        const popupPromise = context.waitForEvent('page', { timeout: 10000 });

        // 点击预览按钮
        await previewButton.click();

        // 等待新页面
        const popup = await popupPromise.catch(err => {
          console.log('等待新页面超时:', err);
          return null;
        });

        // 等待一段时间
        await page.waitForTimeout(5000);

        console.log('\n=== 新标签页网络请求 ===');
        popupRequests.forEach(req => console.log(`REQ: ${req.method} ${req.url}`));

        console.log('\n=== 新标签页网络响应 ===');
        popupResponses.forEach(res => console.log(`RES: ${res.status} ${res.url}`));

        if (popup) {
          console.log('\n=== 新标签页内容 ===');
          const popupContent = await popup.content().catch(() => '无法获取');
          console.log(popupContent.substring(0, 1000));

          await popup.screenshot({ path: 'debug-preview-popup.png' }).catch(() => {});
          console.log('新标签页截图已保存：debug-preview-popup.png');
        }

        console.log('\n=== 测试完成 ===');
      } else {
        console.log('未找到预览按钮');
      }
    } else {
      console.log('未找到评审材料区域');
    }
  });
});
