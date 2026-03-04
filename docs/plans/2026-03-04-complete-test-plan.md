# 项目管理系统 - 完整测试计划 v1.0

**文档版本**: v1.0  
**创建日期**: 2026-03-04  
**目标覆盖率**: 92%+  
**测试范围**: 47 个数据模型 + 管理员后台 + 报告生成 + 缓存服务

---

## 一、执行摘要

### 1.1 测试目标

- **覆盖率目标**: 从当前 88% 提升至 **92%+**
- **模型覆盖**: 47 个 Prisma 模型 100% 测试覆盖
- **专项测试**: 管理员后台、报告生成、缓存服务独立测试套件
- **质量目标**: 关键业务模块 100% 覆盖，支撑模块 85%+ 覆盖

### 1.2 测试范围总览

| 测试类别     | 模块数 | 数据模型                                                                    | 测试用例 | 预计工时 |
| ------------ | ------ | --------------------------------------------------------------------------- | -------- | -------- |
| 核心业务模型 | 15     | User, Project, Task, Milestone, Requirement, Issue, Review, Risk + 关联模型 | 150      | 12h      |
| 重要业务模型 | 12     | Requirement 子模型、Review 子模型                                           | 100      | 8h       |
| 支撑服务模型 | 12     | Tag, FileStorage, Notification, Email 等                                    | 80       | 6h       |
| 基础设施模型 | 8      | AI、AuditLog、Webhook、ScheduledJob                                         | 50       | 4h       |
| 管理员后台   | 5      | PreviewService, EmailConfig, AIConfig, AuditLog, ScheduledJob               | 50       | 6h       |
| 报告生成     | 4      | PDF/DOCX 生成、文件下载                                                     | 40       | 5h       |
| 缓存服务     | 1      | AiResponseCache                                                             | 25       | 4h       |
| **总计**     | **57** | **47**                                                                      | **495**  | **45h**  |

### 1.3 测试阶段划分

```
Phase 1: 管理员后台专项测试      (6h)   → Week 1
Phase 2: 报告生成模块测试         (5h)   → Week 1
Phase 3: 缓存服务专项测试         (4h)   → Week 2
Phase 4: 47 数据模型完整覆盖测试  (30h)  → Week 2-4
```

---

## 二、测试优先级分类

### 2.1 P0 - 核心业务模型（15 个）- 100% 覆盖

**业务重要性**: 系统核心，直接影响业务运转

| 序号 | 模型               | 测试重点                   | 优先级 |
| ---- | ------------------ | -------------------------- | ------ |
| 1    | User               | 认证、角色、状态流转       | P0     |
| 2    | Project            | CRUD、成员管理、权限验证   | P0     |
| 3    | Task               | 状态机、依赖关系、进度跟踪 | P0     |
| 4    | Milestone          | 进度计算、任务关联         | P0     |
| 5    | Requirement        | 审核流程、变更历史         | P0     |
| 6    | Issue              | 状态流转、自动关闭         | P0     |
| 7    | Review             | 评审流程、参与者管理       | P0     |
| 8    | Risk               | 风险评估、AI 识别          | P0     |
| 9    | TaskAssignee       | 任务分配、多对多关系       | P0     |
| 10   | TaskWatcher        | 关注者通知                 | P0     |
| 11   | SubTask            | 子任务层级、完成度计算     | P0     |
| 12   | TaskTag            | 标签关联、批量操作         | P0     |
| 13   | TaskDependency     | 依赖检查、循环依赖检测     | P0     |
| 14   | ProjectMember      | 成员角色、权限继承         | P0     |
| 15   | PasswordResetToken | Token 生成、有效期验证     | P0     |

### 2.2 P1 - 重要业务模型（12 个）- 95% 覆盖

**业务重要性**: 支撑核心业务流程

| 序号 | 模型                  | 测试重点             | 优先级 |
| ---- | --------------------- | -------------------- | ------ |
| 1    | Proposal              | 方案评估、审核流程   | P1     |
| 2    | RequirementImpact     | 波及分析、影响范围   | P1     |
| 3    | RequirementAcceptance | 验收流程、结果记录   | P1     |
| 4    | RequirementDiscussion | 讨论关联任务         | P1     |
| 5    | RequirementHistory    | 变更记录、追溯       | P1     |
| 6    | ReviewMaterial        | 材料上传、版本管理   | P1     |
| 7    | ReviewParticipant     | 参与者角色、评审权限 | P1     |
| 8    | ReviewItem            | 评审项、完成度       | P1     |
| 9    | ReviewCriterion       | 评分标准、权重计算   | P1     |
| 10   | ReviewTemplate        | 模板管理、导入导出   | P1     |
| 11   | ReviewTemplateItem    | 模板项配置           | P1     |
| 12   | ReviewTypeConfig      | 评审类型、系统预设   | P1     |

### 2.3 P2 - 支撑服务模型（12 个）- 90% 覆盖

**业务重要性**: 提供系统支撑能力

| 序号 | 模型                   | 测试重点           | 优先级 |
| ---- | ---------------------- | ------------------ | ------ |
| 1    | Tag                    | 标签管理、颜色配置 | P2     |
| 2    | TaskTemplate           | 模板导入、数据解析 | P2     |
| 3    | FileStorage            | 文件上传、类型验证 | P2     |
| 4    | PreviewServiceConfig   | 服务配置、路由策略 | P2     |
| 5    | Notification           | 通知生成、读取状态 | P2     |
| 6    | NotificationPreference | 偏好设置、渠道配置 | P2     |
| 7    | NotificationIgnore     | 忽略设置、项目级别 | P2     |
| 8    | EmailConfig            | 配置管理、连接测试 | P2     |
| 9    | EmailLog               | 发送记录、状态追踪 | P2     |
| 10   | EmailTemplate          | 模板变量、渲染测试 | P2     |
| 11   | RiskTask               | 风险 - 任务关联    | P2     |
| 12   | Issue (扩展)           | 需求关联、优先级   | P2     |

### 2.4 P3 - 基础设施模型（8 个）- 85% 覆盖

**业务重要性**: 系统基础设施

| 序号 | 模型             | 测试重点                | 优先级 |
| ---- | ---------------- | ----------------------- | ------ |
| 1    | AIConfig         | Provider 配置、密钥管理 | P3     |
| 2    | AILog            | 请求日志、耗时记录      | P3     |
| 3    | AiResponseCache  | 缓存命中、TTL 失效      | P3     |
| 4    | AuditLog         | 审计记录、查询过滤      | P3     |
| 5    | Webhook          | Webhook 配置、事件订阅  | P3     |
| 6    | WebhookDelivery  | 投递记录、重试机制      | P3     |
| 7    | ScheduledJob     | Cron 调度、状态管理     | P3     |
| 8    | ReviewAiAnalysis | AI 分析结果存储         | P3     |

---

## 三、管理员后台测试计划（独立套件）

### 3.1 测试文件结构

```
tests/admin/
├── setup.ts                       # 管理员测试配置
├── preview-services.test.ts       # 预览服务配置测试
├── email-management.test.ts       # 邮件配置/模板/日志测试
├── ai-management.test.ts          # AI 配置/日志/缓存测试
├── audit-logs.test.ts             # 审计日志查询测试
└── scheduled-jobs.test.ts         # 定时任务管理测试
```

### 3.2 测试场景详情

#### 3.2.1 预览服务配置测试 (preview-services.test.ts)

**测试用例** (10 个):

| ID    | 测试场景             | 测试类型 | 验证点                  |
| ----- | -------------------- | -------- | ----------------------- |
| PS-01 | 创建 OnlyOffice 配置 | 单元     | 配置保存、endpoint 验证 |
| PS-02 | 创建 KKFileView 配置 | 单元     | 配置保存、endpoint 验证 |
| PS-03 | 启用/禁用服务        | 集成     | 状态更新、路由切换      |
| PS-04 | 服务优先级配置       | 集成     | 路由策略生效            |
| PS-05 | 配置有效性检查       | 单元     | endpoint 连通性测试     |
| PS-06 | 服务健康检查         | 集成     | 健康检查 API            |
| PS-07 | 配置列表查询         | 单元     | 分页、过滤              |
| PS-08 | 配置更新             | 集成     | 热更新验证              |
| PS-09 | 配置删除             | 单元     | 级联处理                |
| PS-10 | 并发配置冲突         | 并发     | 配置锁机制              |

#### 3.2.2 邮件管理测试 (email-management.test.ts)

**测试用例** (15 个):

| ID    | 测试场景          | 测试类型 | 验证点             |
| ----- | ----------------- | -------- | ------------------ |
| EM-01 | 创建 SMTP 配置    | 单元     | 配置验证、连接测试 |
| EM-02 | 创建公司邮箱配置  | 单元     | 配置验证           |
| EM-03 | 配置激活/默认设置 | 集成     | 默认配置唯一性     |
| EM-04 | 邮件发送测试      | 集成     | 真实发送验证       |
| EM-05 | 邮件模板创建      | 单元     | 模板变量验证       |
| EM-06 | 模板变量替换      | 单元     | 渲染正确性         |
| EM-07 | 邮件日志记录      | 集成     | 状态追踪完整性     |
| EM-08 | 邮件发送失败处理  | 集成     | 错误记录、重试     |
| EM-09 | 批量邮件发送      | 性能     | 并发限制、队列     |
| EM-10 | 配置切换          | 集成     | 热切换验证         |
| EM-11 | 配置删除检查      | 单元     | 使用中配置保护     |
| EM-12 | 邮件模板列表      | 单元     | 分类过滤           |
| EM-13 | 邮件模板更新      | 单元     | 版本管理           |
| EM-14 | 邮件日志查询      | 单元     | 时间范围、状态过滤 |
| EM-15 | 邮件发送统计      | 单元     | 成功率计算         |

#### 3.2.3 AI 管理测试 (ai-management.test.ts)

**测试用例** (10 个):

| ID    | 测试场景            | 测试类型 | 验证点                         |
| ----- | ------------------- | -------- | ------------------------------ |
| AI-01 | 创建 OpenAI 配置    | 单元     | API Key 验证                   |
| AI-02 | 创建 Anthropic 配置 | 单元     | API Key 验证                   |
| AI-03 | 创建自定义 Provider | 单元     | baseUrl 验证                   |
| AI-04 | 配置激活/默认设置   | 集成     | 默认配置唯一性                 |
| AI-05 | AI 日志记录         | 集成     | 请求/响应记录                  |
| AI-06 | AI 耗时统计         | 单元     | 时长计算准确性                 |
| AI-07 | AI 响应缓存配置     | 集成     | 缓存开关                       |
| AI-08 | 服务类型过滤        | 单元     | RISK_ANALYSIS, REVIEW_AUDIT 等 |
| AI-09 | Provider 切换       | 集成     | 故障转移                       |
| AI-10 | 配额管理            | 单元     | 调用次数限制                   |

#### 3.2.4 审计日志测试 (audit-logs.test.ts)

**测试用例** (8 个):

| ID    | 测试场景     | 测试类型 | 验证点                 |
| ----- | ------------ | -------- | ---------------------- |
| AL-01 | 用户登录审计 | 集成     | 登录事件记录           |
| AL-02 | 数据创建审计 | 集成     | CREATE 事件            |
| AL-03 | 数据更新审计 | 集成     | UPDATE 事件            |
| AL-04 | 数据删除审计 | 集成     | DELETE 事件            |
| AL-05 | 权限变更审计 | 集成     | PERMISSION_CHANGE 事件 |
| AL-06 | 日志查询过滤 | 单元     | 用户、动作、时间过滤   |
| AL-07 | 日志导出     | 集成     | CSV/JSON 导出          |
| AL-08 | 敏感操作审计 | 集成     | 密码修改、角色变更     |

#### 3.2.5 定时任务测试 (scheduled-jobs.test.ts)

**测试用例** (7 个):

| ID    | 测试场景       | 测试类型 | 验证点                 |
| ----- | -------------- | -------- | ---------------------- |
| SJ-01 | 创建 Cron 任务 | 单元     | Cron 表达式验证        |
| SJ-02 | 任务激活/禁用  | 集成     | 调度器注册/注销        |
| SJ-03 | 任务执行       | 集成     | endpoint 调用          |
| SJ-04 | 执行状态记录   | 集成     | SUCCESS/FAILED/TIMEOUT |
| SJ-05 | 错误处理       | 集成     | 错误信息记录           |
| SJ-06 | 任务列表查询   | 单元     | 分页、状态过滤         |
| SJ-07 | 任务删除       | 单元     | 运行中任务保护         |

---

## 四、报告生成测试计划

### 4.1 测试文件结构

```
tests/modules/reports/
├── setup.ts                       # 报告测试配置
├── report-generator.test.ts       # 报告生成服务测试
├── pdf-export.test.ts             # PDF 导出流程测试
├── docx-export.test.ts            # DOCX 导出流程测试
└── report-download.test.ts        # 文件下载完整性测试
```

### 4.2 测试场景详情

#### 4.2.1 报告生成服务测试 (report-generator.test.ts)

**测试用例** (12 个):

| ID    | 测试场景         | 测试类型 | 验证点             |
| ----- | ---------------- | -------- | ------------------ |
| RG-01 | 项目进度报告生成 | 集成     | 数据聚合、格式正确 |
| RG-02 | 里程碑完成报告   | 集成     | 任务完成率计算     |
| RG-03 | 风险汇总报告     | 集成     | 风险级别统计       |
| RG-04 | 评审报告生成     | 集成     | 评审结果汇总       |
| RG-05 | 需求状态报告     | 集成     | 需求分布统计       |
| RG-06 | 任务分配报告     | 集成     | 成员负载统计       |
| RG-07 | 报告模板加载     | 单元     | 模板文件读取       |
| RG-08 | 报告变量替换     | 单元     | 数据填充正确性     |
| RG-09 | 报告缓存         | 集成     | 缓存命中/失效      |
| RG-10 | 并发报告生成     | 性能     | 并发限制、队列     |
| RG-11 | 大报告生成       | 性能     | 内存使用、超时     |
| RG-12 | 报告生成失败处理 | 集成     | 错误处理、回滚     |

#### 4.2.2 PDF 导出测试 (pdf-export.test.ts)

**测试用例** (10 个):

| ID    | 测试场景         | 测试类型 | 验证点               |
| ----- | ---------------- | -------- | -------------------- |
| PE-01 | PDF 生成基础功能 | 集成     | 文件生成成功         |
| PE-02 | PDF 内容完整性   | 集成     | 所有章节存在         |
| PE-03 | PDF 格式验证     | 集成     | 字体、布局正确       |
| PE-04 | 中文支持         | 集成     | 中文字符渲染         |
| PE-05 | 表格导出         | 集成     | 表格数据完整         |
| PE-06 | 图表导出         | 集成     | 图表渲染正确         |
| PE-07 | 分页处理         | 集成     | 分页符位置正确       |
| PE-08 | 大 PDF 生成      | 性能     | 内存使用、耗时       |
| PE-09 | PDF 加密         | 集成     | 密码保护             |
| PE-10 | PDF 元数据       | 单元     | 标题、作者、创建时间 |

#### 4.2.3 DOCX 导出测试 (docx-export.test.ts)

**测试用例** (10 个):

| ID    | 测试场景          | 测试类型 | 验证点         |
| ----- | ----------------- | -------- | -------------- |
| DE-01 | DOCX 生成基础功能 | 集成     | 文件生成成功   |
| DE-02 | DOCX 内容完整性   | 集成     | 所有章节存在   |
| DE-03 | 样式保留          | 集成     | 标题、段落样式 |
| DE-04 | 中文支持          | 集成     | 中文字符渲染   |
| DE-05 | 表格导出          | 集成     | 表格格式保留   |
| DE-06 | 图片嵌入          | 集成     | 图片正确显示   |
| DE-07 | 目录生成          | 集成     | 目录页码正确   |
| DE-08 | 页眉页脚          | 集成     | 页眉页脚内容   |
| DE-09 | 大 DOCX 生成      | 性能     | 内存使用、耗时 |
| DE-10 | DOCX 兼容性       | 集成     | Word 打开验证  |

#### 4.2.4 文件下载测试 (report-download.test.ts)

**测试用例** (8 个):

| ID    | 测试场景         | 测试类型 | 验证点             |
| ----- | ---------------- | -------- | ------------------ |
| RD-01 | 文件下载基础功能 | 集成     | 下载成功、内容完整 |
| RD-02 | 文件完整性校验   | 集成     | MD5/SHA256 校验    |
| RD-03 | 大文件下载       | 性能     | 断点续传、超时     |
| RD-04 | 并发下载         | 性能     | 并发限制           |
| RD-05 | 下载权限验证     | 集成     | 未授权访问拒绝     |
| RD-06 | 下载日志记录     | 集成     | 下载次数、用户记录 |
| RD-07 | 临时文件清理     | 集成     | 过期文件删除       |
| RD-08 | CDN 分发         | 集成     | CDN 缓存、回源     |

---

## 五、缓存服务测试计划

### 5.1 测试文件结构

```
tests/services/
├── setup.ts                       # 缓存测试配置
└── cache-service.test.ts          # 缓存服务综合测试
```

### 5.2 测试场景详情

#### 5.2.1 缓存服务综合测试 (cache-service.test.ts)

**测试用例** (25 个):

| ID    | 测试场景          | 测试类型 | 验证点               |
| ----- | ----------------- | -------- | -------------------- |
| CS-01 | 缓存写入基础      | 单元     | Key-Value 存储       |
| CS-02 | 缓存读取基础      | 单元     | Key 查询返回         |
| CS-03 | 缓存命中率测试    | 性能     | 命中率>80%           |
| CS-04 | TTL 自动失效      | 集成     | 到期自动删除         |
| CS-05 | 手动失效          | 集成     | delete 操作          |
| CS-06 | 批量失效          | 集成     | 模式匹配删除         |
| CS-07 | 缓存穿透测试      | 性能     | 空值缓存策略         |
| CS-08 | 缓存击穿测试      | 并发     | 热点 Key 保护        |
| CS-09 | 缓存雪崩测试      | 并发     | TTL 随机化           |
| CS-10 | 并发写入          | 并发     | 写入冲突处理         |
| CS-11 | 并发读取          | 并发     | 读锁机制             |
| CS-12 | 内存使用监控      | 性能     | 内存上限控制         |
| CS-13 | 缓存淘汰策略      | 集成     | LRU/LFU              |
| CS-14 | 缓存预热          | 集成     | 启动预加载           |
| CS-15 | 缓存统计          | 单元     | hit/miss 计数        |
| CS-16 | AI 响应缓存       | 集成     | 请求 Hash 计算       |
| CS-17 | 缓存 Key 命名规范 | 单元     | 命名一致性           |
| CS-18 | 缓存序列化        | 单元     | JSON 序列化/反序列化 |
| CS-19 | 缓存压缩          | 性能     | 大值压缩             |
| CS-20 | 缓存备份          | 集成     | 持久化备份           |
| CS-21 | 缓存恢复          | 集成     | 启动恢复             |
| CS-22 | 分布式缓存        | 集成     | 多实例同步           |
| CS-23 | 缓存降级          | 集成     | 缓存不可用时降级     |
| CS-24 | 缓存监控告警      | 集成     | 命中率告警           |
| CS-25 | 缓存清理任务      | 集成     | 定时清理             |

---

## 六、47 数据模型测试实施计划

### 6.1 P0 核心模型测试（15 个模型）

**测试目录**: `tests/models/p0-core/`

| 序号     | 测试文件                     | 模型               | 测试用例数 | 预计工时 |
| -------- | ---------------------------- | ------------------ | ---------- | -------- |
| 1        | user.test.ts                 | User               | 15         | 2h       |
| 2        | project.test.ts              | Project            | 12         | 1.5h     |
| 3        | task.test.ts                 | Task               | 18         | 2h       |
| 4        | milestone.test.ts            | Milestone          | 10         | 1h       |
| 5        | requirement.test.ts          | Requirement        | 12         | 1.5h     |
| 6        | issue.test.ts                | Issue              | 10         | 1h       |
| 7        | review.test.ts               | Review             | 12         | 1.5h     |
| 8        | risk.test.ts                 | Risk               | 10         | 1h       |
| 9        | task-assignee.test.ts        | TaskAssignee       | 8          | 0.5h     |
| 10       | task-watcher.test.ts         | TaskWatcher        | 6          | 0.5h     |
| 11       | subtask.test.ts              | SubTask            | 8          | 0.5h     |
| 12       | task-tag.test.ts             | TaskTag            | 6          | 0.5h     |
| 13       | task-dependency.test.ts      | TaskDependency     | 10         | 1h       |
| 14       | project-member.test.ts       | ProjectMember      | 8          | 0.5h     |
| 15       | password-reset-token.test.ts | PasswordResetToken | 5          | 0.5h     |
| **小计** | -                            | **15 模型**        | **150**    | **12h**  |

### 6.2 P1 重要模型测试（12 个模型）

**测试目录**: `tests/models/p1-important/`

| 序号     | 测试文件                       | 模型                  | 测试用例数 | 预计工时 |
| -------- | ------------------------------ | --------------------- | ---------- | -------- |
| 1        | proposal.test.ts               | Proposal              | 10         | 1h       |
| 2        | requirement-impact.test.ts     | RequirementImpact     | 8          | 0.5h     |
| 3        | requirement-acceptance.test.ts | RequirementAcceptance | 8          | 0.5h     |
| 4        | requirement-discussion.test.ts | RequirementDiscussion | 8          | 0.5h     |
| 5        | requirement-history.test.ts    | RequirementHistory    | 8          | 0.5h     |
| 6        | review-material.test.ts        | ReviewMaterial        | 10         | 1h       |
| 7        | review-participant.test.ts     | ReviewParticipant     | 8          | 0.5h     |
| 8        | review-item.test.ts            | ReviewItem            | 8          | 0.5h     |
| 9        | review-criterion.test.ts       | ReviewCriterion       | 8          | 0.5h     |
| 10       | review-template.test.ts        | ReviewTemplate        | 10         | 1h       |
| 11       | review-template-item.test.ts   | ReviewTemplateItem    | 6          | 0.5h     |
| 12       | review-type-config.test.ts     | ReviewTypeConfig      | 8          | 1h       |
| **小计** | -                              | **12 模型**           | **100**    | **8h**   |

### 6.3 P2 支撑模型测试（12 个模型）

**测试目录**: `tests/models/p2-support/`

| 序号     | 测试文件                        | 模型                   | 测试用例数 | 预计工时 |
| -------- | ------------------------------- | ---------------------- | ---------- | -------- |
| 1        | tag.test.ts                     | Tag                    | 8          | 0.5h     |
| 2        | task-template.test.ts           | TaskTemplate           | 10         | 1h       |
| 3        | file-storage.test.ts            | FileStorage            | 10         | 1h       |
| 4        | preview-service-config.test.ts  | PreviewServiceConfig   | 8          | 0.5h     |
| 5        | notification.test.ts            | Notification           | 8          | 0.5h     |
| 6        | notification-preference.test.ts | NotificationPreference | 6          | 0.5h     |
| 7        | notification-ignore.test.ts     | NotificationIgnore     | 6          | 0.5h     |
| 8        | email-config.test.ts            | EmailConfig            | 8          | 0.5h     |
| 9        | email-log.test.ts               | EmailLog               | 8          | 0.5h     |
| 10       | email-template.test.ts          | EmailTemplate          | 8          | 0.5h     |
| 11       | risk-task.test.ts               | RiskTask               | 6          | 0.5h     |
| 12       | issue-extension.test.ts         | Issue (扩展)           | 4          | 0.5h     |
| **小计** | -                               | **12 模型**            | **80**     | **6h**   |

### 6.4 P3 基础设施模型测试（8 个模型）

**测试目录**: `tests/models/p3-infra/`

| 序号     | 测试文件                   | 模型             | 测试用例数 | 预计工时 |
| -------- | -------------------------- | ---------------- | ---------- | -------- |
| 1        | ai-config.test.ts          | AIConfig         | 8          | 0.5h     |
| 2        | ai-log.test.ts             | AILog            | 6          | 0.5h     |
| 3        | ai-response-cache.test.ts  | AiResponseCache  | 10         | 1h       |
| 4        | audit-log.test.ts          | AuditLog         | 8          | 0.5h     |
| 5        | webhook.test.ts            | Webhook          | 6          | 0.5h     |
| 6        | webhook-delivery.test.ts   | WebhookDelivery  | 6          | 0.5h     |
| 7        | scheduled-job.test.ts      | ScheduledJob     | 4          | 0.5h     |
| 8        | review-ai-analysis.test.ts | ReviewAiAnalysis | 2          | 0.5h     |
| **小计** | -                          | **8 模型**       | **50**     | **4h**   |

---

## 七、测试实施时间表

### 7.1 Week 1 - 核心模块 + 管理员后台

| 日期  | 任务                                        | 交付物       | 状态   |
| ----- | ------------------------------------------- | ------------ | ------ |
| Day 1 | P0 模型测试 (User, Project, Task)           | 3 个测试文件 | 计划中 |
| Day 2 | P0 模型测试 (Milestone, Requirement, Issue) | 3 个测试文件 | 计划中 |
| Day 3 | P0 模型测试 (Review, Risk + 关联模型)       | 7 个测试文件 | 计划中 |
| Day 4 | 管理员后台测试 (Preview, Email)             | 2 个测试文件 | 计划中 |
| Day 5 | 管理员后台测试 (AI, Audit, ScheduledJob)    | 3 个测试文件 | 计划中 |

### 7.2 Week 2 - 报告生成 + 缓存服务 + P1 模型

| 日期  | 任务                             | 交付物       | 状态   |
| ----- | -------------------------------- | ------------ | ------ |
| Day 1 | 报告生成测试 (Report Generator)  | 1 个测试文件 | 计划中 |
| Day 2 | 报告生成测试 (PDF/DOCX Export)   | 2 个测试文件 | 计划中 |
| Day 3 | 缓存服务测试 (Cache Service)     | 1 个测试文件 | 计划中 |
| Day 4 | P1 模型测试 (Requirement 子模型) | 5 个测试文件 | 计划中 |
| Day 5 | P1 模型测试 (Review 子模型)      | 7 个测试文件 | 计划中 |

### 7.3 Week 3 - P2 支撑模型

| 日期  | 任务                                         | 交付物       | 状态   |
| ----- | -------------------------------------------- | ------------ | ------ |
| Day 1 | P2 模型测试 (Tag, TaskTemplate, FileStorage) | 3 个测试文件 | 计划中 |
| Day 2 | P2 模型测试 (Preview, Notification 系列)     | 4 个测试文件 | 计划中 |
| Day 3 | P2 模型测试 (Email 系列)                     | 3 个测试文件 | 计划中 |
| Day 4 | P2 模型测试 (RiskTask, Issue 扩展)           | 2 个测试文件 | 计划中 |
| Day 5 | 覆盖率检查 + 补充测试                        | 补充测试文件 | 计划中 |

### 7.4 Week 4 - P3 基础设施 + 收尾

| 日期  | 任务                                         | 交付物       | 状态   |
| ----- | -------------------------------------------- | ------------ | ------ |
| Day 1 | P3 模型测试 (AI 系列)                        | 3 个测试文件 | 计划中 |
| Day 2 | P3 模型测试 (AuditLog, Webhook 系列)         | 3 个测试文件 | 计划中 |
| Day 3 | P3 模型测试 (ScheduledJob, ReviewAiAnalysis) | 2 个测试文件 | 计划中 |
| Day 4 | 覆盖率优化 + 性能测试                        | 测试报告     | 计划中 |
| Day 5 | 文档完善 + 最终验收                          | 完整测试报告 | 计划中 |

---

## 八、测试质量标准

### 8.1 测试覆盖要求

| 覆盖类型   | P0 核心 | P1 重要 | P2 支撑 | P3 基础 |
| ---------- | ------- | ------- | ------- | ------- |
| 语句覆盖率 | 100%    | 95%     | 90%     | 85%     |
| 函数覆盖率 | 100%    | 95%     | 90%     | 85%     |
| 分支覆盖率 | 95%     | 90%     | 85%     | 80%     |
| 行覆盖率   | 100%    | 95%     | 90%     | 85%     |

### 8.2 测试类型要求

| 测试类型 | P0 核心     | P1 重要     | P2 支撑 | P3 基础 |
| -------- | ----------- | ----------- | ------- | ------- |
| 单元测试 | ✅ 必须     | ✅ 必须     | ✅ 必须 | ✅ 必须 |
| 集成测试 | ✅ 必须     | ✅ 必须     | ⚠️ 建议 | ⚠️ 建议 |
| 性能测试 | ⚠️ 关键路径 | ⚠️ 关键路径 | ❌ 可选 | ❌ 可选 |
| 并发测试 | ✅ 必须     | ⚠️ 建议     | ❌ 可选 | ❌ 可选 |

### 8.3 测试断言要求

- **CRUD 测试**: 创建、读取、更新、删除完整性验证
- **关联测试**: 外键关系、级联操作验证
- **边界测试**: 空值、最大值、最小值、特殊字符
- **错误处理**: 异常场景、错误消息验证
- **业务规则**: 状态机、权限验证、数据验证

---

## 九、测试基础设施要求

### 9.1 测试数据库

- **类型**: PostgreSQL (与生产一致)
- **隔离**: 每个测试文件独立数据库
- **清理**: 测试完成后自动清理
- **种子数据**: 基础数据工厂提供

### 9.2 Mock 服务

- **Email Service**: Mock 邮件发送
- **AI Service**: Mock AI 调用
- **File Storage**: Mock 文件上传
- **External API**: Mock 外部依赖

### 9.3 测试工具

- **测试框架**: Vitest (单元) + Playwright (E2E)
- **Mock 工具**: MSW + ViMock
- **断言库**: 自定义断言 + Expect
- **覆盖率**: V8 覆盖率 + HTML 报告

---

## 十、风险管理

### 10.1 风险识别

| 风险             | 影响 | 概率 | 缓解措施             |
| ---------------- | ---- | ---- | -------------------- |
| 测试时间不足     | 高   | 中   | 优先级裁剪、分批实施 |
| 数据库隔离问题   | 高   | 中   | 事务回滚、独立数据库 |
| Mock 服务不稳定  | 中   | 低   | 备用 Mock 方案       |
| 测试数据冲突     | 中   | 中   | 数据工厂、唯一性保证 |
| 性能测试环境不足 | 中   | 低   | 降低并发要求         |

### 10.2 风险应对

- **时间风险**: 优先保证 P0 核心模型测试，P2/P3 可裁剪
- **环境问题**: 准备 Docker Compose 测试环境
- **数据冲突**: 使用 cuid() 保证唯一性，测试前清理

---

## 十一、交付物清单

### 11.1 测试代码

- [ ] `tests/admin/` - 管理员后台测试套件
- [ ] `tests/modules/reports/` - 报告生成测试套件
- [ ] `tests/services/cache-service.test.ts` - 缓存服务测试
- [ ] `tests/models/p0-core/` - P0 核心模型测试 (15 文件)
- [ ] `tests/models/p1-important/` - P1 重要模型测试 (12 文件)
- [ ] `tests/models/p2-support/` - P2 支撑模型测试 (12 文件)
- [ ] `tests/models/p3-infra/` - P3 基础设施测试 (8 文件)

### 11.2 测试报告

- [ ] 每周测试进展报告
- [ ] 覆盖率统计报告
- [ ] 性能测试报告
- [ ] 最终测试总结报告

### 11.3 文档

- [ ] 测试计划文档 (本文档)
- [ ] 测试用例详细设计
- [ ] 测试工具使用文档
- [ ] 测试环境配置文档

---

## 十二、验收标准

### 12.1 覆盖率验收

- [ ] 总覆盖率 ≥ 92%
- [ ] P0 核心模型覆盖率 = 100%
- [ ] P1 重要模型覆盖率 ≥ 95%
- [ ] P2 支撑模型覆盖率 ≥ 90%
- [ ] P3 基础设施覆盖率 ≥ 85%

### 12.2 质量验收

- [ ] 所有测试用例可重复执行
- [ ] 测试执行时间 < 30 分钟
- [ ] 无 flaky 测试 (随机失败)
- [ ] 测试代码通过 lint 检查

### 12.3 文档验收

- [ ] 测试计划文档完整
- [ ] 测试报告按时提交
- [ ] 测试用例可追溯至需求

---

## 附录 A: 47 数据模型完整清单

```
核心业务模型 (15):
User, Project, Task, Milestone, Requirement, Issue, Review, Risk,
TaskAssignee, TaskWatcher, SubTask, TaskTag, TaskDependency,
ProjectMember, PasswordResetToken

重要业务模型 (12):
Proposal, RequirementImpact, RequirementAcceptance, RequirementDiscussion,
RequirementHistory, ReviewMaterial, ReviewParticipant, ReviewItem,
ReviewCriterion, ReviewTemplate, ReviewTemplateItem, ReviewTypeConfig

支撑服务模型 (12):
Tag, TaskTemplate, FileStorage, PreviewServiceConfig, Notification,
NotificationPreference, NotificationIgnore, EmailConfig, EmailLog,
EmailTemplate, RiskTask, Issue(扩展)

基础设施模型 (8):
AIConfig, AILog, AiResponseCache, AuditLog, Webhook, WebhookDelivery,
ScheduledJob, ReviewAiAnalysis

管理员后台专用 (已在以上模型中):
PreviewServiceConfig, EmailConfig, EmailTemplate, EmailLog,
AIConfig, AILog, AiResponseCache, AuditLog, ScheduledJob
```

---

## 附录 B: 测试文件命名规范

```
tests/
├── admin/                          # 管理员后台测试
│   └── *.test.ts
├── modules/                        # 功能模块测试
│   └── reports/*.test.ts
├── services/                       # 服务层测试
│   └── *.test.ts
├── models/                         # 数据模型测试
│   ├── p0-core/*.test.ts
│   ├── p1-important/*.test.ts
│   ├── p2-support/*.test.ts
│   └── p3-infra/*.test.ts
├── integration/                    # 集成测试
│   └── *.test.ts
├── e2e/                           # E2E 测试
│   └── *.test.ts
└── helpers/                       # 测试工具
    ├── test-db.ts
    ├── test-data-factory.ts
    └── assertions.ts
```

---

**文档结束**

---

_创建日期_: 2026-03-04  
_版本_: v1.0  
_负责人_: AI Assistant  
_审核状态_: 待审核
