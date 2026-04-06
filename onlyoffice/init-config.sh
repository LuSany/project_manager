#!/bin/bash
# OnlyOffice 配置初始化脚本
# 用于在容器启动后自动配置允许访问私有IP地址并同步密钥
#
# 使用方法:
#   ./onlyoffice/init-config.sh           # 应用配置
#   ./onlyoffice/init-config.sh --verify  # 仅验证配置

set -e

CONTAINER_NAME="pm-onlyoffice"
CONFIG_DST="/etc/onlyoffice/documentserver/local.json"
LOCAL_CONFIG="$(dirname "$0")/local.json"
SECRET_KEY="3kvVrM37aHShAoDRwiow"

# 检查容器是否运行
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "错误: 容器 $CONTAINER_NAME 未运行"
    echo "请先启动容器: docker-compose -f docker-compose.onlyoffice.yml up -d"
    exit 1
fi

# 验证模式
if [ "$1" = "--verify" ]; then
    echo "验证 OnlyOffice 配置..."

    CURRENT_CONFIG=$(docker exec "$CONTAINER_NAME" cat "$CONFIG_DST" 2>/dev/null)
    NGINX_SECRET=$(docker exec "$CONTAINER_NAME" grep "secure_link_secret" /etc/nginx/conf.d/ds.conf 2>/dev/null | awk '{print $NF}' | tr -d ';')

    if echo "$CURRENT_CONFIG" | grep -q '"allowPrivateIPAddress": true'; then
        echo "✅ 配置正确: 已允许私有IP访问"
    else
        echo "❌ 配置缺失: 需要应用配置 (allowPrivateIPAddress)"
        exit 1
    fi

    if echo "$CURRENT_CONFIG" | grep -q "\"secretString\": \"$SECRET_KEY\""; then
        echo "✅ 配置正确: storage.fs.secretString 已设置"
    else
        echo "❌ 配置缺失: storage.fs.secretString 不匹配"
        exit 1
    fi

    if [ "$NGINX_SECRET" = "$SECRET_KEY" ]; then
        echo "✅ 配置正确: nginx secure_link_secret 已同步"
    else
        echo "❌ 配置缺失: nginx secure_link_secret 不匹配 (当前: $NGINX_SECRET)"
        exit 1
    fi

    exit 0
fi

# 应用配置
echo "应用 OnlyOffice 配置..."

# 步骤1: 复制配置文件到容器
docker cp "$LOCAL_CONFIG" "$CONTAINER_NAME:$CONFIG_DST"

# 步骤2: 同步 secure_link 密钥 (关键！确保 nginx 和 local.json 密钥一致)
echo "同步 secure_link 密钥..."
docker exec "$CONTAINER_NAME" /usr/bin/documentserver-update-securelink.sh -s "$SECRET_KEY" 2>&1

# 等待服务启动
sleep 3

# 验证服务状态
if docker exec "$CONTAINER_NAME" supervisorctl status ds:docservice 2>/dev/null | grep -q "RUNNING"; then
    echo "✅ OnlyOffice 配置完成，服务运行正常"
else
    echo "⚠️  配置已应用，但服务可能需要更多时间启动"
fi

# 验证健康状态
HEALTH=$(curl -s http://localhost:8082/healthcheck)
if [ "$HEALTH" = "true" ]; then
    echo "✅ OnlyOffice 健康检查通过"
else
    echo "⚠️  OnlyOffice 健康检查未通过，请稍后重试"
fi