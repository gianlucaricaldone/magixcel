'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [sessionName, setSessionName] = useState<string>('');

  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    // Auto-fill session name from file name (without extension)
    setSessionName(file.name.replace(/\.[^/.]+$/, ''));
  }, [setError]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('sessionName', sessionName.trim() || selectedFile.name.replace(/\.[^/.]+$/, ''));
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

      if (result.success && result.data) {
        const { sessionId, sheets, totalRows, totalColumns } = result.data;

        // Create metadata in old format for compatibility
        const metadata = {
          sheets,
          totalRows,
          totalColumns,
          fileName: result.data.fileName,
          fileSize: result.data.fileSize,
          fileType: result.data.fileType,
        };

        setSession(sessionId, metadata);

        // Fetch full data
        const dataResponse = await fetch(`/api/session/${sessionId}/data`);
        const dataResult = await dataResponse.json();

        if (dataResult.success && dataResult.data) {
          setData(dataResult.data);
        }

        setUploadProgress(100);
        router.push(`/app/workspace/${workspaceId}/session/${sessionId}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, sessionName, setSession, setData, setLoading, setError, router, workspaceId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setSessionName('');
    setUploadProgress(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* File selection area - show only when no file is selected */}
      {!selectedFile && (
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
            cursor-pointer
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
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input">
            <Button variant="outline" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </div>
      )}

      {/* Confirmation form - show when file is selected but not uploading */}
      {selectedFile && !isUploading && (
        <div className="space-y-4 border rounded-lg p-6 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Upload className="h-5 w-5 text-blue-600" />
                <p className="font-medium text-slate-900">{selectedFile.name}</p>
              </div>
              <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!sessionName.trim()}>
              Create Session
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress - show when uploading */}
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
