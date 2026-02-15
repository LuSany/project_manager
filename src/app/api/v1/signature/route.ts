import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { success, error } from '@/lib/api/response';
import { z } from 'zod';

// POST /api/v1/signature - 生成URL签名
const signUrlSchema = z.object({
  url: z.string().url(),
  expiresIn: z.number().positive().optional(), // 签名过期时间（秒）
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = signUrlSchema.parse(body);

    // 生成HMAC-SHA256签名
    const secret = process.env.URL_SIGN_SECRET || 'default-secret-change-in-production';
    const url = validated.url;

    // 简单签名实现：HMAC-SHA256(url + secret + expires)
    const expires = validated.expiresIn || 3600; // 默认1小时
    const timestamp = Math.floor(Date.now() / 1000) + expires;
    const signature = createHmac('sha256', secret)
      .update(`${url}|${timestamp}`)
      .digest('hex');

    const signedUrl = `${url}?signature=${signature}&expires=${timestamp}`;

    return NextResponse.json(success({
      signedUrl,
      expiresAt: timestamp * 1000,
    }));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return error('参数验证失败_ERROR', '参数验证失败', { errors: err.errors }, 400);
    }
    console.error('生成URL签名失败:', err);
    return error('生成URL签名失败_ERROR', '生成URL签名失败', undefined, 500);
  }
}
