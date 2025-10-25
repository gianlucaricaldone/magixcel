'use client';

import { useState } from 'react';
import { WorkspaceGrid } from '@/components/workspace/WorkspaceGrid';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';

export default function AppPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleWorkspaceCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Workspaces</h1>
        <p className="text-slate-600">
          Organize your Excel files and analysis sessions into workspaces
        </p>
      </div>

      <WorkspaceGrid
        key={refreshKey}
        onCreateWorkspace={() => setShowCreateModal(true)}
      />

      <CreateWorkspaceModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  );
}
