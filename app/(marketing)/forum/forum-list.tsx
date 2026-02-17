"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchAll, update, create } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useForumAuth } from "./forum-auth-context";
import { ForumAuthModal } from "./forum-auth-modal";
import { Modal } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { uploadImage } from "@/lib/firebase/storage";
import { translateThreadInBackground, getTranslatedTitle, ensureThreadTranslated } from "@/lib/firebase/translate";
import type { ForumThread } from "@/lib/types/content";
import type { Timestamp } from "firebase/firestore";

type SortMode = "new" | "top" | "old";

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

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (typeof val === "string") return new Date(val);
  if (typeof val === "object" && val !== null && "toDate" in val) {
    return (val as Timestamp).toDate();
  }
  return new Date();
}

export function ForumList() {
  const { t, locale } = useTranslation();
  const { user } = useForumAuth();
  const [threads, setThreads] = useState<(ForumThread & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("new");
  const [createOpen, setCreateOpen] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signIn" | "signUp">("signIn");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state (mirrors admin)
  const [createForm, setCreateForm] = useState<{
    title: string;
    content: string;
    tags: string;
    images: string[];
    links: string[];
  }>({ title: "", content: "", tags: "", images: [], links: [] });
  const [linkInput, setLinkInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const translatingRef = useRef(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const data = await fetchAll<ForumThread>(
        "forum",
        where("status", "in", ["open", "closed"]),
        orderBy("createdAt", "desc"),
      );
      setThreads(data);
    } catch {
      try {
        const data = await fetchAll<ForumThread>("forum");
        setThreads(
          data.filter((th) => th.status === "open" || th.status === "closed"),
        );
      } catch {
        setThreads([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // On-demand: translate threads that lack translations for the current locale
  useEffect(() => {
    if (translatingRef.current || threads.length === 0) return;
    const untranslated = threads.filter(
      (th) => !th.translations?.[locale] && (th.lang || "en") !== locale,
    );
    if (untranslated.length === 0) return;

    translatingRef.current = true;
    (async () => {
      const updated: (ForumThread & { id: string })[] = [];
      for (const th of untranslated) {
        const result = await ensureThreadTranslated(th, locale);
        updated.push(result);
      }
      if (updated.length > 0) {
        setThreads((prev) =>
          prev.map((th) => {
            const u = updated.find((x) => x.id === th.id);
            return u || th;
          }),
        );
      }
    })()
      .catch((err) => console.error("Forum list translation error:", err))
      .finally(() => {
        translatingRef.current = false;
      });
  }, [threads, locale]);

  const sorted = [...threads].sort((a, b) => {
    if (sort === "top") return (b.likes || 0) - (a.likes || 0);
    if (sort === "old")
      return toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime();
    return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
  });

  async function handleLike(threadId: string) {
    if (!user) {
      setAuthModalMode("signIn");
      setAuthModal(true);
      return;
    }
    const thread = threads.find((th) => th.id === threadId);
    if (!thread) return;

    const alreadyLiked = (thread.likedBy || []).includes(user.uid);
    const newLikedBy = alreadyLiked
      ? (thread.likedBy || []).filter((u) => u !== user.uid)
      : [...(thread.likedBy || []), user.uid];

    setThreads((prev) =>
      prev.map((th) =>
        th.id === threadId
          ? { ...th, likes: newLikedBy.length, likedBy: newLikedBy }
          : th,
      ),
    );

    try {
      await update("forum", threadId, {
        likes: newLikedBy.length,
        likedBy: newLikedBy,
      });
    } catch {
      setThreads((prev) =>
        prev.map((th) =>
          th.id === threadId
            ? { ...th, likes: thread.likes, likedBy: thread.likedBy }
            : th,
        ),
      );
    }
  }

  function handleNewPost() {
    if (!user) {
      setAuthModalMode("signUp");
      setAuthModal(true);
      return;
    }
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!createForm.title.trim() || !createForm.content.trim() || !user) return;
    setSubmitting(true);
    try {
      type NewThread = Omit<ForumThread, "id" | "createdAt" | "updatedAt">;
      const tagList = createForm.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
      const title = createForm.title.trim();
      const content = createForm.content.trim();
      const docId = await create<NewThread>("forum", {
        title,
        content,
        author: user.displayName || user.email || "User",
        authorId: user.uid,
        authorEmail: user.email || "",
        status: "open",
        replies: 0,
        likes: 0,
        likedBy: [],
        tags: tagList,
        images: createForm.images,
        links: createForm.links,
        lang: locale,
      });
      // Auto-translate in the background (non-blocking)
      translateThreadInBackground(docId, title, content, locale);
      setCreateOpen(false);
      setCreateForm({ title: "", content: "", tags: "", images: [], links: [] });
      loadThreads();
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadImage(file, "forum/new");
        urls.push(result.url);
      }
      setCreateForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      console.error("Image upload failed:", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeImage(index: number) {
    setCreateForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  function addLink() {
    const url = linkInput.trim();
    if (!url) return;
    setCreateForm((prev) => ({ ...prev, links: [...prev.links, url] }));
    setLinkInput("");
  }

  function removeLink(index: number) {
    setCreateForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  }

  async function handleShare(threadId: string, title: string) {
    const url = `${window.location.origin}/forum/${threadId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedId(threadId);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // User cancelled share or clipboard failed — try textarea fallback
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedId(threadId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch { /* ignore */ }
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 text-sm">
          {(["new", "top", "old"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                sort === s
                  ? "bg-primary text-white"
                  : "text-gray-50 hover:bg-gray-10"
              }`}
            >
              {s === "new"
                ? t.forum.sortNew
                : s === "top"
                  ? t.forum.sortTop
                  : t.forum.sortOld}
            </button>
          ))}
        </div>
        <button
          onClick={handleNewPost}
          className="px-5 py-2 bg-primary text-white text-sm font-medium rounded hover:bg-primary-light transition-colors"
        >
          + {t.forum.newPost}
        </button>
      </div>

      {/* Auth modal */}
      <ForumAuthModal open={authModal} onClose={() => setAuthModal(false)} defaultMode={authModalMode} />

      {/* Create Forum Modal (reuses admin form layout) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.forum.newPost}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              {t.forum.cancel}
            </Button>
            <Button size="sm" onClick={handleCreate} isLoading={submitting}>
              {t.forum.submitPost}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.forum.postTitlePlaceholder}
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder={t.forum.postTitlePlaceholder}
          />
          <div>
            <label className="block text-sm font-medium text-gray-70 mb-1">{t.forum.postContentPlaceholder}</label>
            <textarea
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none min-h-30"
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              placeholder={t.forum.postContentPlaceholder}
            />
          </div>
          <Input
            label={t.forum.postTagsPlaceholder}
            value={createForm.tags}
            onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
            placeholder={t.forum.postTagsPlaceholder}
          />

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">{t.forum.images}</label>
              <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} isLoading={uploading}>
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                {t.forum.upload}
              </Button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>
            {createForm.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {createForm.images.map((url, i) => (
                  <div key={i} className="relative group h-20 w-full">
                    <Image 
                      src={url} 
                      alt="Uploaded image" 
                      fill
                      className="rounded-lg object-cover"
                      sizes="(max-width: 768px) 25vw, 15vw" 
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-white/90 text-gray-60 rounded p-0.5 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">{t.forum.noImages}</p>
            )}
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-100">{t.forum.links}</label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-80 placeholder:text-gray-40 focus:border-primary focus:outline-none"
              />
              <Button variant="outline" size="sm" onClick={addLink}>
                {t.forum.addLink}
              </Button>
            </div>
            {createForm.links.length > 0 ? (
              <div className="space-y-1">
                {createForm.links.map((url, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-gray-10 text-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-gray-70 hover:text-primary">
                      <svg className="w-4 h-4 text-gray-40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      <span className="truncate">{url}</span>
                    </a>
                    <button onClick={() => removeLink(i)} className="text-gray-40 hover:text-red-500 shrink-0 ml-2">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-40">{t.forum.noLinks}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Thread list */}
      {loading ? (
        <div className="border border-gray-20 rounded bg-white divide-y divide-gray-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-10 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-10 rounded w-2/3" />
                <div className="h-3 bg-gray-10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 border border-gray-20 rounded bg-white">
          <p className="text-base text-gray-50">{t.forum.noThreads}</p>
        </div>
      ) : (
        <div className="border border-gray-20 rounded bg-white divide-y divide-gray-20">
          {sorted.map((thread) => {
            const liked = user
              ? (thread.likedBy || []).includes(user.uid)
              : false;
            const date = toDate(thread.createdAt);
            const ago = timeAgo(date, {
              justNow: t.forum.justNow,
              minutesAgo: t.forum.minutesAgo,
              hoursAgo: t.forum.hoursAgo,
              daysAgo: t.forum.daysAgo,
            });

            return (
              <div
                key={thread.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-10/40 transition-colors"
              >
                {/* Vote */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0 w-12">
                  <button
                    onClick={() => handleLike(thread.id)}
                    className={`p-1 rounded transition-colors ${
                      liked ? "text-primary" : "text-gray-40 hover:text-primary"
                    }`}
                    title={
                      user
                        ? liked
                          ? t.forum.liked
                          : t.forum.like
                        : t.forum.signInToLike
                    }
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill={liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                    </svg>
                  </button>
                  <span
                    className={`text-sm font-bold ${liked ? "text-primary" : "text-gray-60"}`}
                  >
                    {thread.likes || 0}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        thread.status === "open"
                          ? "text-green-600"
                          : "text-gray-40"
                      }`}
                    >
                      {thread.status === "open"
                        ? t.forum.open
                        : t.forum.closed}
                    </span>
                    {thread.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-10 text-gray-60 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/forum/${thread.id}`}
                    className="text-base font-semibold text-gray-100 hover:text-primary leading-snug line-clamp-2 transition-colors"
                  >
                    {getTranslatedTitle(thread, locale)}
                  </Link>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-40">
                    <span>
                      {t.forum.postedBy}{" "}
                      <span className="text-gray-60 font-medium">
                        {thread.author}
                      </span>
                    </span>
                    <span>·</span>
                    <span>{ago}</span>
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-40">
                    <button
                      onClick={() => handleLike(thread.id)}
                      className={`flex items-center gap-1 hover:text-primary transition-colors ${
                        liked ? "text-primary" : ""
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                        <path d="M12 4l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z" />
                      </svg>
                      {liked ? t.forum.liked : t.forum.like}
                    </button>
                    <Link
                      href={`/forum/${thread.id}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {thread.replies || 0} {(thread.replies || 0) === 1 ? t.forum.reply : t.forum.replies}
                    </Link>
                    <button
                      onClick={() => handleShare(thread.id, getTranslatedTitle(thread, locale))}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      {copiedId === thread.id ? t.forum.linkCopied : t.forum.share}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
