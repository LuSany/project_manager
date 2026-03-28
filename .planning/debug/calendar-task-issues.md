---
status: investigating
trigger: "日历视图任务显示问题：创建的任务不显示，今日日期无高亮，优先级无颜色区分"
created: 2026-03-28T00:00:00.000Z
updated: 2026-03-28T00:00:00.000Z
---

## Current Focus

gathering initial evidence - reading relevant files to understand the issue

## Symptoms

expected:
1. 双击日期后，弹出创建任务对话框，输入标题后创建任务，任务应显示在日历和其他视图中
2. 当日日期应有明显高亮边框，不同优先级任务应有不同颜色标识

actual:
1. 创建任务后任务不显示在任何视图中
2. 当日日期没有高亮，任务优先级没有颜色区分

errors: 无明显错误提示

reproduction:
1. 进入项目任务页 -> 切换到日历视图 -> 双击任意日期 -> 输入任务标题 -> 点击创建
2. 观察日历视图中的当日日期单元格，以及任务卡片

started: 在简化 TaskList 组件修复视图切换卡死问题后出现

## Eliminated

## Evidence

- timestamp: 2026-03-28T00:10:00.000Z
  checked: API route /api/v1/tasks
  found:
    - POST 接收 `dueDate: z.string().optional()`，使用 `new Date(validatedData.dueDate)` 转换
    - GET 返回任务时，dueDate 是 Date 对象序列化后的 ISO 字符串
    - 前端 handleQuickCreate 发送 `format(dueDate, 'yyyy-MM-dd')` 格式 (如 "2026-03-28")
  implication: API Schema 已修复，日期格式应该兼容

- timestamp: 2026-03-28T00:10:00.000Z
  checked: CalendarDayCell.tsx
  found:
    - 今日高亮使用 inline style: `boxShadow: '0 0 0 2px hsl(var(--primary))'`
    - 使用 `isToday(date)` 判断是否今日
    - 使用 `isSameMonth(date, currentMonth)` 判断是否当前月
  implication: 今日高亮逻辑正确，需要验证是否样式被覆盖或数据未传入

- timestamp: 2026-03-28T00:10:00.000Z
  checked: CalendarTaskCard.tsx
  found:
    - 优先级颜色使用内联样式映射：HIGH=#ef4444, MEDIUM=#eab308, LOW=#3b82f6, CRITICAL=#b91c1c
    - 使用 `useDraggable` 使卡片可拖拽
    - 任务卡片显示优先级颜色条
  implication: 优先级颜色逻辑正确，需要验证 task.priority 值是否正确传入

- timestamp: 2026-03-28T00:10:00.000Z
  checked: page.tsx handleQuickCreate
  found:
    - 创建成功后调用 `fetchTasks()` 刷新列表
    - 传递给 TaskCalendar 的 tasks 是从 API 获取的完整任务列表
  implication: 创建逻辑正确，问题可能在数据刷新或过滤

- timestamp: 2026-03-28T00:15:00.000Z
  checked: 时区问题测试
  found:
    - 前端发送 "2026-03-28" (日期字符串无时区信息)
    - 后端 new Date("2026-03-28") 在上海时区解释为 2026-03-28T00:00:00+08:00
    - 存储到数据库时转换为 UTC: 2026-03-27T16:00:00.000Z
    - 前端收到 ISO 字符串后，new Date() 在本地时区解释
    - 在 UTC-8 时区，本地时间是 2026-03-27 09:00:00，format 后变成 "2026-03-27"
    - 日历的 dateKey 是 "2026-03-27"，但期望显示的是 "2026-03-28"
  implication: **根因确认** - 时区转换导致日期偏移，任务被分组到错误的日期

- timestamp: 2026-03-28T00:20:00.000Z
  checked: TaskCalendar.tsx tasksByDate 计算
  found: |
    const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd')

    问题：task.dueDate 是 ISO 字符串 (如 "2026-03-27T16:00:00.000Z")
    new Date() 在本地时区解释，导致日期偏移
  implication: 需要使用时区中立的解析方式

## Resolution

root_cause: 时区问题导致日历视图日期匹配失败

**问题机制:**
1. 前端发送日期字符串 "2026-03-28" (无时区信息)
2. 后端 new Date("2026-03-28") 在服务器时区解释为 2026-03-28T00:00:00+08:00
3. 存储到数据库时转换为 UTC: 2026-03-27T16:00:00.000Z
4. 前端收到 ISO 字符串后，new Date() 在本地时区解释
5. 在 UTC-8 时区，本地时间是 2026-03-27 09:00:00，format 后变成 "2026-03-27"
6. 日历的 dateKey 是 "2026-03-27"，但用户期望看到的是 "2026-03-28"

**今日高亮问题:**
- CalendarDayCell 使用 `isToday(date)` 判断，但 date 是组件接收的 Date 对象
- 需要验证传入的 date 是否正确

**优先级颜色问题:**
- CalendarTaskCard 使用内联样式，逻辑正确
- 需要验证 task.priority 值是否正确

fix:
1. 修复 TaskCalendar.tsx 的 tasksByDate 计算，使用 parseISO 或手动解析日期字符串
2. 保持日期计算的时区中立性

verification:
- 任务应正确显示在日历上
- 今日日期应有高亮
- 优先级颜色应正确显示

files_changed:
  - src/components/tasks/calendar/TaskCalendar.tsx
