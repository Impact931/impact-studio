'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import type { PageContent, PageSection } from '@/types/inline-editor';
import { useEditMode } from './EditModeContext';

interface ContentContextType {
  pageSlug: string;
  content: PageContent;
  setContent: (content: PageContent) => void;
  updateField: (sectionId: string, field: string, value: unknown) => void;
  addSection: (section: PageSection, afterIndex?: number) => void;
  removeSection: (sectionId: string) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  hasChanges: boolean;
  save: () => Promise<void>;
  publish: () => Promise<void>;
  loading: boolean;
}

const ContentContext = createContext<ContentContextType | null>(null);

const STORAGE_PREFIX = 'impact-studio-content-';

function getLocalContent(slug: string): PageContent | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_PREFIX + slug);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function setLocalContent(slug: string, content: PageContent) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(content));
}

export function ContentProvider({
  children,
  slug,
  initialContent,
}: {
  children: ReactNode;
  slug: string;
  initialContent: PageContent;
}) {
  // Priority: localStorage draft → provided initialContent
  const [content, setContentState] = useState<PageContent>(() => {
    const local = getLocalContent(slug);
    return local ?? initialContent;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { setContentActive } = useEditMode();

  // Signal that a ContentProvider is active (for EditModeToggle visibility)
  useEffect(() => {
    setContentActive(true);
    return () => setContentActive(false);
  }, [setContentActive]);

  const setContent = useCallback(
    (newContent: PageContent) => {
      setContentState(newContent);
      setHasChanges(true);
      setLocalContent(slug, newContent);
    },
    [slug],
  );

  const autoSaveDraft = useCallback(
    (newContent: PageContent) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setLocalContent(slug, newContent);
      }, 2000);
    },
    [slug],
  );

  const updateField = useCallback(
    (sectionId: string, field: string, value: unknown) => {
      setContentState((prev) => {
        const updated = {
          ...prev,
          sections: prev.sections.map((s) => {
            if (s.id !== sectionId) return s;
            // Handle nested fields like "primaryCta.text"
            const parts = field.split('.');
            if (parts.length === 1) {
              return { ...s, data: { ...s.data, [field]: value } } as PageSection;
            }
            // Nested update — supports array indices (e.g. "cards.0.title")
            const data = { ...s.data } as Record<string, unknown>;
            let current: Record<string, unknown> = data;
            for (let i = 0; i < parts.length - 1; i++) {
              const key = parts[i];
              const val = current[key];
              if (Array.isArray(val)) {
                current[key] = [...val];
              } else {
                current[key] = { ...(val as Record<string, unknown>) };
              }
              current = current[key] as Record<string, unknown>;
            }
            current[parts[parts.length - 1]] = value;
            return { ...s, data } as PageSection;
          }),
          updatedAt: new Date().toISOString(),
        };
        setHasChanges(true);
        autoSaveDraft(updated);
        return updated;
      });
    },
    [autoSaveDraft],
  );

  const addSection = useCallback(
    (section: PageSection, afterIndex?: number) => {
      setContentState((prev) => {
        const sections = [...prev.sections];
        const idx = afterIndex !== undefined ? afterIndex + 1 : sections.length;
        sections.splice(idx, 0, section);
        // Reorder
        const reordered = sections.map((s, i) => ({ ...s, order: i }));
        const updated = { ...prev, sections: reordered as PageSection[], updatedAt: new Date().toISOString() };
        setHasChanges(true);
        setLocalContent(slug, updated);
        return updated;
      });
    },
    [slug],
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      setContentState((prev) => {
        const sections = prev.sections.filter((s) => s.id !== sectionId);
        const reordered = sections.map((s, i) => ({ ...s, order: i }));
        const updated = { ...prev, sections: reordered as PageSection[], updatedAt: new Date().toISOString() };
        setHasChanges(true);
        setLocalContent(slug, updated);
        return updated;
      });
    },
    [slug],
  );

  const moveSection = useCallback(
    (sectionId: string, direction: 'up' | 'down') => {
      setContentState((prev) => {
        const sections = [...prev.sections];
        const idx = sections.findIndex((s) => s.id === sectionId);
        if (idx === -1) return prev;
        const newIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= sections.length) return prev;
        [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
        const reordered = sections.map((s, i) => ({ ...s, order: i }));
        const updated = { ...prev, sections: reordered as PageSection[], updatedAt: new Date().toISOString() };
        setHasChanges(true);
        setLocalContent(slug, updated);
        return updated;
      });
    },
    [slug],
  );

  const save = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/content/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      });
      setHasChanges(false);
    } finally {
      setLoading(false);
    }
  }, [slug, content]);

  const publish = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content }),
      });
      // Clear localStorage draft after publish
      localStorage.removeItem(STORAGE_PREFIX + slug);
      setHasChanges(false);
    } finally {
      setLoading(false);
    }
  }, [slug, content]);

  return (
    <ContentContext.Provider
      value={{
        pageSlug: slug,
        content,
        setContent,
        updateField,
        addSection,
        removeSection,
        moveSection,
        hasChanges,
        save,
        publish,
        loading,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}

export function useContentOptional() {
  return useContext(ContentContext);
}
