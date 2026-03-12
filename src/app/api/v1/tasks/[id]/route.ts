import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 任务更新验证 Schema
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'TESTING', 'DONE', 'CANCELLED', 'DELAYED', 'BLOCKED']).optional(),
  progress: z.number().min(0).max(100).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
  assigneeIds: z.array(z.string()).optional(),
});

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
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
          orderBy: { createdAt: 'asc' },
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

// 更新任务
export async function PUT(
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

    // 检查权限
    const isProjectOwner = task.project.ownerId === user.id;
    const isAdmin = user.role === 'ADMIN';

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
        { success: false, error: "无权更新此任务" },
        { status: 403 }
      );
    }

    // 解析并验证请求体
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // 构建更新数据
    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // 如果状态变为 DONE，设置完成时间
      if (validatedData.status === 'DONE') {
        updateData.completedAt = new Date();
      }
    }
    if (validatedData.progress !== undefined) updateData.progress = validatedData.progress;
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority;
    if (validatedData.startDate !== undefined) updateData.startDate = validatedData.startDate ? new Date(validatedData.startDate) : null;
    if (validatedData.dueDate !== undefined) updateData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours;
    if (validatedData.actualHours !== undefined) updateData.actualHours = validatedData.actualHours;
    if (validatedData.milestoneId !== undefined) updateData.milestoneId = validatedData.milestoneId || null;

    // 处理负责人更新
    if (validatedData.assigneeIds !== undefined) {
      // 删除现有的负责人
      await db.taskAssignee.deleteMany({
        where: { taskId: id },
      });
      // 添加新的负责人
      if (validatedData.assigneeIds.length > 0) {
        await db.taskAssignee.createMany({
          data: validatedData.assigneeIds.map((userId) => ({
            taskId: id,
            userId,
          })),
        });
      }
    }

    // 更新任务
    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
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
          },
        },
        milestone: {
          select: {
            id: true,
            title: true,
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: "任务更新成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "数据验证失败", details: error.issues },
        { status: 400 }
      );
    }
    console.error("更新任务失败:", error);
    return NextResponse.json(
      { success: false, error: "更新任务失败" },
      { status: 500 }
    );
  }
}
