---
status: diagnosed
phase: 09-shen-pei-e-yu-tong-ji
source: [09-00-SUMMARY.md, 09-01-SUMMARY.md, 09-02-SUMMARY.md, 09-03-SUMMARY.md, 09-04-SUMMARY.md, 09-05-SUMMARY.md, 09-06-SUMMARY.md]
started: 2026-04-10T22:30:00+08:00
updated: 2026-04-10T23:15:00+08:00
---

## Current Test

[testing complete - all tests evaluated]

## Current Test

number: 10
name: 配额子项设置
expected: |
  为项目配额添加子配额（按设备类型分配），如GPU设备30小时、服务器设备50小时。子配额总和不超过总配额时成功保存。
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server. Clear ephemeral state. Start application from scratch. Server boots without errors, Prisma migrations complete, and homepage loads showing the dashboard.
result: pass

### 2. 审批配置管理
expected: 在管理后台中，可以为特定设备类型配置审批人。点击保存后，审批配置成功存储，刷新页面后配置仍然存在。
result: issue
reported: "无法为特定的设备类型配置审批人"
severity: major

### 3. 预定触发审批流程
expected: 预定一台需要审批的设备后，预订状态显示为"待审批"(PENDING_APPROVAL)，审批人收到审批请求通知。
result: issue
reported: "1. 机时预订日期显示有问题，只显示了4月第一周的日期，无法调整日期；2. 不支持手动创建机时预订自由选择时间；3. 预订时间冲突无提醒；4. 设备管理页面具体设备操作功能不可用"
severity: blocker

### 4. 审批操作 - 通过
expected: 审批人在审批管理页面点击"通过"按钮，预订状态变更为"已预定"(RESERVED)，申请人收到审批通过通知。
result: blocked
blocked_by: approval-functionality
reason: "审批功能不可用"

### 5. 审批操作 - 驳回
expected: 审批人在审批管理页面点击"驳回"按钮并填写驳回理由，预订状态变更为"已取消"(CANCELLED)，申请人收到驳回通知。
result: blocked
blocked_by: approval-functionality
reason: "审批功能不可用"

### 6. 审批操作 - 转交
expected: 审批人在审批管理页面点击"转交"按钮选择其他审批人，审批记录更新，新的审批人收到审批请求通知。
result: blocked
blocked_by: approval-functionality
reason: "审批功能不可用"

### 7. 审批管理页面导航
expected: 侧边栏显示"审批管理"入口，点击后跳转到 /approvals 页面，页面展示待审批/已通过/已拒绝三个 Tab。
result: issue
reported: "审批管理页面可以访问，但无法看到需要审批的单据"
severity: major

### 8. 审批管理页面 Tab 切换
expected: 在审批管理页面，点击"已通过"Tab，表格只显示已通过的审批记录；点击"已拒绝"Tab，表格只显示已拒绝的记录。
result: blocked
blocked_by: approval-data
reason: "无法看到审批单据，无法测试Tab切换"

### 9. 配额设置
expected: 在管理后台为项目设置机时配额（如100小时），保存后配额成功存储，项目配额页面显示设置值。
result: issue
reported: "配额设置功能不可用"
severity: major

### 10. 配额子项设置
expected: 为项目配额添加子配额（按设备类型分配），如GPU设备30小时、服务器设备50小时。子配额总和不超过总配额时成功保存。
result: issue
reported: "配额子项设置功能不可用"
severity: major

## Current Test

number: 14
name: 设备统计页面导航
expected: |
  侧边栏显示"设备统计"入口，点击后跳转到 /equipment/stats 页面。
awaiting: user response

### 11. 配额预警 - 50%
expected: 项目使用配额达到50%时，项目负责人和成员收到50%预警通知（站内通知）。
result: blocked
blocked_by: quota-setup
reason: "配额设置功能不可用，无法测试预警"

### 12. 配额预警 - 80%
expected: 项目使用配额达到80%时，项目负责人和成员收到80%警告通知。
result: blocked
blocked_by: quota-setup
reason: "配额设置功能不可用，无法测试预警"

### 13. 配额预警 - 100%
expected: 项目使用配额达到100%时，项目负责人和成员收到超限警告通知。
result: blocked
blocked_by: quota-setup
reason: "配额设置功能不可用，无法测试预警"

### 14. 设备统计页面导航
expected: 侧边栏显示"设备统计"入口，点击后跳转到 /equipment/stats 页面，统计图表正确区分不同设备类型。
result: issue
reported: "项目机时统计和设备使用率统计未区分不同设备类型"
severity: major

### 20. Excel 导出
expected: 点击"导出 Excel"按钮，浏览器下载 .xlsx 文件。打开文件包含正确的统计数据，表头为中文，包含所有机时使用数据。
result: issue
reported: "导出的统计数据内容较少，不完整，需要包含所有的机时使用数据"
severity: major

### 21. 预定成功提示（无需审批）
expected: 预定一台不需要审批的设备后，显示"预定成功"提示，预订状态为"已预定"。
result: blocked
blocked_by: approval-config
reason: "不支持选择不需要审批的设备，当前设备都不需要审批配置"

### 22. 预定等待审批提示
expected: 预定一台需要审批的设备后，显示"预定已提交，等待审批"提示，预订状态为"待审批"。
result: blocked
blocked_by: approval-functionality
reason: "不支持预定设备审批操作"

## Summary

total: 22
passed: 5
issues: 6
pending: 0
blocked: 11
skipped: 0

### 19. 统计日期筛选
expected: 在设备统计页面选择月份或自定义日期范围，图表和表格数据更新为对应时间段的数据。
result: pass

### 18. 使用记录表格
expected: 在"使用记录"Tab中，显示分页表格，包含设备名称、项目、用户、开始时间、结束时间、时长等列。支持按列排序。
result: pass

### 17. 设备使用率图表
expected: 在"设备使用率"Tab中，显示折线图，展示设备使用率趋势。图表包含50%和80%参考线，鼠标悬停显示具体数值和日期。
result: pass

### 16. 项目机时图表
expected: 在"项目机时"Tab中，显示横向条形图，展示各项目使用的机时数。图表按使用量降序排列，鼠标悬停显示具体数值。
result: pass

### 15. 设备统计概览
expected: 设备统计页面顶部显示4个统计卡片：总设备数、月度机时、平均使用率、预定数。数值正确反映当月数据。
result: pass

### 16. 项目机时图表
expected: 在"项目机时"Tab中，显示横向条形图，展示各项目使用的机时数。图表按使用量降序排列，鼠标悬停显示具体数值。
result: [pending]

### 17. 设备使用率图表
expected: 在"设备使用率"Tab中，显示折线图，展示设备使用率趋势。图表包含50%和80%参考线，鼠标悬停显示具体数值和日期。
result: [pending]

### 18. 使用记录表格
expected: 在"使用记录"Tab中，显示分页表格，包含设备名称、项目、用户、开始时间、结束时间、时长等列。支持按列排序。
result: [pending]

### 19. 统计日期筛选
expected: 在设备统计页面选择月份或自定义日期范围，图表和表格数据更新为对应时间段的数据。
result: [pending]

### 20. Excel 导出
expected: 点击"导出 Excel"按钮，浏览器下载 .xlsx 文件。打开文件包含正确的统计数据，表头为中文。
result: [pending]

### 21. 预定成功提示（无需审批）
expected: 预定一台不需要审批的设备后，显示"预定成功"提示，预订状态为"已预定"。
result: [pending]

### 22. 预定等待审批提示
expected: 预定一台需要审批的设备后，显示"预定已提交，等待审批"提示，预订状态为"待审批"。
result: [pending]

## Summary

total: 22
passed: 1
issues: 3
pending: 14
blocked: 4
skipped: 0

## Gaps

### 审批相关

- truth: "在管理后台中，可以为特定设备类型配置审批人。点击保存后，审批配置成功存储，刷新页面后配置仍然存在。"
  status: failed
  reason: "User reported: 无法为特定的设备类型配置审批人"
  severity: major
  test: 2
  artifacts: []
  missing: [审批配置前端页面或管理后台入口]

- truth: "预定一台需要审批的设备后，预订状态显示为待审批(PENDING_APPROVAL)，审批人收到审批请求通知。"
  status: failed
  reason: "User reported: 1. 机时预订日期显示有问题，只显示了4月第一周的日期，无法调整日期；2. 不支持手动创建机时预订自由选择时间；3. 预订时间冲突无提醒；4. 设备管理页面具体设备操作功能不可用"
  severity: blocker
  test: 3
  artifacts: []
  missing: [预订日期选择器修复, 预订创建自由时间选择, 冲突检测提醒, 设备操作功能修复]

- truth: "审批管理页面可以访问，并能看到需要审批的单据列表。"
  status: failed
  reason: "User reported: 审批管理页面可以访问，但无法看到需要审批的单据"
  severity: major
  test: 7
  artifacts: []
  missing: [审批单据数据查询或显示逻辑]

### 配额相关

- truth: "在管理后台为项目设置机时配额，保存后配额成功存储。"
  status: failed
  reason: "User reported: 配额设置功能不可用"
  severity: major
  test: 9
  artifacts: []
  missing: [配额设置前端页面或API]

- truth: "为项目配额添加子配额（按设备类型分配），保存成功。"
  status: failed
  reason: "User reported: 配额子项设置功能不可用"
  severity: major
  test: 10
  artifacts: []
  missing: [子配额设置功能]

### 统计相关

- truth: "设备统计页面按设备类型区分统计数据。"
  status: failed
  reason: "User reported: 项目机时统计和设备使用率统计未区分不同设备类型"
  severity: major
  test: 14
  artifacts: []
  missing: [按设备类型分组的统计逻辑]

- truth: "Excel导出包含完整的机时使用数据。"
  status: failed
  reason: "User reported: 导出的统计数据内容较少，不完整，需要包含所有的机时使用数据"
  severity: major
  test: 20
  artifacts: []
  missing: [完整的Excel导出数据字段]