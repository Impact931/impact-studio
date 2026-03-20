'use client';

import { SessionProvider } from 'next-auth/react';
import { EditModeProvider } from '@/context/inline-editor/EditModeContext';
import EditModeToggle from '@/components/inline-editor/EditModeToggle';
import { useEditMode } from '@/context/inline-editor/EditModeContext';

/**
 * Fallback toggle for non-editable pages (policies, privacy, etc.)
 * Hides when a ContentProvider is active (editable pages render their own toggle).
 */
function FallbackToggle() {
  const { contentActive } = useEditMode();
  if (contentActive) return null;
  return <EditModeToggle />;
}

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EditModeProvider>
        {children}
        <FallbackToggle />
      </EditModeProvider>
    </SessionProvider>
  );
}
