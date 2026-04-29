# OnlyOffice 配置持久化方案

## 问题背景

OnlyOffice 容器重启后存在两个主要问题：

### 问题一：服务无法启动（unhealthy）

**症状：**
- 容器状态长时间显示 `unhealthy`
- 健康检查失败：`curl: (7) Failed to connect to localhost port 80`
- PostgreSQL 服务状态为 `down`

**根本原因：**
- Docker 停止容器时 PostgreSQL 未优雅关闭
- 残留的 socket 文件 (`/var/run/postgresql/.s.PGSQL.5432`) 和 pid 文件阻止 PostgreSQL 启动
- Supervisor 等待 PostgreSQL 时卡住，导致所有服务无法启动

### 问题二：配置丢失

重启后以下配置会丢失：
1. `request-filtering-agent` - 允许访问私有 IP
2. `storage.fs.secretString` - 缓存 URL 签名密钥
3. `secure_link_secret` - nginx 签名密钥

导致预览失败，错误：
- `DNS lookup is not allowed. Because, It is private IP address`
- `403 Forbidden` (缓存 URL 签名不匹配)

---

## 快速修复

如果容器状态为 `unhealthy`，运行：

```bash
./onlyoffice/fix-startup.sh
```

检查状态：

```bash
./onlyoffice/fix-startup.sh --status
```

预期输出：
```
✅ PostgreSQL: RUNNING
✅ Nginx: RUNNING
✅ RabbitMQ: RUNNING
✅ Redis: RUNNING
✅ DocService: RUNNING
✅ Converter: RUNNING
✅ Healthcheck: PASS
```

## 方案一：手动脚本（推荐用于开发环境）

每次容器重启后运行：

```bash
./onlyoffice/init-config.sh
```

**优点：** 简单、可控
**缺点：** 需要手动操作

---

## 方案二：Systemd 服务（推荐用于生产环境）

自动在容器启动后应用配置。

### 安装步骤

```bash
# 1. 复制服务文件
sudo cp onlyoffice/onlyoffice-config.service /etc/systemd/system/

# 2. 编辑服务文件，修改项目路径
sudo nano /etc/systemd/system/onlyoffice-config.service
# 将 /home/sany/projects/project_manager 改为你的实际路径

# 3. 启用服务
sudo systemctl daemon-reload
sudo systemctl enable onlyoffice-config.service

# 4. 手动触发一次测试
sudo systemctl start onlyoffice-config.service

# 5. 检查状态
sudo systemctl status onlyoffice-config.service
```

**优点：** 全自动、系统级
**缺点：** 需要管理员权限

---

## 方案三：Cron 定时检查

定期检查并修复配置。

```bash
# 编辑 crontab
crontab -e

# 添加以下行（每 5 分钟检查一次）
*/5 * * * * /home/sany/projects/project_manager/onlyoffice/init-config.sh --verify || /home/sany/projects/project_manager/onlyoffice/init-config.sh >> /var/log/onlyoffice-config.log 2>&1
```

**优点：** 持续监控
**缺点：** 可能产生短暂的服务中断

---

## 方案四：Docker Sidecar 容器

使用单独的容器监控和修复配置。

创建 `docker-compose.onlyoffice-helper.yml`：

```yaml
services:
  onlyoffice-config:
    image: docker:cli
    volumes:
      - ./onlyoffice:/onlyoffice:ro
      - /var/run/docker.sock:/var/run/docker.sock
    entrypoint:
      - /bin/sh
      - -c
      - |
        while true; do
          sleep 300
          /onlyoffice/init-config.sh --verify || docker exec pm-onlyoffice /onlyoffice/init-config.sh
        done
    restart: always
```

**优点：** 容器化、易于部署
**缺点：** 额外的容器开销

---

## 推荐方案（综合）

| 场景 | 推荐方案 |
|------|----------|
| 开发环境 | 手动运行 `fix-startup.sh` 和 `init-config.sh` |
| 生产服务器 | Systemd 服务（自动修复启动 + 应用配置） |
| 高可用要求 | Systemd 服务 + Cron 定时检查 |

---

## Systemd 服务（推荐生产环境）

**重要更新：** Systemd 服务已整合启动修复功能，会自动：
1. 等待容器启动
2. 清理 PostgreSQL 残留文件
3. 启动所有服务
4. 应用 OnlyOffice 配置

### 安装步骤

```bash
# 1. 复制服务文件
sudo cp onlyoffice/onlyoffice-config.service /etc/systemd/system/

# 2. 编辑服务文件，修改项目路径（如果不是默认路径）
sudo nano /etc/systemd/system/onlyoffice-config.service
# 将 /home/sany/projects/project_manager 改为你的实际路径

# 3. 启用服务（系统启动时自动运行）
sudo systemctl daemon-reload
sudo systemctl enable onlyoffice-config.service

# 4. 手动触发一次测试
sudo systemctl start onlyoffice-config.service

# 5. 检查状态
sudo systemctl status onlyoffice-config.service
```

---

## 验证配置

```bash
# 检查服务状态
./onlyoffice/fix-startup.sh --status

# 验证 OnlyOffice 配置
./onlyoffice/init-config.sh --verify
```

预期输出：
```
✅ PostgreSQL: RUNNING
✅ Nginx: RUNNING
✅ RabbitMQ: RUNNING
✅ Redis: RUNNING
✅ DocService: RUNNING
✅ Converter: RUNNING
✅ Healthcheck: PASS
✅ 配置正确: 已允许私有IP访问
✅ 配置正确: storage.fs.secretString 已设置
✅ 配置正确: nginx secure_link_secret 已同步
```

---

## 配置文件说明

| 文件 | 用途 |
|------|------|
| `onlyoffice/fix-startup.sh` | 启动修复脚本（清理残留文件、启动服务） |
| `onlyoffice/init-config.sh` | 应用配置脚本（允许私有IP、同步密钥） |
| `onlyoffice/local.json` | OnlyOffice 主配置文件 |
| `onlyoffice/onlyoffice-config.service` | Systemd 服务定义（整合修复+配置） |
| `docker-compose.onlyoffice.yml` | Docker Compose 配置 |

---

## 故障排查

### 检查容器状态

```bash
docker ps --filter "name=pm-onlyoffice"
curl http://localhost:8082/healthcheck
```

### 检查配置

```bash
# OnlyOffice 配置
docker exec pm-onlyoffice cat /etc/onlyoffice/documentserver/local.json

# Nginx 密钥
docker exec pm-onlyoffice grep secure_link_secret /etc/nginx/conf.d/ds.conf
```

### 检查日志

```bash
docker logs pm-onlyoffice --tail 50
```