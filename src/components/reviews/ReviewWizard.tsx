'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { ParticipantsStep } from './steps/ParticipantsStep'
import { MaterialsStep } from './steps/MaterialsStep'
import { ConfirmStep } from './steps/ConfirmStep'
import { Loader2 } from 'lucide-react'

interface ReviewWizardProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export interface WizardData {
  // 步骤1: 基本信息
  title: string
  description: string
  typeId: string
  scheduledAt: string
  // 步骤2: 参与者
  moderatorId: string | null
  reviewers: string[]
  observers: string[]
  // 步骤3: 材料
  materials: MaterialFile[]
}

export interface MaterialFile {
  fileId: string
  fileName: string
  fileType: string
  fileSize: number
}

const initialData: WizardData = {
  title: '',
  description: '',
  typeId: '',
  scheduledAt: '',
  moderatorId: null,
  reviewers: [],
  observers: [],
  materials: [],
}

const STEPS = [
  { id: 1, title: '基本信息' },
  { id: 2, title: '参与者' },
  { id: 3, title: '材料' },
  { id: 4, title: '确认' },
]

export function ReviewWizard({ projectId, open, onOpenChange, onSuccess }: ReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState<WizardData>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: wizardData.title,
          description: wizardData.description || undefined,
          typeId: wizardData.typeId,
          scheduledAt: wizardData.scheduledAt ? new Date(wizardData.scheduledAt).toISOString() : undefined,
          participants: [
            ...(wizardData.moderatorId ? [{ userId: wizardData.moderatorId, role: 'MODERATOR' as const }] : []),
            ...wizardData.reviewers.map((userId) => ({ userId, role: 'REVIEWER' as const })),
            ...wizardData.observers.map((userId) => ({ userId, role: 'OBSERVER' as const })),
          ],
          materials: wizardData.materials,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onOpenChange(false)
        setWizardData(initialData)
        setCurrentStep(1)
        onSuccess?.()
      } else {
        setError(typeof data.error === 'object' ? data.error.message : data.error)
      }
    } catch (err) {
      console.error('创建评审失败:', err)
      setError('创建评审失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setWizardData(initialData)
      setCurrentStep(1)
      setError(null)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.title.trim() !== '' && wizardData.typeId !== ''
      case 2:
        return wizardData.reviewers.length > 0 || wizardData.moderatorId !== null
      case 3:
        return true
      default:
        return true
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={{
              title: wizardData.title,
              description: wizardData.description,
              typeId: wizardData.typeId,
              scheduledAt: wizardData.scheduledAt,
            }}
            onChange={updateData}
          />
        )
      case 2:
        return (
          <ParticipantsStep
            data={{
              moderatorId: wizardData.moderatorId,
              reviewers: wizardData.reviewers,
              observers: wizardData.observers,
            }}
            onChange={updateData}
            projectId={projectId}
          />
        )
      case 3:
        return <MaterialsStep materials={wizardData.materials} onChange={updateData} />
      case 4:
        return <ConfirmStep data={wizardData} onEditStep={setCurrentStep} />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建评审</DialogTitle>
          <DialogDescription>通过向导完成评审创建</DialogDescription>
        </DialogHeader>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {step.id}
              </div>
              <span className={`ml-2 text-sm ${currentStep === step.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
              {index < STEPS.length - 1 && (
                <div className="w-8 h-0.5 bg-muted mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 步骤内容 */}
        <div className="py-4">{renderStep()}</div>

        {/* 导航按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            上一步
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed() || loading}>
              下一步
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认创建
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}