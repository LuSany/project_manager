'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RiskMatrix from '@/components/risks/RiskMatrix';
import RiskProgress from '@/components/risks/RiskProgress';
import RiskTaskLink from '@/components/risks/RiskTaskLink';

export default function RisksPage() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/risks');
      const data = await response.json();
      if (data.success) {
        setRisks(data.data || []);
      }
    } catch (err) {
      console.error('获取风险列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">风险管理</h1>
        <Button onClick={() => window.location.href = '/projects/new'}>
          新建项目
        </Button>
      </div>

      <RiskMatrix risks={risks} />
      <div className="mt-6 space-y-6">
        <RiskProgress riskId="current-risk-id" />
      </div>
    </div>
  );
}
