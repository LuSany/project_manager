import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create fetch mock before any imports
const mockFetch = vi.fn()

// Mock prisma module before any imports
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aIConfig: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    aILog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
      update: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
  },
}))

// Set up global fetch mock
global.fetch = mockFetch

// Import after mocking
import { callAI, analyzeRisk, auditReview } from '@/lib/ai'

describe('AI服务模块', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubEnv('AI_API_KEY', 'test-api-key')
    vi.stubEnv('AI_BASE_URL', 'https://api.openai.com/v1')
    vi.stubEnv('AI_MODEL', 'gpt-4o-mini')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('callAI - 通用AI调用', () => {
    it('API Key未配置时应返回错误', async () => {
      vi.stubEnv('AI_API_KEY', '')

      const result = await callAI('test prompt', 'RISK_ANALYSIS')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not configured')
    })

    it('API调用失败时应返回错误', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      } as any)

      const result = await callAI('test prompt', 'RISK_ANALYSIS')

      expect(result.success).toBe(false)
    })

    it('API调用成功时应返回响应', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          choices: [
            {
              message: { role: 'assistant', content: 'Test response' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      } as any)

      const result = await callAI('test prompt', 'RISK_ANALYSIS')

      expect(result.success).toBe(true)
      expect(result.response).toBe('Test response')
    })

    it('应该记录AI调用日志', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          choices: [{ message: { role: 'assistant', content: 'Response' }, finish_reason: 'stop' }],
        }),
      } as any)

      await callAI('test prompt', 'RISK_ANALYSIS', 'user-1', 'project-1')
    })
  })

  describe('analyzeRisk - 风险分析', () => {
    it('AI调用失败时应返回错误', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Error'),
      } as any)

      const result = await analyzeRisk(
        '测试项目',
        '项目描述',
        [{ name: '任务1', status: 'TODO', progress: 0 }],
        []
      )

      expect(result.success).toBe(false)
    })

    it('AI调用成功时应返回解析后的结果', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  riskScore: 65,
                  riskLevel: 'HIGH',
                  analysis: '风险分析说明',
                  factors: ['因素1', '因素2'],
                  recommendations: ['建议1'],
                }),
              },
              finish_reason: 'stop',
            },
          ],
        }),
      } as any)

      const result = await analyzeRisk(
        '测试项目',
        '项目描述',
        [{ name: '任务1', status: 'IN_PROGRESS', progress: 50 }],
        [{ name: '里程碑1', dueDate: '2024-12-31', status: 'PENDING' }]
      )

      expect(result.success).toBe(true)
      expect(result.result?.riskScore).toBe(65)
      expect(result.result?.riskLevel).toBe('HIGH')
      expect(result.result?.factors).toHaveLength(2)
    })

    it('JSON解析失败时应返回错误', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'invalid json' }, finish_reason: 'stop' }],
        }),
      } as any)

      const result = await analyzeRisk('项目', '描述', [], [])

      expect(result.success).toBe(false)
    })
  })

  describe('auditReview - 评审审核', () => {
    it('AI调用成功时应返回审核结果', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  isCompliant: true,
                  issues: [],
                  overallAssessment: '总体评价良好',
                  score: 85,
                }),
              },
              finish_reason: 'stop',
            },
          ],
        }),
      } as any)

      const result = await auditReview('设计评审', 'technical', [
        { name: '文档1', type: 'pdf', content: '内容' },
      ])

      expect(result.success).toBe(true)
      expect(result.result?.isCompliant).toBe(true)
      expect(result.result?.score).toBe(85)
    })

    it('AI调用失败时应返回错误', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: vi.fn().mockResolvedValue('Bad Request'),
      } as any)

      const result = await auditReview('评审', 'type', [])

      expect(result.success).toBe(false)
    })
  })
})
