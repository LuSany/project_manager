'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface OnlyOfficeConfig {
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

interface OnlyOfficeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  config: OnlyOfficeConfig;
  apiUrl: string;
  mockMode?: boolean;
}

// 扩展Window接口以包含Any全局类型
declare global {
  interface Window {
    DocEditor?: new (options: {
      document: OnlyOfficeConfig['document'];
      editorConfig: OnlyOfficeConfig['editorConfig'];
      events: {
        onDocumentReady?: () => void;
        onLoadComponentError?: (errorCode: number, errorDescription: string) => void;
        onRequestSaveAs?: (event: any) => void;
        onRequestInsertImage?: (event: any) => void;
        onRequestMailMergeRecipients?: (event: any) => void;
        onRequestCompareFile?: (event: any) => void;
        onRequestEditRights?: () => void;
        onRequestHistory?: () => void;
        onRequestHistoryData?: (event: any) => void;
        onRequestHistoryClose?: () => void;
        onRequestRestore?: (event: any) => void;
      };
      height: string;
      width: string;
      type: string;
      token?: string;
    }) => {
      destroy: () => void;
    };
  }
}

export function OnlyOfficeEditor({
  isOpen,
  onClose,
  config,
  apiUrl,
  mockMode = false,
}: OnlyOfficeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const editorInstanceRef = useRef<any>(null);

  // 加载OnlyOffice API脚本
  useEffect(() => {
    if (mockMode || scriptLoaded) return;

    const script = document.createElement('script');
    script.src = `${apiUrl}/web-apps/apps/api/documents/api.js`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      setError('无法加载OnlyOffice编辑器');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiUrl, mockMode, scriptLoaded]);

  // 初始化编辑器
  useEffect(() => {
    if (!isOpen || !editorRef.current || !scriptLoaded || mockMode) {
      return;
    }

    try {
      // 销毁现有实例
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy();
        } catch (e) {
          console.warn('销毁编辑器实例失败:', e);
        }
        editorInstanceRef.current = null;
      }

      setLoading(true);
      setError(null);

      // 初始化编辑器
      if (typeof window.DocEditor === 'function') {
        editorInstanceRef.current = new window.DocEditor({
          document: config.document,
          editorConfig: config.editorConfig,
          events: {
            onDocumentReady: () => {
              setLoading(false);
            },
            onLoadComponentError: (errorCode: number, errorDescription: string) => {
              console.error('OnlyOffice加载错误:', errorCode, errorDescription);
              setError(`加载编辑器失败: ${errorDescription}`);
              setLoading(false);
            },
            onRequestSaveAs: (event: any) => {
              console.log('另存为请求:', event);
            },
            onRequestInsertImage: (event: any) => {
              console.log('插入图片请求:', event);
            },
          },
          height: '100%',
          width: '100%',
          type: 'desktop',
        });
      } else {
        setError('OnlyOffice API未正确加载');
        setLoading(false);
      }
    } catch (err) {
      console.error('初始化编辑器失败:', err);
      setError('初始化编辑器失败');
      setLoading(false);
    }

    return () => {
      if (editorInstanceRef.current) {
        try {
          editorInstanceRef.current.destroy();
        } catch (e) {
          console.warn('清理编辑器实例失败:', e);
        }
        editorInstanceRef.current = null;
      }
    };
  }, [isOpen, config, scriptLoaded, mockMode]);

  // Mock模式显示
  if (mockMode) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] h-[600px]">
          <DialogHeader>
            <DialogTitle>OnlyOffice编辑器 (Mock模式)</DialogTitle>
            <DialogDescription>
              文件: {config.document.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Mock OnlyOffice编辑器</p>
              <p className="text-sm text-muted-foreground">
                文件类型: {config.document.fileType}
              </p>
              <p className="text-sm text-muted-foreground">
                模式: {config.editorConfig.mode === 'edit' ? '编辑' : '查看'}
              </p>
              <p className="text-sm text-muted-foreground">
                用户: {config.editorConfig.user.name}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                这是OnlyOffice编辑器的模拟界面。要使用真实的OnlyOffice编辑器，
                请配置ONLYOFFICE_API_URL环境变量。
              </p>
            </div>
            <Button onClick={onClose}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] p-0">
        <div className="h-full flex flex-col">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>OnlyOffice编辑器</DialogTitle>
            <DialogDescription>
              {config.document.title} ({config.editorConfig.mode === 'edit' ? '编辑模式' : '查看模式'})
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">正在加载编辑器...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={onClose} variant="outline">
                    关闭
                  </Button>
                </div>
              </div>
            )}
            <div
              ref={editorRef}
              className="w-full h-full"
              style={{ display: loading || error ? 'none' : 'block' }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for fetching OnlyOffice configuration
export function useOnlyOfficeConfig(fileId: string, mode: 'edit' | 'view' = 'edit') {
  const [config, setConfig] = useState<{
    url: string;
    config: OnlyOfficeConfig;
    fileName: string;
    fileType: string;
    documentKey: string;
    mockMode: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(`/api/v1/files/${fileId}/preview-edit?mode=${mode}`);
        const data = await response.json();

        if (data.success) {
          setConfig(data.data);
        } else {
          setError(data.error?.message || '获取配置失败');
        }
      } catch (err) {
        setError('网络错误');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [fileId, mode]);

  return { config, loading, error, refetch: () => setLoading(true) };
}
