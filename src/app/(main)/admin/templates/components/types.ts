export interface ReviewType {
  id: string
  name: string
  displayName: string
}

export interface Template {
  id: string
  title?: string
  name?: string
  description?: string
  isPublic?: boolean
  isActive?: boolean
  templateData?: string
  typeId?: string
}

export type TemplateType = 'task' | 'review'