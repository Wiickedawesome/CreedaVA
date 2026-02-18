"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Modal, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { lazyGenerateText, lazySendMessageStream, lazyGetCurrentMessages, lazyLogActionToMemory, lazyGetConversationHistory, lazySwitchConversation, lazyNewConversation } from "@/lib/firebase/ai-lazy";
import { buildTrainedPrompt, getPageContext } from "@/lib/utils/ai-system-prompt";
import { fetchOne } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth-context";
import { Markdown } from "@/components/admin/markdown";
import type { AIMessage, AIConversation } from "@/lib/types/ai";

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
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Action mode = one-shot structured generation; Chat mode = persistent memory
  const isActionMode = !!(onResult || buildPrompt);

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [autoContextLoaded, setAutoContextLoaded] = useState(false);
  const [enrichedDataContext, setEnrichedDataContext] = useState(dataContext);
  const [dynamicPresets, setDynamicPresets] = useState<{ label: string; prompt: string }[]>([]);

  // Action mode state (one-shot result)
  const [result, setResult] = useState("");
  const [showResult, setShowResult] = useState(false);

  // Chat mode state (persistent memory)
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState<AIConversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  // Merge dynamic (AI-generated) presets ahead of static presets
  const allPresets = [...dynamicPresets, ...presets];

  // Rotating presets: show 5 at a time, cycle every 60 seconds
  const VISIBLE_PRESETS = 5;
  const [presetOffset, setPresetOffset] = useState(0);
  const visiblePresets =
    allPresets.length <= VISIBLE_PRESETS
      ? allPresets
      : Array.from({ length: VISIBLE_PRESETS }, (_, i) =>
          allPresets[(presetOffset + i) % allPresets.length],
        );

  useEffect(() => {
    if (allPresets.length <= VISIBLE_PRESETS || generating || showResult) return;
    const timer = setInterval(() => {
      setPresetOffset((prev) => (prev + 1) % allPresets.length);
    }, 60_000);
    return () => clearInterval(timer);
  }, [allPresets.length, generating, showResult]);

  // Auto-focus textarea on open
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  // Auto-load page-aware Firestore context when dialog opens
  useEffect(() => {
    if (!open || autoContextLoaded || dataContext) return;

    let cancelled = false;
    (async () => {
      try {
        const { loadPageAwareContext } = await import("@/lib/utils/ai-page-context");
        const ctx = await loadPageAwareContext(pathname);
        if (!cancelled) {
          setEnrichedDataContext(ctx.dataContext);
          setAutoContextLoaded(true);
        }
      } catch (err) {
        console.warn("[AI Prompt] Auto-context loading failed:", err);
      }
    })();

    return () => { cancelled = true; };
  }, [open, autoContextLoaded, dataContext, pathname]);

  // Load AI-generated dynamic presets from Firestore
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const doc = await fetchOne<{
          presets: { label: string; prompt: string }[];
          generatedAt: string;
        }>("settings", "ai-presets");
        if (!cancelled && doc?.presets?.length) {
          setDynamicPresets(doc.presets);
        }
      } catch (err) {
        console.warn("[AI Prompt] Dynamic presets loading failed:", err);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Chat mode: Load conversation history from unified core
  useEffect(() => {
    if (!open || isActionMode || chatLoaded || !user?.uid) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await lazyGetCurrentMessages(user.uid);
        if (!cancelled && result.messages.length > 0) {
          setChatMessages(
            result.messages.map((m: AIMessage) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
          );
        }
      } catch (err) {
        console.warn("[AI Prompt] Chat history loading failed:", err);
      } finally {
        if (!cancelled) setChatLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [open, isActionMode, chatLoaded, user?.uid]);

  // Chat mode: Scroll to bottom on new messages and during streaming
  const lastChatContent = chatMessages[chatMessages.length - 1]?.content;
  useEffect(() => {
    if (!isActionMode && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages.length, lastChatContent, isActionMode]);

  function handlePreset(presetPrompt: string) {
    setPrompt(presetPrompt);
    textareaRef.current?.focus();
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      if (isActionMode) {
        // ─── Action mode: one-shot structured generation ───
        const pageContext = getPageContext(pathname);

        const fullPrompt = buildPrompt
          ? buildPrompt(prompt, enrichedDataContext || dataContext)
          : buildTrainedPrompt(section, prompt, enrichedDataContext || dataContext, {
              includeCompetitors: true,
              includeKPIs: true,
              includeSEOAlgorithms: true,
              pageContext,
            });

        const raw = await lazyGenerateText(fullPrompt);

        // Log to memory so Creeda AI remembers this action (fire-and-forget)
        if (user?.uid) {
          lazyLogActionToMemory(user.uid, prompt, raw, section, pathname).catch(() => {});
        }

        if (onResult) {
          onResult(raw);
          onClose();
        } else {
          setResult(raw);
          setShowResult(true);
        }
      } else {
        // ─── Chat mode: persistent memory via unified core (streaming) ───
        if (!user?.uid) {
          toast("Please sign in to use AI chat", "error");
          return;
        }
        const userMsg = prompt.trim();
        setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setPrompt("");

        // Add placeholder assistant message for streaming
        setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const stream = lazySendMessageStream(user.uid, userMsg, {
          pagePath: pathname,
          dataContext: enrichedDataContext || dataContext,
          section,
          includeCompetitors: true,
          includeKPIs: true,
        });

        for await (const chunk of stream) {
          setChatMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = { ...last, content: last.content + chunk };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      toast("AI generation failed — try again", "error");
      // Remove optimistic user message + placeholder on chat mode failure
      if (!isActionMode) {
        setChatMessages((prev) => prev.slice(0, -2));
      }
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    toast("Copied to clipboard");
  }

  function handleCopyChatMessage(content: string) {
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard");
  }

  async function handleToggleHistory() {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    if (!user?.uid) return;
    try {
      const convos = await lazyGetConversationHistory(user.uid, 15);
      setPastConversations(convos);
    } catch (err) {
      console.warn("[AI Prompt] History loading failed:", err);
    }
    setShowHistory(true);
  }

  async function handleSwitchConversation(convoId: string) {
    if (!user?.uid || convoId === activeConvoId) return;
    try {
      const result = await lazySwitchConversation(user.uid, convoId);
      setChatMessages(
        result.messages.map((m: AIMessage) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setActiveConvoId(convoId);
      setShowHistory(false);
    } catch (err) {
      console.error("[AI Prompt] Conversation switch failed:", err);
      toast("Failed to switch conversation", "error");
    }
  }

  async function handleNewChat() {
    if (!user?.uid) return;
    try {
      await lazyNewConversation(user.uid);
      setChatMessages([]);
      setActiveConvoId(null);
      setShowHistory(false);
    } catch (err) {
      console.error("[AI Prompt] New conversation failed:", err);
      toast("Failed to start new conversation", "error");
    }
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !isActionMode) {
      e.preventDefault();
      handleGenerate();
    }
  }

  // ─── Action Mode: Result View ──────────────────────
  if (isActionMode && showResult) {
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

  // ─── Chat Mode: Conversational View ────────────────
  if (!isActionMode) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={section}
        size="lg"
        footer={
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {allPresets.length > 0 && (
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {visiblePresets.map((p) => {
                    const isDynamic = dynamicPresets.some((dp) => dp.label === p.label);
                    return (
                      <button
                        key={p.label}
                        onClick={() => handlePreset(p.prompt)}
                        className={`flex-1 min-w-0 rounded-full border px-2 py-1 text-xs transition-all duration-300 truncate cursor-pointer ${
                          isDynamic
                            ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 font-medium"
                            : "border-border bg-white text-gray-60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                        }`}
                      >
                        {isDynamic ? "✦ " : ""}{p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleGenerate}
              isLoading={generating}
              disabled={!prompt.trim()}
            >
              Send
            </Button>
          </>
        }
      >
        <div className="flex flex-col h-[60vh]">
          {/* Chat toolbar */}
          <div className="flex items-center justify-end gap-1 pb-2 border-b border-border mb-2 shrink-0">
            <button
              onClick={handleToggleHistory}
              className={`p-1 rounded transition-colors cursor-pointer ${showHistory ? "text-primary bg-primary/10" : "text-gray-40 hover:text-primary"}`}
              title="Conversation history"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              onClick={handleNewChat}
              className="p-1 text-gray-40 hover:text-primary transition-colors cursor-pointer"
              title="New conversation"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>

          {/* Conversation history dropdown */}
          {showHistory && (
            <div className="border border-border rounded-lg bg-white max-h-40 overflow-y-auto mb-2 shrink-0">
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-50 uppercase tracking-wider border-b border-border">Past Conversations</div>
              {pastConversations.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-40 text-center">No past conversations</p>
              )}
              {pastConversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => handleSwitchConversation(convo.id)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-primary/5 transition-colors cursor-pointer border-b border-border/50 last:border-b-0 ${
                    convo.id === activeConvoId ? "bg-primary/10 text-primary font-medium" : "text-gray-70"
                  }`}
                >
                  <div className="truncate">{convo.title || "Untitled"}</div>
                  <div className="text-[10px] text-gray-40 mt-0.5">
                    {convo.messages?.length || 0} messages
                    {convo.updatedAt ? ` · ${new Date(typeof convo.updatedAt === "string" ? convo.updatedAt : (convo.updatedAt as { seconds: number }).seconds * 1000).toLocaleDateString()}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chat messages area */}
          <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
            {!chatLoaded && (
              <div className="flex items-center justify-center py-8 text-sm text-gray-40">
                Loading conversation&hellip;
              </div>
            )}
            {chatLoaded && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a4 4 0 014 4v1h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2V6a4 4 0 014-4z" />
                    <circle cx="9" cy="14" r="1.5" />
                    <circle cx="15" cy="14" r="1.5" />
                    <path d="M9 18h6" />
                  </svg>
                </div>
                <p className="text-sm text-gray-60 max-w-xs">{description}</p>
                <p className="text-xs text-gray-40 mt-1">I remember our conversations across pages</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md"
                      : "bg-gray-10 text-gray-80 border border-border rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Markdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => handleCopyChatMessage(msg.content)}
                      className="mt-1.5 text-xs text-gray-40 hover:text-primary transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {generating && (
              <div className="flex justify-start">
                <div className="bg-gray-10 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border pt-3">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || `Ask Creeda AI about ${section.toLowerCase()}\u2026`}
              className="w-full min-h-16 max-h-32 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-gray-90 placeholder:text-gray-40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed"
              disabled={generating}
              rows={2}
            />
            <p className="text-xs text-gray-30 mt-1">Enter to send &middot; Shift+Enter for new line &middot; Memory persists across pages</p>
          </div>
        </div>
      </Modal>
    );
  }

  // ─── Action Mode: Prompt View ──────────────────────
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={section}
      size="lg"
      footer={
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {allPresets.length > 0 && (
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {visiblePresets.map((p) => {
                  const isDynamic = dynamicPresets.some((dp) => dp.label === p.label);
                  return (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(p.prompt)}
                      className={`flex-1 min-w-0 rounded-full border px-2 py-1 text-xs transition-all duration-300 truncate cursor-pointer ${
                        isDynamic
                          ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 font-medium"
                          : "border-border bg-white text-gray-60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {isDynamic ? "✦ " : ""}{p.label}
                    </button>
                  );
                })}
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
