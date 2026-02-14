import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/v1/tasks/[id]/subtasks/[subtaskId]/toggle - 切换子任务完成状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  const { id, subtaskId } = await params;

  try {
    // 验证子任务是否存在且属于指定任务
    const subTask = await db.subTask.findFirst({
      where: {
        id: subtaskId,
        taskId: id,
      },
    });

    if (!subTask) {
      return NextResponse.json(
        { success: false, error: "子任务不存在" },
        { status: 404 }
      );
    }

    // 切换完成状态
    const updatedSubTask = await db.subTask.update({
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
