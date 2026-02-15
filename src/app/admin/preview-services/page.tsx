'use client';

import { useState } from 'react';
import { PreviewServiceConfig } from '@/components/files/PreviewServiceConfig';
import { Button } from '@/components/ui/button';

export default function PreviewServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/preview/services');
      const data = await response.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (err) {
      console.error('获取预览服务配置失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">预览服务配置</h1>
        <PreviewServiceConfig onSuccess={fetchServices} />
      </div>

      <div className="mt-6">
        {loading ? (
          <div>加载中...</div>
        ) : services.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            暂无预览服务配置
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: any) => (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{service.serviceType === 'ONLYOFFICE' ? 'OnlyOffice' : service.serviceType === 'KKFILEVIEW' ? 'KKFileView' : '原生预览'}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      端点: {service.endpoint}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${service.isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {service.isEnabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  配置: {service.config || '无'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
