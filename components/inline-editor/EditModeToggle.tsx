'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useEditMode } from '@/context/inline-editor/EditModeContext';
import { useContentOptional } from '@/context/inline-editor/ContentContext';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  Pencil,
  Eye,
  Save,
  Upload,
  Download,
  Check,
  Loader2,
  LogOut,
  LayoutDashboard,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export default function EditModeToggle() {
  const { isEditMode, toggleEditMode, setEditMode, isAdmin, isSaving, setIsSaving } = useEditMode();
  const content = useContentOptional();
  const [isExpanded, setIsExpanded] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on outside touch
  useEffect(() => {
    const handleTouchOutside = (e: TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, []);

  const handleSave = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      await content.save();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!content) return;
    setIsSaving(true);
    try {
      await content.publish();
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = useCallback(() => {
    if (!content) return;
    const data = {
      slug: content.pageSlug,
      content: content.content,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `impact-studio-${content.pageSlug}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [content]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !content) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.content) {
            content.setContent(data.content);
            setImportStatus('Content imported successfully');
          } else {
            setImportStatus('Invalid content file');
          }
          setTimeout(() => setImportStatus(null), 4000);
        } catch {
          setImportStatus('Invalid JSON file');
          setTimeout(() => setImportStatus(null), 4000);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [content],
  );

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
      setEditMode(false);
      setIsExpanded(false);
      signOut({ callbackUrl: '/' });
    }
  };

  if (!isAdmin) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[60] flex flex-col-reverse items-end gap-2 sm:gap-3"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Main toggle button */}
        <button
          onClick={toggleEditMode}
          onTouchStart={() => setIsExpanded(!isExpanded)}
          className={`relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center touch-manipulation ${
            isEditMode
              ? 'bg-brand-accent border-2 border-brand-accent hover:bg-brand-accent-hover'
              : 'bg-gray-900 border-2 border-brand-accent/30 hover:border-brand-accent/60'
          }`}
          title={isEditMode ? 'Exit Edit Mode (⌘⇧E) or Esc' : 'Enter Edit Mode (⌘⇧E)'}
        >
          {isEditMode ? (
            <Pencil className="w-6 h-6 text-white" />
          ) : (
            <Eye className="w-6 h-6 text-brand-accent" />
          )}

          {/* Pending changes badge */}
          {content?.hasChanges && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              !
            </span>
          )}

          {/* Pulse when active */}
          {isEditMode && (
            <span className="absolute inset-0 rounded-full bg-brand-accent/30 animate-ping" />
          )}
        </button>

        {/* Save button — always visible in edit mode */}
        {isEditMode && content && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg shadow-lg transition-all duration-300 touch-manipulation min-h-[44px] text-white disabled:opacity-50 ${
              !content.hasChanges && !isSaving
                ? 'bg-emerald-500 scale-105 ring-2 ring-emerald-400/50'
                : 'bg-green-700 hover:bg-green-600'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : !content.hasChanges ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        )}

        {/* Media Library link */}
        {isExpanded && isEditMode && (
          <Link
            href="/admin/media"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700/50 hover:border-brand-accent/50 text-gray-300 hover:text-brand-accent font-medium rounded-lg shadow-lg transition-all touch-manipulation min-h-[44px]"
          >
            <ImageIcon className="w-4 h-4" />
            Media Library
          </Link>
        )}

        {/* Admin Panel link */}
        {isExpanded && isEditMode && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700/50 hover:border-brand-accent/50 text-gray-300 hover:text-brand-accent font-medium rounded-lg shadow-lg transition-all touch-manipulation min-h-[44px]"
          >
            <LayoutDashboard className="w-4 h-4" />
            Admin Panel
          </Link>
        )}

        {/* Export button */}
        {isExpanded && isEditMode && content && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700/50 hover:border-brand-accent/50 text-gray-300 hover:text-brand-accent font-medium rounded-lg shadow-lg transition-all touch-manipulation min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}

        {/* Import button */}
        {isExpanded && isEditMode && content && (
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border border-gray-700/50 hover:border-brand-accent/50 text-gray-300 hover:text-brand-accent font-medium rounded-lg shadow-lg transition-all touch-manipulation min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        )}

        {/* Import status */}
        {importStatus && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg text-sm text-blue-400">
            <Check className="w-4 h-4" />
            {importStatus}
          </div>
        )}

        {/* Logout button — top of stack */}
        {isExpanded && isEditMode && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-900/60 border border-red-500/40 hover:border-red-400 text-red-300 hover:text-white font-medium rounded-lg shadow-lg transition-all touch-manipulation min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}

        {/* Publish button — when unsaved changes */}
        {isExpanded && isEditMode && content?.hasChanges && (
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 touch-manipulation min-h-[44px]"
          >
            Publish
          </button>
        )}
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileSelected}
      />
    </>
  );
}
