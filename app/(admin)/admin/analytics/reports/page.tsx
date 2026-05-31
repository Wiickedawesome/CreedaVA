"use client";

import { buildTrainedPrompt, buildReportPrompt } from "@/lib/utils/ai-system-prompt";
import { useState, useMemo, useRef, useEffect } from "react";
import { useCollection } from "@/hooks/useCollection";
import { useScheduledReports } from "@/hooks/useScheduledReports";
import {
  PageHeader,
  DataTable,
  Modal,
  AdminTabs,
  StatCard,
  AIPromptButton,
  Markdown,
  useToast,
  EmptyState,
} from "@/components/admin";
import type { Column } from "@/components/admin";
import {
  ReportCategoryCard,
  ScheduledReportCard,
  InsightCard,
  BusinessPulse,
} from "@/components/admin/report-categories";
import { Button, Input } from "@/components/ui";
import type { AIReport, AIReportType, AIInsight, AITask } from "@/lib/types/content";
import type { ToolRiskLevel } from "@/lib/firebase/ai-tools";
import type { ActionDecision } from "@/lib/firebase/ai-autonomy";
import type { Lead, Customer, Task, Project, Contact, Booking } from "@/lib/types/crm";
import type {
  BlogPost,
  SEOKeyword,
  SEOAudit,
  Campaign,
  SocialPost,
  EmailDraft,
  LandingPage,
  ForumThread,
} from "@/lib/types/content";
import type { AllCollections } from "@/lib/utils/ai-data-context";
import {
  buildFullContext,
  buildSalesContext,
  buildSEOContext,
  buildMarketingContext,
  buildOperationsContext,
} from "@/lib/utils/ai-data-context";
import { lazyGenerateText, lazySendMessageStream, lazyGetCurrentMessages, lazyNewConversation, lazyGetConversationHistory, lazySwitchConversation } from "@/lib/firebase/ai-lazy";
import { useAuth } from "@/lib/firebase/auth-context";
import type { AIMessage, AIConversation } from "@/lib/types/ai";
import { cloudExportToSheets, cloudGenerateReportSheet, cloudUploadReportToDrive } from "@/lib/firebase/cloud-functions";

// ─── On-Demand Category Definitions ──────────────────

interface CategoryDef {
  id: AIReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  contextBuilder: (data: AllCollections) => string;
  promptTemplate: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "performance",
    title: "Performance Deep Dive",
    description: "Full business health analysis — pipeline, revenue, velocity, gaps",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    contextBuilder: buildFullContext,
    promptTemplate: `Produce a comprehensive performance deep-dive for CreedaVA. Analyze all data holistically: pipeline health, conversion funnel, revenue trends, task completion velocity, content output, marketing ROI. Identify the top 3 strengths and top 3 weaknesses. Provide a score 0-100 and 5 specific, actionable recommendations.`,
  },
  {
    id: "seo",
    title: "SEO & Content Audit",
    description: "Content gaps, keyword opportunities, page performance",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    contextBuilder: buildSEOContext,
    promptTemplate: `Perform an SEO & Content audit for CreedaVA. Analyze: blog content gaps, keyword coverage, keyword difficulty distribution, search intent alignment, landing page conversion potential. Identify missing content topics, underperforming keywords, and content refresh opportunities. Score 0-100.`,
  },
  {
    id: "pipeline",
    title: "Sales Pipeline",
    description: "Lead flow, conversion rates, bottlenecks, forecasting",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    contextBuilder: buildSalesContext,
    promptTemplate: `Analyze the CreedaVA sales pipeline. Cover: lead volume by source, conversion rate per stage, average deal value, pipeline velocity (time in each stage), win/loss analysis, booking-to-customer conversion. Identify bottlenecks and recommend 5 improvements. Score 0-100.`,
  },
  {
    id: "operational",
    title: "Operational Efficiency",
    description: "Task throughput, project delivery, team productivity",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    contextBuilder: buildOperationsContext,
    promptTemplate: `Analyze CreedaVA&apos;s operational efficiency. Examine: task completion rates, overdue percentages, priority distribution, project delivery timelines, booking fulfillment rates. Identify workflow bottlenecks, resource allocation issues, and productivity patterns. Recommend 5 operational improvements. Score 0-100.`,
  },
  {
    id: "marketing",
    title: "Marketing ROI",
    description: "Campaign performance, channel effectiveness, spend analysis",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
    contextBuilder: buildMarketingContext,
    promptTemplate: `Analyze CreedaVA&apos;s marketing ROI across all channels. Cover: campaign budget vs spend vs conversions, platform performance comparison, social media content output and engagement patterns, email campaign effectiveness, landing page conversion rates. Calculate cost-per-lead and cost-per-conversion where possible. Recommend 5 optimizations. Score 0-100.`,
  },
  {
    id: "growth-forecast",
    title: "Growth Forecast",
    description: "Revenue trends, lead projections, and scaling readiness",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
    contextBuilder: buildFullContext,
    promptTemplate: `Create a 90-day growth forecast for CreedaVA. Analyze current trends in: lead volume, conversion rates, revenue trajectory, customer acquisition cost, churn signals. Project forward based on current momentum. Identify the #1 growth lever and #1 risk. Recommend 5 strategic bets to accelerate growth. Score 0-100 (growth readiness).`,
  },
];

// ─── Helper: format Firestore date ───────────────────

// Hoisted so the react-hooks/purity rule doesn't flag time reads inside the
// component body (event handlers / effects only).
function nowMs(): number {
  return Date.now();
}

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = typeof d === "object" && d !== null && "toDate" in d
    ? (d as { toDate: () => Date }).toDate()
    : new Date(d as string);
  return date.toLocaleDateString();
}

function formatDateTime(d: unknown): string {
  if (!d) return "";
  const date = typeof d === "object" && d !== null && "toDate" in d
    ? (d as { toDate: () => Date }).toDate()
    : new Date(d as string);
  return date.toLocaleString();
}

// ─── AI Chat Component (Unified Core w/ Memory) ────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm Creeda AI. Ask me anything about your website, business data, leads, SEO, marketing, or operations. I have access to all your dashboard data and I remember our conversations.",
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
    return () => { cancelled = true; };
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
        pagePath: "/admin/analytics/reports",
        section: "AI Dashboard Chat",
        dataContext,
        includeCompetitors: true,
        includeKPIs: true,
      });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
          )
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
          <p className="text-[10px] text-gray-40">Powered by Gemini &middot; Persistent memory</p>
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
              className={`text-[10px] p-1 rounded transition-colors cursor-pointer ${showHistory ? "text-primary bg-primary/10" : "text-gray-40 hover:text-primary"}`}
              title="Conversation history"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
            <button
              onClick={handleNewConversation}
              className="text-[10px] text-gray-40 hover:text-primary transition-colors p-1 cursor-pointer"
              title="Start a new conversation"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-gray-10 text-gray-80 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" ? (
                <Markdown content={msg.content} />
              ) : (
                <p>{msg.content}</p>
              )}
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
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
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
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
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
            className="flex-1 rounded-lg border border-border bg-gray-10 px-3 py-2 text-sm text-gray-80 placeholder:text-gray-40 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || generating}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
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

// ─── Activity Tracking Types & Helpers ───────────────

interface ActivityLogEntry {
  id: string;
  toolName: string;
  domain: string;
  risk: ToolRiskLevel;
  decision: ActionDecision;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  conversationId?: string;
  userConfirmed?: boolean;
  executedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

function timeAgo(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const riskColors: Record<string, string> = {
  "read-only": "bg-blue-500/15 text-blue-400",
  draft: "bg-yellow-500/15 text-yellow-400",
  auto: "bg-green-500/15 text-green-400",
  destructive: "bg-red-500/15 text-red-400",
};

const decisionColors: Record<string, string> = {
  "auto-execute": "bg-green-500/15 text-green-400",
  confirm: "bg-yellow-500/15 text-yellow-400",
  deny: "bg-red-500/15 text-red-400",
};

// ─── Page ────────────────────────────────────────────

export default function AIReportsDashboard() {
  // ─── Load ALL collections ──────────────────────────
  const { data: reports, loading: reportsLoading, add, edit: editReport, del } = useCollection<AIReport>("reports", { orderByField: "createdAt" });
  const { data: insights, add: addInsight, edit: editInsight } = useCollection<AIInsight>("ai-insights", { orderByField: "createdAt" });
  const { data: leads } = useCollection<Lead>("leads");
  const { data: customers } = useCollection<Customer>("customers");
  const { data: tasks } = useCollection<Task>("tasks");
  const { data: projects } = useCollection<Project>("projects");
  const { data: contacts } = useCollection<Contact>("contacts");
  const { data: bookings } = useCollection<Booking>("bookings");
  const { data: campaigns } = useCollection<Campaign>("campaigns");
  const { data: socialPosts } = useCollection<SocialPost>("social-posts");
  const { data: emails } = useCollection<EmailDraft>("emails");
  const { data: blog } = useCollection<BlogPost>("blog");
  const { data: keywords } = useCollection<SEOKeyword>("keywords");
  const { data: seoAudits } = useCollection<SEOAudit>("seo");
  const { data: landingPages } = useCollection<LandingPage>("landing-pages");
  const { data: forumThreads } = useCollection<ForumThread>("forum");
  const { data: activityLog, loading: logLoading } = useCollection<ActivityLogEntry>(
    "ai-activity-log",
    { orderByField: "createdAt", orderDirection: "desc" },
  );
  const { data: aiTasks } = useCollection<AITask>(
    "ai-tasks",
    { orderByField: "createdAt", orderDirection: "desc" },
  );

  const { toast } = useToast();

  // ─── All data bundle ──────────────────────────────
  const allData: AllCollections = useMemo(() => ({
    leads, customers, tasks, projects, contacts, bookings,
    campaigns, socialPosts, emails, blog, keywords, seoAudits, landingPages, forumThreads,
  }), [leads, customers, tasks, projects, contacts, bookings, campaigns, socialPosts, emails, blog, keywords, seoAudits, landingPages, forumThreads]);

  // ─── Scheduler ─────────────────────────────────────
  const { schedules, isGenerating: schedulerGenerating, generateReport, autoGenerate } = useScheduledReports();

  // ─── Auto-run stale scheduled reports once data is loaded ───
  // Prevents the Scheduled tab from sitting empty on first visit; the
  // hook already debounces via localStorage (5-minute window).
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (autoRanRef.current) return;
    if (reportsLoading) return;
    if (leads.length + customers.length + bookings.length + tasks.length === 0) return;
    autoRanRef.current = true;
    autoGenerate(allData).catch((err) => console.warn("[reports] autoGenerate failed:", err));
  }, [reportsLoading, leads.length, customers.length, bookings.length, tasks.length, allData, autoGenerate]);

  // ─── Auto-dismiss insights older than 14 days ──────
  const dismissedRef = useRef(new Set<string>());
  useEffect(() => {
    const cutoff = nowMs() - 14 * 24 * 60 * 60 * 1000;
    for (const insight of insights) {
      if (insight.dismissed || dismissedRef.current.has(insight.id)) continue;
      const createdAt = insight.createdAt
        ? typeof insight.createdAt === "object" && "toDate" in insight.createdAt
          ? (insight.createdAt as unknown as { toDate: () => Date }).toDate().getTime()
          : new Date(insight.createdAt as unknown as string).getTime()
        : 0;
      if (createdAt && createdAt < cutoff) {
        dismissedRef.current.add(insight.id);
        editInsight(insight.id, { dismissed: true }).catch(() => {
          dismissedRef.current.delete(insight.id);
        });
      }
    }
  }, [insights, editInsight]);

  // ─── UI state ──────────────────────────────────────
  const [tab, setTab] = useState("overview");
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<AIReport | null>(null);
  const [categoryGenerating, setCategoryGenerating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", summaryHtml: "", highlights: [] as string[], recommendations: [] as string[] });
  const [domainFilter, setDomainFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  async function handleExportToSheets(collection: "leads" | "customers" | "contacts" | "bookings" | "tasks" | "campaigns" | "blog") {
    setExporting(true);
    try {
      const result = await cloudExportToSheets(collection);
      if (result.success) {
        toast(`Exported ${result.rowCount} rows to Google Sheets`, "success");
        window.open(result.spreadsheetUrl, "_blank");
      } else {
        toast("Export failed — check Sheets integration", "error");
      }
    } catch {
      toast("Failed — ensure Google Sheets is configured in Settings → Integrations", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateReportSheet() {
    setExporting(true);
    try {
      const result = await cloudGenerateReportSheet();
      if (result.success) {
        toast(`Report "${result.sheetTitle}" created in Google Sheets`, "success");
        window.open(result.spreadsheetUrl, "_blank");
      } else {
        toast("Failed to generate report sheet", "error");
      }
    } catch {
      toast("Failed — ensure Google Sheets is configured in Settings → Integrations", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleUploadReportToDrive(report: AIReport) {
    setUploading(true);
    try {
      const content = btoa(unescape(encodeURIComponent(
        `# ${report.title}\n\nType: ${report.type}\nGenerated: ${report.createdAt}\nScore: ${report.score ?? "N/A"}\n\n${report.summaryHtml}\n\n## Recommendations\n${(report.recommendations || []).map((r, i) => `${i + 1}. ${r}`).join("\n")}`
      )));
      const result = await cloudUploadReportToDrive(
        `${report.title.replace(/[^a-zA-Z0-9 ]/g, "")}.md`,
        content,
        "text/markdown",
      );
      if (result.success) {
        toast("Report uploaded to Google Drive", "success");
        window.open(result.webLink, "_blank");
      } else {
        toast("Upload failed", "error");
      }
    } catch {
      toast("Failed — ensure Google Drive is configured in Settings → Integrations", "error");
    } finally {
      setUploading(false);
    }
  }

  // ─── Derived stats ────────────────────────────────
  const latestScore = useMemo(() => {
    const scored = reports.filter((r) => r.score !== undefined);
    return scored.length > 0 ? scored[0].score! : null;
  }, [reports]);

  const totalCollections = useMemo(() => {
    return Object.values(allData).filter((arr) => arr && arr.length > 0).length;
  }, [allData]);

  const activeInsights = useMemo(
    () => insights.filter((i) => !i.dismissed),
    [insights],
  );

  const filteredLog = useMemo(() => {
    return activityLog.filter((entry) => {
      if (domainFilter !== "all" && entry.domain !== domainFilter) return false;
      if (riskFilter !== "all" && entry.risk !== riskFilter) return false;
      return true;
    });
  }, [activityLog, domainFilter, riskFilter]);

  const domainOptions = useMemo(() => {
    const set = new Set(activityLog.map((e) => e.domain));
    return Array.from(set).sort();
  }, [activityLog]);

  const logColumns: Column<ActivityLogEntry>[] = [
    {
      key: "executedAt",
      header: "When",
      render: (entry) => (
        <span className="text-xs text-gray-40" title={entry.executedAt}>
          {timeAgo(entry.executedAt)}
        </span>
      ),
    },
    {
      key: "toolName",
      header: "Tool",
      render: (entry) => (
        <span className="font-mono text-xs text-gray-80">{entry.toolName}</span>
      ),
    },
    {
      key: "domain",
      header: "Domain",
      render: (entry) => (
        <span className="text-xs capitalize text-gray-60">{entry.domain}</span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      render: (entry) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${riskColors[entry.risk] || ""}`}>
          {entry.risk}
        </span>
      ),
    },
    {
      key: "decision",
      header: "Decision",
      render: (entry) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${decisionColors[entry.decision] || ""}`}>
          {entry.decision}
        </span>
      ),
    },
    {
      key: "error",
      header: "Status",
      render: (entry) => (
        <span className={`text-xs ${entry.error ? "text-red-400" : "text-green-400"}`}>
          {entry.error ? "Error" : "OK"}
        </span>
      ),
    },
  ];

  const aiTaskColumns: Column<AITask>[] = [
    {
      key: "label",
      header: "Task",
      render: (task) => (
        <span className="text-sm text-gray-80">{task.label}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (task) => (
        <span className="text-xs text-gray-60 capitalize">{task.type.replace(/-/g, " ")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (task) => {
        const statusColors: Record<string, string> = {
          queued: "bg-gray-500/15 text-gray-400",
          running: "bg-blue-500/15 text-blue-400",
          completed: "bg-green-500/15 text-green-400",
          failed: "bg-red-500/15 text-red-400",
        };
        return (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || ""}`}>
            {task.status}
          </span>
        );
      },
    },
    {
      key: "durationMs",
      header: "Duration",
      render: (task) =>
        task.durationMs ? (
          <span className="text-xs text-gray-40">{(task.durationMs / 1000).toFixed(1)}s</span>
        ) : (
          <span className="text-xs text-gray-40">—</span>
        ),
    },
    {
      key: "resultSnapshot",
      header: "Result",
      render: (task) => (
        <span className="text-xs text-gray-60 truncate max-w-50 inline-block">
          {task.resultSnapshot || task.error || "—"}
        </span>
      ),
    },
  ];

  // ─── Handlers ──────────────────────────────────────

  async function handleAiResult(text: string) {
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const result = JSON.parse(cleaned);
      const saved = {
        title: result.title || "AI Report",
        type: "custom" as AIReportType,
        category: "on-demand" as const,
        summaryHtml: result.summaryHtml || result.summary || text,
        highlights: result.highlights || [],
        recommendations: result.recommendations || [],
        score: result.score,
        area: "general",
      };
      await add(saved);
      toast("Report generated!", "success");
    } catch {
      await add({
        title: "AI Report",
        type: "custom" as AIReportType,
        category: "on-demand" as const,
        summaryHtml: text,
        highlights: [],
        recommendations: [],
        area: "general",
      });
      toast("Report generated!", "success");
    }
  }

  async function handleCategoryGenerate(cat: CategoryDef) {
    setCategoryGenerating(cat.id);
    try {
      const context = cat.contextBuilder(allData);
      const prompt = buildReportPrompt(cat.id, cat.promptTemplate, context);

      const raw = await lazyGenerateText(prompt);
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = { title: cat.title, summaryHtml: raw, highlights: [], recommendations: [] };
      }

      await add({
        title: (parsed.title as string) || `${cat.title} — ${new Date().toLocaleDateString()}`,
        type: cat.id,
        category: "on-demand" as const,
        summaryHtml: (parsed.summaryHtml as string) || (parsed.summary as string) || raw,
        highlights: (parsed.highlights as string[]) || [],
        recommendations: (parsed.recommendations as string[]) || [],
        score: parsed.score as number | undefined,
        dataSources: Object.keys(allData).filter(
          (k) => (allData[k as keyof AllCollections] as unknown[])?.length > 0,
        ),
        area: cat.id,
      });

      // Extract insights from recommendations, with a 30-day dedupe window
      // keyed on (category + first 80 chars of the recommendation).
      const recs = (parsed.recommendations as string[]) || [];
      const dedupeWindow = nowMs() - 30 * 24 * 60 * 60 * 1000;
      const existingKeys = new Set(
        insights
          .filter((i) => {
            const created = i.createdAt
              ? typeof i.createdAt === "object" && "toDate" in i.createdAt
                ? (i.createdAt as unknown as { toDate: () => Date }).toDate().getTime()
                : new Date(i.createdAt as unknown as string).getTime()
              : 0;
            return created >= dedupeWindow;
          })
          .map((i) => `${i.sourceReport ?? ""}:${(i.title ?? "").slice(0, 80)}`),
      );
      for (const rec of recs.slice(0, 3)) {
        const key = `${cat.id}:${rec.slice(0, 80)}`;
        if (existingKeys.has(key)) continue;
        existingKeys.add(key);
        await addInsight({
          title: rec.slice(0, 80),
          description: rec,
          area: cat.id === "seo" ? "seo" : cat.id === "pipeline" ? "sales" : cat.id === "marketing" ? "marketing" : cat.id === "operational" ? "operations" : "general",
          severity: "info",
          sourceReport: cat.id,
        });
      }

      toast(`${cat.title} complete!`, "success");
    } catch (err) {
      console.error(`${cat.title} generation failed:`, err);
      toast(`${cat.title} failed — try again`, "error");
    } finally {
      setCategoryGenerating(null);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      await del(selected.id);
      toast("Report deleted");
      setDeleteOpen(false);
      setDetailOpen(false);
      setSelected(null);
    } catch {
      toast("Failed to delete", "error");
    } finally {
      setDeleting(false);
    }
  }

  function openDetail(report: AIReport) {
    setSelected(report);
    setEditForm({
      title: report.title || "",
      summaryHtml: report.summaryHtml || "",
      highlights: [...(report.highlights || [])],
      recommendations: [...(report.recommendations || [])],
    });
    setDetailOpen(true);
  }

  async function handleSaveReport() {
    if (!selected) return;
    setSaving(true);
    try {
      await editReport(selected.id, {
        title: editForm.title,
        summaryHtml: editForm.summaryHtml,
        highlights: editForm.highlights,
        recommendations: editForm.recommendations,
      });
      toast("Report updated");
    } catch {
      toast("Failed to update", "error");
    } finally {
      setSaving(false);
    }
  }

  // ─── Table columns ────────────────────────────────

  const columns: Column<AIReport>[] = [
    {
      key: "title",
      header: "Report",
      render: (r) => (
        <div>
          <p className="text-sm font-medium text-gray-90">{r.title}</p>
          {r.area && (
            <p className="text-[10px] text-gray-40 capitalize mt-0.5">{r.area}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span className="text-xs capitalize bg-gray-10 text-gray-60 px-2 py-0.5 rounded">
          {r.type}
        </span>
      ),
    },
    {
      key: "score" as keyof AIReport,
      header: "Score",
      render: (r) =>
        r.score !== undefined ? (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded ${
              r.score >= 70 ? "text-emerald-700 bg-emerald-50" : r.score >= 40 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
            }`}
          >
            {r.score}/100
          </span>
        ) : (
          <span className="text-xs text-gray-30">—</span>
        ),
    },
    {
      key: "highlights",
      header: "Items",
      render: (r) => (
        <span className="text-sm text-gray-60">{(r.highlights?.length || 0) + (r.recommendations?.length || 0)}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Generated",
      render: (r) => (
        <span className="text-xs text-gray-40">{formatDate(r.createdAt)}</span>
      ),
    },
  ];

  // ─── Tabs config ───────────────────────────────────

  const tabs = [
    { label: "Overview", value: "overview" },
    { label: "Scheduled", value: "scheduled", badge: schedules.filter((s) => s.isStale).length || undefined },
    { label: "On-Demand", value: "on-demand" },
    { label: "Insights", value: "insights", badge: activeInsights.length || undefined },
    { label: "History", value: "history", badge: (reports.length + activityLog.length + aiTasks.length) || undefined },
  ];

  // ─── Loading state ─────────────────────────────────

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Dashboard"
        description="Business-wide AI intelligence — reports, insights, and recommendations across sales, ops, and marketing. For hands-on SEO work, use the SEO Hub."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <AIPromptButton
            section="AI Dashboard"
            description="Ask AI anything about your business data"
            placeholder="e.g. What are my biggest revenue risks? Which leads should I prioritize?"
            presets={[
              { label: "Quick Pulse", prompt: "Give me a quick business pulse. What are the 3 most important things I should know right now? Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array)." },
              { label: "Risk Assessment", prompt: "Identify the top business risks and vulnerabilities. Check for: stale leads, overdue tasks, low conversion rates, content gaps, marketing spend inefficiency. Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array), score (0-100)." },
              { label: "Customer Health", prompt: "Assess overall customer health. Analyze churn risk, satisfaction indicators, upsell readiness, and lifetime value trends. Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array), score (0-100)." },
              { label: "Growth Blockers", prompt: "Identify the top 5 growth blockers across sales, marketing, and operations. For each: root cause, impact, and specific fix. Format as JSON with title, summaryHtml (HTML), highlights (array), recommendations (array), score (0-100)." },
            ]}
            dataContext={buildFullContext(allData)}
            buildPrompt={(input, ctx) =>
              buildTrainedPrompt("AI Dashboard", input, ctx, {
                includeCompetitors: true,
                includeKPIs: true,
                includeReportFormat: true,
              })
            }
            onResult={handleAiResult}
          />
          <div className="relative group w-full sm:w-auto">
            <Button variant="outline" size="sm" isLoading={exporting} className="w-full sm:w-auto">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
              Export to Sheets
            </Button>
            <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover:block w-48 rounded-lg border border-border bg-card shadow-lg py-1">
              {(["leads", "customers", "contacts", "bookings", "tasks", "campaigns", "blog"] as const).map((c) => (
                <button key={c} className="w-full text-left px-3 py-1.5 text-sm text-gray-70 hover:bg-gray-10 capitalize" onClick={() => handleExportToSheets(c)}>
                  {c}
                </button>
              ))}
              <hr className="my-1 border-border" />
              <button className="w-full text-left px-3 py-1.5 text-sm text-primary font-medium hover:bg-gray-10" onClick={handleGenerateReportSheet}>
                Weekly Report
              </button>
            </div>
          </div>
          </div>
        }
      />

      <AdminTabs tabs={tabs} defaultValue="overview" onChange={setTab} />

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Health Score"
              value={latestScore !== null ? `${latestScore}/100` : "—"}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
            <StatCard
              label="Reports Generated"
              value={reports.length}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              }
            />
            <StatCard
              label="Active Insights"
              value={activeInsights.length}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
            />
            <StatCard
              label="Data Sources"
              value={`${totalCollections} collections`}
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              }
            />
          </div>

          {/* Two-column: Pulse + Chat — row height set by Pulse */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Pulse — full natural height, sets the row size */}
            <BusinessPulse
              score={latestScore}
              areas={[
                { label: "Sales", value: leads.length > 0 ? Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100) : 0 },
                { label: "Operations", value: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0 },
                { label: "Content", value: blog.length > 0 ? Math.round((blog.filter((b) => b.status === "published").length / blog.length) * 100) : 0 },
                { label: "Marketing", value: campaigns.length > 0 ? Math.round((campaigns.filter((c) => c.status === "active" || c.status === "completed").length / campaigns.length) * 100) : 0 },
                { label: "SEO", value: seoAudits.length > 0 ? Math.round(seoAudits.reduce((s, a) => s + a.score, 0) / seoAudits.length) : 0 },
                { label: "Bookings", value: bookings.length > 0 ? Math.round((bookings.filter((b) => b.status === "completed" || b.status === "confirmed").length / bookings.length) * 100) : 0 },
                { label: "Forum", value: forumThreads.length > 0 ? Math.round((forumThreads.filter((t) => t.replies > 0).length / forumThreads.length) * 100) : 0 },
                { label: "Keywords", value: keywords.length > 0 ? Math.round((keywords.filter((k) => k.tracked).length / keywords.length) * 100) : 0 },
              ]}
            />

            {/* AI Chat — absolute so it doesn't push the grid row taller */}
            <div className="relative">
              <div className="absolute inset-0">
                <AIChatBox allData={allData} />
              </div>
            </div>
          </div>

          {/* Top insights */}
          {activeInsights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-90 mb-3">Latest Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeInsights.slice(0, 4).map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={() => editInsight(insight.id, { dismissed: true })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════ SCHEDULED TAB ═══════ */}
      {tab === "scheduled" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">Scheduled Reports</h3>
              <p className="text-xs text-gray-50 mt-0.5">
                Auto-generated on page visit when stale. Click to regenerate manually.
              </p>
            </div>
            {schedulerGenerating && (
              <span className="inline-flex items-center gap-2 text-xs text-primary">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Generating...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedules.map((s) => (
              <ScheduledReportCard
                key={s.period}
                period={s.period}
                lastReport={s.lastReport}
                isStale={s.isStale}
                isGenerating={s.isGenerating}
                onRegenerate={() => generateReport(s.period, allData)}
                onView={(report) => openDetail(report)}
              />
            ))}
          </div>

          {/* Scheduled report history */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-gray-90 mb-3">Scheduled Report History</h4>
            <DataTable
              columns={columns}
              data={reports.filter((r) => r.category === "scheduled" || ["daily", "weekly", "monthly"].includes(r.type))}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => openDetail(r)}
              emptyMessage="No scheduled reports yet"
            />
          </div>
        </div>
      )}

      {/* ═══════ ON-DEMAND TAB ═══════ */}
      {tab === "on-demand" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-90">On-Demand Analysis</h3>
            <p className="text-xs text-gray-50 mt-0.5">
              Run targeted analyses. AI scans your data and produces reports with scores and recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <ReportCategoryCard
                key={cat.id}
                icon={cat.icon}
                title={cat.title}
                description={cat.description}
                lastRun={reports.find((r) => r.type === cat.id) || null}
                onGenerate={() => handleCategoryGenerate(cat)}
                generating={categoryGenerating === cat.id}
              />
            ))}
          </div>

          {/* On-demand history */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-gray-90 mb-3">On-Demand Report History</h4>
            <DataTable
              columns={columns}
              data={reports.filter((r) => r.category === "on-demand" || !["daily", "weekly", "monthly"].includes(r.type))}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => openDetail(r)}
              emptyMessage="No on-demand reports yet — run an analysis above"
            />
          </div>
        </div>
      )}

      {/* ═══════ INSIGHTS TAB ═══════ */}
      {tab === "insights" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">AI Insights Feed</h3>
              <p className="text-xs text-gray-50 mt-0.5">
                Recommendations and observations from AI analyses. Pin important ones, dismiss resolved ones.
              </p>
            </div>
            <span className="text-xs text-gray-40">{activeInsights.length} active</span>
          </div>

          {insights.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-20 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <p className="text-sm text-gray-40">No insights yet</p>
              <p className="text-xs text-gray-30 mt-1">Run an analysis from the On-Demand tab to generate insights</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights
                .filter((i) => !i.dismissed)
                .map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onPin={() => editInsight(insight.id, { pinned: !insight.pinned })}
                    onDismiss={() => editInsight(insight.id, { dismissed: true })}
                  />
                ))}

              {/* Dismissed section */}
              {insights.filter((i) => i.dismissed).length > 0 && (
                <details className="mt-6">
                  <summary className="text-xs text-gray-40 cursor-pointer hover:text-gray-60 transition-colors">
                    {insights.filter((i) => i.dismissed).length} dismissed insights
                  </summary>
                  <div className="space-y-2 mt-3">
                    {insights
                      .filter((i) => i.dismissed)
                      .map((insight) => (
                        <InsightCard
                          key={insight.id}
                          insight={insight}
                          onDismiss={() => editInsight(insight.id, { dismissed: false })}
                        />
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ HISTORY TAB ═══════ */}
      {tab === "history" && (
        <div className="space-y-10">
          {/* ── AI Reports ── */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">AI Reports</h3>
              <p className="text-xs text-gray-50 mt-0.5">All AI-generated reports</p>
            </div>
            <DataTable
              columns={columns}
              data={reports}
              keyExtractor={(r) => r.id}
              onRowClick={(r) => openDetail(r)}
              emptyMessage="No reports yet — generate one from your CRM data"
            />
          </div>

          {/* ── Activity Log ── */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">AI Activity Log</h3>
              <p className="text-xs text-gray-50 mt-0.5">All AI tool invocations and decision history</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                aria-label="Filter by domain"
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Domains</option>
                {domainOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                aria-label="Filter by risk level"
                className="bg-card border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                <option value="all">All Risk Levels</option>
                <option value="read-only">Read-Only</option>
                <option value="draft">Draft</option>
                <option value="auto">Auto</option>
                <option value="destructive">Destructive</option>
              </select>
            </div>
            {filteredLog.length === 0 && !logLoading ? (
              <EmptyState
                title="No activity yet"
                description="AI tool invocations will appear here as the AI assistant processes requests."
              />
            ) : (
              <DataTable
                columns={logColumns}
                data={filteredLog}
                keyExtractor={(entry) => entry.id}
              />
            )}
          </div>

          {/* ── AI Tasks ── */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-90">AI Tasks</h3>
              <p className="text-xs text-gray-50 mt-0.5">Background tasks like blog generation, SEO audits, and report creation</p>
            </div>
            {aiTasks.length === 0 ? (
              <EmptyState
                title="No AI tasks"
                description="Tasks like blog generation, SEO audits, and report creation will appear here."
              />
            ) : (
              <DataTable
                columns={aiTaskColumns}
                data={aiTasks}
                keyExtractor={(task) => task.id}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══════ DETAIL / EDIT MODAL ═══════ */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selected ? `Edit: ${editForm.title || "Report"}` : "Report"}
        size="lg"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
              Delete
            </Button>
            {selected && (
              <Button variant="outline" size="sm" onClick={() => handleUploadReportToDrive(selected)} isLoading={uploading} className="w-full sm:w-auto">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                Save to Drive
              </Button>
            )}
            <div className="flex-1 hidden sm:block" />
            <Button variant="outline" size="sm" onClick={() => setDetailOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveReport} isLoading={saving} className="w-full sm:w-auto">
              Update
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Meta badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs capitalize bg-gray-10 text-gray-60 px-2 py-0.5 rounded">
                {selected.type}
              </span>
              {selected.category && (
                <span className="text-xs capitalize bg-primary/10 text-primary px-2 py-0.5 rounded">
                  {selected.category}
                </span>
              )}
              {selected.score !== undefined && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    selected.score >= 70 ? "text-emerald-700 bg-emerald-50" : selected.score >= 40 ? "text-amber-700 bg-amber-50" : "text-red-700 bg-red-50"
                  }`}
                >
                  Score: {selected.score}/100
                </span>
              )}
              <span className="text-xs text-gray-40">
                {formatDateTime(selected.createdAt)}
              </span>
            </div>

            {/* Editable title */}
            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />

            {/* Editable summary */}
            <div>
              <label className="block text-xs font-medium text-gray-50 uppercase tracking-wide mb-2">Summary (HTML)</label>
              <textarea
                className="w-full rounded-lg border border-border px-4 py-3 text-sm text-gray-80 min-h-40 font-mono"
                aria-label="Report summary HTML"
                value={editForm.summaryHtml}
                onChange={(e) => setEditForm({ ...editForm, summaryHtml: e.target.value })}
              />
            </div>

            {/* Editable highlights */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide">Key Highlights</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, highlights: [...editForm.highlights, ""] })}
                >
                  + Add
                </Button>
              </div>
              <div className="space-y-2">
                {editForm.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-border bg-gray-10/50 px-3 py-1.5 text-sm text-gray-80"
                      value={h}
                      onChange={(e) => {
                        const updated = [...editForm.highlights];
                        updated[i] = e.target.value;
                        setEditForm({ ...editForm, highlights: updated });
                      }}
                      aria-label={`Highlight ${i + 1}`}
                    />
                    <button
                      className="text-gray-30 hover:text-red-500 transition-colors"
                      onClick={() => setEditForm({ ...editForm, highlights: editForm.highlights.filter((_, j) => j !== i) })}
                      aria-label={`Remove highlight ${i + 1}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable recommendations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide">Recommendations</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm({ ...editForm, recommendations: [...editForm.recommendations, ""] })}
                >
                  + Add
                </Button>
              </div>
              <div className="space-y-2">
                {editForm.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-border bg-gray-10/50 px-3 py-1.5 text-sm text-gray-80"
                      value={r}
                      onChange={(e) => {
                        const updated = [...editForm.recommendations];
                        updated[i] = e.target.value;
                        setEditForm({ ...editForm, recommendations: updated });
                      }}
                      aria-label={`Recommendation ${i + 1}`}
                    />
                    <button
                      className="text-gray-30 hover:text-red-500 transition-colors"
                      onClick={() => setEditForm({ ...editForm, recommendations: editForm.recommendations.filter((_, j) => j !== i) })}
                      aria-label={`Remove recommendation ${i + 1}`}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Data sources (read-only) */}
            {selected.dataSources && selected.dataSources.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-50 uppercase tracking-wide mb-2">Data Sources</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.dataSources.map((ds) => (
                    <span key={ds} className="text-[10px] bg-gray-10 text-gray-50 px-2 py-0.5 rounded-full capitalize">
                      {ds}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ═══════ DELETE CONFIRM ═══════ */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Report"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-70">
          Delete this report? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
