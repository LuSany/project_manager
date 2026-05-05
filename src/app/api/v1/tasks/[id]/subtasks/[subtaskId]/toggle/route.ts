import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser as getAuthUserIdentity } from '@/lib/auth/get-auth-user'

// 辅助函数：获取认证用户
async function getAuthUser(request: NextRequest) {
  const { userId } = await getAuthUserIdentity(request);
  if (!userId) return null;
  return prisma.users.findUnique({ where: { id: userId } });
}

// PUT /api/v1/tasks/[id]/subtasks/[subtaskId]/toggle - 切换子任务完成状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  const { id, subtaskId } = await params;

  try {
    // 验证子任务是否存在且属于指定任务，且用户有权限访问
    const subTask = await prisma.subtasks.findFirst({
      where: {
        id: subtaskId,
        taskId: id,
        tasks: {
          projects: {
            project_members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      },
    });

    if (!subTask) {
      return NextResponse.json(
        { success: false, error: "子任务不存在或无权访问" },
        { status: 404 }
      );
    }

    // 切换完成状态
    const updatedSubTask = await prisma.subtasks.update({
      where: { id: subtaskId },
      data: {
        completed: !subTask.completed,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSubTask,
    });
  } catch (error) {
    console.error("切换子任务状态失败:", error);
    return NextResponse.json(
      { success: false, error: "切换子任务状态失败" },
      { status: 500 }
    );
  }
}
