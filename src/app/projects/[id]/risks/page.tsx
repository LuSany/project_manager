'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RisksPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="../" className="text-muted-foreground hover:underline">
          ← 返回项目详情
        </Link>
        <h1 className="text-2xl font-bold ml-4">风险管理</h1>
      </div>

      <div className="rounded-lg border p-12 text-center space-y-4">
        <div className="text-lg text-muted-foreground">
          风险管理功能将在第四阶段（第7-8周）实现
        </div>
        <div className="text-sm text-muted-foreground">
          当前阶段：第一阶段 - 基础架构搭建 + 用户管理 + 项目管理 + 里程碑管理
        </div>
        <Link href="../">
          <Button>返回项目详情</Button>
        </Link>
      </div>
    </div>
  );
}
