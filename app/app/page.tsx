'use client';

import { FileUploader } from '@/components/upload/FileUploader';
import { SessionList } from '@/components/upload/SessionList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FolderOpen, Cloud } from 'lucide-react';

export default function AppPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Workspace</h1>
        <p className="text-muted-foreground">
          Upload new files or access your recent sessions
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Recent
          </TabsTrigger>
          <TabsTrigger value="drive" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload an Excel or CSV file to start analyzing your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Access your previously uploaded files and continue your analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SessionList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drive">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
              <CardDescription>
                Connect your Google Drive to access files directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Cloud className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  Google Drive integration coming soon
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  This feature will allow you to import files directly from your Google Drive account
                </p>
                <Button disabled>
                  Connect Google Drive
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
