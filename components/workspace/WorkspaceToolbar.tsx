'use client';

import { Button } from '@/components/ui/button';
import { Plus, ListPlus } from 'lucide-react';

interface WorkspaceToolbarProps {
  onCreateView: () => void;
  onAddView: () => void;
}

export function WorkspaceToolbar({
  onCreateView,
  onAddView,
}: WorkspaceToolbarProps) {
  return (
    <div className="h-14 bg-white border-b flex items-center px-6 gap-3">
      <Button onClick={onCreateView} size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Crea View
      </Button>

      <Button onClick={onAddView} variant="outline" size="sm">
        <ListPlus className="h-4 w-4 mr-2" />
        Aggiungi View
      </Button>
    </div>
  );
}
