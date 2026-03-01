import { describe, it, expect, beforeAll } from 'vitest'

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1'

let authToken = ''
let testUserId = ''
let testProjectId = ''
let testFileId = ''

async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  })
  return response.json()
}

async function setup() {
  const testEmail = `test-file-${Date.now()}@example.com`

  await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
      name: '测试用户',
    }),
  })

  const loginResponse = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: 'TestPassword123!',
    }),
  })

  authToken = loginResponse.data?.token || ''
  testUserId = loginResponse.data?.user?.id || ''

  const projectResponse = await apiCall('/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: `测试项目-${Date.now()}`,
      description: '文件测试用项目',
    }),
  })
  testProjectId = projectResponse.data?.id || ''
}

describe.skip('文件预览集成测试', () => {
  beforeAll(async () => {
    await setup()
  })

  describe('文件上传', () => {
    it('应该成功上传PDF文件', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-document.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          projectId: testProjectId,
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('id')
      expect(response.data).toHaveProperty('fileName')
      testFileId = response.data?.id || ''
    })

    it('应该成功上传图片文件', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-image.png',
          fileSize: 5120,
          mimeType: 'image/png',
          projectId: testProjectId,
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.mimeType).toBe('image/png')
    })

    it('应该成功上传Word文档', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-document.docx',
          fileSize: 2048,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          projectId: testProjectId,
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.mimeType).toContain('document')
    })

    it('应该成功上传Excel文档', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test-spreadsheet.xlsx',
          fileSize: 3072,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          projectId: testProjectId,
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data?.mimeType).toContain('spreadsheet')
    })

    it('缺少必填字段应该失败', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'incomplete-file.pdf',
        }),
      })

      expect(response.success).toBe(false)
    })

    it('不支持的文件类型应该失败', async () => {
      const response = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'test.exe',
          fileSize: 1024,
          mimeType: 'application/x-msdownload',
          projectId: testProjectId,
        }),
      })

      expect(response.success).toBe(false)
    })
  })

  describe('获取文件列表', () => {
    it('应该成功获取文件列表', async () => {
      const response = await apiCall(`/files?projectId=${testProjectId}`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.items)).toBe(true)
    })

    it('应该支持按MIME类型筛选', async () => {
      const response = await apiCall(`/files?projectId=${testProjectId}&mimeType=application/pdf`)

      expect(response.success).toBe(true)
    })

    it('应该支持按上传者筛选', async () => {
      const response = await apiCall(`/files?uploadedBy=${testUserId}`)

      expect(response.success).toBe(true)
    })

    it('应该支持文件大小范围筛选', async () => {
      const response = await apiCall(`/files?projectId=${testProjectId}&minSize=1000&maxSize=5000`)

      expect(response.success).toBe(true)
    })
  })

  describe('获取文件详情', () => {
    it('应该成功获取文件详情', async () => {
      if (!testFileId) return

      const response = await apiCall(`/files/${testFileId}`)

      expect(response.success).toBe(true)
      expect(response.data?.id).toBe(testFileId)
      expect(response.data).toHaveProperty('fileName')
      expect(response.data).toHaveProperty('fileSize')
      expect(response.data).toHaveProperty('mimeType')
      expect(response.data).toHaveProperty('createdAt')
    })
  })

  describe('文件预览', () => {
    it('应该支持PDF文件预览', async () => {
      if (!testFileId) return

      const response = await apiCall(`/files/${testFileId}/preview`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('previewUrl')
    })

    it('应该支持图片文件预览', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `preview-test-${Date.now()}.png`,
          fileSize: 5120,
          mimeType: 'image/png',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/preview`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('previewUrl')
    })

    it('不存在的文件应该返回错误', async () => {
      const response = await apiCall('/files/nonexistent-id/preview')

      expect(response.success).toBe(false)
    })
  })

  describe('文件下载', () => {
    it('应该支持文件下载', async () => {
      if (!testFileId) return

      const response = await apiCall(`/files/${testFileId}/download`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('downloadUrl')
    })

    it('不存在的文件下载应该返回错误', async () => {
      const response = await apiCall('/files/nonexistent-id/download')

      expect(response.success).toBe(false)
    })
  })

  describe('文件缩略图', () => {
    it('应该支持生成图片缩略图', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `thumbnail-test-${Date.now()}.jpg`,
          fileSize: 10240,
          mimeType: 'image/jpeg',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/thumbnail?size=200`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('thumbnailUrl')
    })

    it('应该支持自定义缩略图尺寸', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `thumbnail-test2-${Date.now()}.png`,
          fileSize: 8192,
          mimeType: 'image/png',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/thumbnail?size=400`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('thumbnailUrl')
    })
  })

  describe('文件元数据', () => {
    it('应该获取PDF文件元数据', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `metadata-test-${Date.now()}.pdf`,
          fileSize: 4096,
          mimeType: 'application/pdf',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/metadata`)

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('fileName')
      expect(response.data).toHaveProperty('fileSize')
      expect(response.data).toHaveProperty('mimeType')
    })

    it('应该获取图片文件元数据', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `metadata-img-${Date.now()}.jpg`,
          fileSize: 6144,
          mimeType: 'image/jpeg',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/metadata`)

      expect(response.success).toBe(true)
    })
  })

  describe('文件共享', () => {
    it('应该创建共享链接', async () => {
      if (!testFileId) return

      const response = await apiCall(`/files/${testFileId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          expiresIn: 86400, // 24小时
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('shareUrl')
      expect(response.data).toHaveProperty('expiresAt')
    })

    it('应该验证共享链接', async () => {
      if (!testFileId) return

      const createResponse = await apiCall(`/files/${testFileId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          expiresIn: 3600, // 1小时
        }),
      })

      const shareToken = createResponse.data?.token
      if (!shareToken) return

      const response = await apiCall(`/files/share/${shareToken}`)

      expect(response.success).toBe(true)
    })

    it('应该撤销共享链接', async () => {
      if (!testFileId) return

      const createResponse = await apiCall(`/files/${testFileId}/share`, {
        method: 'POST',
        body: JSON.stringify({
          expiresIn: 3600,
        }),
      })

      const shareToken = createResponse.data?.token
      if (!shareToken) return

      const revokeResponse = await apiCall(`/files/${testFileId}/share/${shareToken}`, {
        method: 'DELETE',
      })

      expect(revokeResponse.success).toBe(true)
    })
  })

  describe('文件删除', () => {
    it('应该成功删除文件', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `to-delete-${Date.now()}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const deleteResponse = await apiCall(`/files/${fileId}`, {
        method: 'DELETE',
      })

      expect(deleteResponse.success).toBe(true)
    })

    it('删除后文件详情应不可访问', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `to-delete-2-${Date.now()}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      await apiCall(`/files/${fileId}`, {
        method: 'DELETE',
      })

      const response = await apiCall(`/files/${fileId}`)

      expect(response.success).toBe(false)
    })
  })

  describe('文件版本管理', () => {
    it('应该支持上传新版本', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `version-test-${Date.now()}.pdf`,
          fileSize: 1024,
          mimeType: 'application/pdf',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/versions`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: 'version-test-v2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
        }),
      })

      expect(response.success).toBe(true)
      expect(response.data).toHaveProperty('version')
    })

    it('应该获取文件版本列表', async () => {
      const createResponse = await apiCall('/files/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: `version-list-${Date.now()}.docx`,
          fileSize: 1024,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          projectId: testProjectId,
        }),
      })

      const fileId = createResponse.data?.id
      if (!fileId) return

      const response = await apiCall(`/files/${fileId}/versions`)

      expect(response.success).toBe(true)
      expect(Array.isArray(response.data?.versions)).toBe(true)
    })
  })
})
