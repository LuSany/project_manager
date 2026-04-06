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

---

## 2026-04-04 更新：下载超时问题

### 问题症状

用户报告预览仍然失败，OnlyOffice日志显示：

```
error downloadFile:url=http://host.docker.internal:3000/api/v1/files/xxx/download
code:ETIMEDOUT
CanceledError: canceled
```

### 根因分析

OnlyOffice 默认下载超时为 2 分钟：

```json
"downloadTimeout": {
  "connectionAndInactivity": "2m",
  "wholeCycle": "2m"
}
```

在某些情况下（应用响应慢、网络波动），2分钟可能不足。

### 修复方案

更新 `local.json` 增加下载超时到 5 分钟：

```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      }
    },
    "converter": {
      "downloadTimeout": {
        "connectionAndInactivity": "5m",
        "wholeCycle": "5m"
      }
    }
  }
}
```

### 应用修复

```bash
# 更新配置
docker exec pm-onlyoffice sh -c 'cat > /etc/onlyoffice/documentserver/local.json << "EOF"
{...配置内容...}
EOF'

# 重启服务
docker exec pm-onlyoffice supervisorctl restart ds:docservice ds:converter
```

### 验证结果

| 检查项               | 结果               |
| -------------------- | ------------------ |
| OnlyOffice健康检查   | ✅ 返回 "true"     |
| 下载测试（从容器内） | ✅ HTTP 200, 0.28s |

### 用户验证步骤

1. 刷新评审详情页面
2. 点击评审材料的「预览」按钮
3. 确认文档正常显示

---

## 2026-04-04 更新：缓存 URL 403 Forbidden

### 问题症状

用户报告预览失败，浏览器错误：

```
The FetchEvent for "http://localhost:8082/.../web-apps/apps/spreadsheeteditor/main/index.html" resulted in a network error response
Uncaught (in promise) TypeError: Failed to fetch at document_editor_service_worker.js
Editor.bin?md5=xxx&expires=xxx:1 Failed to load resource: 403 (Forbidden)
```

### 根因分析

**关键发现：** nginx 使用 `secure_link` 验证缓存 URL 签名，公式为：

```
md5(expires + uri + secret)
```

- nginx `secure_link_secret` = `3kvVrM37aHShAoDRwiow`（正确）
- OnlyOffice 缓存 URL 的 md5 签名 = `rDa6jMVRPCcCKNgjy3j2Bw`（不匹配）
- 预期签名 = `iC989k8nSzUxVYoT62l9Yw`

**根本原因：** OnlyOffice 的 `default.json` 中有：

```json
"storage": {
  "fs": {
    "secretString": "verysecretstring"  // 默认密钥
  }
}
```

OnlyOffice 使用 `storage.fs.secretString` 生成缓存 URL 签名，但 `local.json` 只配置了 `services.CoAuthoring.secret`，没有覆盖 `storage.fs.secretString`。

### 修复方案

更新 `local.json` 添加 `storage.fs.secretString` 配置：

```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,
        "allowMetaIPAddress": true
      },
      "secret": {
        "browser": { "string": "3kvVrM37aHShAoDRwiow", "file": "" },
        "inbox": { "string": "3kvVrM37aHShAoDRwiow", "file": "" },
        "outbox": { "string": "3kvVrM37aHShAoDRwiow", "file": "" },
        "session": { "string": "3kvVrM37aHShAoDRwiow", "file": "" }
      },
      "token": {
        "enable": {
          "browser": false,
          "request": {
            "inbox": false,
            "outbox": false
          }
        }
      }
    },
    "converter": {
      "downloadTimeout": {
        "connectionAndInactivity": "5m",
        "wholeCycle": "5m"
      }
    }
  },
  "storage": {
    "fs": {
      "secretString": "3kvVrM37aHShAoDRwiow"
    }
  },
  "secret": {
    "secretString": "3kvVrM37aHShAoDRwiow"
  },
  "aesEncrypt": {
    "secret": "3kvVrM37aHShAoDRwiow"
  }
}
```

### 应用修复

```bash
# 更新容器内配置
docker exec pm-onlyoffice sh -c 'cat > /etc/onlyoffice/documentserver/local.json << "EOF"
{...配置内容...}
EOF'

# 重启服务
docker exec pm-onlyoffice supervisorctl restart ds:docservice ds:converter

# 清除旧缓存（旧签名不匹配）
docker exec pm-onlyoffice rm -rf /var/lib/onlyoffice/documentserver/App_Data/cache/files/data/[hash]/
```

### 验证结果

| 检查项                        | 结果                    |
| ----------------------------- | ----------------------- |
| OnlyOffice 健康检查           | ✅ 返回 "true"          |
| 缓存 URL 签名测试（手动计算） | ✅ HTTP 200             |
| 配置文件已更新                | ✅ storage.fs 已配置    |
| 服务重启                      | ✅ docservice/converter |
| 旧缓存已清除                  | ✅                      |

### 用户验证步骤

1. 刷新评审详情页面
2. 点击评审材料的「预览」按钮
3. 等待 OnlyOffice 重新下载并缓存文档（可能需要几秒）
4. 确认文档正常显示

## 2026-04-06 更新：容器重启后配置丢失

### 问题症状

OnlyOffice 容器重启后，评审材料预览失败，日志显示：

```
Error: DNS lookup 172.17.0.1 is not allowed. Because, It is private IP address.
```

### 根因分析

容器重启后，`/etc/onlyoffice/documentserver/local.json` 被重置为默认配置，缺少 `request-filtering-agent` 配置。

OnlyOffice 的配置位于容器内部文件系统，不随数据卷持久化。

### 持久化修复方案

#### 方案一：Docker Compose 挂载配置文件（已实施）

修改 `docker-compose.onlyoffice.yml`，将配置文件挂载到数据目录：

```yaml
volumes:
  # 持久化配置：挂载配置文件到数据目录
  - ./onlyoffice/local.json:/var/www/onlyoffice/Data/local.json:ro
```

#### 方案二：手动应用配置（备用）

使用 `onlyoffice/init-config.sh` 脚本：

```bash
# 应用配置
./onlyoffice/init-config.sh

# 验证配置
./onlyoffice/init-config.sh --verify
```

### 验证结果

| 检查项 | 结果 |
|--------|------|
| OnlyOffice 健康检查 | ✅ true |
| 私有IP访问配置 | ✅ allowPrivateIPAddress: true |
| 容器状态 | ✅ healthy |

---

## 技术说明

### OnlyOffice 配置优先级

1. `/etc/onlyoffice/documentserver/default.json` - 默认配置（不可修改）
2. `/etc/onlyoffice/documentserver/local.json` - 本地覆盖配置

### 关键配置项

```json
{
  "services": {
    "CoAuthoring": {
      "request-filtering-agent": {
        "allowPrivateIPAddress": true,  // 允许访问私有IP
        "allowMetaIPAddress": true      // 允许访问元数据IP
      }
    }
  },
  "storage": {
    "fs": {
      "secretString": "3kvVrM37aHShAoDRwiow"  // 缓存URL签名密钥
    }
  }
}
```

### 自动化建议

可以在应用启动时检查 OnlyOffice 配置，如果配置不正确则自动应用：

```typescript
// src/lib/preview/onlyoffice-config-check.ts
async function ensureOnlyOfficeConfig() {
  const response = await fetch(`${ONLYOFFICE_URL}/healthcheck`);
  // 如果配置不正确，调用初始化脚本
}
```
