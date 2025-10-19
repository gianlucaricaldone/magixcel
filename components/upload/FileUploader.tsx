'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useSessionStore } from '@/stores/session-store';
import { useDataStore } from '@/stores/data-store';
import { validateFile } from '@/lib/utils/validators';
import { formatFileSize } from '@/lib/utils/formatters';

interface FileUploaderProps {
  workspaceId?: string;
}

export function FileUploader({ workspaceId = 'default' }: FileUploaderProps) {
  const router = useRouter();
  const { setSession, setLoading, setError } = useSessionStore();
  const { setData } = useDataStore();

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionName', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('workspaceId', workspaceId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();

      if (result.success && result.sessionId && result.metadata) {
        setSession(result.sessionId, result.metadata);

        // Fetch full data
        const dataResponse = await fetch(`/api/session/${result.sessionId}/data`);
        const dataResult = await dataResponse.json();

        if (dataResult.success && dataResult.data) {
          setData(dataResult.data);
        }

        setUploadProgress(100);
        router.push(`/app/workspace/${workspaceId}/session/${result.sessionId}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [setSession, setData, setLoading, setError, router, workspaceId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-slate-300'}
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <div className="mb-4">
          <p className="text-lg font-medium text-slate-700 mb-1">
            Drop your file here or click to browse
          </p>
          <p className="text-sm text-slate-500">
            Supports Excel (.xlsx, .xls) and CSV files up to 1GB
          </p>
        </div>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          disabled={isUploading}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input">
          <Button variant="outline" disabled={isUploading} asChild>
            <span>Browse Files</span>
          </Button>
        </label>
      </div>

      {isUploading && selectedFile && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{selectedFile.name}</span>
            <span>{formatFileSize(selectedFile.size)}</span>
          </div>
          <Progress value={uploadProgress} />
          <p className="text-sm text-muted-foreground text-center">
            {uploadProgress < 100 ? 'Uploading and processing...' : 'Complete!'}
          </p>
        </div>
      )}
    </div>
  );
}
