'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Bot, Loader2, Sparkles, Settings, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface AIReviewerConfig {
  id?: string
  enabled: boolean
  autoVote: boolean
  confidenceThreshold: number
  systemPrompt: string
  analysisDepth: 'basic' | 'standard' | 'deep'
  includeRiskAnalysis: boolean
  includeMaterialAnalysis: boolean
  includeSummary: boolean
}

const defaultConfig: AIReviewerConfig = {
  enabled: false,
  autoVote: false,
  confidenceThreshold: 70,
  systemPrompt: '你是一个专业的项目评审 AI 助手，请根据评审材料和项目背景，分析风险并给出建议。',
  analysisDepth: 'standard',
  includeRiskAnalysis: true,
  includeMaterialAnalysis: true,
  includeSummary: true,
}

export function AIReviewerConfigPanel() {
  const { toast } = useToast()
  const [config, setConfig] = React.useState<AIReviewerConfig>(defaultConfig)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/ai-reviewer/config')
      const json = await res.json()
      if (json.success && json.config) {
        setConfig({ ...defaultConfig, ...json.config })
      }
    } catch (err) {
      setError('获取配置失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/admin/ai-reviewer/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const json = await res.json()
      if (json.success) {
        toast({
          title: '保存成功',
          description: 'AI 评审员配置已更新',
          variant: 'success',
        })
      } else {
        setError(json.error || '保存失败')
      }
    } catch {
      setError('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = (key: keyof AIReviewerConfig, value: boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleInputChange = (key: keyof AIReviewerConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">加载配置...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI 评审员配置
            </CardTitle>
            <CardDescription>配置 AI 评审员的自动分析和投票行为</CardDescription>
          </div>
          <Badge
            className={cn(
              config.enabled
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            )}
          >
            {config.enabled ? '已启用' : '已禁用'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* 基础开关 */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-medium">
            <Settings className="h-4 w-4" />
            基础设置
          </h3>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                启用 AI 评审员
              </Label>
              <p className="text-muted-foreground text-sm">在评审流程中自动添加 AI 评审员</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleToggle('enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>自动投票</Label>
              <p className="text-muted-foreground text-sm">AI 评审员自动根据分析结果投票</p>
            </div>
            <Switch
              checked={config.autoVote}
              onCheckedChange={(checked) => handleToggle('autoVote', checked)}
              disabled={!config.enabled}
            />
          </div>
        </div>

        {/* 分析设置 */}
        <div className="space-y-4">
          <h3 className="font-medium">分析设置</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>分析深度</Label>
              <div className="flex gap-2">
                {(['basic', 'standard', 'deep'] as const).map((depth) => (
                  <Button
                    key={depth}
                    variant={config.analysisDepth === depth ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('analysisDepth', depth)}
                    disabled={!config.enabled}
                  >
                    {depth === 'basic' ? '基础' : depth === 'standard' ? '标准' : '深度'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>置信度阈值：{config.confidenceThreshold}%</Label>
              <Input
                type="range"
                min={50}
                max={99}
                value={config.confidenceThreshold}
                onChange={(e) => handleInputChange('confidenceThreshold', parseInt(e.target.value))}
                disabled={!config.enabled}
                className="h-2"
              />
              <p className="text-muted-foreground text-xs">AI 置信度低于此值时将弃权</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>分析模块</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.includeRiskAnalysis}
                  onCheckedChange={(checked) => handleToggle('includeRiskAnalysis', checked)}
                  disabled={!config.enabled}
                />
                <span className="text-sm">风险分析</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.includeMaterialAnalysis}
                  onCheckedChange={(checked) => handleToggle('includeMaterialAnalysis', checked)}
                  disabled={!config.enabled}
                />
                <span className="text-sm">材料分析</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.includeSummary}
                  onCheckedChange={(checked) => handleToggle('includeSummary', checked)}
                  disabled={!config.enabled}
                />
                <span className="text-sm">摘要生成</span>
              </div>
            </div>
          </div>
        </div>

        {/* 系统提示词 */}
        <div className="space-y-2">
          <Label>系统提示词</Label>
          <Textarea
            value={config.systemPrompt}
            onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
            disabled={!config.enabled}
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
