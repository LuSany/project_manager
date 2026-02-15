'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  icon?: string;
}

export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon && (
                <div className="h-8 w-8 text-blue-600" id="stats-icon">
                  {typeof icon === 'string' ? icon : <span className={icon}>{icon}</span>}
                </div>
              )}
              <div>
                <p className="text-2xl font-bold">{value}</p>
                {change !== undefined && change !== 0 && (
                  <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">
          统计卡片内容
        </div>
      </CardContent>
    </Card>
  );
}
