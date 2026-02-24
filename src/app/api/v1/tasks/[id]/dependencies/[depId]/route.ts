import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

// DELETE /api/v1/tasks/[id]/dependencies/[depId] - 移除任务依赖
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; depId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const { id: taskId, depId } = await params;

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

    // 验证依赖关系是否存在
    const dependency = await db.taskDependency.findUnique({
      where: { id: depId },
    });

    if (!dependency) {
      return NextResponse.json(
        { success: false, error: "依赖关系不存在" },
        { status: 404 }
      );
    }

    // 验证依赖关系是否属于该任务
    if (dependency.taskId !== taskId) {
      return NextResponse.json(
        { success: false, error: "依赖关系不属于该任务" },
        { status: 403 }
      );
    }

    // 删除依赖关系
    await db.taskDependency.delete({
      where: { id: depId },
    });

    return NextResponse.json({
      success: true,
      message: "移除依赖关系成功",
    });
  } catch (error) {
    console.error("移除任务依赖失败:", error);
    return NextResponse.json(
      { success: false, error: "移除任务依赖失败" },
      { status: 500 }
    );
  }
}
