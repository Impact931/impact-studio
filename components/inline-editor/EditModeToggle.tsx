'use client';

import { useEditMode } from '@/context/inline-editor/EditModeContext';
import { useContentOptional } from '@/context/inline-editor/ContentContext';

export default function EditModeToggle() {
  const { isEditMode, toggleEditMode, isAdmin, isSaving, setIsSaving } = useEditMode();
  const content = useContentOptional();

  if (!isAdmin) return null;

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

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      {isEditMode && content && (
        <div className="flex items-center gap-2">
          {content.hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={!content.hasChanges || isSaving}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium bg-brand-accent text-white rounded-lg shadow-sm hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
          >
            Publish
          </button>
        </div>
      )}
      <button
        onClick={toggleEditMode}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-colors ${
          isEditMode ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-accent hover:bg-brand-accent/90'
        }`}
        title={isEditMode ? 'Exit Edit Mode (⌘⇧E)' : 'Enter Edit Mode (⌘⇧E)'}
      >
        {isEditMode ? '✓' : '✎'}
      </button>
    </div>
  );
}
