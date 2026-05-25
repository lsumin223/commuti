'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import TableExtension from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import ImageExtension from '@tiptap/extension-image';
import CharacterCount from '@tiptap/extension-character-count';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState, useCallback } from 'react';
import { FontSize, LetterSpacing, LineHeight, Spoiler } from '@/lib/editor/extensions';
import Toolbar from './Toolbar';

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export default function Editor({ content, onSave, readOnly = false, placeholder = '내용을 입력하세요…', className }: EditorProps) {
  const [focusMode, setFocusMode] = useState(false);
  const [saved, setSaved] = useState(true);
  const [countMode, setCountMode] = useState<'with' | 'without'>('with');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ImageExtension,
      CharacterCount,
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      FontSize,
      LetterSpacing,
      LineHeight,
      Spoiler,
    ],
    content: content ? JSON.parse(content) : '',
    editable: !readOnly,
    onUpdate: () => {
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        triggerSave();
      }, 5000);
    },
  });

  const triggerSave = useCallback(() => {
    if (!editor || !onSave) return;
    const json = JSON.stringify(editor.getJSON());
    onSave(json);
    setSaved(true);
  }, [editor, onSave]);

  // Manual save on Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        triggerSave();
      }
      if (e.key === 'Escape' && focusMode) setFocusMode(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusMode, triggerSave]);

  // Update content when prop changes
  useEffect(() => {
    if (!editor || !content) return;
    const current = JSON.stringify(editor.getJSON());
    if (current !== content) {
      editor.commands.setContent(JSON.parse(content), false);
    }
  }, [editor, content]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  if (!editor) return null;

  const charCount = editor.storage.characterCount;
  const withSpaces  = charCount?.characters() ?? 0;
  const withoutSpaces = charCount?.words() ?? 0; // words as proxy; actual no-space count below
  const rawText = editor.getText();
  const noSpaceCount = rawText.replace(/\s/g, '').length;

  const editorBody = (
    <div className={`tiptap-editor ${className ?? ''}`}>
      {!readOnly && (
        <Toolbar editor={editor} onFocusMode={() => setFocusMode(f => !f)} focusMode={focusMode} />
      )}
      <EditorContent editor={editor}
        className="px-6 py-5 min-h-[300px] focus:outline-none" />
      {!readOnly && (
        <div className="flex items-center justify-between px-6 py-2 border-t border-bd text-xs text-text2">
          <button type="button" onClick={() => setCountMode(m => m === 'with' ? 'without' : 'with')}
            className="hover:text-text1 transition-colors">
            {countMode === 'with'
              ? `${withSpaces.toLocaleString()}자 (공백 포함)`
              : `${noSpaceCount.toLocaleString()}자 (공백 제외)`}
          </button>
          <button type="button" onClick={() => { if (saveTimer.current) clearTimeout(saveTimer.current); triggerSave(); }}
            className={`transition-colors ${saved ? 'text-sage' : 'text-text2 hover:text-text1'}`}>
            {saved ? '저장됨 ✓' : '저장 중…'}
          </button>
        </div>
      )}
    </div>
  );

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-sm flex items-start justify-center overflow-y-auto">
        <div className="w-full max-w-3xl min-h-screen bg-white shadow-xl">
          <div className="flex items-center justify-between px-6 py-3 border-b border-bd bg-bg1 sticky top-0 z-10">
            <span className="text-sm text-text2 font-medium">집중 모드</span>
            <button onClick={() => setFocusMode(false)}
              className="text-xs text-text2 hover:text-text1 transition-colors">
              Esc 또는 클릭하여 닫기
            </button>
          </div>
          {editorBody}
        </div>
      </div>
    );
  }

  return editorBody;
}
