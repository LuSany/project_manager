import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "TESTING", "DONE"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    const task = await db.task.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("更新任务状态失败:", error);
    return NextResponse.json(
      { success: false, error: "更新任务状态失败" },
      { status: 500 }
    );
  }
}
