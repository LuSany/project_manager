#!/bin/bash
# OnlyOffice配置初始化脚本
# 用于在容器启动后自动配置允许访问私有IP地址

set -e

CONTAINER_NAME="pm-onlyoffice"
CONFIG_FILE="/etc/onlyoffice/documentserver/local.json"
LOCAL_CONFIG="/home/sany/projects/project_manager/onlyoffice/local.json"

echo "Configuring OnlyOffice to allow private IP addresses..."

# 复制配置文件到容器
docker cp "$LOCAL_CONFIG" "$CONTAINER_NAME:$CONFIG_FILE"

# 重启OnlyOffice服务
docker exec "$CONTAINER_NAME" supervisorctl restart ds:docservice ds:converter

echo "OnlyOffice configuration complete!"