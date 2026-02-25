// 预览服务路由和降级策略

type PreviewServiceType = 'ONLYOFFICE' | 'KKFILEVIEW' | 'NATIVE'

interface PreviewService {
  type: PreviewServiceType
  priority: number
  available: boolean
  healthCheck: () => Promise<boolean>
  generateUrl: (fileId: string, userId: string) => Promise<string>
}

interface PreviewRouterConfig {
  onlyOffice?: {
    baseUrl: string
    enabled: boolean
    priority: number
  }
  kkFileView?: {
    baseUrl: string
    enabled: boolean
    priority: number
  }
  nativePreview: {
    enabled: boolean
    priority: number
  }
}

/**
 * 预览服务路由器
 * 按优先级尝试服务，失败时降级
 */
export class PreviewRouter {
  private config: PreviewRouterConfig
  private services: PreviewService[] = []

  constructor(config: PreviewRouterConfig) {
    this.config = config
    this.initializeServices()
  }

  private initializeServices() {
    // 按优先级初始化服务
    const serviceConfigs = [
      this.config.onlyOffice?.enabled && {
        type: 'ONLYOFFICE' as const,
        priority: this.config.onlyOffice.priority,
        available: true,
        healthCheck: async () => {
          try {
            const response = await fetch(this.config.onlyOffice!.baseUrl)
            return response.ok
          } catch {
            return false
          }
        },
        generateUrl: async (fileId: string, userId: string) => {
          // OnlyOffice URL 生成逻辑
          return `${this.config.onlyOffice?.baseUrl}/editor?fileId=${fileId}&userId=${userId}`
        },
      },
      this.config.kkFileView?.enabled && {
        type: 'KKFILEVIEW' as const,
        priority: this.config.kkFileView.priority,
        available: true,
        healthCheck: async () => {
          try {
            const response = await fetch(this.config.kkFileView!.baseUrl)
            return response.ok
          } catch {
            return false
          }
        },
        generateUrl: async (fileId: string, _userId: string) => {
          // KKFileView URL 生成逻辑
          const fileUrl = `${this.config.kkFileView?.baseUrl}/files/${fileId}`
          return `${this.config.kkFileView?.baseUrl}/onlinePreview?url=${encodeURIComponent(fileUrl)}`
        },
      },
    ].filter(Boolean) as PreviewService[]

    // 按优先级排序
    this.services = serviceConfigs.sort((a, b) => a.priority - b.priority)
  }

  /**
   * 获取最佳可用预览服务
   * @returns 可用的预览服务类型
   */
  async getBestAvailableService(): Promise<PreviewServiceType | 'NATIVE'> {
    for (const service of this.services) {
      if (service.available && (await service.healthCheck())) {
        return service.type
      }
    }
    return 'NATIVE'
  }

  /**
   * 生成预览 URL（带降级）
   * @param fileId 文件 ID
   * @param userId 用户 ID
   * @param fileType 文件类型
   * @returns 预览 URL
   */
  async generatePreviewUrl(
    fileId: string,
    userId: string,
    fileType: string
  ): Promise<{
    url: string
    serviceType: PreviewServiceType | 'NATIVE'
    fallback: boolean
  }> {
    // 尝试每个服务直到成功
    for (const service of this.services) {
      try {
        if (!service.available) continue

        const isHealthy = await service.healthCheck()
        if (!isHealthy) {
          service.available = false
          continue
        }

        const url = await service.generateUrl(fileId, userId)
        return {
          url,
          serviceType: service.type,
          fallback: false,
        }
      } catch (error) {
        console.error(`预览服务 ${service.type} 失败:`, error)
        service.available = false
        // 继续尝试下一个服务
      }
    }

    // 降级到原生预览
    return {
      url: this.generateNativePreviewUrl(fileId, userId, fileType),
      serviceType: 'NATIVE',
      fallback: true,
    }
  }

  /**
   * 生成原生预览 URL
   */
  private generateNativePreviewUrl(fileId: string, userId: string, fileType: string): string {
    const fileTypes: Record<string, { category: string; handler: string }> = {
      // 图片
      jpg: { category: 'image', handler: 'image' },
      jpeg: { category: 'image', handler: 'image' },
      png: { category: 'image', handler: 'image' },
      gif: { category: 'image', handler: 'image' },
      bmp: { category: 'image', handler: 'image' },
      svg: { category: 'image', handler: 'image' },
      // 视频
      mp4: { category: 'video', handler: 'video' },
      webm: { category: 'video', handler: 'video' },
      ogg: { category: 'video', handler: 'video' },
      // 音频
      mp3: { category: 'audio', handler: 'audio' },
      wav: { category: 'audio', handler: 'audio' },
      // PDF
      pdf: { category: 'document', handler: 'pdf' },
    }

    const handler = fileTypes[fileType.toLowerCase()]
    if (handler) {
      return `/api/v1/files/${fileId}/preview?type=${handler.handler}&userId=${userId}`
    }

    // 不支持的类型，返回下载链接
    return `/api/v1/files/${fileId}/download?userId=${userId}`
  }

  /**
   * 获取服务状态
   */
  async getServiceStatus(): Promise<
    {
      type: PreviewServiceType
      available: boolean
      healthy: boolean
      priority: number
    }[]
  > {
    return Promise.all(
      this.services.map(async (service) => ({
        type: service.type,
        available: service.available,
        healthy: await service.healthCheck(),
        priority: service.priority,
      }))
    )
  }
}

/**
 * 创建默认预览路由器
 */
export function createDefaultPreviewRouter(): PreviewRouter {
  return new PreviewRouter({
    onlyOffice: {
      baseUrl: process.env.ONLYOFFICE_URL || 'http://localhost:8080',
      enabled: process.env.ONLYOFFICE_ENABLED === 'true',
      priority: 1,
    },
    kkFileView: {
      baseUrl: process.env.KKFILEVIEW_URL || 'http://localhost:8012',
      enabled: process.env.KKFILEVIEW_ENABLED === 'true',
      priority: 2,
    },
    nativePreview: {
      enabled: true,
      priority: 3,
    },
  })
}
