// ============================================================================
// 任务模板类型定义
// ============================================================================

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  templateData: TaskTemplateData;
  isPublic: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTemplateData {
  tasks: TemplateTask[];
  milestoneId?: string;
}

export interface TemplateTask {
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
}

export interface TaskImportResult {
  created: number;
  failed: number;
  total: number;
  errors?: Array<{
    task: string;
    error: string;
  }>;
}

export interface TaskImportRequest {
  templateId?: string;
  projectId: string;
  milestoneId?: string;
  tasks?: TemplateTask[];
}

export interface TaskImportFromExcelRequest {
  projectId: string;
  milestoneId?: string;
  file: File;
}
