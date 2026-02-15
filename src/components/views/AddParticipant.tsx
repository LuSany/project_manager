'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddParticipantProps {
  reviewId: string;
  onSuccess?: () => void;
}

export function AddParticipant({ reviewId, onSuccess }: AddParticipantProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('REVIEWER');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      if (response.ok) {
        alert('参与者添加成功');
        setUserId('');
        onSuccess?.();
      } else {
        alert('添加失败');
      }
    } catch (err) {
      alert('添加失败：' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加评审参与者</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              用户ID
            </label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="输入用户ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              角色
            </label>
            <select
              className="block w-full border rounded p-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="REVIEWER">评审人</option>
              <option value="OBSERVER">观察者</option>
              <option value="SECRETARY">记录员</option>
            </select>
          </div>

          <Button onClick={handleAdd} disabled={loading || !userId}>
            {loading ? '添加中...' : '添加'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
