#!/bin/bash
# OnlyOffice 配置自动应用脚本
# 检测并应用持久化配置

set -e

CONFIG_SRC="/var/www/onlyoffice/Data/local.json"
CONFIG_DST="/etc/onlyoffice/documentserver/local.json"
MARKER_FILE="/var/www/onlyoffice/Data/.config_applied"

# 检查是否需要应用配置
if [ -f "$CONFIG_SRC" ] && [ ! -f "$MARKER_FILE" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Applying OnlyOffice configuration..."

    # 复制配置
    cp "$CONFIG_SRC" "$CONFIG_DST"

    # 标记已应用
    touch "$MARKER_FILE"

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Configuration applied successfully!"
fi

# 如果服务已运行，重启以应用配置
if command -v supervisorctl &> /dev/null; then
    if supervisorctl status ds:docservice 2>/dev/null | grep -q "RUNNING"; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restarting services to apply configuration..."
        supervisorctl restart ds:docservice ds:converter
    fi
fi