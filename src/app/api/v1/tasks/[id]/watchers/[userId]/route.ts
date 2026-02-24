import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// DELETE /api/v1/tasks/[id]/watchers/[userId] - 移除关注者
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId, userId } = await params;

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

    // 检查关注关系是否存在
    const watcher = await db.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (!watcher) {
      return NextResponse.json(
        { success: false, error: "关注关系不存在" },
        { status: 404 }
      );
    }

    // 删除关注关系
    await db.taskWatcher.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "移除关注者成功",
    });
  } catch (error) {
    console.error("移除任务关注者失败:", error);
    return NextResponse.json(
      { success: false, error: "移除任务关注者失败" },
      { status: 500 }
    );
  }
}
