import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 需求验收创建验证 Schema
const createAcceptanceSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  result: z.enum(["PENDING", "PASSED", "FAILED", "CONDITIONAL"]).default("PENDING"),
  notes: z.string().optional(),
});

// POST /api/v1/requirements/[id]/acceptances - 创建验收记录
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = createAcceptanceSchema.parse(body);

    // 验证需求是否存在
    const requirement = await db.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      return NextResponse.json(
        { success: false, error: "需求不存在" },
        { status: 404 }
      );
    }

    // 创建验收记录
    const acceptance = await db.requirementAcceptance.create({
      data: {
        requirementId: id,
        userId: validatedData.userId,
        result: validatedData.result,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: acceptance,
        message: "验收记录已创建",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("创建验收记录失败:", error);
    return NextResponse.json(
      { success: false, error: "创建验收记录失败" },
      { status: 500 }
    );
  }
}
