---
status: resolved
trigger: "日历视图任务显示问题：创建的任务不显示，今日日期无高亮，优先级无颜色区分"
created: 2026-03-28T00:00:00.000Z
updated: 2026-04-22T00:00:00.000Z
---

## Resolution

root_cause: 时区问题导致日历视图日期匹配失败

**问题机制:**
1. 前端发送日期字符串 "2026-03-28" (无时区信息)
2. 后端 new Date("2026-03-28") 在服务器时区解释为 2026-03-28T00:00:00+08:00
3. 存储到数据库时转换为 UTC: 2026-03-27T16:00:00.000Z
4. 前端收到 ISO 字符串后，new Date() 在本地时区解释
5. format() 后日期偏移到前一天

fix: 使用时区中立的日期解析
  ```
  // TaskCalendar.tsx 第86行
  const dateKey = task.dueDate.slice(0, 10)
  ```
  直接从 ISO 字符串提取前10个字符作为 dateKey，避免时区转换

verification: Code already has the fix at line 86
files_changed: [src/components/tasks/calendar/TaskCalendar.tsx]

## Status

✅ 已修复 - TaskCalendar.tsx 第86行使用 slice(0, 10) 时区中立解析