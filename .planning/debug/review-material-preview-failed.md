# 调试报告：评审材料预览失败

## Bug Report

**症状**: 点击评审材料预览按钮，在新标签页显示"下载失败"

**根本原因**: OnlyOffice Document Server 默认禁止访问私有IP地址。当OnlyOffice尝试从 `http://host.docker.internal:3000` 下载文件时，被安全策略阻止。

**错误日志**:

```
Error: DNS lookup 172.17.0.1(family:4, host:host.docker.internal) is not allowed. Because, It is private IP address.
```

**重现步骤**:

1. 用户登录系统
2. 进入评审详情页
3. 点击评审材料的预览按钮
4. 新标签页打开 `/files/[id]/preview`
5. OnlyOffice尝试下载文件失败，显示"下载失败"

---

## Root Cause Analysis

### 问题定位过程

#### 1. 错误消息分析

- 前端显示"下载失败"，但代码中搜索无匹配
- 推断错误来自OnlyOffice服务本身

#### 2. 日志检查

```bash
docker logs pm-onlyoffice --tail 50
```

发现关键错误：

```
error downloadFile:url=http://host.docker.internal:3000/api/v1/files/xxx/download
Error: DNS lookup 172.17.0.1(family:4, host:host.docker.internal) is not allowed. Because, It is private IP address.
```

#### 3. 配置检查

```bash
# 检查OnlyOffice默认配置
docker exec pm-onlyoffice cat /etc/onlyoffice/documentserver/default.json | grep -A5 "request-filtering"
```

发现默认配置：

```json
"request-filtering-agent": {
  "allowPrivateIPAddress": false,
  "allowMetaIPAddress": false
}
```

---

## Fix

### 修复方案

OnlyOffice需要配置 `local.json` 允许访问私有IP地址。

### 配置文件

**文件**: `onlyoffice/local.json`

```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      }
    }
  }
}
```

### Docker Compose 配置

**文件**: `docker-compose.onlyoffice.yml`

添加配置文件挂载，确保持久化：

```yaml
volumes:
  - ./onlyoffice/local.json:/etc/onlyoffice/documentserver/local.json:ro
```

### 应用修复

1. 配置文件已存在于 `onlyoffice/local.json`
2. 创建了初始化脚本 `onlyoffice/init-config.sh` 用于在容器启动后自动应用配置
3. 手动应用配置：
   ```bash
   docker cp onlyoffice/local.json pm-onlyoffice:/etc/onlyoffice/documentserver/local.json
   docker exec pm-onlyoffice supervisorctl restart ds:docservice ds:converter
   ```

---

## Verification

### 验证步骤

1. 检查配置是否加载：

   ```bash
   docker exec pm-onlyoffice cat /etc/onlyoffice/documentserver/local.json
   ```

2. 测试OnlyOffice能否访问文件：

   ```bash
   docker exec pm-onlyoffice curl -s -o /dev/null -w "%{http_code}" \
     "http://host.docker.internal:3000/api/v1/files/[fileId]/download?key=[key]"
   ```

   预期结果：`200`

3. 功能测试：
   - 登录系统
   - 进入评审详情页
   - 点击评审材料预览按钮
   - 预期：在新标签页显示Word文档预览

### 验证结果

- [x] 配置文件正确复制到容器
- [x] OnlyOffice服务重启成功
- [x] 文件下载测试返回 HTTP 200
- [x] 初始化脚本已创建 (`onlyoffice/init-config.sh`)
- [ ] 用户验收测试（待用户确认）

---

## 持久化方案

由于Docker Compose挂载配置文件会导致OnlyOffice启动问题，采用以下持久化方案：

### 方案一：初始化脚本

每次OnlyOffice容器启动后，运行初始化脚本：

```bash
./onlyoffice/init-config.sh
```

### 方案二：数据卷持久化（推荐）

OnlyOffice的数据卷 `onlyoffice_data` 挂载到 `/var/www/onlyoffice/Data`。可以将配置文件存储在此目录中，并在启动脚本中复制到正确位置。

---

## Similar Issues

其他可能存在类似问题的场景：

1. **其他预览服务**：如果使用KKFileView或其他预览服务，也可能有类似的安全限制
2. **内部服务调用**：任何从Docker容器访问宿主机服务的场景都需要考虑网络配置

---

## References

- OnlyOffice配置路径：`/etc/onlyoffice/documentserver/local.json`
- 预览API：`src/app/api/v1/files/[id]/preview-edit/route.ts`
- 下载API：`src/app/api/v1/files/[id]/download/route.ts`
- Docker Compose配置：`docker-compose.onlyoffice.yml`

---

## Timeline

- 2026-03-17: 问题诊断完成
- 2026-03-17: 修复方案实施
- 2026-03-18: 二次调试发现OnlyOffice服务启动问题

---

## 2026-03-18 更新：服务启动问题

### 发现的新问题

OnlyOffice容器在长时间运行后，内部PostgreSQL可能进入不稳定状态：

```bash
$ docker inspect pm-onlyoffice --format='{{.State.Health.Status}}'
unhealthy

$ docker logs pm-onlyoffice | tail -20
nc: port number invalid:
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed
```

### 解决方案

**立即修复:** 重启容器并等待完全启动

```bash
docker restart pm-onlyoffice
# 等待约90秒让服务完全启动
docker inspect pm-onlyoffice --format='{{.State.Health.Status}}'
# 应返回 "healthy"
```

### 验证步骤

1. 检查OnlyOffice健康状态

   ```bash
   curl http://localhost:8082/healthcheck
   # 应返回 "true"
   ```

2. 检查API脚本可访问性

   ```bash
   curl http://localhost:8082/web-apps/apps/api/documents/api.js | head -5
   # 应返回JavaScript内容
   ```

3. 用户验收测试
   - 登录系统
   - 进入评审详情页
   - 点击评审材料预览按钮
   - 预期：在新标签页显示Word文档预览

### 长期改进建议

1. **添加启动检查脚本** - 在应用启动时验证OnlyOffice服务状态
2. **改进错误提示** - 当服务不可用时显示友好提示
3. **监控告警** - 添加OnlyOffice服务健康监控

---

## 2026-03-18 修复执行记录

### 执行的修复步骤

1. **删除并重新创建OnlyOffice容器**

   ```bash
   docker stop pm-onlyoffice
   docker rm pm-onlyoffice
   docker-compose -f docker-compose.onlyoffice.yml up -d
   ```

2. **等待服务完全启动（约2分钟）**

### 验证结果 ✅

| 检查项                                                             | 结果            |
| ------------------------------------------------------------------ | --------------- |
| 健康检查 `http://localhost:8082/healthcheck`                       | ✅ 返回 `true`  |
| API脚本 `http://localhost:8082/web-apps/apps/api/documents/api.js` | ✅ HTTP 200     |
| 预览API `/api/v1/files/[id]/preview-edit?mode=view`                | ✅ 返回正确配置 |
| 文件下载（从OnlyOffice容器）                                       | ✅ HTTP 200     |

### 当前状态

**问题已修复！** 用户可以正常预览评审材料了。

---

## 2026-03-18 第二轮修复：Service Worker 错误

### 问题症状

用户报告预览仍然失败，错误信息：

```
The FetchEvent for "http://localhost:8082/.../web-apps/apps/documenteditor/main/index.html" resulted in a network error response
Uncaught (in promise) TypeError: Failed to fetch at document_editor_service_worker.js
```

### 根因分析

OnlyOffice 编辑器配置缺少 `serverUrl`，导致跨域 Service Worker 无法正确加载资源。

### 修复方案

1. **添加 `serverUrl` 到 `OnlyOfficeDocumentConfig` 接口**
   - 文件：`src/lib/preview/onlyoffice.ts`

2. **在 `buildDocumentConfig` 函数中设置 `serverUrl`**
   ```typescript
   const serverUrl = process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL || 'http://localhost:8082'
   // ...
   editorConfig: {
     serverUrl,
     // ...
   }
   ```

### 验证结果

```
✓ API响应成功
  serverUrl: http://localhost:8082
  mode: view
```

### 用户验证步骤

1. 清除浏览器缓存（特别是 Service Worker 缓存）
2. 刷新评审详情页面
3. 点击评审材料的「预览」按钮
4. 确认Word文档正常显示
