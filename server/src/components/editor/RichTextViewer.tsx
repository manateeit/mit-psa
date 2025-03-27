'use client';

import { useEffect } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { PartialBlock } from '@blocknote/core';

interface RichTextViewerProps {
  id?: string;
  content: string | PartialBlock[];
  className?: string;
}

/**
 * RichTextViewer component for displaying BlockNote content with formatting
 * This component renders BlockNote content in read-only mode, preserving all formatting
 */
export default function RichTextViewer({ 
  id = 'rich-text-viewer',
  content,
  className = '',
}: RichTextViewerProps) {
  // Parse content
  const parsedContent = (() => {
    if (Array.isArray(content)) {
      return content;
    }

    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // If string can't be parsed as JSON, create a text block with it
      return [{
        type: "paragraph",
        props: {
          textAlignment: "left",
          backgroundColor: "default",
          textColor: "default"
        },
        content: [{
          type: "text",
          text: content,
          styles: {}
        }]
      }];
    }

    return [{
      type: "paragraph",
      props: {
        textAlignment: "left",
        backgroundColor: "default",
        textColor: "default"
      },
      content: [{
        type: "text",
        text: "",
        styles: {}
      }]
    }];
  })();

  // Create editor instance with content
  const editor = useCreateBlockNote({
    initialContent: parsedContent,
    // The editor is read-only by default in this component
    domAttributes: {
      editor: {
        class: 'pointer-events-none', // Disable interactions with the editor
      },
    },
  });

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-white rounded-lg overflow-auto">
        <BlockNoteView
          editor={editor}
          theme="light"
          className="w-full"
        />
      </div>
    </div>
  );
}
