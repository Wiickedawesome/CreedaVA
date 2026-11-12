"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import { PageHeader, Markdown } from "@/components/admin";
import { BusinessPulse } from "@/components/admin/report-categories";
import type { Lead, Customer, Contact, Booking } from "@/lib/types/crm";
import type {
  AIReport,
  BlogPost,
  SEOKeyword,
  SEOAudit,
  Campaign,
  EmailDraft,
  LandingPage,
  ForumThread,
} from "@/lib/types/content";
import type { AllCollections } from "@/lib/utils/ai-data-context";
import { buildFullContext } from "@/lib/utils/ai-data-context";
import {
  lazySendMessageStream,
  lazyGetCurrentMessages,
  lazyNewConversation,
  lazyGetConversationHistory,
  lazySwitchConversation,
} from "@/lib/firebase/ai-lazy";
import { useAuth } from "@/lib/firebase/auth-context";
import type { AIMessage, AIConversation } from "@/lib/types/ai";

// ─── Chat types ──────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Creeda AI. Ask me anything about your website, business data, leads, SEO, marketing, or operations. I have access to all your dashboard data and I remember our conversations.",
  timestamp: new Date(),
};

/** Convert persisted AIMessage[] from Firestore to display ChatMessage[] */
function toDisplayMessages(msgs: AIMessage[]): ChatMessage[] {
  return msgs.map((m, i) => ({
    id: `${m.role}-${i}-${m.timestamp}`,
    role: m.role,
    content: m.content,
    timestamp: new Date(m.timestamp),
  }));
}

function AIChatBox({ allData }: { allData: AllCollections }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pastConversations, setPastConversations] = useState<(AIConversation & { id: string })[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation history from Firestore on mount
  useEffect(() => {
    if (!user?.uid || historyLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const { messages: history, conversationId } = await lazyGetCurrentMessages(user.uid);
        if (!cancelled) {
          setActiveConvoId(conversationId);
          if (history.length > 0) {
            setMessages([WELCOME_MESSAGE, ...toDisplayMessages(history)]);
          }
        }
      } catch (err) {
        console.warn("[Creeda AI] Failed to load conversation history:", err);
      } finally {
        if (!cancelled) setHistoryLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, historyLoaded]);

  const lastMsgContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, lastMsgContent]);

  async function handleSend() {
    const text = input.trim();
    if (!text || generating || !user?.uid) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    try {
      // Use unified AI Core with streaming — handles memory, context, and history
      const dataContext = buildFullContext(allData);
      const aiMsgId = `ai-${Date.now()}`;

      // Add a placeholder assistant message for streaming
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant" as const, content: "", timestamp: new Date() },
      ]);

      const stream = lazySendMessageStream(user.uid, text, {
        pagePath: "/admin/seo?section=ai",
        section: "Creeda AI",
        dataContext,
        includeCompetitors: true,
        includeKPIs: true,
      });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (err) {
      console.error("AI chat error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setGenerating(false);
      inputRef.current?.focus();
    }
  }

  async function handleNewConversation() {
    if (!user?.uid) return;
    try {
      const newId = await lazyNewConversation(user.uid);
      setActiveConvoId(newId);
      setMessages([WELCOME_MESSAGE]);
      setShowHistory(false);
    } catch (err) {
      console.warn("[Creeda AI] Failed to start new conversation:", err);
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
      setShowHistory(true);
    } catch (err) {
      console.warn("[Creeda AI] Failed to load history:", err);
    }
  }

  async function handleSwitchConversation(convoId: string) {
    if (!user?.uid || convoId === activeConvoId) return;
    try {
      const { messages: history, conversationId } = await lazySwitchConversation(user.uid, convoId);
      setActiveConvoId(conversationId);
      setMessages([WELCOME_MESSAGE, ...toDisplayMessages(history)]);
      setShowHistory(false);
    } catch (err) {
      console.warn("[Creeda AI] Failed to switch conversation:", err);
    }
  }

  const quickPrompts = [
    "How are my leads doing?",
    "What should I focus on today?",
    "SEO quick audit",
    "Revenue risks?",
  ];

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 014 4v1h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2V6a4 4 0 014-4z" />
            <circle cx="9" cy="14" r="1.5" />
            <circle cx="15" cy="14" r="1.5" />
            <path d="M9 18h6" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-90">Creeda AI</h3>
          <p className="text-[10px] text-gray-50">Powered by Gemini &middot; Persistent memory</p>
        </div>
        {generating ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-primary">
            <span className="h-2 w-2 animate-spin rounded-full border border-primary border-t-transparent" />
            Thinking...
          </span>
        ) : (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={handleToggleHistory}
              className={`text-[10px] p-1 rounded transition-colors cursor-pointer ${showHistory ? "text-primary bg-primary/10" : "text-gray-50 hover:text-primary"}`}
              title="Conversation history"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              onClick={handleNewConversation}
              className="text-[10px] text-gray-50 hover:text-primary transition-colors p-1 cursor-pointer"
              title="Start a new conversation"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Conversation history dropdown */}
      {showHistory && (
        <div className="border-b border-border bg-gray-10/50 max-h-48 overflow-y-auto shrink-0">
          <div className="px-3 py-2 text-[10px] font-medium text-gray-50 uppercase tracking-wider">Past Conversations</div>
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

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3"
        tabIndex={0}
        role="region"
        aria-label="Conversation messages, scroll to read"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-gray-10 text-gray-80 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? <Markdown content={msg.content} /> : <p>{msg.content}</p>}
            </div>
          </div>
        ))}
        {generating && (
          <div className="flex justify-start">
            <div className="bg-gray-10 rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-30 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-30 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-30 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts — show only when no conversation */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
                inputRef.current?.focus();
              }}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border text-gray-50 hover:bg-gray-10 hover:text-gray-80 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your website..."
            aria-label="Ask about your website"
            disabled={generating}
            className="flex-1 rounded-lg border border-border bg-gray-10 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || generating}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Send question"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AiSection() {
  // ─── Load all collections that power the assistant + pulse ──
  const { data: reports, loading: reportsLoading } = useCollection<AIReport>("reports", { orderByField: "createdAt" });
  const { data: leads } = useCollection<Lead>("leads");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: contacts } = useCollection<Contact>("contacts");
  const { data: bookings } = useCollection<Booking>("bookings");
  const { data: campaigns } = useCollection<Campaign>("campaigns");
  const { data: emails } = useCollection<EmailDraft>("emails");
  const { data: blog } = useCollection<BlogPost>("blog");
  const { data: keywords } = useCollection<SEOKeyword>("keywords");
  const { data: seoAudits } = useCollection<SEOAudit>("seo");
  const { data: landingPages } = useCollection<LandingPage>("landing-pages");
  const { data: forumThreads } = useCollection<ForumThread>("forum");

  const allData: AllCollections = useMemo(
    () => ({
      leads,
      customers,
      contacts,
      bookings,
      campaigns,
      emails,
      blog,
      keywords,
      seoAudits,
      landingPages,
      forumThreads,
    }),
    [leads, customers, contacts, bookings, campaigns, emails, blog, keywords, seoAudits, landingPages, forumThreads],
  );

  // ─── Keep the weekly digest fresh ──────────────────
  // The weekly scheduled report previously ran from the AI Dashboard. With
  // Creeda AI now living in the SEO Hub, regenerate a stale weekly report here
  // so the Agent → Weekly digest tab stays current. The hook debounces via
  // localStorage (5-minute window) and only touches the weekly period.
  const { autoGenerate } = useScheduledReports();
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    if (reportsLoading) return;
    if (leads.length + customers.length + bookings.length === 0) return;
    autoRanRef.current = true;
    autoGenerate(allData).catch((err) => console.warn("[creeda-ai] autoGenerate failed:", err));
  }, [reportsLoading, leads.length, customers.length, bookings.length, allData, autoGenerate]);

  // ─── Business Pulse score + area breakdown ─────────
  const latestScore = useMemo(() => {
    const scored = reports.filter((r) => r.score !== undefined);
    return scored.length > 0 ? scored[0].score! : null;
  }, [reports]);

  const pulseAreas = useMemo(
    () => [
      { label: "Sales", value: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100) : 0 },
      { label: "Content", value: blog.length > 0 ? Math.round((blog.filter((b) => b.status === "published").length / blog.length) * 100) : 0 },
      { label: "Marketing", value: campaigns.length > 0 ? Math.round((campaigns.filter((c) => c.status === "active" || c.status === "completed").length / campaigns.length) * 100) : 0 },
      { label: "SEO", value: seoAudits.length > 0 ? Math.round(seoAudits.reduce((s, a) => s + a.score, 0) / seoAudits.length) : 0 },
      { label: "Bookings", value: bookings.length > 0 ? Math.round((bookings.filter((b) => b.status === "completed" || b.status === "confirmed").length / bookings.length) * 100) : 0 },
      { label: "Forum", value: forumThreads.length > 0 ? Math.round((forumThreads.filter((t) => t.replies > 0).length / forumThreads.length) * 100) : 0 },
      { label: "Keywords", value: keywords.length > 0 ? Math.round((keywords.filter((k) => k.tracked).length / keywords.length) * 100) : 0 },
    ],
    [leads, blog, campaigns, seoAudits, bookings, forumThreads, keywords],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        as="h2"
        title="Creeda AI"
        description="Chat with Creeda AI about your whole business and watch your live health pulse. It has access to all your dashboard data and remembers your conversations."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Pulse — full natural height, sets the row size */}
        <BusinessPulse score={latestScore} areas={pulseAreas} />

        {/* AI Chat — absolute so it doesn't push the grid row taller */}
        <div className="relative min-h-[32rem]">
          <div className="absolute inset-0">
            <AIChatBox allData={allData} />
          </div>
        </div>
      </div>
    </div>
  );
}
