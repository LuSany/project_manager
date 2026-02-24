import * as crypto from 'crypto';

export interface OnlyOfficeConfig {
  apiUrl: string;
  apiKey?: string;
  documentKey: string;
  fileUrl: string;
  fileType: string;
  mode: 'edit' | 'view';
  user: {
    id: string;
    name: string;
  };
}

export interface OnlyOfficeDocumentConfig {
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
    permissions?: {
      comment?: boolean;
      copy?: boolean;
      download?: boolean;
      edit?: boolean;
      fillForms?: boolean;
      modifyFilter?: boolean;
      modifyContentControl?: boolean;
      review?: boolean;
    };
  };
  editorConfig: {
    mode: 'edit' | 'view';
    callbackUrl?: string;
    user: {
      id: string;
      name: string;
    };
    lang: string;
    region: string;
    customization?: {
      autosave?: boolean;
      comments?: boolean;
      compactHeader?: boolean;
      compactToolbar?: boolean;
      compatibleFeatures?: boolean;
      help?: boolean;
      hideRightMenu?: boolean;
      logo?: {
        image?: string;
        imageEmbedded?: string;
        url?: string;
      };
      macros?: boolean;
      macrosMode?: string;
      mentionShare?: boolean;
      plugins?: boolean;
      review?: boolean;
      showReviewChanges?: boolean;
      spellcheck?: boolean;
      toolbarNoTabs?: boolean;
      toolbarHideFileName?: boolean;
      zoom?: number;
    };
  };
}

/**
 * 检查OnlyOffice服务是否可用（Mock模式）
 */
export function isOnlyOfficeAvailable(): boolean {
  const apiUrl = process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL;
  const mockMode = process.env.ONLYOFFICE_MOCK_MODE === 'true';
  return !!apiUrl || mockMode;
}

/**
 * 生成OnlyOffice编辑器URL
 */
export function generateOnlyOfficeUrl(config: OnlyOfficeConfig): string {
  const apiUrl = process.env.ONLYOFFICE_API_URL || process.env.NEXT_PUBLIC_ONLYOFFICE_API_URL;

  if (!apiUrl) {
    throw new Error('ONLYOFFICE_API_URL is not configured');
  }

  // 构建文档配置
  const docConfig = buildDocumentConfig(config);

  // 如果有API密钥，需要对配置进行签名
  if (config.apiKey) {
    const signature = generateSignature(docConfig, config.apiKey);
    return `${apiUrl}?signature=${encodeURIComponent(signature)}`;
  }

  return apiUrl;
}

/**
 * 生成文档键（用于版本控制）
 */
export function generateDocumentKey(fileId: string, version: number = 1): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${fileId}-${version}`);
  return hash.digest('hex');
}

/**
 * 构建OnlyOffice文档配置
 */
export function buildDocumentConfig(config: OnlyOfficeConfig): OnlyOfficeDocumentConfig {
  const isEditMode = config.mode === 'edit';

  return {
    document: {
      fileType: config.fileType,
      key: config.documentKey,
      title: config.fileUrl.split('/').pop() || 'document',
      url: config.fileUrl,
      permissions: {
        comment: isEditMode,
        copy: true,
        download: true,
        edit: isEditMode,
        fillForms: isEditMode,
        modifyFilter: isEditMode,
        modifyContentControl: isEditMode,
        review: isEditMode,
      },
    },
    editorConfig: {
      mode: config.mode,
      callbackUrl: isEditMode ? generateCallbackUrl(config.documentKey) : undefined,
      user: config.user,
      lang: 'zh-CN',
      region: 'zh-CN',
      customization: {
        autosave: true,
        comments: true,
        compactHeader: false,
        compactToolbar: false,
        compatibleFeatures: true,
        help: true,
        hideRightMenu: false,
        plugins: true,
        review: isEditMode,
        showReviewChanges: true,
        spellcheck: true,
        toolbarNoTabs: false,
        toolbarHideFileName: false,
        zoom: 100,
      },
    },
  };
}

/**
 * 生成配置签名（用于OnlyOffice安全验证）
 */
export function generateSignature(config: OnlyOfficeDocumentConfig, apiKey: string): string {
  const configString = JSON.stringify(config);
  return crypto
    .createHmac('sha256', apiKey)
    .update(configString)
    .digest('base64');
}

/**
 * 生成回调URL（用于保存编辑后的文档）
 */
function generateCallbackUrl(documentKey: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${appUrl}/api/v1/files/onlyoffice-callback?key=${documentKey}`;
}

/**
 * 从文件名获取文件类型
 */
export function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // OnlyOffice支持的文件类型
  const supportedTypes: Record<string, string> = {
    // 文本文档
    'docx': 'docx',
    'doc': 'doc',
    'odt': 'odt',
    'rtf': 'rtf',
    'txt': 'txt',
    'html': 'html',
    'htm': 'htm',
    'mht': 'mht',
    'pdf': 'pdf',
    'djvu': 'djvu',
    'xps': 'xps',
    'epub': 'epub',
    'fb2': 'fb2',
    // 电子表格
    'xlsx': 'xlsx',
    'xls': 'xls',
    'ods': 'ods',
    'csv': 'csv',
    'fods': 'fods',
    // 演示文稿
    'pptx': 'pptx',
    'ppt': 'ppt',
    'odp': 'odp',
    'fodp': 'fodp',
    'ppsx': 'ppsx',
    'pps': 'pps',
  };

  return supportedTypes[ext] || '';
}

/**
 * 检查文件类型是否被OnlyOffice支持
 */
export function isSupportedFileType(fileName: string): boolean {
  const fileType = getFileType(fileName);
  return fileType !== '';
}

/**
 * 生成Mock OnlyOffice响应（用于测试）
 */
export function generateMockOnlyOfficeResponse(config: OnlyOfficeConfig): {
  url: string;
  config: OnlyOfficeDocumentConfig;
} {
  return {
    url: '/mock/onlyoffice-editor',
    config: buildDocumentConfig(config),
  };
}
