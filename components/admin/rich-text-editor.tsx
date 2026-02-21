"use client";

import { useState, useRef, useCallback } from "react";

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// ─── Toolbar button ──────────────────────────────────
function TBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded text-gray-60 hover:bg-gray-10 hover:text-gray-90 transition-colors ${active ? "bg-primary/10 text-primary" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── Tag wrapper helper ──────────────────────────────
function wrapSelection(
  textarea: HTMLTextAreaElement,
  openTag: string,
  closeTag: string,
  value: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);
  const wrapped = `${openTag}${selected || "text"}${closeTag}`;
  const next = before + wrapped + after;
  onChange(next);

  // Restore cursor after next tick
  requestAnimationFrame(() => {
    textarea.focus();
    const cursorPos = start + openTag.length + (selected || "text").length;
    textarea.setSelectionRange(
      start + openTag.length,
      cursorPos,
    );
  });
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  text: string,
  value: string,
  onChange: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const before = value.slice(0, start);
  const after = value.slice(start);
  onChange(before + text + after);

  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + text.length;
    textarea.setSelectionRange(pos, pos);
  });
}

// ─── Component ───────────────────────────────────────
export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("preview");
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = useCallback(
    (open: string, close: string) => {
      if (!ref.current) return;
      wrapSelection(ref.current, open, close, value, onChange);
    },
    [value, onChange],
  );

  const insert = useCallback(
    (text: string) => {
      if (!ref.current) return;
      insertAtCursor(ref.current, text, value, onChange);
    },
    [value, onChange],
  );

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-gray-70 mb-1">{label}</label>
      )}
      <div className="rounded-lg border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        {/* ── Toolbar ── */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-10/60 border-b border-border flex-wrap">
          {/* Formatting */}
          <TBtn title="Bold" onClick={() => wrap("<strong>", "</strong>")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" /><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" /></svg>
          </TBtn>
          <TBtn title="Italic" onClick={() => wrap("<em>", "</em>")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
          </TBtn>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Headings */}
          <TBtn title="Heading 2" onClick={() => wrap("<h2>", "</h2>")}>
            <span className="text-xs font-bold">H2</span>
          </TBtn>
          <TBtn title="Heading 3" onClick={() => wrap("<h3>", "</h3>")}>
            <span className="text-xs font-bold">H3</span>
          </TBtn>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Structure */}
          <TBtn title="Paragraph" onClick={() => wrap("<p>", "</p>")}>
            <span className="text-xs font-bold">P</span>
          </TBtn>
          <TBtn title="Bullet List" onClick={() => insert("\n<ul>\n  <li>Item</li>\n  <li>Item</li>\n</ul>\n")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          </TBtn>
          <TBtn title="Blockquote" onClick={() => wrap("<blockquote>", "</blockquote>")}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          </TBtn>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Link */}
          <TBtn
            title="Link"
            onClick={() => {
              if (!ref.current) return;
              const sel = value.slice(ref.current.selectionStart, ref.current.selectionEnd) || "link text";
              const start = ref.current.selectionStart;
              const before = value.slice(0, start);
              const after = value.slice(ref.current.selectionEnd);
              onChange(before + `<a href="https://">${sel}</a>` + after);
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
          </TBtn>

          {/* Image tag */}
          <TBtn
            title="Image tag"
            onClick={() => insert('<img src="" alt="description" />')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </TBtn>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mode toggle */}
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              mode === "preview" ? "bg-primary text-white" : "bg-card text-gray-60 border border-border hover:bg-gray-10"
            }`}
          >
            {mode === "preview" ? (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5l4 4L7 21H3v-4L16.5 3.5z" /></svg>
                Edit
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                Preview
              </>
            )}
          </button>
        </div>

        {/* ── Editor / Preview ── */}
        {mode === "edit" ? (
          <textarea
            ref={ref}
            className="w-full px-4 py-3 text-sm text-gray-80 placeholder:text-gray-40 focus:outline-none resize-y font-mono bg-card"
            style={{ minHeight }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <div
            className="px-4 py-3 prose prose-sm max-w-none text-sm text-gray-80 overflow-auto bg-card"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: value || `<p class="text-gray-40">${placeholder}</p>` }}
          />
        )}
      </div>
    </div>
  );
}
