# OnlyOffice 配置持久化方案

## 问题背景

OnlyOffice 容器重启后，以下配置会丢失：
1. `request-filtering-agent` - 允许访问私有 IP
2. `storage.fs.secretString` - 缓存 URL 签名密钥
3. `secure_link_secret` - nginx 签名密钥

导致预览失败，错误：
- `DNS lookup is not allowed. Because, It is private IP address`
- `403 Forbidden` (缓存 URL 签名不匹配)

---

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

## 推荐方案

| 场景 | 推荐方案 |
|------|----------|
| 开发环境 | 方案一：手动脚本 |
| 生产服务器 | 方案二：Systemd 服务 |
| 高可用要求 | 方案三 + 方案二 |

---

## 验证配置

```bash
./onlyoffice/init-config.sh --verify
```

预期输出：
```
✅ 配置正确: 已允许私有IP访问
✅ 配置正确: storage.fs.secretString 已设置
✅ 配置正确: nginx secure_link_secret 已同步
```

---

## 配置文件说明

| 文件 | 用途 |
|------|------|
| `onlyoffice/local.json` | OnlyOffice 主配置文件 |
| `onlyoffice/init-config.sh` | 应用配置脚本 |
| `onlyoffice/onlyoffice-config.service` | Systemd 服务定义 |
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