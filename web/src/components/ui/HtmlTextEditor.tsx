import { useCallback, useEffect, useRef } from 'react';
import { normalizeEditorHtml, toEditorHtml } from '@/utils/html';

interface HtmlTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type EditorCommand = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList';

const TOOLBAR: { command: EditorCommand; label: string; title: string }[] = [
  { command: 'bold', label: 'B', title: 'Bold' },
  { command: 'italic', label: 'I', title: 'Italic' },
  { command: 'underline', label: 'U', title: 'Underline' },
  { command: 'insertUnorderedList', label: '•', title: 'Bullet list' },
  { command: 'insertOrderedList', label: '1.', title: 'Numbered list' },
];

const toolbarBtnClass =
  'min-w-[1.75rem] h-7 px-1.5 rounded text-xs font-semibold text-bm-textMuted hover:text-bm-textDark hover:bg-bm-surfaceHover transition-colors';

export function HtmlTextEditor({
  value,
  onChange,
  placeholder = 'Add context for the team…',
  rows = 6,
}: HtmlTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const lastEmittedRef = useRef<string | null>(null);

  const syncEmptyState = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const empty = !normalizeEditorHtml(el.innerHTML);
    el.dataset.empty = empty ? 'true' : 'false';
  }, []);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const normalized = normalizeEditorHtml(el.innerHTML);
    lastEmittedRef.current = normalized;
    onChange(normalized);
    syncEmptyState();
  }, [onChange, syncEmptyState]);

  useEffect(() => {
    if (isFocusedRef.current || value === lastEmittedRef.current) return;
    lastEmittedRef.current = value;
    const el = editorRef.current;
    if (!el) return;
    el.innerHTML = toEditorHtml(value);
    syncEmptyState();
  }, [value, syncEmptyState]);

  useEffect(() => {
    syncEmptyState();
  }, [syncEmptyState]);

  const runCommand = (command: EditorCommand) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt('Link URL');
    if (!url?.trim()) return;
    editorRef.current?.focus();
    document.execCommand('createLink', false, url.trim());
    emitChange();
  };

  const minHeightRem = Math.max(3, rows * 1.35);

  return (
    <div className="rounded-md border border-bm-border bg-bm-surface overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-bm-border bg-bm-board/80">
        {TOOLBAR.map(({ command, label, title }) => (
          <button
            key={command}
            type="button"
            title={title}
            aria-label={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runCommand(command)}
            className={toolbarBtnClass}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          title="Insert link"
          aria-label="Insert link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertLink}
          className={toolbarBtnClass}
        >
          ↗
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        data-placeholder={placeholder}
        data-empty="true"
        className="html-editor rich-html px-3 py-2 text-sm text-bm-textDark leading-relaxed outline-none focus:ring-2 focus:ring-inset focus:ring-bm-blue/30"
        style={{ minHeight: `${minHeightRem}rem` }}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          emitChange();
        }}
        onInput={emitChange}
      />
    </div>
  );
}
