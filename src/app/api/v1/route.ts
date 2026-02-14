import { NextResponse } from "next/server";
import { ApiResponder } from "@/lib/api/response";

export async function GET(
  request: Request,
  response: NextResponse
) {
  return ApiResponder.success({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(
  request: Request,
  response: NextResponse
) {
  const body = await request.json();

  return ApiResponder.created(body, "示例响应");
}
