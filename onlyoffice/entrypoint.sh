#!/bin/bash
# OnlyOffice 启动入口脚本
# 在官方启动脚本前先应用配置

CONFIG_SRC="/var/www/onlyoffice/Data/local.json"
CONFIG_DST="/etc/onlyoffice/documentserver/local.json"

# 如果配置文件存在于数据目录，复制到配置目录
if [ -f "$CONFIG_SRC" ]; then
    echo "Applying custom OnlyOffice configuration..."
    cp "$CONFIG_SRC" "$CONFIG_DST"
fi

# 执行官方启动脚本
exec /app/ds/run-document-server.sh