// KKFileView 预览服务集成
// 文档：https://kkfileview.keking.cn/

interface KKFileViewConfig {
  baseUrl: string;
  previewType?: 'default' | 'mobile';
}

interface PreviewOptions {
  fileUrl: string;
  fileName: string;
  fileType: string;
}

/**
 * 生成 KKFileView 预览 URL
 * @param config KKFileView 配置
 * @param options 预览选项
 * @returns 预览 URL
 */
export function generateKKFileViewPreviewUrl(
  config: KKFileViewConfig,
  options: PreviewOptions
): string {
  const { baseUrl, previewType = 'default' } = config;
  const { fileUrl, fileName, fileType } = options;

  // KKFileView 支持的预览模式
  const previewModes: Record<string, string> = {
    default: 'web',
    mobile: 'mobile',
  };

  const mode = previewModes[previewType] || 'web';

  // 构建预览 URL
  // 格式：{baseUrl}/onlinePreview?url={encodedFileUrl}&fileType={fileType}
  const encodedUrl = encodeURIComponent(fileUrl);

  return `${baseUrl}/onlinePreview?url=${encodedUrl}&fileType=${fileType}&previewType=${mode}`;
}

/**
 * 获取支持的文件类型
 * @returns 支持的文件类型列表
 */
export function getSupportedFileTypes(): string[] {
  return [
    // 文档
    'doc', 'docx', 'wps', 'odt',
    // 表格
    'xls', 'xlsx', 'et', 'ods',
    // 演示
    'ppt', 'pptx', 'dps', 'odp',
    // PDF
    'pdf',
    // 图片
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
    // 文本
    'txt', 'rtf',
    // 代码
    'java', 'py', 'js', 'ts', 'go', 'rust', 'cpp', 'c', 'h',
    // 其他
    'xml', 'json', 'yaml', 'md',
  ];
}

/**
 * 检查文件类型是否支持
 * @param fileType 文件扩展名
 * @returns 是否支持
 */
export function isFileTypeSupported(fileType: string): boolean {
  return getSupportedFileTypes().includes(fileType.toLowerCase());
}

/**
 * 获取文件类型分类
 * @param fileType 文件扩展名
 * @returns 文件类型分类
 */
export function getFileCategory(fileType: string): string {
  const type = fileType.toLowerCase();
  const docTypes = ['doc', 'docx', 'wps', 'odt'];
  const sheetTypes = ['xls', 'xlsx', 'et', 'ods'];
  const presentationTypes = ['ppt', 'pptx', 'dps', 'odp'];
  const pdfTypes = ['pdf'];
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
  const textTypes = ['txt', 'rtf', 'md'];
  const codeTypes = ['java', 'py', 'js', 'ts', 'go', 'rust', 'cpp', 'c', 'h'];

  if (docTypes.includes(type)) return 'document';
  if (sheetTypes.includes(type)) return 'spreadsheet';
  if (presentationTypes.includes(type)) return 'presentation';
  if (pdfTypes.includes(type)) return 'pdf';
  if (imageTypes.includes(type)) return 'image';
  if (textTypes.includes(type)) return 'text';
  if (codeTypes.includes(type)) return 'code';

  return 'other';
}

/**
 * 检查 KKFileView 服务健康状态
 * @param baseUrl KKFileView 基础 URL
 * @returns 健康状态
 */
export async function checkKKFileViewHealth(baseUrl: string): Promise<{
  healthy: boolean;
  message?: string;
}> {
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { healthy: true, message: 'KKFileView 服务可用' };
    }

    return { healthy: false, message: `服务返回状态码：${response.status}` };
  } catch (error) {
    return {
      healthy: false,
      message: error instanceof Error ? error.message : '服务不可达'
    };
  }
}
