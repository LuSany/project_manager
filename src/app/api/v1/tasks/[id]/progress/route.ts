import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const updateProgressSchema = z.object({
  progress: z.number().min(0).max(100).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

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
    console.error("更新任务进度失败:", error);
    return NextResponse.json(
      { success: false, error: "更新任务进度失败" },
      { status: 500 }
    );
  }
}
