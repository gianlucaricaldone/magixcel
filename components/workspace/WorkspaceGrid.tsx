'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IWorkspace } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditWorkspaceModal } from './EditWorkspaceModal';

interface WorkspaceGridProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceGrid({ onCreateWorkspace }: WorkspaceGridProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<IWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [workspaceToEdit, setWorkspaceToEdit] = useState<IWorkspace | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspace');
      const result = await response.json();
      if (result.success) {
        setWorkspaces(result.workspaces);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkspace = (workspace: IWorkspace) => {
    setWorkspaceToEdit(workspace);
    setShowEditModal(true);
  };

  const handleDeleteWorkspace = async (id: string) => {
    if (id === 'default') {
      alert('Cannot delete default workspace');
      return;
    }

    if (!confirm('Are you sure you want to delete this workspace? All sessions will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workspace/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        loadWorkspaces();
      } else {
        alert('Failed to delete workspace: ' + result.error.message);
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Create New Workspace Card */}
      <Card
        className="border-2 border-dashed border-slate-300 hover:border-blue-500 cursor-pointer transition-colors"
        onClick={onCreateWorkspace}
      >
        <CardContent className="flex flex-col items-center justify-center h-48 p-6">
          <div className="rounded-full bg-blue-100 p-4 mb-4">
            <Plus className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Create Workspace</h3>
          <p className="text-sm text-slate-500 text-center mt-2">
            Organize your Excel files into workspaces
          </p>
        </CardContent>
      </Card>

      {/* Existing Workspaces */}
      {workspaces.map((workspace) => (
        <Card
          key={workspace.id}
          className="hover:shadow-lg transition-shadow cursor-pointer group relative"
          onClick={() => router.push(`/app/workspace/${workspace.id}`)}
        >
          <CardContent className="p-6">
            {/* Workspace Actions */}
            {workspace.id !== 'default' && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEditWorkspace(workspace);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkspace(workspace.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Workspace Icon */}
            <div
              className="rounded-lg p-4 mb-4 inline-block"
              style={{ backgroundColor: `${workspace.color}20` }}
            >
              <Folder
                className="h-8 w-8"
                style={{ color: workspace.color }}
              />
            </div>

            {/* Workspace Info */}
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {workspace.name}
            </h3>
            {workspace.description && (
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                {workspace.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>
                Created {new Date(workspace.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Edit Workspace Modal */}
      <EditWorkspaceModal
        workspace={workspaceToEdit}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={loadWorkspaces}
      />
    </div>
  );
}
