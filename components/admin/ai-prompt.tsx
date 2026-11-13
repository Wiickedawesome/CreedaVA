"use client";

import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Modal, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { lazyGenerateText, lazySendMessage, lazyGetCurrentMessages, lazyLogActionToMemory, lazyGetConversationHistory, lazySwitchConversation, lazyNewConversation, lazyConfirmAction, lazyRejectAction } from "@/lib/firebase/ai-lazy";
import { buildTrainedPrompt, getPageContext } from "@/lib/utils/ai-system-prompt";
import { buildSectionPreview } from "@/lib/utils/ai-preview";
import { CREEDA_AI_NAME, describeAdminArea } from "@/lib/constants/ai-brand";
import { fetchOne } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/firebase/auth-context";
import { Markdown } from "@/components/admin/markdown";
import type { AIMessage, AIConversation } from "@/lib/types/ai";
import type { ToolExecutionResult, PendingAction } from "@/lib/firebase/ai-tool-executor";
import type { PromptInput } from "@/lib/firebase/ai";

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
   * Grouped presets — renders two labeled rows of chips instead of a flat
   * rotating list. Use when two areas need to inform one prompt.
   * When present, overrides the rotation behavior for the grouped items.
   */
  presetGroups?: { groupLabel: string; items: { label: string; prompt: string }[] }[];
  /**
   * Build the full prompt from user input + data context.
   * If not provided, uses a default that includes the section context.
   */
  buildPrompt?: (input: string, dataContext: string) => PromptInput;
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
  /**
   * Chat-mode only. When set and the conversation is empty on first open,
   * auto-fires this prompt for a proactive opening
   * analysis. Fires only once per dialog open (tracked via ref).
   */
  proactiveQuery?: string;
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
  const pathname = usePathname();
  const areaLabel = describeAdminArea(pathname ?? "");

  return (
    <span>
      <button
        onClick={() => setOpen(true)}
        className={`group relative inline-flex items-center justify-center rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ai-prompt-btn ${
          size === "sm" ? "h-9 w-9" : "h-10 w-10"
        } ${className}`}
        title={`Ask ${CREEDA_AI_NAME}${areaLabel ? ` about ${areaLabel}` : ""}`}
        aria-label={`Ask ${CREEDA_AI_NAME}`}
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
        {/* Specialist pulse indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 color-dot" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full color-dot" />
        </span>
      </button>

      {open && (
        <AIPromptDialog
          {...config}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </span>
  );
}

// ─── AI Prompt Dialog ────────────────────────────────

const TOUR_STEPS = [
  {
    title: "Meet Your AI Specialist",
    body: "Each page has a dedicated expert. ORACLE handles SEO, NOVA creates content, SCOUT tracks sales performance, and more.",
  },
  {
    title: "Persistent Memory",
    body: "I remember everything across pages and sessions. Your context builds over time — no need to repeat yourself.",
  },
  {
    title: "Proactive Analysis",
    body: "On key pages I auto-analyze your data the moment you open me. No prompt needed — I start working immediately.",
  },
  {
    title: "Save Note",
    body: "Any insight I generate can be saved to AI Tasks with one click using the bookmark icon below each response.",
  },
  {
    title: "Switch Specialists",
    body: "I carry the context of the page you are on, so ask in plain language — no mode switching needed.",
  },
];

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
  presetGroups = [],
  buildPrompt,
  onResult,
  previewable = false,
  previewLabel = "Preview Page",
  proactiveQuery = "",
}: AIPromptDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const proactiveFired = useRef(false);
  const pathname = usePathname();
  const areaLabel = describeAdminArea(pathname ?? "");

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
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; toolsUsed?: ToolExecutionResult[] }[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState<AIConversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);

  // Onboarding tour state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Offline prompt queue
  const [, setOfflineQueue] = useState<string[]>([]);

  // Tool calling state
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null);

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

  // Show onboarding tour on first open (chat mode only)
  useEffect(() => {
    if (!open || isActionMode) return;
    if (typeof window !== "undefined" && !localStorage.getItem("ai-onboarding-v1")) {
      const timeoutId = setTimeout(() => {
        setShowOnboarding(true);
        setOnboardingStep(0);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [open, isActionMode]);

  // Drain offline queue when connection restores
  useEffect(() => {
    function handleOnline() {
      setOfflineQueue((q) => {
        if (q.length > 0) {
          setPrompt(q[0]);
          toast("You're back online — queued prompt ready to send", "info");
          return q.slice(1);
        }
        return q;
      });
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [toast]);

  // Chat mode: proactive first look when the conversation is empty
  useEffect(() => {
    if (!open || isActionMode || !chatLoaded || chatMessages.length > 0 || !proactiveQuery || !user?.uid || proactiveFired.current) return;
    proactiveFired.current = true;
    setGenerating(true);
    setActiveToolName("thinking");
    lazySendMessage(user.uid, proactiveQuery, {
      section,
      pagePath: pathname ?? "/admin",
    }).then((result) => {
      setChatMessages([{ role: "assistant", content: result.response, toolsUsed: result.toolsUsed }]);
      if (result.pendingActions?.length) setPendingActions(result.pendingActions);
    }).catch((err) => {
      console.warn("[AI Prompt] Proactive analysis failed:", err);
    }).finally(() => {
      setGenerating(false);
      setActiveToolName(null);
    });
  }, [open, isActionMode, chatLoaded, chatMessages.length, proactiveQuery, user?.uid, pathname, section]);

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
        // ─── Chat mode: persistent memory via unified core (with tool calling) ───
        if (!user?.uid) {
          toast("Please sign in to use AI chat", "error");
          return;
        }
        const userMsg = prompt.trim();

        // Queue prompt if offline instead of making failing API call
        if (typeof window !== "undefined" && !navigator.onLine) {
          setOfflineQueue((q) => [...q, userMsg]);
          setChatMessages((prev) => [
            ...prev,
            { role: "user", content: `${userMsg} ⏸ *(queued — you're offline)*` },
          ]);
          setPrompt("");
          toast("You're offline — prompt queued and will send when connection restores", "info");
          setGenerating(false);
          return;
        }

        setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
        setPrompt("");

        // Use sendMessage (non-streaming) to support tool-call loop
        setActiveToolName("thinking");
        const msgResult = await lazySendMessage(user.uid, userMsg, {
          pagePath: pathname ?? "/admin",
          dataContext: enrichedDataContext || dataContext,
          section,
          includeCompetitors: true,
          includeKPIs: true,
        });
        setActiveToolName(null);

        // Older prompts could emit a [HANDOFF:CODENAME] marker to switch
        // persona. There is one assistant now, so strip it if it still appears.
        const cleanResponse = msgResult.response.replace(/\[HANDOFF:[A-Z]+\]/g, "").trim();

        // Add assistant message with tools metadata
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: cleanResponse,
            toolsUsed: msgResult.toolsUsed,
          },
        ]);

        // Store any pending actions for confirmation UI
        if (msgResult.pendingActions?.length) {
          setPendingActions((prev) => [...prev, ...msgResult.pendingActions!]);
        }
      }
    } catch (err) {
      console.error("AI generation failed:", err);
      toast("AI generation failed — try again", "error");
      // Remove optimistic user message on chat mode failure
      if (!isActionMode) {
        setChatMessages((prev) => prev.slice(0, -1));
        setActiveToolName(null);
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

  async function handleSaveNote(content: string) {
    try {
      const { saveSpecialistNote } = await import("@/lib/utils/ai-feedback");
      await saveSpecialistNote(content, CREEDA_AI_NAME, areaLabel || "Admin", section, pathname ?? "");
      toast("Note saved to AI Tasks", "success");
    } catch {
      toast("Failed to save note", "error");
    }
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

  async function handleConfirmAction(actionId: string) {
    setConfirmingActionId(actionId);
    try {
      const result = await lazyConfirmAction(actionId);
      toast(`Action confirmed: ${result.name}`, "success");
      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
    } catch (err) {
      console.error("Confirm action failed:", err);
      toast("Failed to confirm action", "error");
    } finally {
      setConfirmingActionId(null);
    }
  }

  function handleRejectAction(actionId: string) {
    lazyRejectAction(actionId);
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
    toast("Action rejected", "info");
  }

  function handlePreviewPage() {
    // Link the admin's own stylesheets so the preview uses the real design
    // system rather than a copy of it. `href` is already absolute.
    const stylesheets = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map((link) => link.href)
      .filter(Boolean);

    const html = buildSectionPreview(result, section, stylesheets);
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
              {presetGroups.length > 0 ? (
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {presetGroups.map((group) => (
                    <div key={group.groupLabel} className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-gray-50 shrink-0 font-medium w-14 truncate">{group.groupLabel}</span>
                      {group.items.slice(0, 4).map((p) => (
                        <button
                          key={p.label}
                          onClick={() => handlePreset(p.prompt)}
                          className="flex-1 min-w-0 rounded-full border border-border bg-card px-2 py-1 text-xs text-gray-60 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200 truncate cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : allPresets.length > 0 && (
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
                            : "border-border bg-card text-gray-60 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
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
        <div className="flex flex-col h-[60vh] relative" style={{ '--sc': "var(--primary)" } as React.CSSProperties}>
          {/* ─── Onboarding Tour Overlay ─── */}
          {showOnboarding && (
            <div className="absolute inset-0 z-20 bg-card/96 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-8">
              {/* Step dots */}
              <div className="flex gap-1.5 mb-6">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === onboardingStep ? "w-6 bg-primary" : "w-2 bg-gray-20"
                    }`}
                  />
                ))}
              </div>

              {/* Step content */}
              <div className="text-center max-w-xs">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto shadow-sm assistant-ring"
                >
                  <svg className="w-7 h-7 assistant-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-90 mb-2">
                  {TOUR_STEPS[onboardingStep].title}
                </h3>
                <p className="text-sm text-gray-60 leading-relaxed">
                  {TOUR_STEPS[onboardingStep].body}
                </p>
              </div>

              {/* Navigation */}
              <div className="mt-8 flex items-center gap-3">
                {onboardingStep > 0 && (
                  <button
                    onClick={() => setOnboardingStep((s) => s - 1)}
                    className="px-3 py-1.5 text-xs text-gray-50 hover:text-gray-80 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
                {onboardingStep < TOUR_STEPS.length - 1 ? (
                  <button
                    onClick={() => setOnboardingStep((s) => s + 1)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer assistant-bg"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      localStorage.setItem("ai-onboarding-v1", "done");
                      setShowOnboarding(false);
                    }}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer assistant-bg"
                  >
                    Got it!
                  </button>
                )}
              </div>

              {/* Skip */}
              <button
                onClick={() => setShowOnboarding(false)}
                className="mt-3 text-xs text-gray-30 hover:text-gray-50 transition-colors cursor-pointer"
              >
                Skip (show again next time)
              </button>
            </div>
          )}
          {/* Chat toolbar */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-border mb-2 shrink-0">
            {/* Specialist badge + switcher */}
            <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium assistant-badge">
                <span className="font-bold tracking-wide">{CREEDA_AI_NAME}</span>
                {areaLabel && <span className="text-[9px] opacity-60">· {areaLabel}</span>}
              </div>
            </div>
            {/* History + new conversation */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleHistory}
                className={`p-1 rounded transition-colors cursor-pointer ${showHistory ? "text-primary bg-primary/10" : "text-gray-50 hover:text-primary"}`}
                title="Conversation history"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </button>
              <button
                onClick={handleNewChat}
                className="p-1 text-gray-50 hover:text-primary transition-colors cursor-pointer"
                title="New conversation"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conversation history dropdown */}
          {showHistory && (
            <div className="border border-border rounded-lg bg-card max-h-40 overflow-y-auto mb-2 shrink-0">
              <div className="px-3 py-1.5 text-[10px] font-medium text-gray-50 uppercase tracking-wider border-b border-border">Past Conversations</div>
              {pastConversations.length === 0 && (
                <p className="px-3 py-3 text-xs text-gray-50 text-center">No past conversations</p>
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
                  <div className="text-[10px] text-gray-50 mt-0.5">
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
              <div className="flex items-center justify-center py-8 text-sm text-gray-50">
                Loading conversation&hellip;
              </div>
            )}
            {chatLoaded && chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-sm assistant-ring"
                >
                  <svg className="w-7 h-7 assistant-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1 assistant-name">{CREEDA_AI_NAME}</p>
                <p className="text-sm text-gray-60 max-w-xs">{description}</p>
                <p className="text-xs text-gray-50 mt-1">I remember our conversations across pages</p>
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
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-gray-10 text-gray-80 border border-border rounded-bl-md border-l-2"
                  }`}
                  style={msg.role === "assistant" ? { borderLeftColor: "var(--sc)" } : undefined}
                >
                  {msg.role === "assistant" ? (
                    <Markdown content={msg.content} />
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {/* Tool usage badges */}
                  {msg.role === "assistant" && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] text-gray-50 mr-1 self-center">Tools:</span>
                      {msg.toolsUsed.map((tool, ti) => (
                        <span
                          key={ti}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] px-2 py-0.5 font-medium"
                          title={JSON.stringify(tool.response, null, 2).slice(0, 300)}
                        >
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                          </svg>
                          {tool.name.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.role === "assistant" && msg.content && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => handleCopyChatMessage(msg.content)}
                        className="text-xs text-gray-50 hover:text-primary transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                      <span className="text-gray-30 text-xs">·</span>
                      <button
                        onClick={() => handleSaveNote(msg.content)}
                        className="text-xs text-gray-50 hover:text-primary transition-colors cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Pending action confirmation cards */}
            {pendingActions.length > 0 && (
              <div className="space-y-2">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-xl border border-warning-soft-line bg-warning-soft/40 p-3"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-warning-soft flex items-center justify-center">
                      <svg className="w-4 h-4 text-warning-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-warning-text">Action requires confirmation</p>
                      <p className="text-xs text-gray-60 mt-0.5">{action.impactSummary}</p>
                      <p className="text-[10px] text-gray-50 mt-1 font-mono">{action.toolName.replace(/_/g, " ")}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleConfirmAction(action.id)}
                          isLoading={confirmingActionId === action.id}
                          className="text-xs! px-3! py-1! h-auto!"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectAction(action.id)}
                          className="text-xs! px-3! py-1! h-auto!"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {generating && (
              <div className="flex justify-start">
                <div className="bg-gray-10 border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    {activeToolName && activeToolName !== "thinking" && (
                      <span className="text-[10px] text-primary/70 font-medium animate-pulse">
                        Using {activeToolName.replace(/_/g, " ")}…
                      </span>
                    )}
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
              className="w-full min-h-16 max-h-32 rounded-lg border border-border bg-gray-10/50 px-4 py-2.5 text-sm text-gray-90 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-none leading-relaxed"
              disabled={generating}
              rows={2}
            />
            <p className="text-xs text-gray-30 mt-1">Enter to send &middot; Shift+Enter for new line &middot; Can use tools &middot; Memory persists</p>
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
            {presetGroups.length > 0 ? (
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                {presetGroups.map((group) => (
                  <div key={group.groupLabel} className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] text-gray-50 shrink-0 font-medium w-14 truncate">{group.groupLabel}</span>
                    {group.items.slice(0, 4).map((p) => (
                      <button
                        key={p.label}
                        onClick={() => handlePreset(p.prompt)}
                        className="flex-1 min-w-0 rounded-full border border-border bg-gray-10/60 px-2 py-1 text-xs text-gray-70 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all duration-200 truncate cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ) : allPresets.length > 0 && (
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
                          : "border-border bg-gray-10/60 text-gray-70 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {isDynamic ? "✦ " : ""}{p.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-50 tabular-nums">
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
      <div className="space-y-3" style={{ '--sc': "var(--primary)" } as React.CSSProperties}>
        <div className="relative flex items-center mb-1" onClick={e => e.stopPropagation()}>
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium assistant-badge">
            <span className="font-bold tracking-wide">{CREEDA_AI_NAME}</span>
            {areaLabel && <span className="opacity-60">— {areaLabel}</span>}
          </div>
        </div>
        <p className="text-sm text-gray-60">{description}</p>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, maxChars))}
          placeholder={placeholder || `What would you like to create or analyze for ${section.toLowerCase()}?`}
          className="w-full min-h-48 max-h-[50vh] rounded-lg border border-border bg-gray-10/50 px-4 py-3 text-sm text-gray-90 placeholder:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 resize-y leading-relaxed"
          disabled={generating}
        />
      </div>
    </Modal>
  );
}
