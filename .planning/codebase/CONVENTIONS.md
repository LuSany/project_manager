# Coding Conventions

**分析日期:** 2026-03-25

## 命名模式

**文件命名:**
- React 组件：`PascalCase.tsx`，例如 `Button.tsx`, `TaskKanban.tsx`
- Hooks：`usePascalCase.ts`，例如 `useAuth.tsx`, `useTags.ts`
- 工具函数：`kebab-case.ts` 或 `camelCase.ts`，例如 `test-db.ts`, `mime-detector.ts`
- 类型定义：`kebab-case.ts` 或 `PascalCase.ts`，例如 `types.ts`, `issue.ts`
- 测试文件：`*.test.ts` 或 `*.test.tsx`，例如 `historyStore.test.ts`, `KanbanCard.test.tsx`

**函数命名:**
- 普通函数：`camelCase`，例如 `fetchUser`, `createTestUser`
- React 组件：`PascalCase`，例如 `AuthProvider`, `Button`
- 测试函数：`describe`, `it`, `expect` 使用 Vitest 标准
- 工厂函数：`createX`，例如 `userFactory.create()`, `projectFactory.create()`

**变量命名:**
- 普通变量：`camelCase`，例如 `userData`, `testUser`
- 常量：`UPPER_CASE` 用于真正的常量，例如 `DEFAULT_TIMEOUT`, `API_BASE`
- React hooks 状态：`camelCase`，例如 `user`, `loading`
- 类型接口：`PascalCase`，例如 `User`, `ApiResponse`

**组件命名:**
- UI 组件：`PascalCase`，例如 `Button`, `Dialog`, `Popover`
- 页面组件：`page.tsx` (Next.js 约定)
- 布局组件：`layout.tsx` (Next.js 约定)

## 代码风格

**格式化:**
- 工具：Prettier (`prettier` v3.4.2)
- 配置文件：`.prettierrc`
- 配置：
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "plugins": ["prettier-plugin-tailwindcss"]
  }
  ```

**Linting:**
- 工具：ESLint v9 + TypeScript ESLint
- 配置：`eslint.config.mjs`
- 扩展：`next/core-web-vitals`, `typescript-eslint/recommended`
- 关键规则：
  ```js
  "@typescript-eslint/no-unused-vars": ["warn", {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_"
  }]
  "@typescript-eslint/no-explicit-any": "warn"
  "react-hooks/exhaustive-deps": "warn"
  "react/no-unescaped-entities": "off"
  ```

**TypeScript:**
- 严格模式：部分启用 (`strict: false`)
- 模块系统：`esnext`
- 模块解析：`bundler`
- JSX：`preserve`
- 路径别名：`@/*` → `./src/*`

## 导入组织

**导入顺序:**
1. React 核心库 (`react`, `react-dom`)
2. 第三方库 (`@tanstack/react-query`, `zustand`, `date-fns`)
3. UI 库 (`@radix-ui/*`, `lucide-react`, `shadcn/ui`)
4. 内部模块 (`@/lib/*`, `@/components/*`, `@/hooks/*`)
5. 类型 (`@/types/*`)
6. 相对路径导入

**路径别名:**
- `@/` → `./src/`
- 配置文件：`tsconfig.json`

**示例:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api/client'
import type { User } from '@/types'
```

## 错误处理

**API 错误处理:**
- 使用自定义 `ApiError` 类，包含 `status`, `code`, `message`, `data`
- 文件：`src/lib/api/client.ts`
- 模式：
  ```typescript
  export class ApiError extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
      public data?: unknown
    ) {
      super(message)
      this.name = 'ApiError'
    }
  }
  ```

**Try-Catch 模式:**
- 使用 `try/catch/finally` 处理异步操作
- 在 `catch` 中返回统一的错误响应格式
- 在 `finally` 中清理资源（如清除定时器）

**Hooks 中的错误处理:**
```typescript
try {
  const response = await api.get('/users/me')
  if (response.success && response.data) {
    setUser(response.data)
  }
} catch (error) {
  console.error('Failed to fetch user:', error)
  // 不中断应用，保持降级状态
}
```

**验证错误:**
- 使用 Zod 进行运行时验证（依赖中有 `zod` v4.3.6）
- Hooks 中抛出带有描述性消息的 `Error`

## 状态管理

**Zustand:**
- 主要状态管理库 (`zustand` v5.0.2)
- 使用 `create` 函数创建 store
- 使用 `subscribeWithSelector` 中间件支持订阅
- 文件示例：`src/stores/historyStore.ts`

**Zustand Store 模式:**
```typescript
interface State {
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]
  maxHistory: number
  isUndoingOrRedoing: boolean
}

interface Actions {
  pushEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void
  undo: () => Promise<void>
  redo: () => Promise<void>
  clear: () => void
}

export const useHistoryStore = create<State & Actions>()(
  subscribeWithSelector((set, get) => ({
    // state and actions
  }))
)
```

**React Context:**
- 用于认证状态 (`AuthProvider`)
- 文件：`src/hooks/useAuth.tsx`
- 模式：
  ```typescript
  const AuthContext = createContext<AuthContextType | undefined>(undefined)

  export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
  }
  ```

**React Query:**
- 用于服务器状态缓存 (`@tanstack/react-query` v5.62.0)
- 与 Zustand 配合使用：Zustand 管理 UI 状态，React Query 管理 API 数据

## 组件模式

**UI 组件 (基于 shadcn/ui):**
- 使用 `class-variance-authority` (cva) 定义变体
- 使用 `forwardRef` 支持 ref 转发
- 文件示例：`src/components/ui/button.tsx`

```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "..." },
    size: { default: "...", sm: "..." }
  },
  defaultVariants: { variant: "default", size: "default" }
})

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
)
```

**工具函数:**
- `cn()` 函数用于合并类名 (`tailwind-merge` + `clsx`)
- 文件：`src/lib/utils.ts`

## 注释规范

**JSDoc:**
- 在公共 API、复杂函数和类型定义上使用 JSDoc
- 中文注释
- 示例：
  ```typescript
  /**
   * History Store
   * 撤销/重做状态管理 - 基于 Zustand
   */
  ```

**行内注释:**
- 使用中文
- 解释"为什么"而非"是什么"

---

*约定分析：2026-03-25*
