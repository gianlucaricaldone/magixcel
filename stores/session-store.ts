import { create } from 'zustand';
import { IFileMetadata } from '@/types';

/**
 * Session state management
 */

interface SessionState {
  sessionId: string | null;
  metadata: IFileMetadata | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (sessionId: string, metadata: IFileMetadata) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  metadata: null,
  isLoading: false,
  error: null,

  setSession: (sessionId, metadata) =>
    set({
      sessionId,
      metadata,
      isLoading: false,
      error: null,
    }),

  clearSession: () =>
    set({
      sessionId: null,
      metadata: null,
      isLoading: false,
      error: null,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),
}));
