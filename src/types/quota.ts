import { z } from 'zod'

export const createQuotaSchema = z.object({
  projectId: z.string().min(1, '项目ID不能为空'),
  totalHours: z.number().positive('总配额必须大于 0').min(0.1, '总配额至少为 0.1 小时'),
  period: z.enum(['MONTHLY', 'QUARTERLY']).default('MONTHLY'),
  subItems: z
    .array(
      z.object({
        deviceTypeId: z.string().min(1),
        subHours: z.number().positive('子配额必须大于 0').min(0.1),
      })
    )
    .optional()
    .default([]),
})

export const updateQuotaSchema = z
  .object({
    totalHours: z.number().positive('总配额必须大于 0').min(0.1).optional(),
    period: z.enum(['MONTHLY', 'QUARTERLY']).optional(),
    subItems: z
      .array(
        z.object({
          deviceTypeId: z.string().min(1),
          subHours: z.number().positive('子配额必须大于 0').min(0),
        })
      )
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: '至少需要一个字段' })

export type CreateQuotaRequest = z.infer<typeof createQuotaSchema>
export type UpdateQuotaRequest = z.infer<typeof updateQuotaSchema>

export interface QuotaResponse {
  id: string
  projectId: string
  totalHours: number
  period: string
  warningSent50: boolean
  warningSent80: boolean
  warningSent100: boolean
  subItems: QuotaSubItem[]
  createdAt: string
  updatedAt: string
  projectName?: string
}

export interface QuotaSubItem {
  id: string
  quotaId: string
  deviceTypeId: string
  subHours: number
  deviceTypeName?: string
}
