'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEditMode } from '@/context/inline-editor/EditModeContext';
import { useContent } from '@/context/inline-editor/ContentContext';
import FloatingToolbar from './FloatingToolbar';

interface EditableTextProps {
  sectionId: string;
  field: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  children?: React.ReactNode;
}

export default function EditableText({
  sectionId,
  field,
  as: Tag = 'div',
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
  children,
}: EditableTextProps) {
  const { isEditMode } = useEditMode();
  const { content, updateField } = useContent();

  // Find the current value from content
  const section = content.sections.find((s) => s.id === sectionId);
  const fieldParts = field.split('.');
  let value = section?.data as Record<string, unknown> | undefined;
  for (const part of fieldParts) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part] as Record<string, unknown> | undefined;
    }
  }
  const textValue = (typeof value === 'string' ? value : '') || '';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: multiline ? {} : false,
        bulletList: multiline ? {} : false,
        orderedList: multiline ? {} : false,
        blockquote: multiline ? {} : false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: textValue,
    editable: isEditMode,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      // For single-line, strip wrapping <p> tags
      const clean = multiline ? html : html.replace(/^<p>/, '').replace(/<\/p>$/, '');
      updateField(sectionId, field, clean);
    },
  });

  // Sync editable state
  useEffect(() => {
    if (editor) editor.setEditable(isEditMode);
  }, [editor, isEditMode]);

  // Sync content when it changes externally
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const current = editor.getHTML();
      const wrapped = multiline ? textValue : `<p>${textValue}</p>`;
      if (current !== wrapped && current !== textValue) {
        editor.commands.setContent(textValue);
      }
    }
  }, [editor, textValue, multiline]);

  if (!isEditMode) {
    // Render static content
    if (children) return <Tag className={className}>{children}</Tag>;
    if (multiline) {
      return <Tag className={className} dangerouslySetInnerHTML={{ __html: textValue }} />;
    }
    return <Tag className={className}>{textValue}</Tag>;
  }

  return (
    <div className={`relative group ${className}`}>
      <FloatingToolbar editor={editor} multiline={multiline} />
      <EditorContent
        editor={editor}
        className={`outline-none ring-1 ring-brand-accent/30 rounded px-1 -mx-1 hover:ring-brand-accent/60 focus-within:ring-brand-accent ${
          multiline ? 'min-h-[4rem]' : ''
        }`}
      />
    </div>
  );
}
