'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RiskList } from '@/components/risks/RiskList';

export default function RisksPage({ params }: { params: Promise<{ id: string }> }) {
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    params.then(p => setProjectId(p.id));
  }, [params]);

  if (!projectId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Link href="../" className="text-muted-foreground hover:underline">
          ← 返回项目详情
        </Link>
        <h1 className="text-2xl font-bold ml-4">风险管理</h1>
      </div>

      <RiskList projectId={projectId} />
    </div>
  );
}
