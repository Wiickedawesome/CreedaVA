"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { AdminTabs, PageHeader, useToast } from "@/components/admin";
import { Button, Input } from "@/components/ui";
import { useCollection } from "@/hooks/useCollection";
import { uploadImage } from "@/lib/firebase/storage";
import type { BlogPost } from "@/lib/types/content";
import {
  FORMATS,
  FORMAT_IDS,
  LIMITS,
  TEMPLATES,
  TEMPLATE_IDS,
  marketingImageFilename,
  marketingImageUrl,
  type MarketingCopy,
  type MarketingFormat,
  type TemplateId,
} from "@/lib/brand/marketing-templates";

/**
 * Image studio — two jobs that used to be one.
 *
 * Marketing graphics: typography and layout, rendered from templates so the
 * logo, palette and type are exact. An image model cannot draw the real mark
 * and cannot set readable text, so it was never able to do this.
 *
 * Article photos: the photographic pipeline with its anti-AI screening, which
 * still suits a blog illustration that should not look generated.
 *
 * Both are kept apart deliberately — the photo prompt forbids text and logos,
 * which is precisely the opposite of what a marketing graphic needs.
 */

type Section = "graphics" | "photos";

const SECTION_IDS: Section[] = ["graphics", "photos"];

const isSection = (value: string): value is Section =>
  SECTION_IDS.includes(value as Section);

/** A blank copy block, seeded from the template's own sample. */
function copyFor(template: TemplateId, current?: MarketingCopy): MarketingCopy {
  const sample = TEMPLATES[template].sample;
  return {
    eyebrow: current?.eyebrow || sample.eyebrow || "",
    headline: current?.headline || sample.headline || "",
    supporting: current?.supporting || sample.supporting || "",
    items: current?.items.length ? current.items : [...(sample.items ?? [])],
    cta: current?.cta || sample.cta || "",
    footnote: current?.footnote || sample.footnote || "creedava.com",
  };
}

/** Single-line copy field. */
function CopyField({
  label,
  value,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-70">{label}</label>
      <Input
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function MarketingGraphics() {
  const [template, setTemplate] = useState<TemplateId>("statement");
  const [format, setFormat] = useState<MarketingFormat>("square");
  const [copy, setCopy] = useState<MarketingCopy>(() => copyFor("statement"));
  // The preview is an image request, so it waits for typing to stop rather than
  // firing once per keystroke.
  const [debounced, setDebounced] = useState(copy);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(copy), 500);
    return () => clearTimeout(timer);
  }, [copy]);

  const fields = TEMPLATES[template].fields;
  const labels = TEMPLATES[template].labels ?? {};
  const spec = FORMATS[format];

  const url = useMemo(
    () => marketingImageUrl(template, format, debounced),
    [template, format, debounced],
  );
  const filename = marketingImageFilename(template, format);

  const setField = (field: keyof MarketingCopy) => (value: string) =>
    setCopy((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      {/* ── Controls ─────────────────────────────────── */}
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-100">Template</p>
          <div className="space-y-1.5">
            {TEMPLATE_IDS.map((id) => {
              const active = id === template;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTemplate(id);
                    setCopy((previous) => copyFor(id, previous));
                  }}
                  aria-pressed={active}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-gray-20"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      active ? "text-primary" : "text-gray-100"
                    }`}
                  >
                    {TEMPLATES[id].label}
                  </span>
                  <span className="block text-xs text-gray-50">
                    {TEMPLATES[id].description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-100">Size</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FORMAT_IDS.map((id) => {
              const active = id === format;
              const item = FORMATS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormat(id)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:bg-gray-20"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      active ? "text-primary" : "text-gray-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-gray-50">
                    {item.width}×{item.height}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-gray-50">{spec.usage}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-100">Words on the image</p>

          {fields.includes("eyebrow") && (
            <CopyField
              label={labels.eyebrow ?? "Label above the headline"}
              value={copy.eyebrow}
              max={LIMITS.eyebrow}
              placeholder="Virtual assistants"
              onChange={setField("eyebrow")}
            />
          )}

          {fields.includes("headline") && (
            <CopyField
              label={labels.headline ?? "Headline"}
              value={copy.headline}
              max={LIMITS.headline}
              placeholder="One clear sentence"
              onChange={setField("headline")}
            />
          )}

          {fields.includes("supporting") && (
            <CopyField
              label={labels.supporting ?? "Supporting line"}
              value={copy.supporting}
              max={LIMITS.supporting}
              placeholder="Optional detail"
              onChange={setField("supporting")}
            />
          )}

          {fields.includes("items") && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-70">
                {labels.items ?? "Points, one per line"}
              </label>
              <textarea
                value={copy.items.join("\n")}
                rows={4}
                onChange={(e) =>
                  setCopy((previous) => ({
                    ...previous,
                    items: e.target.value.split("\n").slice(0, LIMITS.items),
                  }))
                }
                className="w-full rounded-md border border-gray-40 bg-card px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {fields.includes("cta") && (
            <CopyField
              label={labels.cta ?? "Call to action"}
              value={copy.cta}
              max={LIMITS.cta}
              placeholder="Book a call"
              onChange={setField("cta")}
            />
          )}

          {fields.includes("footnote") && (
            <CopyField
              label="Corner note"
              value={copy.footnote}
              max={LIMITS.footnote}
              placeholder="creedava.com"
              onChange={setField("footnote")}
            />
          )}
        </div>
      </div>

      {/* ── Preview ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-70">
            {spec.width} × {spec.height}
            {url !== marketingImageUrl(template, format, copy) && (
              <span className="ml-2 text-xs text-gray-50">updating…</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download={filename}
              className="inline-flex h-8 items-center justify-center rounded-md border-2 border-primary px-4 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Download PNG
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-gray-20 p-3">
          {/*
            Plain <img>: `next/image` would proxy the source through
            /_next/image, which fetches without the admin session cookie and
            gets a 401. There is nothing to optimize either — it is a PNG this
            server draws on demand.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            src={url}
            alt="Marketing graphic preview"
            width={spec.width}
            height={spec.height}
            className="mx-auto h-auto w-full rounded-lg"
          />
        </div>

        <p className="text-xs text-gray-50">
          The preview is the file. Logo, type and colours are the site&apos;s own,
          so nothing is approximated.
        </p>
      </div>
    </div>
  );
}

/** Server-side cap, mirrored here so the textarea can stop you before a round trip. */
const MAX_MATERIAL_LENGTH = 4000;

const FOLDER = "studio";

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

/**
 * Article photos — build images from any source material.
 *
 * Deliberately independent of the post editor: paste a body, a paragraph, a
 * link or a plain brief, and get candidates back. Accepted images are uploaded
 * to Storage and handed back as a URL to copy, or downloaded straight to disk.
 *
 * Nothing is stored anywhere but Storage, so there is no queue, no new
 * collection and no record to tidy up. Discarded candidates cost nothing
 * because upload only happens when you act on one.
 */
function ArticlePhotos() {
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
  );
}

/**
 * Page shell.
 *
 * `?tab=photos` is honoured so the old studio is still one click away and a
 * bookmark keeps working.
 */
export default function ImageStudioPage() {
  const searchParams = useSearchParams();
  const requested = searchParams?.get("tab") ?? "";
  const [section, setSection] = useState<Section>(
    isSection(requested) ? requested : "graphics",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image studio"
        description="Marketing graphics rendered in your brand — logo, palette and type are exact. Or generate a photographic image for an article."
      />

      <AdminTabs
        tabs={[
          { label: "Marketing graphics", value: "graphics" },
          { label: "Article photos", value: "photos" },
        ]}
        activeTab={section}
        onChange={(value) => setSection(isSection(value) ? value : "graphics")}
      />

      {section === "graphics" ? <MarketingGraphics /> : <ArticlePhotos />}
    </div>
  );
}
