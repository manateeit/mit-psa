// server/src/components/editor/TextEditor.tsx
'use client'

import React, { useEffect, useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Toolbar from '../../components/editor/Toolbar';
import { createYjsProvider } from '../../components/editor/yjs-config';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';
import styles from './TextEditor.module.css';

type TextEditorProps = {
  roomName?: string,
  initialContent?: string,
  onContentChange?: (content: string) => void,
  handleSubmit?: (content: string) => Promise<void>,
  children?: React.ReactNode,
  editorRef?: React.MutableRefObject<Editor | null>;
}

const TextEditor: React.FC<TextEditorProps> = ({ 
  roomName, 
  initialContent, 
  onContentChange, 
  handleSubmit, 
  children,
  editorRef
}) => {
  roomName = roomName || ("default-room-" + Math.random().toString(36).substring(7));

  const { ydoc, provider } = useMemo((() => createYjsProvider(roomName)), [roomName]);

  const turndownService = new TurndownService();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Underline,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: 'John Doe',
          color: '#40cff9',
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: 'p-5',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const sanitizedHtml = DOMPurify.sanitize(html);
      const markdown = turndownService.turndown(sanitizedHtml);
      if (onContentChange) {
        onContentChange(markdown);
      }
    },
    onCreate: ({ editor }) => {
      if (editor.isEmpty && initialContent) {
        editor.commands.setContent(initialContent);
      }
    },
    onDestroy: () => {
      provider.destroy()
    }
  });

  useEffect(() => {
    if (editorRef && editor) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`${styles['editor']} w-full px-4`}>
      {children}
      <EditorContent className={styles.noBorder} style={{ whiteSpace: "pre-line" }} editor={editor} />
      <Toolbar editor={editor} content={editor.getHTML()} onSubmit={handleSubmit} />
    </div>
  );
};

export default TextEditor;
