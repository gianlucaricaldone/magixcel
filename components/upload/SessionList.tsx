'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileSpreadsheet, Calendar, Database, ExternalLink, Trash2 } from 'lucide-react';
import { ISession } from '@/types';
import { formatRelativeTime, formatFileSize, formatNumber } from '@/lib/utils/formatters';

interface SessionListProps {
  workspaceId?: string;
}

export function SessionList({ workspaceId }: SessionListProps) {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<ISession | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [workspaceId]);

  const loadSessions = async () => {
    try {
      const endpoint = workspaceId
        ? `/api/workspace/${workspaceId}/sessions`
        : '/api/sessions';

      const response = await fetch(endpoint);
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

  const handleDeleteClick = (e: React.MouseEvent, session: ISession) => {
    e.preventDefault();
    e.stopPropagation();
    setSessionToDelete(session);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/session/${sessionToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove the deleted session from the list
        setSessions(sessions.filter(s => s.id !== sessionToDelete.id));
        setSessionToDelete(null);
      } else {
        console.error('Failed to delete session:', result.error);
        alert('Failed to delete session. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      alert('Failed to delete session. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setSessionToDelete(null);
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
      {sessions.map((session) => {
        const sessionLink = workspaceId
          ? `/app/workspace/${workspaceId}/session/${session.id}`
          : `/app/workspace/${session.workspace_id}/session/${session.id}`;

        return (
          <div key={session.id} className="relative">
            <Link href={sessionLink}>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, session)}
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Database className="h-4 w-4" />
                      {formatNumber(session.metadata?.totalRows || 0)} rows
                    </div>
                    <div className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      {session.metadata?.totalColumns || 0} columns
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
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{sessionToDelete?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
