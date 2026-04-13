---
status: diagnosed
phase: 09-shen-pei-e-yu-tong-ji
source: [09-00-SUMMARY.md, 09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-04-SUMMARY.md, 09-05-SUMMARY.md, 09-06-SUMMARY.md, 09-07-SUMMARY.md, 09-08-SUMMARY.md, 09-09-SUMMARY.md]
started: 2026-04-10T22:30:00+08:00
updated: 2026-04-14T00:20:00+08:00
---

## Current Test

[testing complete - 4 architecture-level permission issues found]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Clear ephemeral state. Start application from scratch. Server boots without errors, Prisma migrations complete, and homepage loads showing the dashboard.
result: pass

### 2. 审批配置管理（09-07 Task 1 修复）
expected: |
  侧边栏显示"审批配置"入口，点击跳转到 /admin/approval-configs。
  页面支持：设备类型选择、审批级数设置（1-10）、多级审批人配置、编辑删除现有配置。
  配置保存后刷新仍存在。
result: pass

### 3. 预订日历完整月份（09-07 Task 3 修复）
expected: |
  机时预订日历显示完整的6周月份网格，从周一开始。
  所有当月日期可点击，非当月日期灰色不可交互。
  可自由选择日期和时间槽进行预订。
result: pass

### 4. 预订冲突提示（09-08 增强）
expected: |
  预订时间冲突时，显示完整提示：时间段、已被谁预定、所属项目。
  格式："时间段 MM-dd HH:mm-HH:mm 已被 用户 预定（项目: 项目名）"
  弹窗居中显示。
result: pass

### 5. 审批记录查询（09-07 Task 4 修复）
expected: |
  审批管理页面 /approvals 显示待审批的预订记录。
  审批人能看到自己负责的设备类型的待审批预订。
  PENDING 状态的预订正确显示在待审批列表中。
result: pass
diagnosed: "09-09 修复了 action: { not: 'PENDING' } 过滤条件"

### 6. 配额管理页面（09-07 Task 2）
expected: |
  侧边栏显示"配额管理"入口，点击跳转到 /admin/quotas。
  页面支持：项目选择、总配额设置、周期设置（月度/季度）、子配额配置。
  子配额总和验证不超过总配额。
result: pass

### 7. 配额预警状态显示（09-09 + 09-10 修复）
expected: |
  配额管理页面显示项目使用进度条和预警状态（50%/80%/100%）。
  使用率超过100%时显示红色"超限"徽章，而非"正常"。
result: pass
diagnosed: "09-10 修复 UI 使用 warningLevel 字段而非 warningSent* 标志"

### 8. 设备统计设备类型筛选（09-07 Task 5）
expected: |
  设备统计页面 /equipment/stats 有设备类型下拉选择器。
  选择不同设备类型，图表数据按该类型筛选更新。
  项目机时图表显示设备类型名称。
result: pass

### 9. Excel导出完整性（09-09 Gap 3 修复）
expected: |
  导出的Excel包含多sheet：汇总统计 + 详细记录。
  项目机时：预定数量、平均/最大/最小单次时长、详细记录sheet。
  设备使用率：预定次数、每日趋势sheet。
  使用记录：预定ID用于追溯。
result: pass
diagnosed: "09-09 新增 complete-report type，包含3个sheet"

### 10. 审批转交功能（09-10 修复）
expected: |
  审批人点击"转交"按钮，弹窗显示用户下拉列表。
  选择用户后点击确认，转交成功。
result: pass
diagnosed: "09-10 修复 ApprovalActions.tsx json.data.users → json.data.data"

### 11. 审批流程通过（原测试项）
expected: 审批人点击"通过"，预订状态变为RESERVED，申请人收到通知。
result: blocked
blocked_by: approval-flow
reason: "审批通过功能待验证"

### 12. 审批流程驳回（原测试项）
expected: 审批人点击"驳回"并填写理由，预订状态变为CANCELLED，申请人收到通知。
result: blocked
blocked_by: approval-flow
reason: "审批驳回功能待验证"

### 13. 审批流程转交（原测试项）
expected: 审批人点击"转交"选择其他审批人，新审批人收到通知。
result: blocked
blocked_by: approval-flow
reason: "审批转交功能待验证"

### 14. 配额预警通知（原测试项）
expected: 项目配额达到50%/80%/100%时发送站内通知。
result: blocked
blocked_by: quota-notification
reason: "预警通知功能待验证"

### 15. 设备审批权限控制
expected: |
  只有被配置为审批人的用户才能看到和处理待审批预订。
  非审批人访问 /approvals 页面应显示空列表或无权限提示。
result: issue
reported: "所有用户都可以处理设备审批，都能看到待审批列表"
severity: major
root_cause: "approval-records API 未验证用户是否为审批人，只验证登录状态"

### 16. 设备管理权限控制
expected: |
  只有管理员（ADMIN 角色）可以管理设备（创建、编辑、删除）。
  普通用户不应有设备管理入口。
result: issue
reported: "所有用户都可以做设备管理"
severity: major
root_cause: "device-types API POST/PUT/DELETE 未检查 user.role === 'ADMIN'"

### 17. 设备统计信息访问权限
expected: |
  设备统计页面应只对管理员或审批人可见。
  普通项目成员不应看到设备类型统计信息。
result: issue
reported: "所有用户都能看到设备类型、设备统计信息"
severity: minor
root_cause: "equipment/stats API 无角色验证，仅验证登录状态"

### 18. 项目成员设备预订权限
expected: |
  项目成员可以申请预订设备（需选择所属项目）。
  预订创建成功或进入审批流程。
result: issue
reported: "项目成员无法申请使用设备"
severity: blocker
root_cause: "待调查 - 可能是前端 projectId 选择器或 API projectId 验证问题"

## Summary

total: 18
passed: 11
issues: 4
pending: 0
blocked: 4
skipped: 0

## Gaps

### Gap 1: 审批记录查询 (已修复)
- truth: "审批人能看到自己负责的设备类型的待审批预订"
  status: fixed
  test: 5
  severity: major
  root_cause: "approval-records/route.ts 第96行缺少 PENDING 过滤"
  fix_commit: "7ec5c6c"

### Gap 2: 配额预警状态显示 (已修复)
- truth: "配额管理页面正确显示预警状态（使用率>100%显示红色）"
  status: fixed
  test: 7
  severity: major
  root_cause: "UI 显示 warningSent* 数据库标志而非 API 计算的 warningLevel 字段"
  fix_commit: "6d749b5"

### Gap 3: Excel导出完整性 (已修复)
- truth: "导出包含完整数据（项目机时、设备使用率、使用记录）"
  status: fixed
  test: 9
  severity: major
  root_cause: "缺少完整报告导出类型"
  fix_commit: "7ec5c6c"

### Gap 4: 审批转交功能 (已修复)
- truth: "审批转交弹窗显示用户下拉列表无错误"
  status: fixed
  test: 10
  severity: major
  root_cause: "ApprovalActions.tsx 第50行访问 json.data.users，但 API 返回 json.data.data"
  fix_commit: "6d749b5"

### Gap 5: 审批转交用户范围 (已修复)
- truth: "转交审批只显示当前级别审批人选项"
  status: fixed
  test: 10
  severity: major
  root_cause: "ApprovalActions 从所有用户中选择，但 API 验证必须是当前级别审批人"
  fix_commit: "5f57aae"

### Gap 6: 设备审批权限控制
- truth: "只有审批人能处理设备审批"
  status: failed
  test: 15
  severity: major
  root_cause: "approval-records API 未验证用户是否为审批人"
  scope: architecture
  artifacts:
    - path: "src/app/api/v1/approval-records/route.ts"
      issue: "GET 方法未检查用户是否在审批配置中"

### Gap 7: 设备管理权限控制
- truth: "只有管理员可以管理设备"
  status: failed
  test: 16
  severity: major
  root_cause: "device-types API POST/PUT/DELETE 未检查 ADMIN 角色"
  scope: architecture
  artifacts:
    - path: "src/app/api/v1/device-types/route.ts"
      issue: "POST 方法缺少 user.role === 'ADMIN' 验证"

### Gap 8: 设备统计访问权限
- truth: "设备统计信息只对管理员/审批人可见"
  status: failed
  test: 17
  severity: minor
  root_cause: "equipment/stats API 无角色验证"
  scope: architecture

### Gap 9: 项目成员设备预订
- truth: "项目成员可以申请预订设备"
  status: failed
  test: 18
  severity: blocker
  root_cause: "待调查"
  scope: architecture