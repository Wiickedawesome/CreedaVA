"use client";

import { useState } from "react";
import { PageHeader, useToast } from "@/components/admin";
import { Button } from "@/components/ui";
import {
  FORMATS,
  FORMAT_IDS,
  LAYOUTS,
  LIMITS,
  PLATFORMS,
  TONES,
  creativeFilename,
  type CreativeFormat,
  type CreativePlan,
  type Platform,
  type Tone,
} from "@/lib/brand/creative";

/**
 * Image studio — a brief in, a finished social post out.
 *
 * The AI designs the post: the angle, the composition family, the exact
 * wording, and where the photo comes from. A renderer draws it, so the headline
 * is set in a real font rather than painted by an image model — which is what
 * makes text legible without narrowing the range to a few fixed templates.
 *
 * Captions come back with the image, one per platform, each copyable on its
 * own. Nothing is uploaded.
 */

interface RenderedImage {
  dataUrl: string;
  width: number;
  height: number;
  filename: string;
}

interface CreativeResponse {
  plan?: CreativePlan;
  image?: RenderedImage;
  photoDropped?: boolean;
  message?: string;
  error?: string;
}

export default function ImageStudioPage() {
  const { toast } = useToast();

  const [brief, setBrief] = useState("");
  const [format, setFormat] = useState<CreativeFormat>("feed");
  const [tone, setTone] = useState<Tone>("warm");

  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<CreativePlan | null>(null);
  const [image, setImage] = useState<RenderedImage | null>(null);
  const [captions, setCaptions] = useState<CreativePlan["captions"] | null>(
    null,
  );
  const [captionTab, setCaptionTab] = useState<Platform>("facebook");
  const [photoDropped, setPhotoDropped] = useState(false);

  const tooLong = brief.length > LIMITS.brief;
  const canGenerate = brief.trim().length >= 10 && !tooLong && !busy;

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch("/api/brand/creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, format, tone }),
      });
      const data = (await res.json()) as CreativeResponse;

      if (!res.ok) {
        // A failed draw can still carry the design: the words are worth keeping
        // even when the picture did not come through.
        if (data.plan) {
          setPlan(data.plan);
          setCaptions(data.plan.captions);
          setImage(null);
        }
        toast(data.error ?? data.message ?? "Could not build the post", "error");
        return;
      }

      setPlan(data.plan ?? null);
      setCaptions(data.plan?.captions ?? null);
      setImage(data.image ?? null);
      setPhotoDropped(Boolean(data.photoDropped));
      toast("Post ready", "success");
    } catch {
      toast("Could not reach the server", "error");
    } finally {
      setBusy(false);
    }
  }

  async function copy(label: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast(`${label} copied`, "success");
    } catch {
      toast("Clipboard is blocked in this browser", "error");
    }
  }

  function download() {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = image.filename || creativeFilename(format);
    link.click();
  }

  const hashtagLine = plan ? plan.hashtags.map((tag) => `#${tag}`).join(" ") : "";
  const activeCaption = captions ? captions[captionTab] : "";
  const fullPost = [activeCaption, hashtagLine].filter(Boolean).join("\n\n");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image studio"
        description="Describe the post. CreedaVA's AI designs it, writes the caption, and sets the type in your brand."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
        {/* ── Brief ───────────────────────────────────── */}
        <div className="space-y-5">
          <div>
            <label
              htmlFor="brief"
              className="mb-1 block text-sm font-medium text-gray-100"
            >
              What is this post about?
            </label>
            <textarea
              id="brief"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={7}
              placeholder="We just added 24/7 bilingual phone coverage. Small teams stop losing calls after hours without hiring anyone."
              className="w-full rounded-md border border-gray-40 bg-card px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-50">
                A sentence or two is enough. Numbers you give here are the only
                ones it may use.
              </span>
              <span className={tooLong ? "text-error-text" : "text-gray-50"}>
                {brief.length}/{LIMITS.brief}
              </span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-100">Size</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMAT_IDS.map((id) => {
                const active = id === format;
                const spec = FORMATS[id];
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
                      {spec.label}
                    </span>
                    <span className="block text-[11px] text-gray-50">
                      {spec.width}×{spec.height}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-50">{FORMATS[format].usage}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-100">Tone</p>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((item) => {
                const active = item.id === tone;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTone(item.id)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-gray-70 hover:bg-gray-20"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={generate} disabled={!canGenerate} isLoading={busy}>
            {plan ? "Design another" : "Design the post"}
          </Button>

          <p className="text-xs text-gray-50">
            The AI picks the composition from the brief. Nothing is uploaded.
          </p>
        </div>

        {/* ── Result ──────────────────────────────────── */}
        <div className="space-y-5">
          {!plan && (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-sm text-gray-70">
                Your creative and captions will appear here.
              </p>
            </div>
          )}

          {plan && image && (
            <div className="space-y-2">
              {/* Plain <img>: next/image would fetch through /_next/image
                  without the admin cookie and get a 401. The source is a data
                  URL, so there is nothing to optimize either. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
              <img
                src={image.dataUrl}
                alt="The designed post"
                className="w-full rounded-lg border border-border bg-gray-20"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-50">
                  {image.width}×{image.height} ·{" "}
                  {LAYOUTS[plan.design.layout]}
                </p>
                <Button variant="outline" size="sm" onClick={download}>
                  Download PNG
                </Button>
              </div>
            </div>
          )}

          {plan && !image && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-gray-70">
                The words are ready below, but the image did not come through.
                Design another to try again.
              </p>
            </div>
          )}

          {photoDropped && (
            <p className="text-xs text-gray-50">
              The photo did not load, so this was drawn as type only.
            </p>
          )}

          {plan && (
            <>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-50">
                  The idea
                </p>
                <p className="mt-1 text-sm text-gray-100">{plan.concept}</p>
                <p className="mt-2 text-xs text-gray-70">
                  Composition: {LAYOUTS[plan.design.layout]}
                  {plan.design.headline ? ` · “${plan.design.headline}”` : ""}
                </p>
              </div>

              {captions && (
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {PLATFORMS.map((platform) => {
                        const active = platform.id === captionTab;
                        const hasText = Boolean(captions[platform.id]);
                        return (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => setCaptionTab(platform.id)}
                            aria-pressed={active}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card text-gray-70 hover:bg-gray-20"
                            }`}
                          >
                            {platform.label}
                            {!hasText && (
                              <span className="ml-1 text-gray-50">—</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copy(captionTab, fullPost)}
                    >
                      Copy post
                    </Button>
                  </div>

                  <textarea
                    value={activeCaption}
                    onChange={(e) =>
                      setCaptions((previous) =>
                        previous
                          ? { ...previous, [captionTab]: e.target.value }
                          : previous,
                      )
                    }
                    rows={6}
                    aria-label={`${captionTab} caption`}
                    className="w-full rounded-md border border-gray-40 bg-card px-4 py-2.5 text-sm text-gray-100 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  {plan.hashtags.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-70">
                          Hashtags
                        </p>
                        <button
                          type="button"
                          onClick={() => copy("Hashtags", hashtagLine)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-gray-50">{hashtagLine}</p>
                    </div>
                  )}

                  <p className="mt-3 text-xs text-gray-50">
                    Edit before posting. Copy post includes the hashtags.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
