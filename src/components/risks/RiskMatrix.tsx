'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Risk {
  id: string;
  title: string;
  status: string;
  priority: string;
  probability: string;
  impact: string;
}

interface RiskMatrixProps {
  risks: Risk[];
}

export function RiskMatrix({ risks }: RiskMatrixProps) {
  const getPriorityLevel = (priority: string) => {
    switch (priority) {
      case 'LOW': return 1;
      case 'MEDIUM': return 2;
      case 'HIGH': return 3;
      case 'URGENT': return 4;
      default: return 2;
    }
  };

  const getImpactLevel = (impact: string) => {
    switch (impact) {
      case 'LOW': return 1;
      case 'MEDIUM': return 2;
      case 'HIGH': return 3;
      case 'CRITICAL': return 4;
      default: return 2;
    }
  };

  const getRiskLevel = (probability: string, impact: string) => {
    const probLevel = getPriorityLevel(probability);
    const impactLevel = getImpactLevel(impact);
    return Math.max(probLevel, impactLevel);
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-200 text-green-800';
      case 2: return 'bg-yellow-200 text-yellow-800';
      case 3: return 'bg-orange-200 text-orange-800';
      case 4: return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getCellLabel = (level: number) => {
    switch (level) {
      case 1: return '低';
      case 2: return '中';
      case 3: return '高';
      case 4: return '严重';
      default: return '低';
    }
  };

  const getProbabilityLabel = (level: number) => {
    switch (level) {
      case 1: return '极低';
      case 2: return '低';
      case 3: return '中';
      case 4: return '高';
      default: return '低';
    }
  };

  const getImpactLabel = (level: number) => {
    switch (level) {
      case 1: return '轻微';
      case 2: return '中等';
      case 3: return '严重';
      case 4: return '灾难性';
      default: return '中等';
    }
  };

  // 获取某个位置的风险
  const getRiskAtPosition = (probLevel: number, impactLevel: number) => {
    return risks.find(risk =>
      getPriorityLevel(risk.probability) === probLevel &&
      getImpactLevel(risk.impact) === impactLevel
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>风险矩阵</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 图例 */}
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold">风险等级：</span>
            <Badge className="bg-green-200 text-green-800">低</Badge>
            <Badge className="bg-yellow-200 text-yellow-800">中</Badge>
            <Badge className="bg-orange-200 text-orange-800">高</Badge>
            <Badge className="bg-red-200 text-red-800">严重</Badge>
          </div>

          {/* 矩阵表头 */}
          <div className="grid grid-cols-6 gap-2 text-sm">
            <div></div>
            <div className="text-center font-semibold">轻微</div>
            <div className="text-center font-semibold">中等</div>
            <div className="text-center font-semibold">严重</div>
            <div className="text-center font-semibold">灾难性</div>
            <div className="text-center font-semibold">概率</div>
          </div>

          {/* 矩阵内容 */}
          {[1, 2, 3, 4].map((probLevel) => (
            <div key={probLevel} className="grid grid-cols-6 gap-2 items-center">
              <div className="text-right font-semibold text-xs">
                {getProbabilityLabel(probLevel)}
              </div>
              {[1, 2, 3, 4].map((impactLevel) => {
                const risk = getRiskAtPosition(probLevel, impactLevel);
                const riskLevel = risk ? getRiskLevel(risk.probability, risk.impact) : 0;
                const bgColor = riskLevel > 0 ? getCellColor(riskLevel) : 'bg-gray-100 text-gray-400';

                return (
                  <div
                    key={impactLevel}
                    className={`h-16 rounded flex items-center justify-center text-xs font-medium ${bgColor}`}
                  >
                    {risk ? (
                      <div className="text-center">
                        <div className="font-bold">{getCellLabel(riskLevel)}</div>
                        <div className="text-xs opacity-75 truncate max-w-20">{risk.title}</div>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                );
              })}
              <div className="text-center text-xs text-muted-foreground">
                {getProbabilityLabel(probLevel)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
