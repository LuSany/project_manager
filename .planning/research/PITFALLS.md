# Domain Pitfalls

**Domain:** UI 现代化项目 (Next.js 15 + React 18 + TypeScript + shadcn/ui)
**Researched:** 2026-03-25
**Sources:** WebSearch (12 articles on UI modernization, theming, state management, drag-drop performance)

---

## Critical Pitfalls

### 1. 主题切换闪烁 (FOUC - Flash of Unstyled Content)

**What goes wrong:**
- 页面加载时主题选择器闪烁（默认浅色 → 深色）
- 使用 `useEffect` 在客户端应用主题，导致 SSR 与客户端不匹配
- 主题值存储在 localStorage，但读取时机太晚

**Why it happens:**
- Next.js App Router 默认 SSR，但主题偏好是客户端状态
- 没有在服务端渲染前确定主题
- `next-themes` 或类似库配置不当

**Consequences:**
- 用户体验差，明显闪烁
- SEO 工具可能报告内容不匹配
- 深色模式用户每次刷新都经历刺眼闪光

**Prevention:**
- 使用 `next-themes` 库（专为 Next.js 设计）
- 在 `layout.tsx` 中包裹 `ThemeProvider`，设置 `attribute="class"` 和 `defaultTheme="system"`
- 在 `<head>` 中添加内联脚本，在 hydration 前设置主题类
- 主题切换按钮使用 `useTheme()` hook，避免手动操作 localStorage

**Detection:**
- 深色模式下刷新页面，观察是否有白闪
- 检查 HTML `<html>` 标签的 `class` 属性是否正确设置
- 使用 Chrome DevTools Performance 面板记录加载过程

**Phase:** Phase 1 (布局组件重构) - 必须首先解决

---

### 2. Zustand 状态管理碎片化

**What goes wrong:**
- 多个 store 重复存储相同数据（如用户信息、项目配置）
- Store 订阅过多导致不必要的重渲染
- 持久化配置不当，刷新后状态丢失（当前项目已有此问题）

**Why it happens:**
- 没有统一的 store 设计原则
- 开发者各自创建 store 而不考虑全局架构
- Zustand 的 `persist` 中间件配置复杂，容易出错

**Consequences:**
- 内存浪费，性能下降
- 状态不一致（两个 store 中同一数据不同步）
- 刷新后看板视图/卡片排序丢失（项目当前问题）

**Prevention:**
- 按功能域划分 store：`authStore`、`projectStore`、`boardStore`、`uiStore`
- 使用 `useShallow` hook 避免过度订阅
- 集中配置 persist 中间件，明确哪些 state 需要持久化
- 对于 boardStore 等复杂状态，考虑乐观更新 + 服务端同步

**Detection:**
- 使用 React DevTools Profiler 检查重渲染来源
- 搜索代码库中 `createStore`/`create` (zustand) 的调用次数
- 检查 store 文件中 `persist` 配置是否完整

**Phase:** Phase 1 (布局组件重构) - UI store 统一；Phase 2+ 各功能模块按需扩展

---

### 3. 拖拽性能崩溃（大数据集看板）

**What goes wrong:**
- 100+ 任务时拖拽明显卡顿
- 拖拽时整个看板重新渲染
- 移动端拖拽完全不可用

**Why it happens:**
- dnd-kit 配置不当，没有限制拖拽更新频率
- 每个任务卡片都是独立组件但没有 memo
- 拖拽时触发全局状态更新（如自动保存到数据库）

**Consequences:**
- 大项目无法使用看板视图
- 用户回退到列表视图，降低产品价值感
- 移动端用户无法操作

**Prevention:**
- 使用 `@dnd-kit/core` 的 `Sensor` 配置，设置拖拽激活阈值
- 卡片组件使用 `React.memo`，只订阅必要状态
- 拖拽排序使用乐观更新，批量同步到服务端（debounce 500ms）
- 虚拟滚动：任务超过 50 时只渲染可见区域

**Detection:**
- 创建含 200+ 任务的测试看板
- 使用 Chrome Performance 面板记录拖拽操作
- 监控 `onDragEnd` 回调执行频率

**Phase:** Phase 1 (任务视图组件 - 看板视图) - 必须在实现阶段解决

---

### 4. Tailwind CSS 4 升级断崖

**What goes wrong:**
- 升级后 CSS 构建失败或样式错乱
- `@apply` 指令行为变化导致自定义组件失效
- JIT 编译模式变化影响动态类名

**Why it happens:**
- Tailwind 4 (2025 发布) 改变了配置格式和引擎
- 从 PostCSS 插件模式转向原生 CSS 解析器
- 项目使用了 v3 的废弃特性

**Consequences:**
- 构建管道完全阻塞
- 样式问题难以排查（无编译错误但视觉异常）
- 需要大规模重构样式代码

**Prevention:**
- 升级前阅读 [Tailwind CSS 4 迁移指南](https://tailwindcss.com/blog/tailwindcss-v4)
- 检查是否使用了 `@tailwind` 指令（v4 改用 `@import "tailwindcss"`）
- 动态类名改用 `clsx`/`tailwind-merge` 确保正确处理
- 在特性分支先升级，运行完整视觉回归测试

**Detection:**
- 运行 `npm run build` 观察 CSS 相关警告
- 检查 `tailwind.config.js` 是否有废弃配置项
- 对比升级前后 CSS 文件大小差异

**Phase:** Phase 1 开始前 - 必须先完成升级验证

---

### 5. Next.js 15 App Router 服务端/客户端边界模糊

**What goes wrong:**
- 本应是服务端组件却添加了 `useState`/`useEffect`
- 客户端组件中尝试访问服务端数据（如 Prisma 查询）
- Props 传递导致客户端组件不必要地变成服务端组件

**Why it happens:**
- App Router 的组件模型与 Pages Router 完全不同
- 开发者对 RSC（React Server Components）理解不足
- 缺乏明确的组件边界规范

**Consequences:**
- hydration 错误（"Text content does not match"）
- 构建失败（"Server components cannot import client-only packages"）
- 性能退化（本可服务端渲染的变成了客户端渲染）

**Prevention:**
- 严格遵循规则：需要交互/状态/Effect → `"use client"` 指令
- 数据获取放在服务端组件，通过 props 传递给客户端组件
- 使用 `Suspense` 包裹异步客户端组件
- 建立项目规范：`components/` 默认客户端，`app/**/page.tsx` 默认服务端

**Detection:**
- 运行 `next build` 检查 hydration 警告
- 使用 React DevTools 查看组件渲染位置（服务器/客户端）
- 搜索代码库中 `useState`/`useEffect` 是否都添加了 `use client`

**Phase:** Phase 1 (所有新组件) - 需要在开发前建立规范

---

## Moderate Pitfalls

### 6. 命令面板（Cmd+K）性能陷阱

**What goes wrong:**
- 打开命令面板时明显延迟
- 搜索结果实时更新导致频繁重渲染
- 快捷键冲突（与其他库或浏览器快捷键）

**Prevention:**
- 命令面板数据预加载（应用启动时构建搜索索引）
- 搜索结果使用虚拟列表（`react-virtual` 或 `@tanstack/virtual`）
- 使用 `kbar` 或 `cmdk` 库而非自研
- 快捷键使用 `useHotkeys` 库，支持上下文感知

**Phase:** Phase 1 (布局组件重构)

---

### 7. 甘特图自定义渲染性能

**What goes wrong:**
- 100+ 任务时甘特图渲染超时
- 缩放/平移操作卡顿
- 依赖关系线绘制错误

**Prevention:**
- 使用 SVG 而非 DOM 节点绘制任务条（更少重排）
- 时间轴使用固定间隔，避免动态计算
- 依赖线使用简化的贝塞尔曲线而非精确路径
- 考虑集成成熟库（如 `frappe-gantt` 或 `dhtmlx-gantt`）而非完全自研

**Phase:** Phase 1 (任务视图组件 - 甘特图) - 需要深度调研

---

### 8. 可折叠侧边栏动画性能

**What goes wrong:**
- 折叠/展开时布局抖动
- 动画过程中内容重排
- 移动端动画掉帧

**Prevention:**
- 使用 CSS `transform: translateX()` 而非 `width` 动画
- 固定侧边栏宽度（不使用百分比或 auto）
- 使用 `framer-motion` 的 `layout` prop 处理布局动画
- 移动端禁用动画或降低动画复杂度

**Phase:** Phase 1 (布局组件重构)

---

### 9. 组件库冲突（Radix UI + shadcn/ui）

**What goes wrong:**
- 样式覆盖冲突
- 同一组件两种实现（如 Dialog 既有 Radix 又有 shadcn）
- shadcn 组件复制后无法接收上游修复

**Prevention:**
- 明确策略：shadcn 优先，Radix 仅用于 shadcn 未覆盖场景
- 复制 shadcn 组件到 `components/ui/` 后记录版本号
- 建立组件升级流程（定期检查 shadcn 更新）
- 统一使用 `cn()` 工具函数处理类名合并

**Phase:** Phase 1 开始前 - 需要明确技术决策

---

### 10. 图表库（Recharts）限制

**What goes wrong:**
- Recharts 不支持甘特图（项目已识别）
- 大数据集时 SVG 渲染性能差
- 自定义 tooltip/legend 复杂

**Prevention:**
- 甘特图：使用自定义 SVG 实现（项目决策）或集成专用库
- 大数据集：使用 `visx` (Airbnb) 基于 D3 的低级抽象
- 提前评估：仪表盘是否需要实时数据更新（WebSocket → 节流渲染）

**Phase:** Phase 1 (仪表盘组件)

---

## Minor Pitfalls

### 11. 响应式断点冲突

**What goes wrong:**
- Tailwind 默认断点与设计要求不匹配
- 移动端布局在不同设备上表现不一致

**Prevention:**
- 在 `tailwind.config.js` 中明确定义项目断点
- 使用 `sm:`、`md:`、`lg:` 而非硬编码像素值
- 在真实设备上测试（不只是 DevTools 模拟）

**Phase:** Phase 1 (所有组件)

---

### 12. 图标系统混乱

**What goes wrong:**
- 混用多种图标库（lucide-react、heroicons、自定义 SVG）
- 图标大小/颜色不一致
- 图标加载闪烁

**Prevention:**
- 统一使用 `lucide-react`（shadcn 推荐）
- 建立 `Icon` 组件封装，统一 size/color 属性
- 自定义 SVG 内联到组件中避免额外请求

**Phase:** Phase 1 (组件开发规范)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| 布局组件重构 | 主题切换闪烁、侧边栏动画性能 | 使用 next-themes、CSS transform 动画 |
| 看板视图 | 拖拽性能崩溃 | dnd-kit 优化、React.memo、乐观更新 |
| 甘特图 | 自定义渲染性能 | SVG 实现、虚拟滚动、考虑第三方库 |
| 仪表盘 | Recharts 限制 | 评估 visx 替代方案、节流实时数据 |
| 命令面板 | 搜索性能、快捷键冲突 | kbar/cmdk 库、预加载索引 |
| 状态管理 | Zustand 碎片化、持久化丢失 | 统一 store 设计、useShallow hook |

---

## Sources

- [Tailwind CSS 4 Announcement](https://tailwindcss.com/blog/tailwindcss-v4) - 官方发布博客
- [next-themes Documentation](https://github.com/pacocoursey/next-themes) - GitHub 仓库
- [dnd-kit Performance Guide](https://docs.dndkit.com/guides/performance) - 官方性能指南
- [Zustand Best Practices 2025](https://github.com/pmndrs/zustand) - Zustand 官方仓库
- [Next.js 15 App Router Patterns](https://nextjs.org/docs/app) - Next.js 官方文档
- [Recharts Limitations Discussion](https://github.com/recharts/recharts/issues) - GitHub Issues

---

*Pitfalls audit complete: 2026-03-25*
