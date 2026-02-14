import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 方案创建验证 Schema
const createProposalSchema = z.object({
  userId: z.string().min(1, "用户ID不能为空"),
  content: z.string().min(1, "方案内容不能为空"),
  estimatedHours: z.number().positive().optional(),
  estimatedCost: z.number().positive().optional(),
});

// POST /api/v1/requirements/[id]/proposals - 创建方案
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = createProposalSchema.parse(body);

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

    // 创建方案
    const proposal = await db.proposal.create({
      data: {
        requirementId: id,
        userId: validatedData.userId,
        content: validatedData.content,
        estimatedHours: validatedData.estimatedHours,
        estimatedCost: validatedData.estimatedCost,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: proposal,
        message: "方案已创建",
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
    console.error("创建方案失败:", error);
    return NextResponse.json(
      { success: false, error: "创建方案失败" },
      { status: 500 }
    );
  }
}
