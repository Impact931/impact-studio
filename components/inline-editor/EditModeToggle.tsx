'use client';

import { useEditMode } from '@/context/inline-editor/EditModeContext';
import { useContentOptional } from '@/context/inline-editor/ContentContext';
import { Pencil, Eye, Save, Upload, Loader2 } from 'lucide-react';

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
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2">
      {isEditMode && content && (
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2">
          {content.hasChanges && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded font-medium">
              Unsaved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!content.hasChanges || isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
            title="Save Draft"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover disabled:opacity-40 transition-colors"
            title="Publish Changes"
          >
            <Upload className="w-4 h-4" />
            Publish
          </button>
        </div>
      )}
      <button
        onClick={toggleEditMode}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all ${
          isEditMode
            ? 'bg-green-600 hover:bg-green-700 ring-4 ring-green-200'
            : 'bg-brand-accent hover:bg-brand-accent-hover'
        }`}
        title={isEditMode ? 'Exit Edit Mode (⌘⇧E)' : 'Enter Edit Mode (⌘⇧E)'}
      >
        {isEditMode ? <Eye className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
      </button>
    </div>
  );
}
