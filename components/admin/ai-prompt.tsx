"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { Modal, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { lazyGenerateText } from "@/lib/firebase/ai-lazy";
import { buildTrainedPrompt } from "@/lib/utils/ai-system-prompt";

// ─── Types ───────────────────────────────────────────

export interface AIPromptConfig {
  /** Section name shown in dialog header (e.g. "Blog AI", "SEO AI") */
  section: string;
  /** Short description of what AI can do for this section */
  description: string;
  /** Placeholder text for the prompt textarea */
  placeholder?: string;
  /** Max character limit for prompt input */
  maxChars?: number;
  /** Contextual data passed to AI (serialized string) */
  dataContext?: string;
  /**
   * Quick-action presets shown as chips above the textarea.
   * Clicking one pre-fills the textarea.
   */
  presets?: { label: string; prompt: string }[];
  /**
   * Build the full prompt from user input + data context.
   * If not provided, uses a default that includes the section context.
   */
  buildPrompt?: (input: string, dataContext: string) => string;
  /**
   * Custom handler for the result. If provided, called instead of showing
   * the generic result view. Use for structured results (blog posts, etc.).
   */
  onResult?: (result: string) => void;
  /**
   * If true, result can be previewed as a "page" in new tab.
   */
  previewable?: boolean;
  /**
   * Label for the preview button (default: "Preview Page").
   */
  previewLabel?: string;
}

export interface AIPromptButtonProps extends AIPromptConfig {
  /** Override the button content (default: AI icon) */
  children?: ReactNode;
  /** Additional CSS class for the trigger button */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

// ─── AI Prompt Button (trigger) ──────────────────────

export function AIPromptButton({
  children,
  className = "",
  size = "md",
  ...config
}: AIPromptButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative inline-flex items-center justify-center rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-primary/5 text-primary hover:from-primary/15 hover:to-primary/10 hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${
          size === "sm" ? "h-9 w-9" : "h-10 w-10"
        } ${className}`}
        title={`${config.section} — Click to open AI assistant`}
        aria-label={`Open ${config.section}`}
      >
        {children || (
          <svg
            className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} transition-transform group-hover:scale-110`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a4 4 0 014 4v1h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2V6a4 4 0 014-4z" />
            <circle cx="9" cy="14" r="1.5" />
            <circle cx="15" cy="14" r="1.5" />
            <path d="M9 18h6" />
          </svg>
        )}
        {/* Subtle animated dot indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
      </button>

      {open && (
        <AIPromptDialog
          {...config}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ─── AI Prompt Dialog ────────────────────────────────

interface AIPromptDialogProps extends AIPromptConfig {
  open: boolean;
  onClose: () => void;
}

function AIPromptDialog({
  open,
  onClose,
  section,
  description,
  placeholder,
  maxChars = 5000,
  dataContext = "",
  presets = [],
  buildPrompt,
  onResult,
  previewable = false,
  previewLabel = "Preview Page",
}: AIPromptDialogProps) {
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Rotating presets: show 5 at a time, cycle every 6 seconds
  const VISIBLE_PRESETS = 5;
  const [presetOffset, setPresetOffset] = useState(0);
  const visiblePresets =
    presets.length <= VISIBLE_PRESETS
      ? presets
      : Array.from({ length: VISIBLE_PRESETS }, (_, i) =>
          presets[(presetOffset + i) % presets.length],
        );

  useEffect(() => {
    if (presets.length <= VISIBLE_PRESETS || generating || showResult) return;
    const timer = setInterval(() => {
      setPresetOffset((prev) => (prev + 1) % presets.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [presets, generating, showResult]);

  // Auto-focus textarea on open
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  function handlePreset(presetPrompt: string) {
    setPrompt(presetPrompt);
    textareaRef.current?.focus();
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const fullPrompt = buildPrompt
        ? buildPrompt(prompt, dataContext)
        : buildTrainedPrompt(section, prompt, dataContext, {
            includeCompetitors: true,
            includeKPIs: true,
          });

      const raw = await lazyGenerateText(fullPrompt);

      if (onResult) {
        onResult(raw);
        onClose();
      } else {
        setResult(raw);
        setShowResult(true);
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      toast("AI generation failed — try again", "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    toast("Copied to clipboard");
  }

  function handlePreviewPage() {
    // Open result as HTML preview in new tab
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview — ${section}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Roboto', system-ui, sans-serif; color: #002D72; line-height: 1.6; padding: 2rem; max-width: 900px; margin: 0 auto; }
    h1, h2, h3 { color: #005148; margin: 1.5rem 0 0.75rem; }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    p { margin-bottom: 1rem; }
    ul, ol { margin: 0.5rem 0 1rem 1.5rem; }
    li { margin-bottom: 0.25rem; }
    a { color: #005148; }
    .preview-bar { position: fixed; top: 0; left: 0; right: 0; background: #005148; color: white; padding: 0.5rem 1rem; font-size: 0.875rem; text-align: center; z-index: 999; }
    .content { margin-top: 3rem; }
  </style>
</head>
<body>
  <div class="preview-bar">Preview — ${section} | CreedaVA AI Generated Content</div>
  <div class="content">${result}</div>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function handleModify() {
    // Go back to prompt view with context
    setShowResult(false);
    setPrompt(
      `Modify the following:\n\n${result.slice(0, 500)}${result.length > 500 ? "..." : ""}\n\nChanges requested: `,
    );
    textareaRef.current?.focus();
  }

  function handleReset() {
    setPrompt("");
    setResult("");
    setShowResult(false);
  }

  // ─── Result View ───────────────────────────────────
  if (showResult) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={`${section} — Result`}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleReset}>
              New Prompt
            </Button>
            <Button variant="outline" size="sm" onClick={handleModify}>
              Modify
            </Button>
            {previewable && (
              <Button variant="outline" size="sm" onClick={handlePreviewPage}>
                {previewLabel}
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              Copy
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <div className="rounded-lg border border-border bg-gray-10/50 p-5 text-sm text-gray-80 whitespace-pre-wrap max-h-[60vh] overflow-y-auto leading-relaxed">
          {result}
        </div>
      </Modal>
    );
  }

  // ─── Prompt View ───────────────────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={section}
      size="lg"
      footer={
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Preset chips — rotate through suggestions */}
            {presets.length > 0 && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {visiblePresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.prompt)}
                    className="flex-1 min-w-0 rounded-full border border-border bg-white px-2 py-1 text-xs text-gray-60 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-300 truncate cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-40 tabular-nums">
            {prompt.length}/{maxChars}
          </span>
          <Button
            size="sm"
            onClick={handleGenerate}
            isLoading={generating}
            disabled={!prompt.trim() || prompt.length > maxChars}
          >
            Generate
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-60">{description}</p>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
          placeholder={placeholder || `What would you like to create or analyze for ${section.toLowerCase()}?`}
          className="w-full min-h-48 max-h-[50vh] rounded-lg border border-border bg-white px-4 py-3 text-sm text-gray-90 placeholder:text-gray-40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-y leading-relaxed"
          disabled={generating}
        />
      </div>
    </Modal>
  );
}
