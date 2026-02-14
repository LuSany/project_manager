import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 波及影响分析创建验证 Schema
const createImpactSchema = z.object({
  description: z.string().min(1, "影响描述不能为空"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// POST /api/v1/requirements/[id]/impacts - 创建影响分析记录
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const validatedData = createImpactSchema.parse(body);

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

    // 创建波及影响分析记录
    const impact = await db.requirementImpact.create({
      data: {
        requirementId: id,
        description: validatedData.description,
        severity: validatedData.severity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: impact,
        message: "波及影响分析记录已创建",
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
    console.error("创建波及影响分析失败:", error);
    return NextResponse.json(
      { success: false, error: "创建波及影响分析失败" },
      { status: 500 }
    );
  }
}
