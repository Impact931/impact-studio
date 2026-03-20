'use client';

import { ContentProvider } from '@/context/inline-editor/ContentContext';
import EditablePage from './EditablePage';
import EditModeToggle from './EditModeToggle';
import type { PageContent } from '@/types/inline-editor';

/**
 * Wraps a page with ContentProvider + EditablePage + EditModeToggle.
 * EditModeToggle is INSIDE ContentProvider so Save/Publish can access content.
 */
export default function PageEditorShell({
  slug,
  initialContent,
  children,
}: {
  slug: string;
  initialContent: PageContent;
  children?: React.ReactNode;
}) {
  return (
    <ContentProvider slug={slug} initialContent={initialContent}>
      <EditablePage />
      {children}
      <EditModeToggle />
    </ContentProvider>
  );
}
