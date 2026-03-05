/**
 * 文件预览服务路由器
 * 实现服务选择和降级策略
 */

import { db } from '@/lib/db'

export type PreviewServiceType = 'ONLYOFFICE' | 'KKFILEVIEW' | 'NATIVE'
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy'

export interface PreviewServiceHealth {
  service: PreviewServiceType
  status: HealthStatus
  lastCheck: Date
  responseTime: number
  errorCount: number
}

export interface PreviewServiceConfig {
  id: string
  serviceType: PreviewServiceType
  endpoint: string
  isEnabled: boolean
  config: string
}

// 服务优先级配置
const SERVICE_PRIORITY: Record<string, PreviewServiceType[]> = {
  // Office 文档优先 OnlyOffice
  'docx': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  'doc': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  'xlsx': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  'xls': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  'pptx': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  'ppt': ['ONLYOFFICE', 'KKFILEVIEW', 'NATIVE'],
  // PDF 使用 KKFileView
  'pdf': ['KKFILEVIEW', 'NATIVE'],
  // 其他格式
  'odt': ['KKFILEVIEW', 'NATIVE'],
  'ods': ['KKFILEVIEW', 'NATIVE'],
  'odp': ['KKFILEVIEW', 'NATIVE'],
  'txt': ['NATIVE'],
  'csv': ['NATIVE'],
  // 图片使用原生
  'jpg': ['NATIVE'],
  'jpeg': ['NATIVE'],
  'png': ['NATIVE'],
  'gif': ['NATIVE'],
  'webp': ['NATIVE'],
  'svg': ['NATIVE'],
  // 视频使用原生
  'mp4': ['NATIVE'],
  'webm': ['NATIVE'],
  'ogg': ['NATIVE'],
}

// 健康状态缓存
const healthCache = new Map<PreviewServiceType, PreviewServiceHealth>()

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

/**
 * 获取文件类型分类
 */
export function getFileCategory(mimeType: string, extension: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('spreadsheet') || ['xlsx', 'xls', 'csv'].includes(extension)) return 'spreadsheet'
  if (mimeType.includes('presentation') || ['pptx', 'ppt'].includes(extension)) return 'presentation'
  if (mimeType.includes('document') || ['docx', 'doc', 'odt'].includes(extension)) return 'document'
  return 'other'
}

/**
 * 检查服务健康状态
 */
export async function checkServiceHealth(
  service: PreviewServiceType,
  config: PreviewServiceConfig
): Promise<PreviewServiceHealth> {
  const startTime = Date.now()

  try {
    const endpoint = config.endpoint

    // 根据服务类型执行健康检查
    if (service === 'ONLYOFFICE') {
      // OnlyOffice 健康检查端点
      const healthUrl = `${endpoint}/healthcheck`
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          service,
          status: 'healthy',
          lastCheck: new Date(),
          responseTime,
          errorCount: 0,
        }
      } else {
        return {
          service,
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime,
          errorCount: 1,
        }
      }
    } else if (service === 'KKFILEVIEW') {
      // KKFileView 健康检查
      const healthUrl = `${endpoint}/`
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      const responseTime = Date.now() - startTime

      if (response.ok) {
        return {
          service,
          status: 'healthy',
          lastCheck: new Date(),
          responseTime,
          errorCount: 0,
        }
      } else {
        return {
          service,
          status: 'unhealthy',
          lastCheck: new Date(),
          responseTime,
          errorCount: 1,
        }
      }
    }

    // NATIVE 服务始终健康
    return {
      service: 'NATIVE',
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorCount: 0,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const cached = healthCache.get(service)
    const errorCount = (cached?.errorCount || 0) + 1

    return {
      service,
      status: errorCount >= 3 ? 'unhealthy' : 'degraded',
      lastCheck: new Date(),
      responseTime,
      errorCount,
    }
  }
}

/**
 * 选择最佳预览服务
 */
export async function selectPreviewService(
  filename: string,
  mimeType: string
): Promise<{
  service: PreviewServiceType
  config?: PreviewServiceConfig
  degraded: boolean
}> {
  const extension = getFileExtension(filename)
  const priority = SERVICE_PRIORITY[extension] || ['KKFILEVIEW', 'NATIVE']

  // 获取已配置的服务
  const configs = await db.previewServiceConfig.findMany({
    where: { isEnabled: true },
  })

  const configMap = new Map<PreviewServiceType, PreviewServiceConfig>()
  configs.forEach((c) => {
    configMap.set(c.serviceType as PreviewServiceType, c as PreviewServiceConfig)
  })

  // 始终添加 NATIVE 作为后备
  configMap.set('NATIVE', {
    id: 'native',
    serviceType: 'NATIVE',
    endpoint: '',
    isEnabled: true,
    config: '{}',
  })

  // 按优先级选择服务
  for (const serviceType of priority) {
    const config = configMap.get(serviceType)
    if (!config) continue

    // NATIVE 服务始终可用
    if (serviceType === 'NATIVE') {
      return { service: 'NATIVE', config, degraded: priority[0] !== 'NATIVE' }
    }

    // 检查健康状态
    let health = healthCache.get(serviceType)

    // 如果缓存过期（超过5分钟），重新检查
    if (!health || Date.now() - health.lastCheck.getTime() > 5 * 60 * 1000) {
      health = await checkServiceHealth(serviceType, config)
      healthCache.set(serviceType, health)
    }

    // 如果服务健康，使用它
    if (health.status === 'healthy') {
      return { service: serviceType, config, degraded: false }
    }

    // 如果服务降级但可用，使用并标记
    if (health.status === 'degraded') {
      return { service: serviceType, config, degraded: true }
    }
  }

  // 所有服务都不可用，使用 NATIVE
  return {
    service: 'NATIVE',
    config: configMap.get('NATIVE'),
    degraded: true,
  }
}

/**
 * 生成预览 URL
 */
export function generatePreviewUrl(
  service: PreviewServiceType,
  config: PreviewServiceConfig,
  fileId: string,
  fileUrl: string,
  options?: {
    editable?: boolean
    watermark?: boolean
  }
): string {
  switch (service) {
    case 'ONLYOFFICE':
      // OnlyOffice 文档服务器 URL
      const ooConfig = JSON.parse(config.config || '{}')
      return `${config.endpoint}/web-apps/apps/apps/documents/documents/index.html?fileUrl=${encodeURIComponent(fileUrl)}`

    case 'KKFILEVIEW':
      // KKFileView 预览 URL
      return `${config.endpoint}/onlinePreview?url=${encodeURIComponent(fileUrl)}`

    case 'NATIVE':
    default:
      // 原生预览 - 直接返回文件 URL
      return fileUrl
  }
}

/**
 * 获取所有服务健康状态
 */
export async function getAllServicesHealth(): Promise<PreviewServiceHealth[]> {
  const configs = await db.previewServiceConfig.findMany({
    where: { isEnabled: true },
  })

  const results: PreviewServiceHealth[] = []

  for (const config of configs) {
    const serviceType = config.serviceType as PreviewServiceType
    const health = await checkServiceHealth(serviceType, config as PreviewServiceConfig)
    healthCache.set(serviceType, health)
    results.push(health)
  }

  // 添加 NATIVE
  results.push({
    service: 'NATIVE',
    status: 'healthy',
    lastCheck: new Date(),
    responseTime: 0,
    errorCount: 0,
  })

  return results
}