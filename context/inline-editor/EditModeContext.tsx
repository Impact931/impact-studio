'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (v: boolean) => void;
  isAdmin: boolean;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  setEditMode: () => {},
  isAdmin: false,
  isSaving: false,
  setIsSaving: () => {},
});

const STORAGE_KEY = 'impact-studio-edit-mode';

export function EditModeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isAdmin = !!session?.user;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Restore from sessionStorage on mount
  useEffect(() => {
    if (isAdmin && typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'true') setIsEditMode(true);
    }
  }, [isAdmin]);

  const setEditMode = useCallback(
    (value: boolean) => {
      if (!isAdmin && value) return;
      setIsEditMode(value);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, String(value));
      }
    },
    [isAdmin],
  );

  const toggleEditMode = useCallback(() => {
    setEditMode(!isEditMode);
  }, [isEditMode, setEditMode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'e') {
        e.preventDefault();
        toggleEditMode();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleEditMode]);

  // Exit edit mode if session ends
  useEffect(() => {
    if (!isAdmin) {
      setIsEditMode(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [isAdmin]);

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, setEditMode, isAdmin, isSaving, setIsSaving }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
