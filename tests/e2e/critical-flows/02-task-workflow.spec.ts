/**
 * E2E-02: 任务完整流程
 *
 * 端到端测试核心流程
 * 创建任务 → 分配 → 进度更新 → 完成 → 验收
 *
 * 测试场景:
 * 1. 创建新任务
 * 2. 分配任务给成员
 * 3. 更新任务进度
 * 4. 标记任务完成
 * 5. 任务验收
 * 6. 任务状态流转
 * 7. 子任务管理
 * 8. 任务依赖验证
 *
 * Phase 3 E2E 测试
 */

import { test, expect } from '@playwright/test'

test.describe('E2E-02: Complete Task Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[name="email"]', 'test-admin@example.com')
    await page.fill('[name="password"]', 'AdminPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/dashboard|\/projects/)
  })

  test('should create new task', async ({ page }) => {
    const taskTitle = `E2E Task ${Date.now()}`

    // Navigate to tasks
    await page.goto('/tasks')
    await page.click('text=New Task, text=创建任务')

    // Fill task form
    await page.fill('[name="title"]', taskTitle)
    await page.fill('[name="description"]', 'E2E task creation test')
    await page.selectOption('[name="priority"]', 'MEDIUM')

    // Submit
    await page.click('button[type="submit"]')

    // Verify task created
    await expect(page.locator('h1')).toContainText(taskTitle)
  })

  test('should assign task to team member', async ({ page }) => {
    // Create task first
    await page.goto('/tasks/new')
    await page.fill('[name="title"]', `Assign Task ${Date.now()}`)
    await page.fill('[name="description"]', 'Task assignment test')
    await page.click('button[type="submit"]')

    // Assign task
    await page.click('text=Assign, text=分配')
    await page.click('[data-testid="assign-member"]')
    await page.click('text=Test User')
    await page.click('button:has-text("Confirm")')

    // Verify assignment
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should update task progress', async ({ page }) => {
    // Navigate to existing task
    await page.goto('/tasks')
    await page.click('text=Task')

    // Update progress
    await page.click('text=Progress, text=进度')
    await page.fill('[name="progress"]', '50')
    await page.click('button:has-text("Update")')

    // Verify progress updated
    await expect(page.locator('text=50%')).toBeVisible()
  })

  test('should mark task as completed', async ({ page }) => {
    // Navigate to task
    await page.goto('/tasks')
    await page.click('text=Task')

    // Mark complete
    await page.click('button:has-text("Complete"), button:has-text("完成")')
    await page.click('button:has-text("Confirm")')

    // Verify status
    await expect(page.locator('text=COMPLETED, text=已完成')).toBeVisible()
  })

  test('should accept completed task', async ({ page }) => {
    // Navigate to completed task
    await page.goto('/tasks?status=COMPLETED')
    await page.click('text=Task')

    // Accept task
    await page.click('text=Accept, text=验收')
    await page.fill('[name="acceptanceComment"]', 'Task accepted successfully')
    await page.click('button:has-text("Accept")')

    // Verify acceptance
    await expect(page.locator('text=ACCEPTED, text=已验收')).toBeVisible()
  })

  test('should handle task status transitions', async ({ page }) => {
    // Create task
    await page.goto('/tasks/new')
    await page.fill('[name="title"]', `Status Flow ${Date.now()}`)
    await page.click('button[type="submit"]')

    // TODO → IN_PROGRESS
    await page.click('button:has-text("Start"), button:has-text("开始")')
    await expect(page.locator('text=IN_PROGRESS')).toBeVisible()

    // IN_PROGRESS → COMPLETED
    await page.click('button:has-text("Complete")')
    await expect(page.locator('text=COMPLETED')).toBeVisible()
  })

  test('should create and manage subtasks', async ({ page }) => {
    // Navigate to task
    await page.goto('/tasks')
    await page.click('text=Task')

    // Add subtask
    await page.click('text=Add Subtask, text=添加子任务')
    await page.fill('[name="subtaskTitle"]', 'Subtask 1')
    await page.click('button:has-text("Add")')

    // Verify subtask created
    await expect(page.locator('text=Subtask 1')).toBeVisible()

    // Complete subtask
    await page.click('[data-testid="complete-subtask"]')
    await expect(page.locator('text=50%')).toBeVisible()
  })

  test('should verify task dependencies', async ({ page }) => {
    // Create first task
    await page.goto('/tasks/new')
    await page.fill('[name="title"]', 'Dependency Task 1')
    await page.click('button[type="submit"]')

    // Create second task with dependency
    await page.goto('/tasks/new')
    await page.fill('[name="title"]', 'Dependency Task 2')
    await page.click('text=Add Dependency, text=添加依赖')
    await page.click('text=Dependency Task 1')
    await page.click('button[type="submit"]')

    // Verify dependency
    await expect(page.locator('text=Dependency Task 1')).toBeVisible()
    await expect(page.locator('text=blocks, text=阻塞')).toBeVisible()
  })
})
