#!/bin/bash

# 测试完善计划 - 启动脚本
# 用法：./start-test-fix.sh [phase1|phase2|status]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查前置条件
check_prerequisites() {
    print_info "检查前置条件..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装"
        exit 1
    fi
    
    # 检查 Docker (用于测试数据库)
    if ! command -v docker &> /dev/null; then
        print_warning "Docker 未安装，集成测试可能无法运行"
    fi
    
    print_success "前置检查通过"
}

# 启动测试数据库
start_test_db() {
    print_info "启动测试数据库..."
    
    if command -v docker &> /dev/null; then
        if ! docker ps | grep -q test-postgres; then
            docker start test-postgres 2>/dev/null || {
                print_warning "无法启动 test-postgres 容器，请手动启动"
                return 1
            }
            print_success "测试数据库已启动"
        else
            print_success "测试数据库已在运行"
        fi
    else
        print_warning "Docker 不可用，跳过数据库启动"
    fi
}

# 生成 Prisma 客户端
generate_prisma() {
    print_info "生成 Prisma 客户端..."
    npm run db:generate
    print_success "Prisma 客户端已生成"
}

# 启动阶段 1
start_phase1() {
    print_info "启动阶段 1: 集成测试修复"
    
    # 检查是否已有工作分支
    if git show-ref --verify --quiet refs/heads/test-fix-phase-1; then
        print_info "切换到现有分支 test-fix-phase-1..."
        git checkout test-fix-phase-1
    else
        print_info "创建工作分支 test-fix-phase-1..."
        git checkout -b test-fix-phase-1
    fi
    
    print_success "阶段 1 工作区已准备"
    
    echo ""
    print_info "下一步操作:"
    echo "1. 运行基线测试：npm run test:unit 2>&1 | tee /tmp/test-baseline.txt"
    echo "2. 查看详细计划：cat docs/plans/2026-03-03-test-fix-phase-1-plan.md"
    echo "3. 开始修复 Task 1.1: ProjectMember.role 枚举值"
    echo ""
    print_warning "提示：按照计划文档中的任务列表逐个完成"
}

# 启动阶段 2
start_phase2() {
    print_info "启动阶段 2: 覆盖率提升"
    
    # 检查阶段 1 是否完成
    print_info "运行快速测试检查阶段 1 完成情况..."
    if npm run test:unit -- --run --reporter=basic 2>&1 | grep -q "FAIL"; then
        print_warning "阶段 1 可能未完成，仍有测试失败"
        read -p "确定要启动阶段 2 吗？(y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            print_info "请先完成阶段 1"
            exit 0
        fi
    fi
    
    # 创建工作分支
    if git show-ref --verify --quiet refs/heads/test-fix-phase-2; then
        print_info "切换到现有分支 test-fix-phase-2..."
        git checkout test-fix-phase-2
    else
        print_info "创建工作分支 test-fix-phase-2..."
        git checkout -b test-fix-phase-2
    fi
    
    print_success "阶段 2 工作区已准备"
    
    echo ""
    print_info "下一步操作:"
    echo "1. 查看当前覆盖率：npm run test:unit:coverage"
    echo "2. 查看详细计划：cat docs/plans/2026-03-03-coverage-improvement-plan.md"
    echo "3. 开始编写 API 路由测试"
    echo ""
    print_warning "提示：按照计划文档中的任务列表逐个完成"
}

# 显示状态
show_status() {
    print_info "=== 测试完善计划状态 ==="
    echo ""
    
    # Git 状态
    print_info "当前分支:"
    git branch --show-current
    echo ""
    
    # 运行快速测试
    print_info "运行快速测试..."
    if timeout 60 npm run test:unit -- --run --reporter=basic 2>&1 | tail -20; then
        print_success "测试运行完成"
    else
        print_warning "测试运行失败或超时"
    fi
    echo ""
    
    # 覆盖率状态（如果有）
    if [ -f coverage/coverage-summary.json ]; then
        print_info "覆盖率摘要:"
        cat coverage/coverage-summary.json | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    total = data.get('total', {})
    print(f\"  Statements: {total.get('statements.pct', 'N/A')}%\")
    print(f\"  Branches: {total.get('branches.pct', 'N/A')}%\")
    print(f\"  Functions: {total.get('functions.pct', 'N/A')}%\")
    print(f\"  Lines: {total.get('lines.pct', 'N/A')}%\")
except:
    print('  无法解析覆盖率数据')
" 2>/dev/null || print_warning "无法解析覆盖率数据"
    else
        print_warning "覆盖率报告尚未生成"
    fi
    echo ""
    
    # 计划文档状态
    print_info "计划文档:"
    if [ -f docs/plans/2026-03-03-test-fix-phase-1-plan.md ]; then
        echo "  ✅ 阶段 1 计划: docs/plans/2026-03-03-test-fix-phase-1-plan.md"
    else
        echo "  ❌ 阶段 1 计划: 未找到"
    fi
    
    if [ -f docs/plans/2026-03-03-coverage-improvement-plan.md ]; then
        echo "  ✅ 阶段 2 计划: docs/plans/2026-03-03-coverage-improvement-plan.md"
    else
        echo "  ❌ 阶段 2 计划: 未找到"
    fi
    
    if [ -f docs/plans/2026-03-03-test-improvement-master-plan.md ]; then
        echo "  ✅ 总览文档：docs/plans/2026-03-03-test-improvement-master-plan.md"
    else
        echo "  ❌ 总览文档：未找到"
    fi
}

# 显示帮助
show_help() {
    echo "测试完善计划 - 启动脚本"
    echo ""
    echo "用法：$0 [command]"
    echo ""
    echo "命令:"
    echo "  phase1    启动阶段 1 (集成测试修复)"
    echo "  phase2    启动阶段 2 (覆盖率提升)"
    echo "  status    显示当前状态"
    echo "  help      显示此帮助信息"
    echo ""
    echo "如果不指定命令，将运行前置检查和状态显示"
}

# 主函数
main() {
    echo "======================================"
    echo "   项目管理系统 - 测试完善计划"
    echo "======================================"
    echo ""
    
    case "${1:-}" in
        phase1)
            check_prerequisites
            start_test_db
            generate_prisma
            start_phase1
            ;;
        phase2)
            check_prerequisites
            start_phase2
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            check_prerequisites
            show_status
            ;;
        *)
            print_error "未知命令：$1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
