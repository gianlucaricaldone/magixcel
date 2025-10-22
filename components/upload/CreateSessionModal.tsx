'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, Cloud, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSessionStore } from '@/stores/session-store';
import { useDataStore } from '@/stores/data-store';
import { validateFile } from '@/lib/utils/validators';
import { formatFileSize } from '@/lib/utils/formatters';

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

type DataSource = 'local' | 'existing' | 'gdrive' | null;

interface IFile {
  file_hash: string;
  file_name: string;
  file_type: 'xlsx' | 'xls' | 'csv';
  file_size: number;
  row_count: number;
  column_count: number;
  first_imported: string;
  usage_count: number;
  example_session_id: string;
}

export function CreateSessionModal({ open, onOpenChange, workspaceId }: CreateSessionModalProps) {
  const router = useRouter();
  const { setSession, setLoading, setError } = useSessionStore();
  const { setData } = useDataStore();

  const [dataSource, setDataSource] = useState<DataSource>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // For existing file import
  const [files, setFiles] = useState<IFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [selectedFileHash, setSelectedFileHash] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');

  const resetModal = () => {
    setDataSource(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setSelectedFileHash(null);
    setSessionName('');
  };

  const handleClose = () => {
    if (!isUploading) {
      resetModal();
      onOpenChange(false);
    }
  };

  // Load files for "From Existing File" mode
  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch(`/api/files?workspaceId=${workspaceId}`);
      const result = await response.json();
      if (result.success) {
        setFiles(result.files || []);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [workspaceId]);

  // Handle local file selection (not upload yet)
  const handleFileSelection = useCallback((file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    // Auto-fill session name if empty
    if (!sessionName.trim()) {
      setSessionName(file.name.replace(/\.[^/.]+$/, ''));
    }
  }, [sessionName, setError]);

  // Handle local file upload (triggered by button)
  const handleLocalFileUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      // Use custom session name or fall back to file name without extension
      const finalSessionName = sessionName.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');
      formData.append('sessionName', finalSessionName);
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

        const dataResponse = await fetch(`/api/session/${result.sessionId}/data`);
        const dataResult = await dataResponse.json();

        if (dataResult.success && dataResult.data) {
          setData(dataResult.data);
        }

        setUploadProgress(100);
        handleClose();
        router.push(`/app/workspace/${workspaceId}/session/${result.sessionId}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, sessionName, setSession, setData, setLoading, setError, router, workspaceId, handleClose]);

  // Handle creation from existing file
  const handleCreateFromExisting = useCallback(async () => {
    if (!selectedFileHash) return;

    setIsUploading(true);
    setLoading(true);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromFileHash: selectedFileHash,
          workspaceId,
          sessionName: sessionName || undefined, // Only send if not empty
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create session');
      }

      const result = await response.json();

      if (result.success && result.sessionId && result.metadata) {
        setSession(result.sessionId, result.metadata);

        const dataResponse = await fetch(`/api/session/${result.sessionId}/data`);
        const dataResult = await dataResponse.json();

        if (dataResult.success && dataResult.data) {
          setData(dataResult.data);
        }

        handleClose();
        router.push(`/app/workspace/${workspaceId}/session/${result.sessionId}`);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create session');
      setIsUploading(false);
    } finally {
      setLoading(false);
    }
  }, [selectedFileHash, sessionName, workspaceId, setSession, setData, setLoading, setError, router, handleClose]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelection(file);
      }
    },
    [handleFileSelection]
  );

  // Render data source selection
  const renderDataSourceSelection = () => (
    <div className="grid grid-cols-1 gap-4 py-4">
      {/* New File */}
      <button
        onClick={() => setDataSource('local')}
        className="group p-6 border-2 border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">New File</h3>
            <p className="text-sm text-slate-600">
              Upload a new Excel (.xlsx, .xls) or CSV file from your computer
            </p>
          </div>
        </div>
      </button>

      {/* Existing File */}
      <button
        onClick={() => {
          setDataSource('existing');
          loadFiles();
        }}
        className="group p-6 border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
            <FileSpreadsheet className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Existing File</h3>
            <p className="text-sm text-slate-600">
              Use a file from an existing session (saves storage space)
            </p>
          </div>
        </div>
      </button>

      {/* Google Drive */}
      <button
        disabled
        className="group p-6 border-2 border-slate-200 rounded-lg opacity-60 cursor-not-allowed text-left relative"
      >
        <Badge className="absolute top-4 right-4 bg-amber-500">Coming Soon</Badge>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 bg-slate-100 rounded-lg">
            <Cloud className="h-6 w-6 text-slate-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">Google Drive</h3>
            <p className="text-sm text-slate-600">
              Connect a file from your Google Drive account
            </p>
          </div>
        </div>
      </button>
    </div>
  );

  // Render local file upload UI
  const renderLocalUpload = () => (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setDataSource(null);
          setSelectedFile(null);
          setSessionName('');
        }}
        className="mb-2"
      >
        ← Back to options
      </Button>

      {!isUploading ? (
        <>
          {/* Session Name Input - Always visible */}
          <div className="space-y-2">
            <label htmlFor="new-session-name" className="text-sm font-medium text-slate-900">
              Session Name
            </label>
            <input
              id="new-session-name"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* File Upload Area - Always visible */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'}
              ${selectedFile ? 'bg-green-50 border-green-500' : ''}
              cursor-pointer
            `}
          >
            {!selectedFile ? (
              <>
                <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Drop your file here or click to browse
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Supports Excel (.xlsx, .xls) and CSV files up to 1GB
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                  id="file-input-modal"
                />
                <label htmlFor="file-input-modal">
                  <Button variant="outline" size="sm" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded">
                    <Upload className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Create Button - Always visible */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDataSource(null);
                setSelectedFile(null);
                setSessionName('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLocalFileUpload}
              disabled={!selectedFile || !sessionName.trim()}
              className="flex-1"
            >
              Create Session
            </Button>
          </div>
        </>
      ) : (
        /* Upload Progress */
        <div className="space-y-3 py-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{selectedFile?.name}</span>
            <span className="text-slate-500">{selectedFile && formatFileSize(selectedFile.size)}</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-slate-600 text-center">
            {uploadProgress < 100 ? 'Uploading and processing...' : 'Complete!'}
          </p>
        </div>
      )}
    </div>
  );

  // Render existing file selection UI
  const renderExistingFileSelection = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDataSource(null)}
        className="mb-2"
      >
        ← Back to options
      </Button>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-900">Select File</h3>
        <p className="text-xs text-slate-600 mb-3">
          Your new session will use the same file data but have independent filters and settings
        </p>

        {loadingFiles ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No files available in this workspace</p>
            <p className="text-xs text-slate-400 mt-2">Upload a file first to reuse it</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2">
            {files.map((file) => (
              <button
                key={file.file_hash}
                onClick={() => setSelectedFileHash(file.file_hash)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedFileHash === file.file_hash
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900 text-sm">{file.file_name}</h4>
                      {file.usage_count > 1 && (
                        <Badge variant="secondary" className="text-xs">
                          Used in {file.usage_count} sessions
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{file.row_count.toLocaleString()} rows</span>
                      <span>•</span>
                      <span>{file.column_count} columns</span>
                      <span>•</span>
                      <span>{formatFileSize(file.file_size)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      First imported {new Date(file.first_imported).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedFileHash && (
        <div className="pt-4 border-t space-y-4">
          <div className="space-y-2">
            <label htmlFor="session-name" className="text-sm font-medium text-slate-900">
              Session Name
            </label>
            <input
              id="session-name"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Leave empty for default name"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500">
              {sessionName.trim()
                ? `Session will be named: "${sessionName.trim()}"`
                : 'Default: File name without extension'}
            </p>
          </div>

          <Button
            onClick={handleCreateFromExisting}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Creating...' : 'Create New Session'}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            {dataSource === null && 'Choose the data source for your new session'}
            {dataSource === 'local' && 'Upload a new file from your computer'}
            {dataSource === 'existing' && 'Select a file from an existing session'}
            {dataSource === 'gdrive' && 'Connect a file from Google Drive'}
          </DialogDescription>
        </DialogHeader>

        {dataSource === null && renderDataSourceSelection()}
        {dataSource === 'local' && renderLocalUpload()}
        {dataSource === 'existing' && renderExistingFileSelection()}
      </DialogContent>
    </Dialog>
  );
}
