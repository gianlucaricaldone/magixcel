'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Calendar, Database, ExternalLink } from 'lucide-react';
import { ISession } from '@/types';
import { formatRelativeTime, formatFileSize, formatNumber } from '@/lib/utils/formatters';

export function SessionList() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const result = await response.json();

      if (result.success && result.sessions) {
        setSessions(result.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSpreadsheet className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground mb-2">No sessions yet</p>
        <p className="text-sm text-muted-foreground">
          Upload your first file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <Link href={`/app/${session.id}`} key={session.id}>
          <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    {session.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {session.original_file_name}
                  </CardDescription>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Database className="h-4 w-4" />
                  {formatNumber(session.row_count)} rows
                </div>
                <div className="flex items-center gap-1">
                  <FileSpreadsheet className="h-4 w-4" />
                  {session.column_count} columns
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatRelativeTime(session.created_at)}
                </div>
                <div>
                  {formatFileSize(session.file_size)}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
