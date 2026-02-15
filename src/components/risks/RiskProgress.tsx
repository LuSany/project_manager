'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RiskProgressProps {
  riskId: string;
}

export function RiskProgress({ riskId }: RiskProgressProps) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const addProgress = async () => {
    if (!note.trim()) {
      return alert('请输入进展记录');
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/risks/${riskId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, status: 'ANALYZING' }),
      });

      if (response.ok) {
        setNote('');
        alert('进展记录已添加');
      } else {
        alert('添加失败');
      }
    } catch (err) {
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>风险进展记录</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="输入进展记录..."
          rows={4}
          className="min-h-[100px] w-full"
        />
        <Button onClick={addProgress} disabled={loading}>
          {loading ? '添加中...' : '添加记录'}
        </Button>
      </CardContent>
    </Card>
  );
}
