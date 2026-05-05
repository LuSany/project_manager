import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 默认看板列配置
const DEFAULT_BOARD_COLUMNS = [
  { id: 'pending', title: '待评审', status: 'PENDING', color: '#FFA940', wipLimit: null, order: 0 },
  { id: 'approved', title: '已批准', status: 'APPROVED', color: '#1890FF', wipLimit: null, order: 1 },
  { id: 'in_progress', title: '开发中', status: 'IN_PROGRESS', color: '#52C41A', wipLimit: null, order: 2 },
  { id: 'completed', title: '已完成', status: 'COMPLETED', color: '#8C8C8C', wipLimit: null, order: 3 },
];

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request);
  if (!userId) return null;
  return db.users.findUnique({ where: { id: userId } });
}

// GET /api/v1/projects/[id]/board-config - 获取看板配置
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    let config = await db.requirement_board_configs.findUnique({
      where: { projectId },
    });

    // 如果不存在配置，创建默认配置
    if (!config) {
      config = await db.requirement_board_configs.create({
        data: {
          id: crypto.randomUUID(),
          projectId,
          columns: DEFAULT_BOARD_COLUMNS,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("获取看板配置失败:", error);
    return NextResponse.json(
      { success: false, error: "获取看板配置失败" },
      { status: 500 }
    );
  }
}

// PUT /api/v1/projects/[id]/board-config - 更新看板配置
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { columns } = body;

    // 验证权限：只有项目所有者或管理员可以修改
    const project = await db.projects.findUnique({
      where: { id: projectId },
      include: {
        project_members: {
          where: { userId: user.id, role: { in: ['PROJECT_OWNER', 'PROJECT_ADMIN'] } },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "项目不存在" },
        { status: 404 }
      );
    }

    if (project.ownerId !== user.id && project.project_members.length === 0 && user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: "无权修改看板配置" },
        { status: 403 }
      );
    }

    // 更新或创建配置
    const config = await db.requirement_board_configs.upsert({
      where: { projectId },
      update: { columns },
      create: {
        id: crypto.randomUUID(),
        projectId,
        columns,
      },
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("更新看板配置失败:", error);
    return NextResponse.json(
      { success: false, error: "更新看板配置失败" },
      { status: 500 }
    );
  }
}