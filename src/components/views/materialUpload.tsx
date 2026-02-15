'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/lib/api-client';

interface MaterialUploadProps {
  reviewId: string;
  onSuccess?: () => void;
}

export function MaterialUpload({ reviewId, onSuccess }: MaterialUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await uploadFile(file, reviewId);
      alert('材料上传成功');
      setFile(null);
      onSuccess?.();
    } catch (err) {
      alert('上传失败：' + err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>上传评审材料</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              选择文件
            </label>
            <input
              type="file"
              className="block w-full text-sm border rounded p-2"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? '上传中...' : '上传'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
