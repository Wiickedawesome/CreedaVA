"use client";

import { useState } from "react";
import Image from "next/image";
import { PageHeader, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import { useCollection } from "@/hooks/useCollection";
import { uploadImage } from "@/lib/firebase/storage";
import type { BlogPost } from "@/lib/types/content";

/**
 * Image studio — build images from any source material.
 *
 * Deliberately independent of the post editor: paste a body, a paragraph, a
 * link or a plain brief, and get candidates back. Accepted images are uploaded
 * to Storage and handed back as a URL to copy, or downloaded straight to disk.
 *
 * Nothing is stored anywhere but Storage, so there is no queue, no new
 * collection and no record to tidy up. Discarded candidates cost nothing
 * because upload only happens when you act on one.
 */

/** Server-side cap, mirrored here so the textarea can stop you before a round trip. */
const MAX_MATERIAL_LENGTH = 4000;

const FOLDER = "blog/studio";

interface Candidate {
  dataUrl: string;
  mimeType: string;
  /** Screening could not clear this one. Shown, but marked. */
  flagged: boolean;
}

interface GenerateResponse {
  candidates?: Candidate[];
  scene?: string;
  message?: string;
  error?: string;
}

/** Data URL → File, so the existing upload path is reused unchanged. */
function dataUrlToFile(dataUrl: string, mimeType: string, name: string): File {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return new File([bytes], name, { type: mimeType });
}

function extensionFor(mimeType: string): string {
  const subtype = mimeType.split("/")[1] ?? "png";
  return subtype === "jpeg" ? "jpg" : subtype;
}

/**
 * Blog bodies are stored as HTML. The scene brief wants prose, and leaving tags
 * in means the model reads markup instead of the article.
 */
function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export default function ImageStudioPage() {
  const { toast } = useToast();
  const { data: posts } = useCollection<BlogPost>("blog", {
    orderByField: "createdAt",
  });

  const [material, setMaterial] = useState("");
  const [generating, setGenerating] = useState(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedUrls, setSavedUrls] = useState<Record<number, string>>({});
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scene, setScene] = useState<string | null>(null);

  const tooLong = material.length > MAX_MATERIAL_LENGTH;
  const canGenerate = material.trim().length > 0 && !tooLong && !generating;

  function loadFromPost(postId: string) {
    const post = posts.find((candidate) => candidate.id === postId);
    if (!post) return;

    const body = htmlToText(post.content ?? "");
    const composed = [post.title, post.excerpt, body]
      .filter((part): part is string => Boolean(part?.trim()))
      .join("\n\n");

    setMaterial(composed.slice(0, MAX_MATERIAL_LENGTH));
    toast(`Loaded “${post.title}”`, "success");
  }

  async function handleGenerate() {
    setGenerating(true);
    setCandidates([]);
    setScene(null);
    setSavedUrls({});

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material }),
      });
      const data = (await res.json()) as GenerateResponse;

      if (!res.ok) {
        toast(data.error ?? "Image generation failed", "error");
        return;
      }

      setCandidates(data.candidates ?? []);
      setScene(data.scene ?? null);
      // Returned when every candidate failed screening: still shown, so the
      // work is not silently thrown away, but the reason is stated.
      if (data.message) toast(data.message, "error");
    } catch (err) {
      console.error("[ImageStudio] request failed:", err);
      toast("Network error while generating images", "error");
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload(index: number) {
    const candidate = candidates[index];
    if (!candidate) return;

    const link = document.createElement("a");
    link.href = candidate.dataUrl;
    link.download = `creeda-image-${index + 1}.${extensionFor(candidate.mimeType)}`;
    link.click();
  }

  async function handleSave(index: number) {
    const candidate = candidates[index];
    if (!candidate) return;

    setSavingIndex(index);
    try {
      const file = dataUrlToFile(
        candidate.dataUrl,
        candidate.mimeType,
        `creeda-image-${index + 1}.${extensionFor(candidate.mimeType)}`,
      );
      const uploaded = await uploadImage(file, FOLDER);
      setSavedUrls((prev) => ({ ...prev, [index]: uploaded.url }));

      try {
        await navigator.clipboard.writeText(uploaded.url);
        toast("Uploaded — URL copied", "success");
      } catch {
        // Clipboard access can be refused; the URL is still shown to copy by hand.
        toast("Uploaded — copy the URL below", "success");
      }
    } catch (err) {
      toast((err as Error).message || "Upload failed", "error");
    } finally {
      setSavingIndex(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Image studio"
        description="Paste a draft, a brief, an excerpt or any text. It proposes a scene, draws candidates, and screens each one for AI tells before you see it."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* ── Source material ─────────────────────────── */}
        <div className="space-y-3">
          <div>
            <label
              htmlFor="material"
              className="mb-1 block text-sm font-medium text-gray-100"
            >
              Source material
            </label>
            <textarea
              id="material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              rows={12}
              placeholder="Paste post text, a paragraph, or a description of the image you want…"
              className="w-full rounded-md border border-gray-40 bg-card px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-50">
                Accents, tone and subject all come from this text.
              </span>
              <span className={tooLong ? "text-error-text" : "text-gray-50"}>
                {material.length}/{MAX_MATERIAL_LENGTH}
              </span>
            </div>
          </div>

          {posts.length > 0 && (
            <div>
              <label
                htmlFor="from-post"
                className="mb-1 block text-sm font-medium text-gray-100"
              >
                Load from a post
              </label>
              <select
                id="from-post"
                defaultValue=""
                onChange={(e) => {
                  loadFromPost(e.target.value);
                  e.target.value = "";
                }}
                className="w-full rounded-md border border-gray-40 bg-card px-4 py-2.5 text-sm text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Choose a post…</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button onClick={handleGenerate} isLoading={generating} disabled={!canGenerate}>
            {generating ? "Generating and screening…" : "Generate images"}
          </Button>

          <p className="text-xs text-gray-50">
            Three candidates per run. Nothing is uploaded until you save or
            download one.
          </p>
        </div>

        {/* ── Results ─────────────────────────────────── */}
        <div className="space-y-3">
          {scene && (
            <p className="text-sm text-gray-70">
              <span className="font-medium text-gray-90">Scene: </span>
              {scene}
            </p>
          )}

          {candidates.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-gray-50">
              {generating
                ? "Working…"
                : "Candidates will appear here once you generate."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-xl border border-border bg-card p-2"
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                      src={candidate.dataUrl}
                      alt={`Generated candidate ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    {candidate.flagged && (
                      <span className="absolute left-1 top-1 rounded bg-error-soft px-1.5 py-0.5 text-[10px] text-error-text">
                        Not screened
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(index)}
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSave(index)}
                      isLoading={savingIndex === index}
                      disabled={savingIndex !== null}
                    >
                      Save
                    </Button>
                  </div>

                  {savedUrls[index] && (
                    <input
                      readOnly
                      value={savedUrls[index]}
                      onFocus={(e) => e.currentTarget.select()}
                      aria-label={`URL of saved image ${index + 1}`}
                      className="w-full rounded-md border border-border bg-gray-10 px-2 py-1.5 text-xs text-gray-70"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
