"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  fetchOne,
  fetchAll,
  create,
  update,
  where,
  orderBy,
} from "@/lib/firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { ForumAuthProvider, useForumAuth } from "../forum-auth-context";
import { ForumAuthModal } from "../forum-auth-modal";
import {
  getTranslatedTitle,
  getTranslatedContent,
  translateReplyInBackground,
  ensureThreadTranslated,
  ensureReplyTranslated,
} from "@/lib/firebase/translate";
import type { ForumThread, ForumReply } from "@/lib/types/content";
import type { Timestamp } from "firebase/firestore";
import { sanitizeHtml } from "@/lib/utils/sanitize-html";

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (typeof val === "string") return new Date(val);
  if (typeof val === "object" && val !== null && "toDate" in val)
    return (val as Timestamp).toDate();
  return new Date();
}

function timeAgo(
  date: Date,
  labels: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string },
): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return labels.justNow;
  if (mins < 60) return `${mins}${labels.minutesAgo}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${labels.hoursAgo}`;
  const days = Math.floor(hrs / 24);
  return `${days}${labels.daysAgo}`;
}

function ThreadContent({ id }: { id: string }) {
  const { t, locale } = useTranslation();
  const { user, profile } = useForumAuth();
  const [thread, setThread] = useState<(ForumThread & { id: string }) | null>(null);
  const [replies, setReplies] = useState<(ForumReply & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [sort, setSort] = useState<"new" | "old" | "top">("new");
  const [copied, setCopied] = useState(false);
  const translatingThreadRef = useRef(false);
  const translatingRepliesRef = useRef(false);

  const agoLabels = {
    justNow: t.forum.justNow,
    minutesAgo: t.forum.minutesAgo,
    hoursAgo: t.forum.hoursAgo,
    daysAgo: t.forum.daysAgo,
  };

  const loadThread = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchOne<ForumThread>("forum", id);
      setThread(data ? { ...data, id } : null);
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReplies = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchAll<ForumReply>(
        "forumReplies",
        where("threadId", "==", id),
        orderBy("createdAt", "desc"),
      );
      setReplies(data);
    } catch {
      try {
        const data = await fetchAll<ForumReply>("forumReplies");
        setReplies(data.filter((r) => r.threadId === id));
      } catch {
        setReplies([]);
      }
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadThread();
      void loadReplies();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadThread, loadReplies]);

  // On-demand: translate thread if missing translations for current locale
  useEffect(() => {
    if (!thread || translatingThreadRef.current) return;
    const sourceLang = thread.lang || "en";
    if (sourceLang === locale) return;
    if (thread.translations?.[locale]) return;

    translatingThreadRef.current = true;
    ensureThreadTranslated(thread, locale)
      .then((updated) => {
        if (updated.translations?.[locale]) setThread(updated);
      })
      .catch((err) => console.error("Thread translation error:", err))
      .finally(() => {
        translatingThreadRef.current = false;
      });
  }, [thread, locale]);

  // On-demand: translate replies if missing translations for current locale
  useEffect(() => {
    if (translatingRepliesRef.current || replies.length === 0) return;
    const untranslated = replies.filter(
      (r) => !r.translations?.[locale] && (r.lang || "en") !== locale,
    );
    if (untranslated.length === 0) return;

    translatingRepliesRef.current = true;
    (async () => {
      const updated: (ForumReply & { id: string })[] = [];
      for (const r of untranslated) {
        const result = await ensureReplyTranslated(r, locale);
        updated.push(result);
      }
      if (updated.length > 0) {
        setReplies((prev) =>
          prev.map((r) => {
            const u = updated.find((x) => x.id === r.id);
            return u || r;
          }),
        );
      }
    })()
      .catch((err) => console.error("Reply translation error:", err))
      .finally(() => {
        translatingRepliesRef.current = false;
      });
  }, [replies, locale]);

  // Sort replies
  const sortedReplies = [...replies].sort((a, b) => {
    if (sort === "top") return (b.likes || 0) - (a.likes || 0);
    if (sort === "old")
      return toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
    return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
  });

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !replyText.trim() || !thread) return;

    setSubmitting(true);
    try {
      const content = replyText.trim();
      const data: Omit<ForumReply, "id" | "createdAt" | "updatedAt"> = {
        threadId: thread.id,
        author: profile.displayName,
        authorId: user.uid,
        authorEmail: profile.email,
        content,
        likes: 0,
        likedBy: [],
        lang: locale,
      };
      const replyId = await create("forumReplies", data);
      // Auto-translate reply in the background
      translateReplyInBackground(replyId, content, locale);
      await update("forum", thread.id, { replies: (thread.replies || 0) + 1 });
      setThread((prev) =>
        prev ? { ...prev, replies: (prev.replies || 0) + 1 } : prev,
      );
      setReplyText("");
      loadReplies();
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLikeReply(replyId: string) {
    if (!user) {
      setAuthModal(true);
      return;
    }
    const reply = replies.find((r) => r.id === replyId);
    if (!reply) return;

    const alreadyLiked = (reply.likedBy || []).includes(user.uid);
    const newLikedBy = alreadyLiked
      ? (reply.likedBy || []).filter((u) => u !== user.uid)
      : [...(reply.likedBy || []), user.uid];

    setReplies((prev) =>
      prev.map((r) =>
        r.id === replyId
          ? { ...r, likes: newLikedBy.length, likedBy: newLikedBy }
          : r,
      ),
    );

    try {
      await update("forumReplies", replyId, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      });
    } catch {
      setReplies((prev) =>
        prev.map((r) =>
          r.id === replyId
            ? { ...r, likes: reply.likes, likedBy: reply.likedBy }
            : r,
        ),
      );
    }
  }

  async function handleLikeThread() {
    if (!user) {
      setAuthModal(true);
      return;
    }
    if (!thread) return;

    const alreadyLiked = (thread.likedBy || []).includes(user.uid);
    const newLikedBy = alreadyLiked
      ? (thread.likedBy || []).filter((u) => u !== user.uid)
      : [...(thread.likedBy || []), user.uid];

    setThread((prev) =>
      prev
        ? { ...prev, likes: newLikedBy.length, likedBy: newLikedBy }
        : prev,
    );

    try {
      await update("forum", thread.id, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      });
    } catch {
      setThread((prev) =>
        prev
          ? { ...prev, likes: thread.likes, likedBy: thread.likedBy }
          : prev,
      );
    }
  }

  if (loading) {
    return (
      <div className="px-6 lg:px-10 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-10 rounded w-20" />
          <div className="h-7 bg-gray-10 rounded w-3/4" />
          <div className="h-4 bg-gray-10 rounded w-1/3" />
          <div className="h-32 bg-gray-10 rounded mt-4" />
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="px-6 lg:px-10 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-100 mb-2">
          {t.forum.threadNotFound}
        </h1>
        <p className="text-sm text-gray-60 mb-4">
          {t.forum.threadNotFoundDesc}
        </p>
        <Link
          href="/forum"
          className="text-sm text-primary hover:underline"
        >
          {t.forum.backToForum}
        </Link>
      </div>
    );
  }

  const threadDate = toDate(thread.createdAt);
  const threadAgo = timeAgo(threadDate, agoLabels);
  const threadLiked = user
    ? (thread.likedBy || []).includes(user.uid)
    : false;

  return (
    <div className="min-h-[60vh] bg-gray-10/30">
      <div className="px-6 lg:px-10 py-6">
        {/* Auth modal */}
        <ForumAuthModal open={authModal} onClose={() => setAuthModal(false)} />

        {/* Back nav */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-1 text-sm text-gray-60 hover:text-primary mb-4 transition-colors"
        >
          {t.forum.backToForum}
        </Link>

        {/* Thread */}
        <div className="border border-gray-20 rounded bg-white">
          <div className="flex gap-4 p-5">
            {/* Vote */}
            <div className="flex flex-col items-center gap-1 shrink-0 w-12">
              <button
                onClick={handleLikeThread}
                aria-label="Like thread"
                className={`p-1 rounded transition-colors ${
                  threadLiked ? "text-primary" : "text-gray-60 hover:text-primary"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={threadLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                </svg>
              </button>
              <span className={`text-sm font-bold ${threadLiked ? "text-primary" : "text-gray-60"}`}>
                {thread.likes || 0}
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    thread.status === "open" ? "text-green-700" : "text-gray-60"
                  }`}
                >
                  {thread.status === "open" ? t.forum.open : t.forum.closed}
                </span>
                {thread.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-gray-10 text-gray-60 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-xl lg:text-2xl font-bold text-gray-100 mb-2">
                {getTranslatedTitle(thread, locale)}
              </h1>

              <div className="text-xs text-gray-60 mb-4">
                {t.forum.postedBy}{" "}
                <span className="text-gray-60 font-medium">{thread.author}</span>
                {" \u00b7 "}
                {threadAgo}
              </div>

              {/* Content */}
              {/<[a-z][\s\S]*>/i.test(getTranslatedContent(thread, locale)) ? (
                <div
                  className="text-sm leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-100 prose-headings:font-bold prose-p:text-gray-80 prose-p:leading-relaxed prose-a:text-primary prose-strong:text-gray-90 prose-li:text-gray-80"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(getTranslatedContent(thread, locale)),
                  }}
                />
              ) : (
                <div className="text-sm text-gray-80 leading-relaxed whitespace-pre-wrap">
                  {getTranslatedContent(thread, locale)}
                </div>
              )}
              {thread.translations && thread.lang && thread.lang !== locale && thread.translations[locale] && (
                <span className="inline-block mt-2 text-[10px] text-gray-60 italic">
                  {t.forum.autoTranslated}
                </span>
              )}

              {/* Links */}
              {thread.links && thread.links.length > 0 && (
                <div className="mt-3 space-y-1">
                  {thread.links.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      {url}
                    </a>
                  ))}
                </div>
              )}

              {/* Thread action bar */}
              <div className="mt-4 flex items-center gap-5 text-xs text-gray-60">
                <button
                  onClick={handleLikeThread}
                  className={`flex items-center gap-1.5 hover:text-primary transition-colors ${
                    threadLiked ? "text-primary" : ""
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={threadLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                  </svg>
                  {threadLiked ? t.forum.liked : t.forum.like}
                </button>
                <span className="flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  {thread.replies || 0} {(thread.replies || 0) === 1 ? t.forum.reply : t.forum.replies}
                </span>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/forum/${thread.id}`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ title: getTranslatedTitle(thread, locale), url });
                      } else if (navigator.clipboard?.writeText) {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } else {
                        const ta = document.createElement("textarea");
                        ta.value = url;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    } catch {
                      try {
                        const ta = document.createElement("textarea");
                        ta.value = url;
                        ta.style.position = "fixed";
                        ta.style.opacity = "0";
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand("copy");
                        document.body.removeChild(ta);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch { /* ignore */ }
                    }
                  }}
                  className={`flex items-center gap-1.5 hover:text-primary transition-colors ${copied ? "text-primary" : ""}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  {copied ? t.forum.linkCopied : t.forum.share}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reply input */}
        <div className="mt-4 border border-gray-20 rounded bg-white p-4">
          {user && profile ? (
            <form onSubmit={handleReply}>
              <div className="text-xs text-gray-60 mb-2">
                {t.forum.addComment}{" "}
                <span className="text-gray-60 font-medium">
                  {profile.displayName}
                </span>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t.forum.writeReply}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-20 rounded text-sm resize-y focus:outline-none focus:border-primary"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !replyText.trim()}
                  className="px-5 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-light transition-colors disabled:opacity-50"
                >
                  {submitting ? "..." : t.forum.postReply}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAuthModal(true)}
              className="w-full text-center py-4 text-sm text-gray-60 hover:text-primary transition-colors"
            >
              {t.forum.signInToReply}
            </button>
          )}
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-60">
                {replies.length}{" "}
                {replies.length === 1 ? t.forum.comment : t.forum.comments}
              </span>
              <div className="flex items-center gap-1 text-xs">
                {(["new", "old", "top"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      sort === s
                        ? "bg-primary text-white"
                        : "text-gray-60 hover:bg-gray-10"
                    }`}
                  >
                    {s === "new"
                      ? t.forum.sortNew
                      : s === "old"
                        ? t.forum.sortOld
                        : t.forum.sortTop}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-gray-20 rounded bg-white divide-y divide-gray-20">
              {sortedReplies.map((reply) => {
                const liked = user
                  ? (reply.likedBy || []).includes(user.uid)
                  : false;
                const replyDate = toDate(reply.createdAt);
                const replyAgo = timeAgo(replyDate, agoLabels);

                return (
                  <div key={reply.id} className="flex gap-4 p-4">
                    {/* Vote */}
                    <div className="flex flex-col items-center gap-1 shrink-0 w-10">
                      <button
                        onClick={() => handleLikeReply(reply.id)}
                        aria-label="Like reply"
                        className={`p-1 rounded transition-colors ${
                          liked
                            ? "text-primary"
                            : "text-gray-60 hover:text-primary"
                        }`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={liked ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                        </svg>
                      </button>
                      <span
                        className={`text-xs font-bold ${liked ? "text-primary" : "text-gray-60"}`}
                      >
                        {reply.likes || 0}
                      </span>
                    </div>

                    {/* Reply content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-60 mb-1">
                        <span className="text-gray-60 font-medium">
                          {reply.author}
                        </span>
                        {" \u00b7 "}
                        {replyAgo}
                      </div>
                      <p className="text-sm text-gray-80 leading-relaxed whitespace-pre-wrap">
                        {getTranslatedContent(reply, locale)}
                      </p>
                      {reply.translations && reply.lang && reply.lang !== locale && reply.translations[locale] && (
                        <span className="inline-block mt-1 text-[10px] text-gray-60 italic">
                          {t.forum.autoTranslated}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForumThreadContent({ id }: { id: string }) {
  return (
    <ForumAuthProvider>
      <ThreadContent id={id} />
    </ForumAuthProvider>
  );
}
