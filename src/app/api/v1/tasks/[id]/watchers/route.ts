import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// 添加关注者验证 Schema
const addWatcherSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
});

// GET /api/v1/tasks/[id]/watchers - 获取任务的所有关注者
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId } = await params;

    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在或无权访问" },
        { status: 404 }
      );
    }

    const watchers = await db.taskWatcher.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: watchers,
    });
  } catch (error) {
    console.error("获取任务关注者失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务关注者失败" },
      { status: 500 }
    );
  }
}

// POST /api/v1/tasks/[id]/watchers - 添加关注者
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { userId } = addWatcherSchema.parse(body);

    // 验证任务是否存在且用户有权限访问
    const task = await db.task.findFirst({
      where: {
        id: taskId,
        project: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在或无权访问" },
        { status: 404 }
      );
    }

    // 验证目标用户是否为项目成员
    const targetUser = await db.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "目标用户不是项目成员" },
        { status: 400 }
      );
    }

    // 检查是否已经关注
    const existingWatcher = await db.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (existingWatcher) {
      return NextResponse.json(
        { success: false, error: "用户已关注该任务" },
        { status: 400 }
      );
    }

    // 创建关注关系
    const watcher = await db.taskWatcher.create({
      data: {
        taskId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: watcher,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("添加任务关注者失败:", error);
    return NextResponse.json(
      { success: false, error: "添加任务关注者失败" },
      { status: 500 }
    );
  }
}
