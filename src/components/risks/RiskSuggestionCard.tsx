'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RiskLevel, RiskCategory } from '@/types/risk'
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_CATEGORY_LABELS } from '@/types/risk'

interface RiskSuggestion {
  title: string
  category: RiskCategory
  probability: number
  impact: number
  riskLevel: RiskLevel
  mitigation: string
  recommendation: string
}

interface RiskSuggestionCardProps {
  suggestion: RiskSuggestion
  onCreateRisk: () => void
  isCreating: boolean
}

export function RiskSuggestionCard({
  suggestion,
  onCreateRisk,
  isCreating,
}: RiskSuggestionCardProps) {
  const riskScore = suggestion.probability * suggestion.impact

  return (
    <Card className="p-4 transition-shadow hover:shadow-md">
      {/* 顶部：风险等级徽章 + 标题 */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                suggestion.riskLevel === 'CRITICAL'
                  ? 'text-red-500'
                  : suggestion.riskLevel === 'HIGH'
                    ? 'text-orange-500'
                    : suggestion.riskLevel === 'MEDIUM'
                      ? 'text-yellow-500'
                      : 'text-green-500'
              )}
            />
            <h3 className="text-lg font-semibold">{suggestion.title}</h3>
          </div>
        </div>
        <Badge className={cn('text-xs', RISK_LEVEL_COLORS[suggestion.riskLevel])}>
          {RISK_LEVEL_LABELS[suggestion.riskLevel]} 风险
        </Badge>
      </div>

      {/* 类别标签 */}
      <div className="mb-3 flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {RISK_CATEGORY_LABELS[suggestion.category]}
        </Badge>
      </div>

      {/* 概率/影响评级 */}
      <div className="bg-muted/50 mb-3 rounded p-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">概率：</span>
            <span className="font-medium">{suggestion.probability}/5</span>
          </div>
          <div>
            <span className="text-muted-foreground">影响：</span>
            <span className="font-medium">{suggestion.impact}/5</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">风险评分：</span>
            <span
              className={cn(
                'font-bold',
                riskScore <= 4
                  ? 'text-green-600'
                  : riskScore <= 9
                    ? 'text-yellow-600'
                    : riskScore <= 16
                      ? 'text-orange-600'
                      : 'text-red-600'
              )}
            >
              {riskScore}/25 ({RISK_LEVEL_LABELS[suggestion.riskLevel]})
            </span>
          </div>
        </div>
      </div>

      {/* 应对策略 */}
      {suggestion.mitigation && (
        <div className="mb-3">
          <p className="text-muted-foreground mb-1 text-sm font-medium">应对策略：</p>
          <p className="text-sm">{suggestion.mitigation}</p>
        </div>
      )}

      {/* 创建按钮 */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={onCreateRisk} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              创建中...
            </>
          ) : (
            '创建为风险'
          )}
        </Button>
      </div>
    </Card>
  )
}
