import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 方案更新验证 Schema
const updateProposalSchema = z.object({
  content: z.string().min(1, "方案内容不能为空").optional(),
  estimatedHours: z.number().positive().optional(),
  estimatedCost: z.number().positive().optional(),
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]).optional(),
});

// PUT /api/v1/requirements/[id]/proposals/[proposalId] - 更新方案
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; proposalId: string }> }
) {
  const { id, proposalId } = await context.params;

  try {
    const body = await request.json();
    const validatedData = updateProposalSchema.parse(body);

    // 验证方案是否存在
    const existingProposal = await db.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { success: false, error: "方案不存在" },
        { status: 404 }
      );
    }

    // 验证方案是否属于该需求
    if (existingProposal.requirementId !== id) {
      return NextResponse.json(
        { success: false, error: "方案不属于该需求" },
        { status: 400 }
      );
    }

    // 更新方案
    const proposal = await db.proposal.update({
      where: { id: proposalId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: proposal,
      message: "方案已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("更新方案失败:", error);
    return NextResponse.json(
      { success: false, error: "更新方案失败" },
      { status: 500 }
    );
  }
}
