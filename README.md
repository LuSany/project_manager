# 项目管理系统

企业级项目管理系统，支持项目生命周期管理、任务跟踪、需求管理、评审流程等核心功能。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 15.x | React框架 |
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 样式方案 |
| Zustand | 5.x | 客户端状态管理 |
| TanStack Query | 5.x | 服务端状态管理 |
| React Hook Form | 7.x | 表单处理 |
| Zod | 4.x | 数据验证 |
| Prisma | 6.x | ORM |
| Jose | 5.x | JWT认证 |
| Vitest | 3.x | 单元测试 |
| Playwright | Latest | E2E测试 |

## 开发规范

### 目录结构

```
src/
├── app/                # Next.js App Router页面
│   ├── (auth)/        # 认证相关页面
│   ├── (main)/        # 主应用页面
│   ├── api/           # API路由
│   └── layout.tsx
├── components/         # React组件
│   ├── ui/           # shadcn/ui基础组件
│   └── ...           # 业务组件
├── lib/              # 工具库
│   ├── api/          # API客户端
│   ├── auth/         # 认证逻辑
│   ├── db/           # 数据库
│   └── utils.ts      # 工具函数
├── stores/           # Zustand状态管理
├── types/            # TypeScript类型定义
└── styles/           # 全局样式
```

### 分支策略

- `main` - 主分支，始终保持可部署状态
- `feature/*` - 功能开发分支
- `bugfix/*` - Bug修复分支
- `hotfix/*` - 紧急修复分支

### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型: feat, fix, refactor, docs, test, chore

示例:
```
feat(auth): 添加用户注册API

- 实现邮箱验证
- 添加Zod schema验证
- 集成JWT token生成

Closes #123
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境配置

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

### 数据库设置

```bash
# 生成Prisma客户端
npm run db:generate

# 运行数据库迁移
npm run db:migrate

# 填充种子数据（可选）
npm run db:seed
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 测试

```bash
# 单元测试
npm run test:unit

# 单元测试覆盖率
npm run test:unit:coverage

# E2E测试
npm run test:e2e

# E2E测试UI模式
npm run test:e2e:ui
```

## 脚本

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 格式化
npm run format

# 类型检查
npm run typecheck
```

## 文档

- [技术规范 V4.0](./docs/TECHNICAL_SPECIFICATION_V4.md)
- [开发计划](./.claude/plans/elegant-wibbling-pudding.md)

## 许可证

Copyright © 2026
