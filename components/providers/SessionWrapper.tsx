'use client';

import { SessionProvider } from 'next-auth/react';
import { EditModeProvider } from '@/context/inline-editor/EditModeContext';
import EditModeToggle from '@/components/inline-editor/EditModeToggle';

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <EditModeProvider>
        {children}
        <EditModeToggle />
      </EditModeProvider>
    </SessionProvider>
  );
}
