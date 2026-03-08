import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// 辅助函数：获取已认证用户
async function getAuthUser(request: NextRequest) {
  const userId = request.cookies.get('user-id')?.value;
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const task = await db.task.findUnique({
      where: { id },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 检查用户是否为项目成员或管理员
    const isProjectOwner = task.project.ownerId === user.id;
    const isAssignee = task.assignees.some(a => a.userId === user.id);
    const isAdmin = user.role === 'ADMIN';

    // 查询项目成员关系
    const projectMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.id,
        },
      },
    });

    if (!isProjectOwner && !isAssignee && !projectMember && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "无权访问此任务" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return NextResponse.json(
      { success: false, error: "获取任务详情失败" },
      { status: 500 }
    );
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // 认证检查
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "未授权，请先登录" },
      { status: 401 }
    );
  }

  try {
    const task = await db.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 检查权限：项目所有者、管理员或任务创建者可以删除
    const isProjectOwner = task.project.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    // 查询项目成员关系
    const projectMember = await db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: user.id,
        },
      },
    });

    if (!isProjectOwner && !projectMember && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "无权删除此任务" },
        { status: 403 }
      );
    }

    // 删除任务的相关数据
    await db.$transaction(async (tx) => {
      // 删除任务分配
      await tx.taskAssignee.deleteMany({
        where: { taskId: id },
      });
      // 删除任务标签
      await tx.taskTag.deleteMany({
        where: { taskId: id },
      });
      // 删除任务依赖
      await tx.taskDependency.deleteMany({
        where: { OR: [{ taskId: id }, { dependsOnId: id }] },
      });
      // 删除任务观察者
      await tx.taskWatcher.deleteMany({
        where: { taskId: id },
      });
      // 删除子任务
      await tx.subTask.deleteMany({
        where: { taskId: id },
      });
      // 删除任务
      await tx.task.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "任务已删除",
    });
  } catch (error) {
    console.error("删除任务失败:", error);
    return NextResponse.json(
      { success: false, error: "删除任务失败" },
      { status: 500 }
    );
  }
}
