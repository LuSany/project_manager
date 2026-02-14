import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// DELETE /api/v1/tasks/[id]/tags/[tagId] - 移除任务标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id: taskId, tagId } = await params;

    // 验证任务是否存在
    const task = await db.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 验证标签是否存在
    const tag = await db.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { success: false, error: "标签不存在" },
        { status: 404 }
      );
    }

    // 检查关联是否存在
    const taskTag = await db.taskTag.findUnique({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    if (!taskTag) {
      return NextResponse.json(
        { success: false, error: "任务未关联该标签" },
        { status: 404 }
      );
    }

    // 删除关联
    await db.taskTag.delete({
      where: {
        taskId_tagId: {
          taskId,
          tagId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "移除标签成功",
    });
  } catch (error) {
    console.error("移除任务标签失败:", error);
    return NextResponse.json(
      { success: false, error: "移除任务标签失败" },
      { status: 500 }
    );
  }
}
