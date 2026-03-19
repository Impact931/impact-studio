'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface EditModeContextType {
  isEditMode: boolean;
  toggleEditMode: () => void;
  isAdmin: boolean;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
}

const EditModeContext = createContext<EditModeContextType>({
  isEditMode: false,
  toggleEditMode: () => {},
  isAdmin: false,
  isSaving: false,
  setIsSaving: () => {},
});

export function EditModeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const isAdmin = !!session?.user;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setIsEditMode((prev) => !prev);
  }, [isAdmin]);

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
    if (!isAdmin) setIsEditMode(false);
  }, [isAdmin]);

  return (
    <EditModeContext.Provider value={{ isEditMode, toggleEditMode, isAdmin, isSaving, setIsSaving }}>
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  return useContext(EditModeContext);
}
