/**
 * 默认评审类型配置
 * 
 * 系统预设的评审类型，包括：
 * - 可行性评估评审
 * - 里程碑评审
 * - 测试方案评审
 * - 测试发布评审
 * - 测试报告评审
 * - 初审
 * - 终审
 * - 阶段评审
 */

export interface ReviewTypeConfigInput {
  name: string
  displayName: string
  description?: string
  isSystem: boolean
}

export const DEFAULT_REVIEW_TYPES: ReviewTypeConfigInput[] = [
  {
    name: 'FEASIBILITY',
    displayName: '可行性评估评审',
    description: '评估项目或方案可行性',
    isSystem: true,
  },
  {
    name: 'MILESTONE',
    displayName: '里程碑评审',
    description: '里程碑相关评审',
    isSystem: true,
  },
  {
    name: 'TEST_PLAN',
    displayName: '测试方案评审',
    description: '测试方案或规程评审',
    isSystem: true,
  },
  {
    name: 'TEST_RELEASE',
    displayName: '测试发布评审',
    description: '测试程序发布评审',
    isSystem: true,
  },
  {
    name: 'TEST_REPORT',
    displayName: '测试报告评审',
    description: '测试报告评审',
    isSystem: true,
  },
  {
    name: 'INITIAL',
    displayName: '初审',
    description: '初步评审',
    isSystem: true,
  },
  {
    name: 'FINAL',
    displayName: '终审',
    description: '最终评审',
    isSystem: true,
  },
  {
    name: 'PHASE',
    displayName: '阶段评审',
    description: '阶段评审',
    isSystem: true,
  },
]
