'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IWorkspace } from '@/types/database';
import { FileUploader } from '@/components/upload/FileUploader';
import { SessionList } from '@/components/upload/SessionList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FolderOpen, ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<IWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    try {
      const response = await fetch(`/api/workspace/${workspaceId}`);
      const result = await response.json();

      if (result.success) {
        setWorkspace(result.workspace);
      } else {
        console.error('Workspace not found');
        router.push('/app');
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
      router.push('/app');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button + Workspace Header */}
      <div className="mb-8">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspaces
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="rounded-lg p-3"
            style={{ backgroundColor: `${workspace.color}20` }}
          >
            <Folder className="h-8 w-8" style={{ color: workspace.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-1">{workspace.name}</h1>
            {workspace.description && (
              <p className="text-slate-600">{workspace.description}</p>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload an Excel or CSV file to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader workspaceId={workspaceId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                Access your files and continue your analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionList workspaceId={workspaceId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
