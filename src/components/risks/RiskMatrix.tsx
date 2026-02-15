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

  return (
    <Card>
      <CardHeader>
        <CardTitle>风险矩阵</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="text-xs font-semibold mb-4">概率/影响</div>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center text-muted-foreground">影响↓</div>
            <div className="text-center text-muted-foreground">概率→</div>
          </div>
          <div className="text-xs text-muted-foreground">概率</div>
        </div>
        {[1, 2, 3, 4].map((level) => (
            <div key={level} className="text-center">
              <div className={`h-8 w-8 rounded-full ${getCellColor(level)}`}>
                {getCellLabel(level)}
              </div>
            </div>
          )).map((impact) => (
            <div key={5 * level} className={`mt-2 h-8 rounded-full ${getCellColor(5 * level)}`}>
              {getImpactLabel(5 * level)}
            </div>
          ))}
        </div>
        {[1, 2, 3, 4].map((priority) => (
          <div key={priority} className={`col-start-${getPriorityLevel(priority)}`}>
            <div className={`p-3 rounded-full ${getCellColor(getPriorityLevel(priority))}`}>
              P{getPriorityLabel(priority)}
            </div>
          </div>
        ))}
      </div>
    </Card>
      </CardContent>
    </Card>
  );
}
