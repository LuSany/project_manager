#!/bin/bash
# OnlyOffice 启动修复脚本
# 解决 PostgreSQL 残留文件导致的服务无法启动问题
#
# 问题根源:
# - Docker 停止容器时 PostgreSQL 未优雅关闭
# - 残留的 socket 和 pid 文件阻止 PostgreSQL 启动
# - Supervisor 等待 PostgreSQL 卡住，导致所有服务无法启动
#
# 使用方法:
#   ./onlyoffice/fix-startup.sh           # 修复并启动服务
#   ./onlyoffice/fix-startup.sh --status  # 仅检查状态

set -e

CONTAINER_NAME="pm-onlyoffice"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo "${RED}[ERROR]${NC} $1"; }

# 检查容器是否运行
check_container() {
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        log_error "容器 $CONTAINER_NAME 未运行"
        return 1
    fi
    return 0
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."

    # PostgreSQL
    PG_STATUS=$(docker exec "$CONTAINER_NAME" service postgresql status 2>&1 || echo "unknown")
    if echo "$PG_STATUS" | grep -q "down"; then
        echo "  PostgreSQL: ${RED}DOWN${NC}"
        return 1
    elif echo "$PG_STATUS" | grep -q "running"; then
        echo "  PostgreSQL: ${GREEN}RUNNING${NC}"
    else
        echo "  PostgreSQL: ${YELLOW}UNKNOWN${NC}"
    fi

    # Nginx
    NGINX_STATUS=$(docker exec "$CONTAINER_NAME" service nginx status 2>&1 || echo "not running")
    if echo "$NGINX_STATUS" | grep -q "not running"; then
        echo "  Nginx: ${RED}DOWN${NC}"
        return 1
    else
        echo "  Nginx: ${GREEN}RUNNING${NC}"
    fi

    # RabbitMQ
    RABBITMQ_STATUS=$(docker exec "$CONTAINER_NAME" service rabbitmq-server status 2>&1 || echo "not running")
    if echo "$RABBITMQ_STATUS" | grep -q -E "(not running|stopped|FAILED)"; then
        echo "  RabbitMQ: ${RED}DOWN${NC}"
        return 1
    else
        echo "  RabbitMQ: ${GREEN}RUNNING${NC}"
    fi

    # Redis
    REDIS_STATUS=$(docker exec "$CONTAINER_NAME" service redis-server status 2>&1 || echo "stopped")
    if echo "$REDIS_STATUS" | grep -q "stopped"; then
        echo "  Redis: ${RED}DOWN${NC}"
        return 1
    else
        echo "  Redis: ${GREEN}RUNNING${NC}"
    fi

    # Supervisor (docservice & converter)
    SUPERVISOR_STATUS=$(docker exec "$CONTAINER_NAME" supervisorctl status ds:docservice 2>&1 || echo "not running")
    if echo "$SUPERVISOR_STATUS" | grep -q "RUNNING"; then
        echo "  DocService: ${GREEN}RUNNING${NC}"
        echo "  Converter: ${GREEN}RUNNING${NC}"
    else
        echo "  DocService: ${RED}DOWN${NC}"
        return 1
    fi

    return 0
}

# 检查健康状态
check_health() {
    HEALTH=$(curl -s --connect-timeout 5 http://localhost:8082/healthcheck 2>&1 || echo "false")
    if [ "$HEALTH" = "true" ]; then
        echo "  Healthcheck: ${GREEN}PASS${NC}"
        return 0
    else
        echo "  Healthcheck: ${RED}FAIL${NC}"
        return 1
    fi
}

# 清理 PostgreSQL 残留文件
cleanup_postgresql() {
    log_info "清理 PostgreSQL 残留文件..."

    # 清理 socket 文件和 pid 文件
    docker exec "$CONTAINER_NAME" rm -f \
        /var/run/postgresql/.s.PGSQL.5432 \
        /var/run/postgresql/16-main.pid \
        /var/run/postgresql/.s.PGSQL.5432.lock \
        2>/dev/null || true

    # 清理 supervisor 残留
    docker exec "$CONTAINER_NAME" rm -f \
        /var/run/supervisor.sock \
        /var/run/supervisord.pid \
        2>/dev/null || true

    log_info "清理完成"
}

# 启动所有服务
start_services() {
    log_info "启动 PostgreSQL..."
    docker exec "$CONTAINER_NAME" service postgresql start 2>&1 || {
        log_error "PostgreSQL 启动失败"
        return 1
    }

    # 等待 PostgreSQL 就绪
    for i in {1..10}; do
        if docker exec "$CONTAINER_NAME" pg_isready -h localhost 2>&1 | grep -q "accepting connections"; then
            log_info "PostgreSQL 就绪"
            break
        fi
        sleep 1
    done

    log_info "启动 Nginx..."
    docker exec "$CONTAINER_NAME" service nginx start 2>&1

    log_info "启动 RabbitMQ..."
    docker exec "$CONTAINER_NAME" service rabbitmq-server start 2>&1

    log_info "启动 Redis..."
    docker exec "$CONTAINER_NAME" service redis-server start 2>&1

    log_info "启动 Supervisor..."
    docker exec "$CONTAINER_NAME" /usr/bin/supervisord -c /etc/supervisor/supervisord.conf 2>&1 || {
        # 如果 supervisor 已运行，重启服务
        docker exec "$CONTAINER_NAME" supervisorctl restart ds:docservice ds:converter 2>&1 || true
    }

    # 等待服务就绪
    sleep 5

    # 检查 supervisor 服务
    for i in {1..15}; do
        if docker exec "$CONTAINER_NAME" supervisorctl status ds:docservice 2>&1 | grep -q "RUNNING"; then
            log_info "DocService 运行中"
            break
        fi
        sleep 1
    done

    log_info "服务启动完成"
}

# 主逻辑
main() {
    case "$1" in
        --status)
            check_container
            check_services
            check_health
            exit $?
            ;;
        --fix-only)
            check_container || exit 1
            cleanup_postgresql
            start_services
            ;;
        *)
            check_container || exit 1

            # 先检查状态
            if check_services && check_health; then
                log_info "服务已正常运行，无需修复"
                exit 0
            fi

            # 需要修复
            log_warn "服务异常，开始修复..."
            cleanup_postgresql
            start_services

            # 验证修复结果
            sleep 10
            if check_health; then
                log_info "修复成功！"
                exit 0
            else
                log_error "修复失败，请手动检查"
                exit 1
            fi
            ;;
    esac
}

main "$@"