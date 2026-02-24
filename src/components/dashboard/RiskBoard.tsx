'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Risk {
  id: string;
  title: string;
  description?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  probability: number;
  impact: number;
  project?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
  };
}

interface RiskStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface RiskBoardProps {
  projectId?: string;
}

export function RiskBoard({ projectId }: RiskBoardProps) {
  const [loading, setLoading] = useState(false);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [stats, setStats] = useState<RiskStats>({ critical: 0, high: 0, medium: 0, low: 0 });

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) {
        params.set('projectId', projectId);
      }
      const response = await fetch(`/api/v1/dashboard/risks?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setRisks(data.data.risks || []);
        setStats(data.data.stats || { critical: 0, high: 0, medium: 0, low: 0 });
      }
    } catch (err) {
      console.error('获取风险数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [projectId]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-600 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getRiskLevelLabel = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return '关键';
      case 'HIGH':
        return '高';
      case 'MEDIUM':
        return '中';
      default:
        return '低';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          风险看板
        </CardTitle>
        <CardDescription>
          当前共有 {risks.length} 个未关闭的风险
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">加载中...</div>
        ) : risks.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            暂无风险
          </div>
        ) : (
          <>
            {/* 风险统计 */}
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-red-100 rounded">
                <div className="text-lg font-bold text-red-600">{stats.critical}</div>
                <div className="text-xs text-red-700">关键</div>
              </div>
              <div className="text-center p-2 bg-orange-100 rounded">
                <div className="text-lg font-bold text-orange-600">{stats.high}</div>
                <div className="text-xs text-orange-700">高</div>
              </div>
              <div className="text-center p-2 bg-yellow-100 rounded">
                <div className="text-lg font-bold text-yellow-700">{stats.medium}</div>
                <div className="text-xs text-yellow-700">中</div>
              </div>
              <div className="text-center p-2 bg-green-100 rounded">
                <div className="text-lg font-bold text-green-600">{stats.low}</div>
                <div className="text-xs text-green-700">低</div>
              </div>
            </div>

            {/* 风险列表 */}
            <div className="space-y-2">
              {risks.slice(0, 5).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn('text-xs', getRiskLevelColor(risk.riskLevel))}>
                        {getRiskLevelLabel(risk.riskLevel)}
                      </Badge>
                      <span className="font-medium">{risk.title}</span>
                    </div>
                    {risk.project && (
                      <div className="text-xs text-muted-foreground">
                        项目：{risk.project.name}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      概率：{risk.probability}/5
                      <br />
                      影响：{risk.impact}/5
                    </div>
                    {risk.probability * risk.impact >= 15 && (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 查看更多 */}
            {risks.length > 5 && (
              <div className="text-center">
                <Button variant="outline" size="sm" className="w-full">
                  查看全部 {risks.length} 个风险
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
