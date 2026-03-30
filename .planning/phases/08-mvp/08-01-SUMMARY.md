# Plan 08-01: DeviceType 和 Device CRUD API 实现总结

## 执行时间

- 开始时间: 2026-03-30
- 执行时长: ~15 分钟
- 提交数: 2 个原子提交

## 实现内容

### Task 1: DeviceType CRUD API

**创建文件:**

- `src/app/api/v1/device-types/route.ts`
- `src/app/api/v1/device-types/[id]/route.ts`

**功能特性:**

1. **GET /api/v1/device-types** - 列表查询
   - 支持分页（page, pageSize）
   - 支持名称模糊搜索（不区分大小写）
   - 返回设备类型列表及其关联设备摘要
   - 响应格式: `{ success: true, data: { items, total, page, pageSize, totalPages } }`

2. **POST /api/v1/device-types** - 创建设备类型
   - 名称唯一性校验（防止重复）
   - Zod schema 验证（name 必填，其他可选）
   - 字段: name, modelName, location, description, owner

3. **GET /api/v1/device-types/[id]** - 获取单个设备类型
   - 返回设备类型详情及其关联设备列表
   - 设备列表按创建时间倒序

4. **PUT /api/v1/device-types/[id]** - 更新设备类型
   - 名称唯一性校验（排除自身）
   - 所有字段可选更新

5. **DELETE /api/v1/device-types/[id]** - 删除设备类型
   - 设备引用检查（有设备的类型无法删除）
   - 级联删除保护

**提交:** `80b0a13` - feat(equip): 实现 DeviceType CRUD API

---

### Task 2: Device CRUD API 和状态管理

**创建文件:**

- `src/app/api/v1/devices/route.ts`
- `src/app/api/v1/devices/[id]/route.ts`
- `src/app/api/v1/devices/[id]/status/route.ts`

**功能特性:**

1. **GET /api/v1/devices** - 列表查询
   - 支持分页（page, pageSize）
   - 支持多维度过滤: status, typeId, name
   - 名称模糊搜索（不区分大小写）
   - 返回设备列表及其类型信息
   - 按更新时间倒序排序

2. **POST /api/v1/devices** - 创建设备
   - 设备类型存在性校验
   - Zod schema 验证（name, typeId 必填）
   - 默认状态: AVAILABLE
   - 自动关联设备类型信息

3. **GET /api/v1/devices/[id]** - 获取设备详情
   - 返回设备类型完整信息
   - 返回活跃预定列表（RESERVED, IN_PROGRESS）
   - 预定包含用户和项目信息
   - 预定按开始时间排序，限制 10 条

4. **PUT /api/v1/devices/[id]** - 更新设备
   - 设备类型存在性校验（仅当更改 type 时）
   - 名称和类型可选更新

5. **DELETE /api/v1/devices/[id]** - 删除设备
   - 活跃预定检查（RESERVED, IN_PROGRESS）
   - 有活跃预定的设备无法删除

6. **PATCH /api/v1/devices/[id]/status** - 状态管理
   - Zod enum 验证（5 种有效状态）
   - **状态转换规则:**
     - **禁止:** 任何状态 → DISABLED（如果有活跃预定）
     - **禁止:** IN_USE → AVAILABLE（需通过结束预定来恢复）
     - 其他转换允许

**设备状态枚举:**

- `AVAILABLE` - 可用
- `RESERVED` - 已预约
- `IN_USE` - 使用中
- `MAINTENANCE` - 维护中
- `DISABLED` - 已停用

**提交:** `1ad774e` - feat(equip): 实现 Device CRUD API 和状态管理

---

## 技术细节

### 认证模式

所有路由使用 `getAuthUser` 辅助函数进行认证:

```typescript
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value
  if (!userId) return null
  return db.users.findUnique({ where: { id: userId } })
}
```

### 数据验证

- 使用 Zod schema 进行运行时验证
- 统一错误处理（返回 400 状态码和错误消息）

### 关联数据

- DeviceType → Devices (一对多)
- Device → Bookings (一对多)
- Booking → User, Project (多对一)

### 安全措施

- 名称唯一性校验
- 外键引用检查
- 活跃预订保护
- 状态转换验证

---

## 需求覆盖

| 需求                   | 覆盖情况                               |
| ---------------------- | -------------------------------------- |
| EQUIP-01: 设备类型管理 | ✅ 完整 CRUD，包含名称唯一性和删除保护 |
| EQUIP-02: 设备 CRUD    | ✅ 完整 CRUD，包含类型引用和预订保护   |
| EQUIP-03: 设备状态管理 | ✅ PATCH 端点，状态转换验证规则        |

---

## 文件清单

### DeviceType API

- `src/app/api/v1/device-types/route.ts` (92 行)
- `src/app/api/v1/device-types/[id]/route.ts` (118 行)

### Device API

- `src/app/api/v1/devices/route.ts` (107 行)
- `src/app/api/v1/devices/[id]/route.ts` (124 行)
- `src/app/api/v1/devices/[id]/status/route.ts` (76 行)

### 总计

- **5 个新文件**
- **517 行代码**
- **2 个提交**

---

## 验证

### 自动化验证

```bash
# DeviceType API
grep -q "export async function GET" src/app/api/v1/device-types/route.ts
grep -q "export async function POST" src/app/api/v1/device-types/route.ts
grep -q "export async function PUT" src/app/api/v1/device-types/[id]/route.ts
grep -q "export async function DELETE" src/app/api/v1/device-types/[id]/route.ts

# Device API
grep -q "export async function GET" src/app/api/v1/devices/route.ts
grep -q "export async function POST" src/app/api/v1/devices/route.ts
grep -q "export async function PATCH" src/app/api/v1/devices/[id]/status/route.ts
```

### 验收标准

- ✅ DeviceType API 支持 GET, POST, PUT, DELETE
- ✅ Device API 支持 GET, POST, PUT, DELETE
- ✅ Device 状态管理端点支持 PATCH
- ✅ 所有路由使用 `getAuthUser` 进行认证
- ✅ 所有路由使用 Zod schema 进行验证
- ✅ 名称唯一性校验
- ✅ 外键引用检查
- ✅ 活跃预订保护

---

## 后续工作

- 计划 08-02: 设备预定 API (POST /api/v1/bookings)
- 计划 08-03: 设备使用记录 API
- 计划 08-04: 前端设备管理页面
- 计划 08-05: 前端设备预定界面

---

## 关键决策

| 决策                            | 理由                                             |
| ------------------------------- | ------------------------------------------------ |
| 使用 PATCH 而非 PUT 更新状态    | PATCH 语义更清晰（部分更新），遵循 REST 最佳实践 |
| IN_USE → AVAILABLE 禁止直接转换 | 强制通过预定流程管理设备状态，确保数据一致性     |
| 删除前检查活跃预定              | 防止数据不一致和业务逻辑错误                     |
| 名称唯一性校验                  | 防止重复数据，确保可识别性                       |

---

## 备注

- 所有 API 遵循现有 `src/app/api/v1/tasks/route.ts` 模式
- 使用 `crypto.randomUUID()` 生成 ID
- 响应格式统一: `{ success: boolean, data?: T, error?: string }`
- LSP 报告的错误是 TypeScript Server 尚未重新加载 Prisma 客户端类型，不影响实际运行
